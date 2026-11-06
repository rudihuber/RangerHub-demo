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

const chapter=(n,isRead=true,version=0,who='a',bookId='bible-01',id=randomUUID(),tribe='clp-west')=>cmd(who,'set-bible-chapter',{bookId,chapter:n,isRead,version},id,tribe);
const rb=(s=(null),id='bible-01')=>(s||state()).bibleReading.records['11']?.[id];
const chaptersOf=(s,id='bible-01')=>s.bible.records['11']?.[id]?.chapterState;
test('canonical 66-book catalog contains AT 929 + NT 260 = 1189 chapters without changing points',async()=>{
 const c=JSON.parse(readFileSync(new URL('../data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json',import.meta.url),'utf8')),sum=t=>c.books.filter(b=>b.testament===t).reduce((n,b)=>n+b.chapters,0);
 assert.equal(c.books.length,66);assert.equal(sum('AT'),929);assert.equal(sum('NT'),260);assert.equal(c.books.reduce((n,b)=>n+b.points,0),240);const s=(await get()).data;assert.equal(s.bible.totalChapters,1189);assert.equal(own(s).bibleChapters,0);
});
test('3/50 Genesis chapters are 6 percent with no points or examination slots',async()=>{
 for(let n=1;n<=3;n++)assert.equal((await chapter(n,true,n-1)).status,200);const s=(await get()).data;assert.equal(own(s).biblePoints,0);assert.equal(own(s).bibleChapters,3);assert.equal(own(s).bibleChapterPercent,3/1189*100);assert.equal(s.ledger.length,0);assert.equal(s.exams.length,0);assert.deepEqual(chaptersOf(s).chapters,[1,2,3]);assert.equal(chaptersOf(s).chapters.length/50*100,6);
});
test('whole-book check covers all chapters; undo restores the exact existing 3/50 plan',async()=>{
 for(let n=1;n<=3;n++)await chapter(n,true,n-1);await setRead('bible-01',true,3);let s=(await get()).data;assert.equal(own(s).bibleChapters,50);assert.equal(own(s).points,10);assert.deepEqual(chaptersOf(s).chapters,[1,2,3]);assert.equal(chaptersOf(s).explicit,true);
 await setRead('bible-01',false,4);s=(await get()).data;assert.equal(own(s).bibleChapters,3);assert.equal(own(s).points,0);assert.deepEqual(chaptersOf(s).chapters,[1,2,3]);assert.equal(chaptersOf(s).explicit,false);
});
test('finishing last individual chapter grants one book credit; undo and retry reverse only once',async()=>{
 for(let n=1;n<=49;n++)assert.equal((await chapter(n,true,n-1)).status,200);assert.equal(own((await get()).data).points,0);assert.equal((await chapter(50,true,49)).status,200);let s=(await get()).data;assert.equal(own(s).points,10);assert.equal(own(s).bibleChapters,50);assert.equal(s.ledger.filter(e=>e.type==='bible-credit').length,1);
 assert.equal((await chapter(50,true,49)).status,200);assert.equal((await chapter(50,false,50)).status,200);s=(await get()).data;assert.equal(own(s).points,0);assert.equal(own(s).bibleChapters,49);assert.equal((await chapter(50,false,50)).status,200);assert.equal((await chapter(50,true,51)).status,200);s=(await get()).data;assert.equal(own(s).points,10);assert.equal(own(s).bibleChapters,50);assert.equal(s.ledger.length,3);
});
test('editing one chapter of explicit full coverage materializes the other chapters, removes credit',async()=>{
 await chapter(1);await setRead('bible-01',true,1);assert.equal((await chapter(2,false,2)).status,200);let s=(await get()).data;assert.equal(own(s).bibleChapters,49);assert.equal(own(s).points,0);assert.equal(chaptersOf(s).explicit,false);assert.ok(chaptersOf(s).chapters.includes(50));assert.ok(!chaptersOf(s).chapters.includes(2));
 await chapter(2,true,3);s=(await get()).data;assert.equal(own(s).points,10);assert.equal((await setRead('bible-01',false,4)).status,200);s=(await get()).data;assert.equal(own(s).points,0);assert.equal(own(s).bibleChapters,49);assert.ok(!chaptersOf(s).chapters.includes(50));
});
test('old read flags migrate as full coverage without records, duplicate journal entries or version changes',async()=>{
 await setRead();const before=state();delete before.bibleReading.records['11']['bible-01'].chapterState;const old=JSON.stringify(before),next=model.migrate(before);assert.equal(JSON.stringify(next),old);const env={rangers:exported.stamms['clp-west'].rangers,leaders:exported.stamms['clp-west'].leaders,meetings:exported.stamms['clp-west'].meetings},a={id:11,kind:'rangers',leader:false,role:'Ranger',stammId:'clp-west',homeStammId:'clp-west'};
 const snap=model.snapshot(next,env,a);assert.equal(own(snap).bibleChapters,50);assert.equal(own(snap).points,10);assert.equal(next.bibleReading.records['11']['bible-01'].version,1);assert.equal(next.ledger.length,1);assert.equal(JSON.stringify(model.migrate(next)),old);
});
test('all 66 directly marked books cover exactly 1189 chapters and 240 points; undo yields zero',async()=>{
 for(let i=1;i<=66;i++)assert.equal((await setRead('bible-'+String(i).padStart(2,'0'))).status,200);let s=(await get()).data;assert.equal(own(s).bibleChapters,1189);assert.equal(own(s).bibleChapterPercent,100);assert.equal(own(s).biblePoints,240);assert.equal(own(s).bibleBooks,66);
 for(let i=1;i<=66;i++)await setRead('bible-'+String(i).padStart(2,'0'),false,1);s=(await get()).data;assert.equal(own(s).bibleChapters,0);assert.equal(own(s).points,0);assert.equal(s.exams.length,0);
});
test('chapter duplicates and simultaneous devices use version checks and command idempotency',async()=>{
 const id=randomUUID(),rs=await Promise.all([chapter(1,true,0,'a','bible-01',id),chapter(1,true,0,'a','bible-01',id),chapter(1)]);assert.ok(rs.every(r=>r.status===200));assert.equal(rb().version,1);assert.equal(own((await get()).data).bibleChapters,1);
 const conflict=await Promise.all([chapter(2,true,1),chapter(3,true,1)]);assert.deepEqual(conflict.map(r=>r.status).sort(),[200,422]);assert.equal(own((await get()).data).bibleChapters,2);assert.equal((await chapter(1,false,0)).status,422);assert.equal((await chapter(1,true,0)).status,200);
});
test('chapter privacy, role protection and stamms are enforced on the server',async()=>{
 await chapter(1);for(const who of ['lead','stamm','admin'])assert.equal((await chapter(2,true,1,who)).status,403);assert.equal((await chapter(1,true,0,'a','bible-01',randomUUID(),'meppen')).status,403);
 const other=(await get('b')).data;assert.equal(other.bible.records['11'],undefined);assert.equal(other.ranking.find(r=>r.id===11).bibleChapters,undefined);const lead=(await get('lead')).data;assert.equal(lead.bible.records['11']['bible-01'].chapterState.chapters.length,1);assert.equal(own(lead).bibleChapters,1);
});
test('invalid chapters, foreign identities and forged points fail without modifying the source',async()=>{
 const before=JSON.stringify(state());for(const p of [{bookId:'bible-01',chapter:0,isRead:true,version:0},{bookId:'bible-01',chapter:51,isRead:true,version:0},{bookId:'bible-19',chapter:151,isRead:true,version:0},{bookId:'bible-01',chapter:1,isRead:true,version:0,rangerId:12},{bookId:'bible-01',chapter:1,isRead:true,version:0,points:100},{bookId:'bible-01',chapter:1.5,isRead:true,version:0},{bookId:'bible-01',chapter:1,isRead:'yes',version:0}])assert.equal((await cmd('a','set-bible-chapter',p)).status,422);assert.equal(JSON.stringify(state()),before);
});
test('ordinary Fachwissen credits and all three examination slots remain independent',async()=>{
 await book();await onDay();await grade((await exams())[0]);const preserved=JSON.stringify(state().ledger[0]);for(let n=1;n<=3;n++)await chapter(n,true,n-1);await setRead('bible-01',true,3);await setRead('bible-01',false,4);assert.equal(JSON.stringify(state().ledger[0]),preserved);assert.equal(own((await get()).data).points,5);assert.equal((await exams()).length,1);
});
test('chapter plans persist in the existing canonical SQLite JSON and keep active credit projection correct',async()=>{
 await chapter(1);await setRead('bible-01',true,1);assert.equal(db.prepare('SELECT is_read FROM knowledge_bible_reading WHERE stamm_id=? AND ranger_id=? AND book_id=?').get('clp-west','11','bible-01').is_read,1);const persisted=JSON.parse(db.prepare('SELECT state_json FROM knowledge_stamms WHERE id=?').get('clp-west').state_json);assert.deepEqual(persisted.bibleReading.records['11']['bible-01'].chapterState.chapters,[1]);assert.equal(db.prepare('SELECT COUNT(*) n FROM knowledge_active_credits').get().n,1);await setRead('bible-01',false,2);assert.equal(db.prepare('SELECT COUNT(*) n FROM knowledge_active_credits').get().n,0);
});
test('server restart retains partial undo state and never re-awards an existing complete book',async()=>{
 await chapter(1);await chapter(2,true,1);await setRead('bible-01',true,2);const before=JSON.stringify(state().ledger),records=JSON.stringify(state().bibleReading.records);
 await new Promise(r=>server.close(r));const principals=[{id:11,kind:'rangers',homeStammId:'clp-west',tokenHash:createHash('sha256').update(tokens.a).digest('hex'),expiresAt:'2099-01-01T00:00:00Z'}];server=createServer(createKnowledgeService({db,principals,origin:'http://localhost:8000'}).handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 assert.equal(JSON.stringify(state().ledger),before);assert.equal(JSON.stringify(state().bibleReading.records),records);assert.equal(own((await get()).data).bibleChapters,50);await setRead('bible-01',false,3);const s=(await get()).data;assert.equal(own(s).bibleChapters,2);assert.equal(own(s).points,0);assert.deepEqual(chaptersOf(s).chapters,[1,2]);
});
test('team-scoped leaders receive chapter statistics only for their authorized ranger team',async()=>{
 await chapter(1,true,0,'a');await chapter(1,true,0,'b');const row=db.prepare('SELECT people_json FROM knowledge_stamms WHERE id=?').get('clp-west'),people=JSON.parse(row.people_json);people.leaders.find(p=>p.id===100).teamIds=['Team A'];db.prepare('UPDATE knowledge_stamms SET people_json=? WHERE id=?').run(JSON.stringify(people),'clp-west');const s=(await get('lead')).data;assert.equal(s.bible.records['12'],undefined);assert.equal(s.ranking.find(r=>r.id===12).bibleChapters,undefined);assert.equal(own(s).bibleChapters,1);
});
