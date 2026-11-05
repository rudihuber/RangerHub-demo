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

test('canonical dataset has exactly 66 stable books in order and totals 187 + 53 = 240',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json',import.meta.url),'utf8'));
 assert.equal(catalog.books.length,66);assert.equal(new Set(catalog.books.map(b=>b.id)).size,66);
 catalog.books.forEach((b,i)=>{assert.equal(b.id,'bible-'+String(i+1).padStart(2,'0'));assert.equal(b.canonicalOrder,i+1);assert.ok(Number.isInteger(b.points)&&b.points>=1);});
 assert.equal(catalog.books.filter(b=>b.testament==='AT').length,39);assert.equal(catalog.books.filter(b=>b.testament==='NT').length,27);
 assert.equal(catalog.books.filter(b=>b.testament==='AT').reduce((n,b)=>n+b.points,0),187);assert.equal(catalog.books.filter(b=>b.testament==='NT').reduce((n,b)=>n+b.points,0),53);
});
test('reading starts at zero, book catalog adds 240 to actual active Fachwissen maximum',async()=>{
 const s=(await get()).data;assert.deepEqual(s.maximum,{fachwissen:1358,bible:240,total:1598,unresolved:3});assert.equal(own(s).biblePoints,0);assert.equal(own(s).points,0);assert.deepEqual(s.bible.records['11'],{});
});
test('mark, undo and mark again grant exactly the book value and preserve the normal journal',async()=>{
 await book();await onDay();await grade((await exams())[0]);const before=state().ledger.map(e=>JSON.stringify(e));
 for(const [read,version,total] of [[true,0,15],[false,1,5],[true,2,15],[false,3,5]]){assert.equal((await setRead('bible-01',read,version)).status,200);const s=(await get()).data;assert.equal(own(s).points,total);assert.equal(own(s).approved,1);assert.equal(own(s).fachwissenPoints,5);assert.equal(own(s).biblePoints,read?10:0);assert.deepEqual(state().ledger.slice(0,before.length).map(e=>JSON.stringify(e)),before);}
});
test('all 66 marks yield exactly 240, undoing all yields exactly zero and never fills exam slots',async()=>{
 const before=JSON.stringify(state().exams);
 for(let i=1;i<=66;i++)assert.equal((await setRead('bible-'+String(i).padStart(2,'0'))).status,200);
 let s=(await get()).data;assert.equal(own(s).points,240);assert.equal(own(s).bibleBooks,66);assert.equal(own(s).approved,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM knowledge_bible_reading WHERE is_read=1').get().n,66);assert.equal(db.prepare('SELECT COUNT(*) n FROM knowledge_active_credits').get().n,66);
 for(let i=1;i<=66;i++)assert.equal((await setRead('bible-'+String(i).padStart(2,'0'),false,1)).status,200);
 s=(await get()).data;assert.equal(own(s).points,0);assert.equal(own(s).bibleBooks,0);assert.equal(JSON.stringify(state().exams),before);assert.equal(db.prepare('SELECT COUNT(*) n FROM knowledge_active_credits').get().n,0);
});
test('duplicate simultaneous devices and idempotency keys create only one active reading credit',async()=>{
 const id=randomUUID(),rs=await Promise.all([setRead('bible-19',true,0,'a',id),setRead('bible-19',true,0,'a',id),setRead('bible-19')]);assert.ok(rs.every(r=>r.status===200));assert.equal(own((await get()).data).points,30);assert.equal(state().ledger.filter(e=>e.type==='bible-credit').length,1);assert.equal(state().bibleReading.records['11']['bible-19'].version,1);
 assert.equal((await setRead('bible-19',false,1,'a',id)).status,409);
});
test('an old queued mark cannot resurrect a subsequently withdrawn mark',async()=>{
 await setRead();await setRead('bible-01',false,1);assert.equal((await setRead('bible-01',true,0)).status,422);const s=(await get()).data;assert.equal(s.bible.records['11']['bible-01'].isRead,false);assert.equal(own(s).points,0);
});
test('a new mark after undo needs the current version; redundant explicit states are harmless',async()=>{
 await setRead();await setRead('bible-01',false,1);assert.equal((await setRead('bible-01',false,0)).status,200);assert.equal((await setRead('bible-01',true,2)).status,200);assert.equal((await setRead('bible-01',true,2)).status,200);assert.equal(own((await get()).data).points,10);assert.equal(state().ledger.length,3);
});
test('rangers cannot supply another identity, points, attachments, invalid book or ambiguous toggle',async()=>{
 for(const p of [{bookId:'bible-01',isRead:true,version:0,rangerId:12},{bookId:'bible-01',isRead:true,version:0,points:500},{bookId:'bible-01',isRead:true,version:0,text:'proof'},{bookId:'bible-67',isRead:true,version:0},{bookId:'bible-01',isRead:'true',version:0},{bookId:'bible-01',toggle:true},{bookId:'bible-01',isRead:true,version:-1}])assert.equal((await cmd('a','set-bible-read',p)).status,422);
 assert.equal(state().ledger.length,0);
});
test('leaders, stammleiter and admins may inspect but cannot mark or remove ranger reading',async()=>{
 await setRead();for(const who of ['lead','stamm','admin'])assert.equal((await setRead('bible-01',false,1,who)).status,403);const snap=(await get('lead')).data;assert.equal(snap.bible.records['11']['bible-01'].isRead,true);assert.equal(own(snap).points,10);
});
test('ranger details and team-restricted leader details do not leak other reading records',async()=>{
 await setRead();assert.equal((await setRead('bible-02',true,0,'b')).status,200);let s=(await get('b')).data;assert.equal(s.bible.records['11'],undefined);assert.equal(own(s).points,10);
 const row=db.prepare('SELECT people_json FROM knowledge_stamms WHERE id=?').get('clp-west'),p=JSON.parse(row.people_json);p.leaders.find(p=>p.id===100).teamIds=['Team A'];db.prepare('UPDATE knowledge_stamms SET people_json=? WHERE id=?').run(JSON.stringify(p),'clp-west');s=(await get('lead')).data;assert.equal(s.bible.records['12'],undefined);assert.equal(s.bible.records['11']['bible-01'].isRead,true);
});
test('same user IDs in different stamms keep reading and totals separate',async()=>{
 await setRead();const s=(await get('admin','meppen')).data;assert.equal(s.ranking.find(r=>r.id===11).points,0);assert.deepEqual(s.bible.records['11'],{});assert.equal((await cmd('a','set-bible-read',{bookId:'bible-01',isRead:true,version:0},randomUUID(),'meppen')).status,403);
});
test('all three ordinary examinations remain available and the fourth stays blocked after Bible marks',async()=>{
 for(const tid of [T,'fw-B-01-p133','fw-A-08-p087'])assert.equal((await book(tid)).status,200);await setRead();await setRead('bible-02');assert.equal((await book('fw-B-01-p134')).status,422);assert.equal((await exams()).length,3);assert.equal(own((await get()).data).points,18);await setRead('bible-01',false,1);assert.equal((await exams()).length,3);
});
test('maxima respect actual local catalog changes and the Bible catalog stays immutable',async()=>{
 await edit('stamm','tasks',T,{points:7});let s=(await get()).data;assert.equal(s.maximum.total,1600);assert.equal((await edit('stamm','tasks','bible-01',{points:100})).status,422);await edit('stamm','tasks',T,{isActive:false});s=(await get()).data;assert.equal(s.maximum.total,1593);assert.equal(s.maximum.bible,240);
});
test('existing V30 users, roles, ledger and exam payloads survive idempotent extension',()=>{
 const plain=loadModel().model.initial();delete plain.bibleReading;plain.ledger.push({id:'normal-preserved',type:'credit',rangerId:11,taskId:T,points:5,at:'2026-01-01T10:00:00Z',by:100});const before=structuredClone(plain),s=model.migrate(plain);for(const [key,value] of Object.entries(before))assert.equal(JSON.stringify(s[key]),JSON.stringify(value));assert.equal(JSON.stringify(model.migrate(s)),JSON.stringify(s));
});
test('legacy 395-style marks and points migrate once without double counting ordinary points',()=>{
 const s=model.initial();s.bibleReading={schema:1,catalogVersion:'bible-reading-v1-395',records:{11:{'bible-19':{completed:true},'bible-40':{isRead:true},'bible-57':{isRead:false}}}};s.ledger=[{id:'ordinary',type:'credit',rangerId:11,taskId:T,points:5,at:'2026-01-01T10:00:00Z',by:100},{id:'old-psalms',type:'credit',source:'bible_reading',rangerId:11,taskId:'bible-19',points:50,at:'2026-01-01T10:00:00Z',by:100},{id:'old-matthew',type:'credit',source:'bible_reading',rangerId:11,taskId:'bible-40',points:9,at:'2026-01-01T10:00:00Z',by:100}];const migrated=model.migrate(s);assert.equal(model.totals(migrated,11),40);assert.equal(migrated.bibleReading.records['11']['bible-19'].isRead,true);assert.equal(migrated.bibleReading.records['11']['bible-57'].isRead,false);assert.equal(migrated.ledger[0].id,'ordinary');assert.equal(JSON.stringify(model.migrate(migrated)),JSON.stringify(migrated));
});
test('old pending Bible examinations stay open reading, do not award points or occupy slots',()=>{
 const s=model.initial();delete s.bibleReading;s.exams.push({id:'legacy-book-exam',rangerId:11,taskId:'bible-01',meetingId:100,status:'registered',history:[]});const m=model.migrate(s);assert.equal(m.exams[0].status,'reading_pending');assert.equal(model.used(m,11,100),0);assert.equal(model.totals(m,11),0);assert.deepEqual(JSON.parse(JSON.stringify(m.bibleReading.pendingMigration['11'])),['bible-01']);
});
test('SQLite restart and verified reimport preserve book versions and do not append a second award',async()=>{
 await setRead();const before=state().ledger.length;const principals=[{id:1,kind:'leaders',homeStammId:'clp-west',tokenHash:createHash('sha256').update(tokens.admin).digest('hex'),expiresAt:'2099-01-01T00:00:00Z'}];createKnowledgeService({db,principals,origin:'http://localhost:8000'});importExisting(db,exported,model);assert.equal(state().ledger.length,before);assert.equal(state().bibleReading.records['11']['bible-01'].version,1);assert.equal(db.prepare('SELECT version,is_read FROM knowledge_bible_reading').get().version,1);
});
test('complete legacy 395-point SQLite data becomes exactly 240 reading points once, keeping all 66 marks',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json',import.meta.url),'utf8')),s=model.initial();s.bibleReading={schema:1,catalogVersion:'bible-reading-v1-395',records:{11:{}}};const values=catalog.books.map(b=>Math.max(1,Math.round(b.points*395/240)));values[0]+=395-values.reduce((n,p)=>n+p,0);
 for(const [i,b] of catalog.books.entries()){s.bibleReading.records[11][b.id]={isRead:true,version:3,updatedAt:'2026-01-01T10:00:00Z'};s.ledger.push({id:'legacy-'+b.id,type:'credit',source:'bible_reading',rangerId:11,taskId:b.id,points:values[i],at:'2026-01-01T10:00:00Z',by:100});}
 assert.equal(s.ledger.reduce((n,e)=>n+e.points,0),395);db.prepare('UPDATE knowledge_stamms SET state_json=? WHERE id=?').run(JSON.stringify(s),'clp-west');for(const e of s.ledger)db.prepare('INSERT INTO knowledge_ledger VALUES(?,?,?,?,?,?,?)').run(e.id,'clp-west','11',e.taskId,e.points,null,JSON.stringify(e));
 const principals=[{id:1,kind:'leaders',homeStammId:'clp-west',tokenHash:createHash('sha256').update(tokens.admin).digest('hex'),expiresAt:'2099-01-01T00:00:00Z'}];createKnowledgeService({db,principals,origin:'http://localhost:8000'});let migrated=state();assert.equal(model.totals(migrated,11),240);assert.equal(Object.values(migrated.bibleReading.records['11']).filter(r=>r.isRead).length,66);assert.equal(migrated.bibleReading.records['11']['bible-01'].version,3);assert.equal(db.prepare('SELECT COUNT(*) n FROM knowledge_ledger').get().n,198);const before=JSON.stringify(migrated);createKnowledgeService({db,principals,origin:'http://localhost:8000'});assert.equal(JSON.stringify(state()),before);
});
test('legacy book exams cannot be rated or consume slots after the reading migration',()=>{
 const s=model.initial();delete s.bibleReading;s.exams=[{id:'passed-bible',rangerId:11,taskId:'bible-01',meetingId:100,status:'passed',history:[]}];const migrated=model.migrate(s);assert.equal(migrated.exams[0].status,'reading_archived');assert.equal(model.used(migrated,11,100),0);assert.throws(()=>model.apply(migrated,{rangers:exported.stamms['clp-west'].rangers},{id:1,kind:'leaders',leader:true,role:'Admin',stammId:'clp-west',homeStammId:'clp-west'},loadModel().catalogModel.emptyLayer(),'correct-exam',{examId:'passed-bible',result:'passed',reason:'X'}),/keine Leiterprüfung/);
});
test('an unassigned old aggregate Bible credit is never silently added to the new 240 points',()=>{
 const s=model.initial();s.bibleReading={schema:1,catalogVersion:'bible-reading-v1-395',records:{11:{'bible-01':{isRead:true}}}};s.ledger.push({id:'old-aggregate',type:'credit',source:'bible_reading',rangerId:11,taskId:'bible-reading-total',points:395,at:'2026-01-01T10:00:00Z'});const before=JSON.stringify(s);assert.throws(()=>model.migrate(s),/keinem kanonischen Buch/);assert.equal(JSON.stringify(s),before);s.ledger.push({id:'aggregate-reversed',type:'reversal',source:'bible_reading',rangerId:11,taskId:'bible-reading-total',points:-395,reversalOf:'old-aggregate',at:'2026-01-02T10:00:00Z'});assert.equal(model.totals(model.migrate(s),11),10);
});
