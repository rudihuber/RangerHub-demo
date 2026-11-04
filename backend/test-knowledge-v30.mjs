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
test('server identity, tribe permissions, disabled old workflows and no evidence fields',async()=>{
 assert.equal((await get('none')).status,401);assert.equal((await get('expired')).status,401);assert.equal((await get('a','meppen')).status,403);
 for(const type of ['invite','submit','observe','review','start','respond','settle'])assert.equal((await cmd('lead',type,{taskId:T,text:'not collected'})).status,400);
 assert.equal((await cmd('a','grade-exam',{examId:'x',result:'passed',role:'Admin'})).status,403);
 assert.equal((await cmd('a','catalog-change',{kind:'tasks',id:T,scope:'local',fields:{points:999}})).status,403);
 assert.equal((await get('admin','meppen')).status,200);
});
test('three slots are transactional across categories and four simultaneous clients',async()=>{
 const ids=[T,'fw-A-08-p087','fw-C-03-p290','fw-B-01-p133'];
 const actual=(await get()).data.catalog.tasks.find(t=>t.sourceTopic==='Erste Hilfe').id;ids[2]=actual;
 const responses=await Promise.all(ids.map(id=>book(id)));assert.equal(responses.filter(r=>r.status===200).length,3);assert.equal(responses.filter(r=>r.status===422).length,1);
 assert.equal((await exams()).length,3);assert.equal((await get()).data.ranking.find(r=>r.id===11).points,0);
});
test('duplicate booking and request replay create one registration',async()=>{
 const id=randomUUID(),p={taskId:T,meetingId:100};const rs=await Promise.all([cmd('a','register-exam',p,id),cmd('a','register-exam',p,id),book()]);
 assert.ok(rs.every(r=>r.status===200));assert.equal((await exams()).length,1);
 assert.equal((await cmd('a','register-exam',{...p,taskId:'fw-B-01-p133'},id)).status,409);
});
test('withdraw before the meeting frees a slot, but reviewed attempts still consume slots',async()=>{
 for(const id of [T,'fw-B-01-p133','fw-B-01-p134'])await book(id);
 const first=(await exams())[0];assert.equal((await cmd('a','withdraw-exam',{examId:first.id})).status,200);
 assert.equal((await book('fw-B-01-p135')).status,200);await onDay();
 const open=(await exams()).filter(e=>e.status==='registered');await grade(open[0],'failed');await grade(open[1],'no_show');
 assert.equal((await cmd('a','withdraw-exam',{examId:open[0].id})).status,422);
 const row=db.prepare('SELECT state_json FROM knowledge_stamms WHERE id=?').get('clp-west');assert.equal(model.used(JSON.parse(row.state_json),11,100),3);
});
test('grading is in-person and concurrent leaders cannot double-grade or double-credit',async()=>{
 await book();const e=(await exams())[0];assert.equal((await grade(e)).status,422);await onDay();
 const rs=await Promise.all([grade(e),grade(e),grade(e,'failed','stamm')]);assert.equal(rs.filter(r=>r.status===200).length,2);assert.equal(rs.filter(r=>r.status===422).length,1);
 const s=(await get()).data;assert.equal(s.ledger.length,1);assert.equal(s.ranking.find(r=>r.id===11).points,5);assert.equal(s.exams.filter(e=>e.status==='registered').length,0);assert.equal(s.exams[0].status,'passed');
 assert.equal((await book(T,'a',101)).status,422);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM knowledge_active_credits').get().n,1);
});
test('failed and no-show attempts award no points and can be retried later',async()=>{
 await book();await onDay();await grade((await exams())[0],'failed');assert.equal((await get()).data.ledger.length,0);
 assert.equal((await book(T,'a',101)).status,200);assert.equal((await exams()).length,2);
 const m=(await get('lead')).data.meetings.find(m=>m.id===101);await cmd('lead','calendar-change',{meeting:{...m,date:day(-1),start:'11:00'},revision:m.revision});
 await grade((await exams())[1],'no_show');assert.equal((await get()).data.ledger.length,0);
});
test('cancellation keeps history and explicit replacement checks its own three-slot limit',async()=>{
 await book();const m=(await get('lead')).data.meetings.find(m=>m.id===100);await cmd('lead','calendar-change',{meetingId:100,revision:m.revision});
 let e=(await exams())[0];assert.equal(e.status,'meeting_cancelled');assert.equal((await get()).data.nextMeeting.id,101);
 assert.equal((await cmd('a','reassign-exam',{examId:e.id,meetingId:101})).status,200);e=(await exams())[0];assert.equal(e.status,'registered');assert.equal(e.meetingId,101);assert.equal(e.history.at(-1).type,'reassigned');
});
test('only matching real calendar meetings can be used; cancelled participation is respected',async()=>{
 assert.equal((await book(T,'a',99999)).status,422);
 assert.equal((await cmd('a','participation-change',{meetingId:100,cancelled:true})).status,200);assert.equal((await book()).status,422);
 assert.equal((await cmd('a','calendar-change',{meeting:meeting(888),revision:0})).status,403);
 assert.equal((await cmd('a','participation-change',{meetingId:100,cancelled:false})).status,200);assert.equal((await book()).status,200);
});
test('local editor, stammleiter and global admin layers remain separated',async()=>{
 const before=(await get('meppen','meppen')).data.catalog.tasks.find(t=>t.id===T).points;
 assert.equal((await edit('stamm','tasks',T,{text:'Lokale Fassung',points:7})).status,200);
 assert.equal((await get()).data.catalog.tasks.find(t=>t.id===T).points,7);assert.equal((await get('meppen','meppen')).data.catalog.tasks.find(t=>t.id===T).points,before);
 assert.equal((await edit('lead','tasks',T,{points:999},'global')).status,422);
 assert.equal((await edit('admin','tasks',T,{points:9},'global')).status,200);
 assert.equal((await get()).data.catalog.tasks.find(t=>t.id===T).points,7);assert.equal((await get('meppen','meppen')).data.catalog.tasks.find(t=>t.id===T).points,9);
 assert.equal((await edit('stamm','tasks',T,{},'local',{reset:true})).status,200);assert.equal((await get()).data.catalog.tasks.find(t=>t.id===T).points,9);
});
test('editor permissions can be withdrawn; malicious global role fields never grant access',async()=>{
 assert.equal((await cmd('stamm','set-editor-permission',{leaderId:100,allowed:false})).status,200);
 assert.equal((await edit('lead','tasks',T,{text:'Forbidden'})).status,422);
 assert.equal((await cmd('lead','catalog-change',{kind:'tasks',id:T,scope:'global',fields:{points:77},role:'Admin',revision:0})).status,422);
 assert.equal((await edit('stamm','tasks',T,{description:'Erlaubt'})).status,200);
});
test('point edits and archival never rewrite earned points or booked requirement versions',async()=>{
 await book();await edit('stamm','tasks',T,{points:12,text:'Neue Fassung'});await onDay();await grade((await exams())[0]);
 assert.equal((await get()).data.ledger[0].points,5);assert.equal((await get()).data.exams[0].taskSnapshot.text,'Zeige sieben Sternbilder am Himmel. (5 Punkte)');
 await edit('stamm','tasks',T,{archived:true});assert.equal((await get()).data.ranking.find(r=>r.id===11).points,5);assert.equal((await get()).data.catalog.tasks.find(t=>t.id===T).visible,false);
 assert.equal((await edit('stamm','categories','B',{archived:true})).status,422);assert.equal((await edit('stamm','categories','B',{archived:true},'local',{cascadeConfirmed:true})).status,200);
 assert.equal((await get()).data.ranking.find(r=>r.id===11).points,5);
});
test('result correction needs stammleiter authority, a reason and a matching reversal',async()=>{
 await book();await onDay();const e=(await exams())[0];await grade(e);
 assert.equal((await cmd('lead','correct-exam',{examId:e.id,result:'failed',reason:'Korrektur'})).status,422);
 assert.equal((await cmd('stamm','correct-exam',{examId:e.id,result:'failed',reason:''})).status,422);
 assert.equal((await cmd('stamm','correct-exam',{examId:e.id,result:'failed',reason:'Prüfung verwechselt.'})).status,200);
 let s=(await get()).data;assert.deepEqual(s.ledger.map(e=>e.points),[5,-5]);assert.equal(s.ranking.find(r=>r.id===11).points,0);
 await cmd('stamm','correct-exam',{examId:e.id,result:'passed',reason:'Richtiges Ergebnis geprüft.'});s=(await get()).data;assert.equal(s.ranking.find(r=>r.id===11).points,5);assert.equal(s.ledger.length,3);
 assert.throws(()=>db.exec('DELETE FROM knowledge_ledger'),/append-only/);
});
test('all 36 source topics keep one location, and custom regions/places/topics/tasks are editable',async()=>{
 let s=(await get('stamm')).data;assert.equal(s.catalog.topics.length,36);assert.equal(s.catalog.locations.length,36);
 for(const t of s.catalog.topics)assert.equal(s.catalog.locations.filter(l=>l.id===t.locationId).length,1);
 for(const [kind,fields] of [['categories',{title:'Wasserwissen'}],['regions',{title:'Flussinsel',scene:'rescue'}]])assert.equal((await cmd('stamm','catalog-change',{kind,scope:'local',create:true,fields})).status,200);
 s=(await get('stamm')).data;const category=s.catalog.categories.find(x=>x.title==='Wasserwissen'),region=s.catalog.regions.find(x=>x.title==='Flussinsel');
 await cmd('stamm','catalog-change',{kind:'locations',scope:'local',create:true,fields:{title:'Neue Hütte',regionId:region.id,icon:'hut'}});
 s=(await get('stamm')).data;const location=s.catalog.locations.find(x=>x.title==='Neue Hütte');
 await cmd('stamm','catalog-change',{kind:'topics',scope:'local',create:true,fields:{title:'Eigener Themenort',locationId:location.id,categoryId:category.id}});
 s=(await get('stamm')).data;const topic=s.catalog.topics.find(x=>x.title==='Eigener Themenort');
 assert.equal((await cmd('stamm','catalog-change',{kind:'tasks',scope:'local',create:true,fields:{title:'Wasser finden',text:'Erkläre die Aufgabe persönlich.',points:3,topicId:topic.id}})).status,200);
 assert.equal((await get('meppen','meppen')).data.catalog.topics.length,36);assert.equal((await get()).data.catalog.topics.length,37);
 assert.equal((await edit('stamm','tasks',T,{topicId:topic.id,sortOrder:2})).status,200);assert.equal((await get()).data.catalog.tasks.find(t=>t.id===T).mapRegionId,region.id);
});
test('legacy points and evidence survive once in a closed archive and never enter active exam payloads',()=>{
 const old={schema:1,progress:{['11:'+T]:{status:'approved',evidence:{text:'Private Altinformation'}}},ledger:[{id:'legacy-credit',type:'credit',rangerId:11,taskId:T,points:5,at:'2026-01-01T10:00:00Z',by:100}],challenges:[{id:'old-duel'}],policies:{},resolutions:{},audit:[]};
 const s=model.migrate(old);assert.equal(JSON.stringify(s.ledger),JSON.stringify(old.ledger));assert.equal(JSON.stringify(model.migrate(s)),JSON.stringify(s));assert.equal(s.legacy.challenges[0].id,'old-duel');
 const snap=model.snapshot(s,{rangers:exported.stamms['clp-west'].rangers,meetings:[]},{id:11,kind:'rangers',leader:false,stammId:'clp-west'});
 assert.equal(snap.ranking.find(r=>r.id===11).points,5);assert.equal(snap.challenges,undefined);assert.equal(JSON.stringify(snap).includes('Private Altinformation'),false);assert.equal(snap.progress['11:'+T].status,'approved');
});
test('team-scoped leader cannot inspect or grade another team and ranger cannot forge a target',async()=>{
 const row=db.prepare('SELECT people_json FROM knowledge_stamms WHERE id=?').get('clp-west'),people=JSON.parse(row.people_json);people.leaders.find(p=>p.id===100).teamIds=['Team A'];db.prepare('UPDATE knowledge_stamms SET people_json=? WHERE id=?').run(JSON.stringify(people),'clp-west');
 await book(T,'b');await onDay();const foreign=(await exams('stamm'))[0];assert.equal((await grade(foreign)).status,422);assert.equal((await get('lead')).data.exams.length,0);
 assert.equal((await cmd('a','register-exam',{taskId:T,meetingId:101,rangerId:12})).status,400);
 assert.equal((await cmd('b','withdraw-exam',{examId:foreign.id})).status,422);
 assert.equal((await grade(foreign,'passed','stamm')).status,200);const snap=(await get('lead')).data;assert.equal(snap.ledger.length,0);assert.equal(Object.keys(snap.progress).length,0);assert.equal(snap.ranking.find(r=>r.id===12).points,5);
});
test('server refuses digital evidence and forged points, and calendar uses compare-and-swap',async()=>{
 for(const extra of [{text:'Nachweis'},{photo:'data:xxx'},{points:999},{evidenceType:'oral'}])assert.equal((await cmd('a','register-exam',{taskId:T,meetingId:100,...extra})).status,400);
 const m=(await get('lead')).data.meetings.find(m=>m.id===100);const p={meeting:{...m,place:'Jugendwiese Cloppenburg'},revision:m.revision};assert.equal((await cmd('lead','calendar-change',p)).status,200);assert.equal((await cmd('lead','calendar-change',p)).status,422);
});
test('unknown source points need an audited clarification and fitness keeps its exact original option',async()=>{
 const unknown='fw-A-06-p078';await book(unknown);await onDay();const e=(await exams())[0];assert.equal((await grade(e)).status,422);
 assert.equal((await edit('stamm','tasks',unknown,{points:2},'local',{reason:''})).status,422);assert.equal((await edit('stamm','tasks',unknown,{points:2})).status,200);assert.equal((await grade(e)).status,200);assert.equal((await get()).data.ledger[0].sourcePoints,null);
 assert.equal((await cmd('b','register-exam',{taskId:fitness,meetingId:101,pointOption:286})).status,200);const fitnessExam=(await exams()).find(e=>e.taskId===fitness);assert.equal(fitnessExam.taskSnapshot.points,8);
});
test('a cancelled registration cannot be moved into a full replacement meeting',async()=>{
 await book();for(const id of ['fw-B-01-p133','fw-B-01-p134','fw-A-08-p087'])await book(id,'a',101);
 const m=(await get('lead')).data.meetings.find(m=>m.id===100);await cmd('lead','calendar-change',{meetingId:100,revision:m.revision});const e=(await exams())[0];assert.equal((await cmd('a','reassign-exam',{examId:e.id,meetingId:101})).status,422);assert.equal((await exams())[0].status,'meeting_cancelled');
});
test('custom task without a short title, subitem revisions and stale editor writes are handled',async()=>{
 let s=(await get('stamm')).data;const create=await cmd('stamm','catalog-change',{kind:'tasks',scope:'local',create:true,fields:{title:'',text:'Erkläre Wasser.',points:0,topicId:'B-01'}});assert.equal(create.status,200);
 assert.equal((await edit('stamm','tasks',T,{displaySubItems:['Erster eigener Unterpunkt']})).status,200);
 const item=(await get()).data.catalog.tasks.find(t=>t.id===T);assert.deepEqual(item.displaySubItems,['Erster eigener Unterpunkt']);assert.deepEqual(item.originalSubItems,[]);
 assert.equal((await cmd('stamm','catalog-change',{kind:'tasks',scope:'local',id:T,revision:0,fields:{text:'Veraltete Fassung'}})).status,422);
});
test('verified imports preserve global layers and reject unaudited local knowledge without changing the DB',()=>{
 const {catalogModel:K}=loadModel(),g=K.emptyLayer();g.overrides.tasks[T]={fields:{points:9},revision:1};g.revision=1;
 const incoming=structuredClone(exported);incoming.shared={knowledgeCatalog:g};const separate=openDatabase(':memory:');
 try{assert.throws(()=>importExisting(separate,incoming,model),/operator audit/);assert.equal(separate.prepare('SELECT COUNT(*) n FROM knowledge_stamms').get().n,0);importExisting(separate,incoming,model,{includeVerifiedKnowledge:true});assert.equal(JSON.parse(separate.prepare('SELECT data_json FROM knowledge_global_catalog').get().data_json).overrides.tasks[T].fields.points,9);importExisting(separate,incoming,model,{includeVerifiedKnowledge:true});assert.equal(separate.prepare('SELECT COUNT(*) n FROM knowledge_global_catalog').get().n,1);}finally{separate.close();}
});
test('existing SQLite schema-one state upgrades at server restart without changing ledger or private archive',()=>{
 const legacy={schema:1,progress:{},ledger:[{id:'old-restart',type:'credit',rangerId:11,taskId:T,points:5,at:'2026-01-01T10:00:00Z',by:100}],challenges:[{id:'retained'}],policies:{},resolutions:{},audit:[]};db.prepare('UPDATE knowledge_stamms SET state_json=? WHERE id=?').run(JSON.stringify(legacy),'clp-west');db.prepare('INSERT INTO knowledge_ledger VALUES(?,?,?,?,?,?,?)').run('old-restart','clp-west','11',T,5,null,JSON.stringify(legacy.ledger[0]));
 const principal={id:1,kind:'leaders',homeStammId:'clp-west',tokenHash:createHash('sha256').update(tokens.admin).digest('hex'),expiresAt:'2099-01-01T00:00:00Z'};
 createKnowledgeService({db,principals:[principal],origin:'http://localhost:8000'});const once=db.prepare('SELECT state_json FROM knowledge_stamms WHERE id=?').get('clp-west').state_json;createKnowledgeService({db,principals:[principal],origin:'http://localhost:8000'});assert.equal(db.prepare('SELECT state_json FROM knowledge_stamms WHERE id=?').get('clp-west').state_json,once);assert.equal(JSON.parse(once).legacy.challenges[0].id,'retained');assert.equal(JSON.parse(once).ledger[0].points,5);assert.equal(db.prepare('SELECT COUNT(*) n FROM knowledge_active_credits').get().n,1);
});
test('matching team meetings are selected and cancelled meeting details remain in personal history',async()=>{
 let m=(await get('lead')).data.meetings.find(m=>m.id===100);await cmd('lead','calendar-change',{meeting:{...m,teamIds:['Team B']},revision:m.revision});assert.equal((await get('a')).data.nextMeeting.id,101);assert.equal((await book()).status,422);assert.equal((await book(T,'b')).status,200);
 m=(await get('lead')).data.meetings.find(m=>m.id===100);await cmd('lead','calendar-change',{meetingId:100,revision:m.revision});const snap=(await get('b')).data;assert.equal(snap.meetings.find(m=>m.id===100).cancelled,true);assert.equal(snap.meetings.find(m=>m.id===100).place,'Cloppenburg');assert.equal(snap.exams[0].status,'meeting_cancelled');assert.equal(snap.nextMeeting.id,101);
});
test('custom local entries remain editable after creation and global arena title can change',async()=>{
 assert.equal((await cmd('stamm','catalog-change',{scope:'local',kind:'locations',create:true,fields:{title:'Testhütte',regionId:'wildnis',icon:'hut'}})).status,200);let s=(await get('stamm')).data;let loc=s.catalog.locations.find(l=>l.title==='Testhütte');assert.equal(loc.localRevision,1);assert.equal((await edit('stamm','locations',loc.id,{title:'Umbenannte Hütte',x:25})).status,200);assert.equal((await edit('stamm','locations',loc.id,{x:null})).status,200);assert.equal((await get()).data.catalog.locations.find(l=>l.id===loc.id).x,null);
 assert.equal((await edit('admin','regions','arena',{title:'Unsere Ranger-Rangliste',scene:'ranking'},'global')).status,200);
});
test('same ranger IDs in different stamms never share credits or examinations',async()=>{
 await book();await onDay();await grade((await exams())[0]);const other=(await get('admin','meppen')).data;assert.equal(other.ranking.find(r=>r.id===11).points,0);assert.equal(other.exams.length,0);assert.equal(other.ledger.length,0);assert.equal((await get()).data.ranking.find(r=>r.id===11).points,5);
});
test('cancelled duplicate attempt cannot be reassigned after the task has been passed elsewhere',async()=>{
 await book();const m=(await get('lead')).data.meetings.find(m=>m.id===100);await cmd('lead','calendar-change',{meetingId:100,revision:m.revision});await book(T,'a',101);await onDay(101);const list=await exams();await grade(list.find(e=>e.status==='registered'));const old=list.find(e=>e.status==='meeting_cancelled');assert.equal((await cmd('a','reassign-exam',{examId:old.id,meetingId:800})).status,422);
});
