import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,request as httpRequest} from 'node:http';
import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {openDatabase,loadModel,importExisting,createKnowledgeService} from './knowledge-server.mjs';
let db,server,base,tokens,model;
const T='fw-B-01-p132',fitness='fw-C-01-p275';
const exported={__rhv24:true,stamms:{'clp-west':{rangers:[{id:11,name:'JB',team:'Team A'},{id:12,name:'KN',team:'Team B'},{id:13,name:'LI'},{id:14,name:'Archived',archived:true},{id:15,name:'Ineligible',knowledgeEligible:false}],leaders:[{id:1,role:'Admin'},{id:100,role:'Leiter'}]},meppen:{rangers:[{id:11,name:'Another Ranger'}],leaders:[{id:8001,role:'Stammleiter'}]}}};
beforeEach(async()=>{
 db=openDatabase(':memory:');model=loadModel().model;importExisting(db,exported,model);
 tokens={};const principals=[['a',11,'rangers','clp-west'],['b',12,'rangers','clp-west'],['lead',100,'leaders','clp-west'],['admin',1,'leaders','clp-west'],['meppen',8001,'leaders','meppen'],['expired',13,'rangers','clp-west']].map(([key,id,kind,homeStammId])=>{
  const token=randomBytes(36).toString('base64url');tokens[key]=token;return {id,kind,homeStammId,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:key==='expired'?'2000-01-01T00:00:00Z':'2099-01-01T00:00:00Z'};
 });
 server=createServer(createKnowledgeService({db,principals,origin:'http://localhost:8000'}).handler);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
});
afterEach(async()=>{await new Promise(r=>server.close(r));db.close();});
async function get(who='a',tribe='clp-west',query=''){
 const response=await fetch(base+'/knowledge?stammId='+tribe+query,{headers:tokens[who]?{Authorization:'Bearer '+tokens[who]}:{}});return {status:response.status,data:await response.json()};
}
async function cmd(who,type,payload,requestId=randomUUID(),tribe='clp-west'){
 const response=await fetch(base+'/knowledge/commands?stammId='+tribe,{method:'POST',headers:{Authorization:'Bearer '+tokens[who],'Content-Type':'application/json'},body:JSON.stringify({type,payload,requestId})});return {status:response.status,data:await response.json()};
}
async function submit(who='a',taskId=T){assert.equal((await cmd(who,'submit',{taskId,text:'Nachweis persönlich vorgeführt.',evidenceType:'oral',consent:true})).status,200);}
async function approve(rangerId=11,taskId=T){return cmd('lead','review',{taskId,rangerId,approved:true,comment:'Vorführung geprüft.'});}
async function clear(rangerId,taskId=T){assert.equal((await cmd('lead','policy',{taskId,rangerId,eligible:true,reason:'Eignung und Aufsicht persönlich geprüft.'})).status,200);}

