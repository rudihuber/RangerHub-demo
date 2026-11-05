import {readFileSync} from 'node:fs';
import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,request as httpRequest} from 'node:http';
import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {openDatabase,loadModel,importExisting,createKnowledgeService} from './knowledge-server.mjs';
let db,server,base,tokens,model;
const day=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
const meeting=(id,n=7)=>({id,date:day(n),start:'10:00',end:'12:00',place:'Cloppenburg',theme:'Rangertreffen'});
const T='fw-B-01-p132',fitness='fw-C-01-p275';
const exported={__rhv24:true,stamms:{'clp-west':{rangers:[{id:11,name:'JB',team:'Team A'},{id:12,name:'KN',team:'Team B'},{id:13,name:'LI'},{id:14,name:'Archived',archived:true},{id:15,name:'Ineligible',knowledgeEligible:false}],leaders:[{id:1,role:'Admin'},{id:100,role:'Leiter'},{id:101,role:'Stammleiter'}],meetings:[meeting(100),meeting(101,14)]},meppen:{rangers:[{id:11,name:'Another Ranger'}],leaders:[{id:8001,role:'Stammleiter'}],meetings:[meeting(800)]}}};
beforeEach(async()=>{
 db=openDatabase(':memory:');model=loadModel().model;importExisting(db,exported,model);
 tokens={};const principals=[['a',11,'rangers','clp-west'],['b',12,'rangers','clp-west'],['lead',100,'leaders','clp-west'],['admin',1,'leaders','clp-west'],['stamm',101,'leaders','clp-west'],['meppen',8001,'leaders','meppen'],['expired',13,'rangers','clp-west']].map(([key,id,kind,homeStammId])=>{
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
async function book(taskId=T,who='a',meetingId=100){return cmd(who,'register-exam',{taskId,meetingId});}
async function exams(who='lead'){return (await get(who)).data.exams;}
async function onDay(id=100){const m=(await get('lead')).data.meetings.find(m=>m.id===id);assert.equal((await cmd('lead','calendar-change',{meeting:{...m,date:day(-1)},revision:m.revision})).status,200);}
async function grade(e,result='passed',who='lead'){return cmd(who,'grade-exam',{examId:e.id,result});}
async function edit(who,kind,id,fields,scope='local',extra={}){
 const snap=(await get(who)).data,item=snap.catalog[kind].find(x=>x.id===id);
 return cmd(who,'catalog-change',{kind,id,fields,scope,reason:'Geprüfte Quellen-/Katalogänderung.',revision:scope==='global'?item?.globalRevision||0:item?.localRevision||0,...extra});
}
const setRead=(bookId='bible-01',isRead=true,version=0,who='a',id=randomUUID())=>cmd(who,'set-bible-read',{bookId,isRead,version},id);
const state=()=>JSON.parse(db.prepare('SELECT state_json FROM knowledge_stamms WHERE id=?').get('clp-west').state_json);
const own=s=>s.ranking.find(r=>r.id===11);

const wisdomEdit=async(who,kind,id,fields,scope='local',extra={},tribe='clp-west')=>{const s=(await get(who,tribe)).data;const i=s.wisdom[kind].find(i=>i.id===id);return cmd(who,'wisdom-change',{kind,id,fields,scope,revision:scope==='global'?i?.globalRevision||0:i?.localRevision||0,...extra},randomUUID(),tribe);};
test('16 complete source modules, 5 groups, eight properties, only 3 initial publications',async()=>{
 const all=(await get('stamm')).data.wisdom,r=(await get()).data.wisdom;
 assert.equal(all.modules.length,16);assert.equal(all.groups.length,5);assert.deepEqual(r.modules.map(m=>m.id).sort(),['eigenschaften','emblem','start']);assert.equal(r.groups.length,2);
 for(const m of all.modules){assert.ok(m.introduction.length>30);const hs=all.hotspots.filter(h=>h.moduleId===m.id);assert.ok(hs.length>=3);assert.ok(hs.every(h=>h.text.length>40));}
 assert.deepEqual(all.hotspots.filter(h=>h.moduleId==='eigenschaften').map(h=>h.label.toLowerCase()),['wachsam','rein','ehrlich','tapfer','treu','höflich','gehorsam','geistlich']);
 assert.ok(!/sourcePages|sourceMeta|pageNumber|pdfPage|sourceReference/.test(JSON.stringify(r)));
});
test('hidden module bodies cannot leak through ranger snapshots or search filters',async()=>{
 const secret=(await get('lead')).data.wisdom.hotspots.find(h=>h.moduleId==='teamhelfer').text;
 for(const query of ['', '&category=teamhelfer','&team=teamhelfer']){const s=(await get('a','clp-west',query)).data.wisdom;assert.ok(!JSON.stringify(s).includes(secret));assert.ok(!s.modules.some(m=>m.id==='teamhelfer'));assert.equal(s.layers,undefined);}
});
test('ordinary leaders and rangers cannot publish, including with forged role or delegated FW rights',async()=>{
 for(const who of ['a','lead'])for(const scope of ['global','local'])assert.notEqual((await cmd(who,'wisdom-change',{scope,kind:'modules',id:'lilie',revision:0,fields:{published:true},role:'Admin'})).status,200);
 await cmd('stamm','set-editor-permission',{leaderId:100,allowed:true});assert.notEqual((await wisdomEdit('lead','modules','lilie',{published:true})).status,200);
 assert.ok(!(await get()).data.wisdom.modules.some(m=>m.id==='lilie'));
});
test('stammleiter publishes locally, persisted across reads and other devices; Meppen unchanged',async()=>{
 assert.equal((await wisdomEdit('stamm','modules','lilie',{published:true,text:'Ausführliche lokale Erklärung.'})).status,200);
 assert.ok((await get()).data.wisdom.modules.some(m=>m.id==='lilie'));assert.ok((await get('b')).data.wisdom.modules.some(m=>m.id==='lilie'));
 assert.ok(!(await get('admin','meppen')).data.wisdom.modules.find(m=>m.id==='lilie').published);
 assert.equal((await wisdomEdit('stamm','modules','motto',{published:true},'global')).status,422);
 assert.equal((await cmd('stamm','wisdom-change',{scope:'local',kind:'modules',id:'motto',revision:0,fields:{published:true}},randomUUID(),'meppen')).status,403);
});
test('admin global defaults and local overrides are separate, even when switching stamms',async()=>{
 await wisdomEdit('stamm','modules','lilie',{published:false});assert.equal((await wisdomEdit('admin','modules','lilie',{published:true},'global')).status,200);
 assert.ok(!(await get()).data.wisdom.modules.some(m=>m.id==='lilie'));assert.equal((await get('admin','meppen')).data.wisdom.modules.find(m=>m.id==='lilie').published,true);
 assert.equal((await wisdomEdit('admin','modules','motto',{published:true},'local',{},'meppen')).status,200);assert.ok(!(await get()).data.wisdom.modules.some(m=>m.id==='motto'));
});
test('stale parallel publications are rejected with CAS; same command replay stays idempotent',async()=>{
 const p={scope:'local',kind:'modules',id:'lilie',revision:0,fields:{published:true}},rs=await Promise.all([cmd('stamm','wisdom-change',p),cmd('admin','wisdom-change',{...p,fields:{published:false}})]);
 assert.deepEqual(rs.map(r=>r.status).sort(),[200,422]);const id=randomUUID(),s=(await get('stamm')).data.wisdom.modules.find(m=>m.id==='lilie'),payload={...p,revision:s.localRevision};
 assert.equal((await cmd('stamm','wisdom-change',payload,id)).status,200);assert.equal((await cmd('stamm','wisdom-change',payload,id)).data.replayed,true);
});
test('group, module and hotspot creation, ordering, edit, archive and restore preserve points and people',async()=>{
 await setRead();const people=db.prepare('SELECT people_json FROM knowledge_stamms WHERE id=?').get('clp-west').people_json,ledger=JSON.stringify(state().ledger);
 for(const [kind,id,fields] of [['groups','custom-camp',{title:'Unser Lager',order:40}],['modules','custom-lesson',{groupId:'custom-camp',title:'Orientierung am Lager',introduction:'Ein eigenes Wissensthema für unseren Stamm.',text:'Ausführliche Beschreibung zum Entdecken.',published:true,order:3}],['hotspots','custom-symbol',{moduleId:'custom-lesson',label:'Der Weg',text:'Hier steht eine ausführliche Erklärung für unser Lernsymbol, die bewusst erst nach Auswahl geöffnet wird.',order:1}]])assert.equal((await wisdomEdit('stamm',kind,id,fields)).status,200);
 let w=(await get()).data.wisdom;assert.ok(w.hotspots.some(h=>h.id==='custom-symbol'));
 assert.equal((await wisdomEdit('stamm','groups','custom-camp',{archived:true})).status,200);w=(await get()).data.wisdom;assert.ok(!w.modules.some(m=>m.id==='custom-lesson'));assert.ok(!w.hotspots.some(h=>h.id==='custom-symbol'));
 await wisdomEdit('stamm','groups','custom-camp',{archived:false});assert.ok((await get()).data.wisdom.hotspots.some(h=>h.id==='custom-symbol'));
 assert.equal(JSON.stringify(state().ledger),ledger);assert.equal(db.prepare('SELECT people_json FROM knowledge_stamms WHERE id=?').get('clp-west').people_json,people);assert.equal(own((await get()).data).points,10);
});
test('publication history stores scope, revision and author, preview obeys current publications',async()=>{
 await wisdomEdit('stamm','modules','lilie',{published:true});await wisdomEdit('stamm','modules','lilie',{published:false});const w=(await get('stamm')).data.wisdom;
 assert.equal(w.layers.local.audit.length,2);assert.equal(w.layers.local.audit[0].by,101);assert.equal(w.layers.local.audit[0].scope,'local');assert.equal(w.modules.find(m=>m.id==='lilie').localRevision,2);assert.ok(!w.preview.modules.some(m=>m.id==='lilie'));
 await wisdomEdit('stamm','modules','lilie',{published:true});assert.ok((await get('stamm')).data.wisdom.preview.modules.some(m=>m.id==='lilie'));
});
test('no-op read/migrate never initializes new records or awards Ranger-Wissen points',async()=>{
 const before=JSON.stringify(state()),w=(await get()).data.wisdom;await get('stamm');assert.equal(JSON.stringify(state()),before);assert.equal(state().rangerWisdom,undefined);assert.equal(own((await get()).data).points,0);assert.equal(w.rights.local,false);
});
test('invalid hierarchy, duplicate IDs, HTML fields, and invalid scope fail without data loss',async()=>{
 const before=JSON.stringify(state());for(const p of [
 {scope:'global',kind:'modules',id:'lilie',revision:0,fields:{html:'<script>alert(1)</script>'}},
 {scope:'local',kind:'modules',id:'new-module',revision:0,fields:{title:'Kaputt',groupId:'missing'}},
 {scope:'local',kind:'hotspots',id:'symbol',revision:0,fields:{label:'Kaputt',moduleId:'missing'}},
 {scope:'local',kind:'modules',id:'lilie',revision:0,fields:{published:'yes'}},
 {scope:'other',kind:'modules',id:'lilie',revision:0,fields:{published:true}}
 ])assert.equal((await cmd('admin','wisdom-change',p)).status,422);assert.equal(JSON.stringify(state()),before);
});