test('personal authentication, membership, server roles and CORS are enforced',async()=>{
 assert.equal((await get('none')).status,401);assert.equal((await get('expired')).status,401);
 assert.equal((await get('a','meppen')).status,403);assert.equal((await get('meppen','clp-west')).status,403);
 assert.equal((await cmd('a','review',{taskId:T,rangerId:11,approved:true,role:'Admin'})).status,403);
 const result=await fetch(base+'/knowledge?stammId=clp-west',{headers:{Authorization:'Bearer '+tokens.a,Origin:'https://unauthorized.example'}});assert.equal(result.status,403);
 assert.deepEqual((await get('admin','meppen')).data.people.map(p=>p.alias),['Another R.']);
});
test('UTF-8 evidence remains intact when a multibyte character crosses request chunks',async()=>{
 const text='Größe, Vögel, Füchse und schöne Wälder.',raw=Buffer.from(JSON.stringify({type:'submit',requestId:randomUUID(),payload:{taskId:T,text,evidenceType:'text',consent:true}}));
 const split=raw.indexOf(Buffer.from('ö'))+1;
 const status=await new Promise((resolve,reject)=>{
  const req=httpRequest(base+'/knowledge/commands?stammId=clp-west',{method:'POST',headers:{Authorization:'Bearer '+tokens.a,'Content-Type':'application/json'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
  req.on('error',reject);req.write(raw.subarray(0,split));setTimeout(()=>req.end(raw.subarray(split)),10);
 });
 assert.equal(status,200);assert.equal((await get()).data.progress['11:'+T].evidence.text,text);
});
test('submission gives no points; leader approval is shared across independent clients',async()=>{
 await submit();assert.equal((await get()).data.ranking.find(p=>p.id===11).points,0);
 assert.equal(Object.keys((await get('b')).data.progress).length,0);
 assert.equal((await approve()).status,200);
 const r=(await get('b')).data;assert.equal(r.ranking.find(p=>p.id===11).points,5);assert.equal(r.ledger.length,0);assert.equal(Object.keys(r.progress).length,0);
 assert.equal((await get()).data.ledger[0].by,100);assert.equal((await get()).data.progress['11:'+T].status,'approved');
});
test('simultaneous approvals and replayed requests never double credit',async()=>{
 await submit();const requestId=randomUUID(),payload={taskId:T,rangerId:11,approved:true};
 const responses=await Promise.all([cmd('lead','review',payload,requestId),cmd('lead','review',payload,requestId),cmd('lead','review',payload)]);
 assert.ok(responses.every(r=>r.status===200));assert.equal((await get()).data.ledger.length,1);
 assert.equal((await get()).data.ranking.find(r=>r.id===11).points,5);
 assert.equal((await cmd('lead','review',{...payload,approved:false},requestId)).status,409);
});
test('revocation requires a reason and appends one immutable reversal',async()=>{
 await submit();await approve();assert.equal((await cmd('lead','revoke',{taskId:T,rangerId:11,reason:''})).status,422);
 assert.equal((await cmd('lead','revoke',{taskId:T,rangerId:11,reason:'Nachweis muss ergänzt werden.'})).status,200);
 assert.equal((await cmd('lead','revoke',{taskId:T,rangerId:11,reason:'Erneut.'})).status,422);
 assert.equal((await get()).data.ranking.find(r=>r.id===11).points,0);assert.equal((await get()).data.ledger.length,2);
 assert.throws(()=>db.exec('DELETE FROM knowledge_ledger'),/append-only/);assert.throws(()=>db.exec('UPDATE knowledge_ledger SET points=99'),/append-only/);
 await submit();await approve();assert.equal((await get()).data.ranking.find(r=>r.id===11).points,5);assert.equal((await get()).data.ledger.length,3);
});
test('missing source points cannot be credited without an audited resolution',async()=>{
 const t='fw-A-06-p078';await submit('a',t);assert.equal((await approve(11,t)).status,422);
 assert.equal((await cmd('a','resolve',{taskId:t,points:99,source:'fake',reason:'fake'})).status,403);
 assert.equal((await cmd('lead','resolve',{taskId:t,points:3,source:'Von der Fachleitung geprüftes Quellenblatt, Zeile 9',reason:'Dokumentierte Quellenklärung im Test.'})).status,200);
 await approve(11,t);const e=(await get()).data.ledger[0];assert.equal(e.sourcePoints,null);assert.equal(e.points,3);assert.ok(e.resolution.source);
});
test('fitness alternative retains its single eight-point value without guessing training points',async()=>{
 await clear(11,fitness);assert.equal((await cmd('a','submit',{taskId:fitness,text:'Sportabzeichen Silber vorgelegt.',evidenceType:'practice',consent:true,pointOption:286})).status,200);
 assert.equal((await approve(11,fitness)).status,200);assert.equal((await get()).data.ranking.find(r=>r.id===11).points,8);
 await clear(12,fitness);await submit('b',fitness);assert.equal((await approve(12,fitness)).status,422);
});
test('unsafe tasks and duels require individual clearance; no foreign submissions',async()=>{
 const fire='fw-B-10-p228'; // Resolve the fire task from the actual catalog if paragraph shifts.
 const actual=loadModel().catalog.tasks.find(t=>t.sourceTopic==='Feuerbohren').id;
 assert.equal((await cmd('a','start',{taskId:actual})).status,422);
 assert.equal((await cmd('a','submit',{taskId:T,rangerId:12,text:'Foreign',evidenceType:'text',consent:true})).status,422);
 assert.equal((await cmd('a','invite',{taskId:T,targetId:12,deadline:new Date(Date.now()+7*86400000).toISOString()})).status,422);
 await clear(11);await clear(12);await clear(11,actual);
 assert.equal((await cmd('a','start',{taskId:actual})).status,200);
});
test('invitation consent, shared progress and confirmed draw do not add bonus points',async()=>{
 await clear(11);await clear(12);
 assert.equal((await cmd('a','invite',{taskId:T,targetId:12,deadline:new Date(Date.now()+7*86400000).toISOString()})).status,200);
 const c=(await get()).data.challenges[0];assert.equal((await cmd('a','respond',{challengeId:c.id,accept:true})).status,422);
 assert.equal((await cmd('b','respond',{challengeId:c.id,accept:true})).status,200);
 await submit('a');await submit('b');await approve(11);await approve(12);
 const result=(await get()).data;assert.equal(result.challenges[0].status,'finished');assert.equal(result.challenges[0].result.winner,null);
 assert.deepEqual(result.ranking.filter(r=>r.points>0).map(r=>r.rank),[1,1]);assert.equal(result.ranking.find(r=>r.id===11).points,5);
 assert.equal(result.challenges[0].playerStatuses[12],'approved');
});
test('decline, cancel, spam protection and eligibility reject invalid duels without penalties',async()=>{
 await clear(11);await clear(12);const payload={taskId:T,targetId:12,deadline:new Date(Date.now()+7*86400000).toISOString()};
 await cmd('a','invite',payload);assert.equal((await cmd('a','invite',payload)).status,422);
 let c=(await get()).data.challenges[0];assert.equal((await cmd('b','respond',{challengeId:c.id,accept:false})).status,200);
 assert.equal((await get()).data.ranking.find(r=>r.id===12).points,0);
 await cmd('a','invite',payload);c=(await get()).data.challenges[1];assert.equal((await cmd('b','cancel',{challengeId:c.id})).status,200);
 assert.equal((await cmd('a','invite',{...payload,targetId:15})).status,422);
});
test('membership refresh never resets progress; archived and ineligible members are excluded',async()=>{
 await submit();await approve();importExisting(db,exported,model);
 const data=(await get('lead')).data;assert.deepEqual(data.people.map(p=>p.id),[11,12,13]);assert.equal(data.ranking.find(r=>r.id===11).points,5);
 const old=data.progress['11:'+T].evidence.text;assert.equal(old,'Nachweis persönlich vorgeführt.');
});
test('only three outgoing invitations may be open at once',async()=>{
 const tasks=loadModel().catalog.tasks.filter(t=>t.sourceTopic==='Astronomie').slice(0,4);
 for(const t of tasks){await clear(11,t.id);await clear(12,t.id);}
 for(let i=0;i<4;i++){
  const r=await cmd('a','invite',{taskId:tasks[i].id,targetId:12,deadline:new Date(Date.now()+7*86400000).toISOString()});
  assert.equal(r.status,i<3?200:422);
 }
 assert.equal((await get()).data.challenges.length,3);
});
test('a first import never automatically trusts local demo credits',()=>{
 const other=openDatabase(':memory:'),source=structuredClone(exported);source.stamms['clp-west'].knowledge=model.initial();
 assert.throws(()=>importExisting(other,source,model),/operator audit/);
 assert.equal(other.prepare('SELECT COUNT(*) AS count FROM knowledge_stamms').get().count,0);
 importExisting(other,source,model,{includeVerifiedKnowledge:true});assert.equal(other.prepare('SELECT COUNT(*) AS count FROM knowledge_stamms').get().count,2);other.close();
});
test('weekly/category/team views derive from the same ledger and safe aliases',async()=>{
 await submit();await approve();const start=model.week(new Date());
 assert.equal((await get('lead','clp-west','&since='+start+'&category=B')).data.ranking.find(r=>r.id===11).points,5);
 assert.equal((await get('lead','clp-west','&category=A')).data.ranking.find(r=>r.id===11).points,0);
 assert.equal((await get('lead','clp-west','&since='+model.date().slice(0,7)+'-01')).data.ranking.find(r=>r.id===11).points,5);
 assert.deepEqual((await get('lead','clp-west','&team=Team%20A')).data.ranking.map(r=>r.id),[11]);
 assert.equal((await get('a','clp-west','&category=Z')).status,400);
 assert.equal(Object.keys((await get()).data.progress).length,1);
});
test('winner uses submitted time, expired deadline waits for pending reviews, revocation reopens result',()=>{
 const s=model.initial(),people=exported.stamms['clp-west'].rangers,lead={id:100,leader:true,homeStammId:'clp-west'},a={id:11,leader:false},b={id:12,leader:false};
 const run=(who,type,payload,at)=>model.apply(s,people,who,type,payload,at,randomUUID);
 for(const rid of [11,12])run(lead,'policy',{taskId:T,rangerId:rid,eligible:true,reason:'Checked'},'2026-10-01T10:00:00Z');
 run(a,'invite',{taskId:T,targetId:12,deadline:'2026-10-08T12:00:00Z'},'2026-10-01T12:00:00Z');const c=s.challenges[0];
 run(b,'respond',{challengeId:c.id,accept:true},'2026-10-01T13:00:00Z');
 run(a,'submit',{taskId:T,text:'A',consent:true,evidenceType:'oral'},'2026-10-02T12:00:00Z');run(b,'submit',{taskId:T,text:'B',consent:true,evidenceType:'oral'},'2026-10-03T12:00:00Z');
 assert.throws(()=>run(lead,'settle',{challengeId:c.id,reason:'After deadline'},'2026-10-09T12:00:00Z'),/Nachweise prüfen/);
 run(lead,'review',{taskId:T,rangerId:12,approved:true},'2026-10-09T13:00:00Z');run(lead,'review',{taskId:T,rangerId:11,approved:true},'2026-10-09T14:00:00Z');assert.equal(c.result.winner,11);
 run(lead,'revoke',{taskId:T,rangerId:11,reason:'Needs correction'},'2026-10-10T12:00:00Z');assert.equal(c.status,'active');assert.equal(c.result,null);
});
