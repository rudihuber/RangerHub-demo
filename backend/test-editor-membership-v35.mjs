import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {openDatabase,loadModel,importExisting,createKnowledgeService} from './knowledge-server.mjs';
import {aiAssistant,imageBytes} from './editor-v35.mjs';
let db,server,base,tokens,model,directory,member;
const day=n=>new Date(Date.now()+n*86400000).toISOString().slice(0,10);
const people={rangers:[{id:11,name:'Ranger A'},{id:12,name:'Ranger B'},{id:13,name:'Altarchiv',archived:true},{id:14,name:'Früher inaktiv',active:false}],leaders:[{id:1,name:'Admin',role:'Admin'},{id:2,name:'Stammleitung',role:'Stammleiter'},{id:3,name:'Leitung',role:'Leiter'}]};
beforeEach(async()=>{
 db=openDatabase(':memory:');({model,membership:member}=loadModel());directory=mkdtempSync(join(tmpdir(),'rh-v35-'));importExisting(db,{__rhv24:true,stamms:{'clp-west':{...structuredClone(people),meetings:[{id:100,date:day(5),start:'18:00'}]},meppen:{...structuredClone(people),meetings:[]}}},model);
 tokens={};const principals=[['admin',1,'leaders','clp-west'],['stamm',2,'leaders','clp-west'],['lead',3,'leaders','clp-west'],['ranger',11,'rangers','clp-west'],['other',11,'rangers','meppen'],['otherStamm',2,'leaders','meppen']].map(([who,id,kind,homeStammId])=>{const token=randomBytes(36).toString('base64url');tokens[who]=token;return {id,kind,homeStammId,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:'2099-01-01T00:00:00Z'};});
 server=createServer(createKnowledgeService({db,principals,origin:'http://localhost:8000',assetDirectory:directory,ai:{}}).handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
});
afterEach(async()=>{await new Promise(r=>server.close(r));db.close();rmSync(directory,{recursive:true,force:true});});
async function get(who='admin',tribe='clp-west'){const r=await fetch(base+'/knowledge?stammId='+tribe,{headers:{Authorization:'Bearer '+tokens[who]}});return {status:r.status,data:await r.json()};}
async function cmd(who,type,payload,tribe='clp-west'){const r=await fetch(base+'/knowledge/commands?stammId='+tribe,{method:'POST',headers:{Authorization:'Bearer '+tokens[who],'Content-Type':'application/json'},body:JSON.stringify({type,payload,requestId:randomUUID()})});return {status:r.status,data:await r.json()};}
const text=(html='Erster Text')=>({id:'text-a',type:'text',x:50,y:50,width:800,height:200,rotation:0,z:1,opacity:1,locked:false,group:'',html,label:'Text',style:{fontSize:24,color:'#294b3b',lineHeight:1.4}});
const doc=(html='Erster Text')=>({schema:1,pages:[{id:'page-a',title:'Seite',section:'',visible:true,archived:false,height:800,background:'#f5f2e6',elements:[text(html)]}]});
const draft=(revision,document=doc(),scope='local',who='admin',tribe='clp-west')=>cmd(who,'visual-draft',{scope,moduleId:'emblem',revision,document},tribe);
const publish=(revision,scope='local',who='admin',tribe='clp-west')=>cmd(who,'visual-publish',{scope,moduleId:'emblem',revision},tribe);
const status=(value,revision=0,extra={},who='admin',tribe='clp-west')=>cmd(who,'membership-change',{kind:'rangers',personId:11,status:value,revision,effectiveFrom:day(0),confirmed:true,...extra},tribe);
test('drafts are private, explicit publication synchronizes another authenticated device, restore stays draft',async()=>{
 assert.equal((await draft(0)).status,200);const ranger=(await get('ranger')).data;assert.equal(ranger.visual.layers,undefined);assert.equal(JSON.stringify(ranger).includes('Erster Text'),false);assert.equal((await publish(1)).status,200);assert.equal((await get('ranger')).data.visual.published.emblem.document.pages[0].elements[0].html,'Erster Text');
 assert.equal((await draft(2,doc('Zweite Fassung'))).status,200);assert.equal((await publish(3)).status,200);assert.equal((await cmd('admin','visual-restore',{moduleId:'emblem',scope:'local',revision:4,version:1})).status,200);assert.equal((await get('ranger')).data.visual.published.emblem.document.pages[0].elements[0].html,'Zweite Fassung');assert.equal((await get()).data.visual.layers.local.records.emblem.draft.pages[0].elements[0].html,'Erster Text');
});
test('stale edits conflict, local publication never changes another tribe, global/local precedence is explicit',async()=>{
 assert.equal((await draft(0,doc('Global'),'global')).status,200);assert.equal((await publish(1,'global')).status,200);assert.equal((await draft(0,doc('Eigener Stamm'),'local','stamm')).status,200);assert.equal((await draft(0,doc('Veraltetes Gerät'),'local','stamm')).status,422);assert.equal((await publish(1,'local','stamm')).status,200);assert.equal((await get('ranger')).data.visual.published.emblem.document.pages[0].elements[0].html,'Eigener Stamm');assert.equal((await get('other','meppen')).data.visual.published.emblem.document.pages[0].elements[0].html,'Global');assert.notEqual((await draft(0,doc(),'global','stamm')).status,200);assert.equal((await draft(0,doc(),'local','otherStamm','clp-west')).status,403);
});
test('module release and page visibility remain independent of draft/publication',async()=>{
 const hidden=doc();hidden.pages[0].visible=false;assert.equal((await draft(0,hidden)).status,200);assert.equal((await publish(1)).status,200);assert.equal((await get('ranger')).data.visual.published.emblem.document.pages.length,0);
 const snap=(await get()).data,module=snap.wisdom.modules.find(m=>m.id==='emblem');assert.equal((await cmd('admin','wisdom-change',{kind:'modules',id:'emblem',scope:'local',revision:module.localRevision,fields:{published:false}})).status,200);assert.equal((await get('ranger')).data.visual.published.emblem,undefined);assert.ok((await get()).data.visual.layers.local.records.emblem.published);
});
test('ranger and ordinary leader cannot forge editor or membership writes',async()=>{
 for(const who of ['ranger','lead']){assert.notEqual((await draft(0,doc(),'global',who)).status,200);assert.notEqual((await status('paused',0,{role:'Admin'},who)).status,200);}
 assert.equal((await cmd('admin','visual-permission',{scope:'local',personId:3,enabled:true})).status,200);assert.equal((await draft(0,doc(),'local','lead')).status,200);assert.notEqual((await draft(0,doc(),'global','lead')).status,200);
});
test('unsafe HTML, unowned image references and objects outside the page are rejected',async()=>{
 assert.equal((await draft(0,doc('<img src=x onerror=alert(1)>'))).status,422);const outside=doc();outside.pages[0].elements[0].x=900;assert.equal((await draft(0,outside)).status,422);const invalid=doc();invalid.pages[0].elements[0]={...text(),type:'image',assetId:'upload-'+'a'.repeat(64),alt:'Fremdes Bild'};assert.equal((await draft(0,invalid)).status,422);
});
test('uploads are scoped authenticated blobs and ranger cannot read unpublished media',async()=>{
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6qXcAAAAASUVORK5CYII=','base64');const url=base+'/knowledge/assets?stammId=clp-west&scope=local&width=1&height=1&alt=Bild';let r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+tokens.admin,'Content-Type':'image/png'},body:bytes});assert.equal(r.status,200);const asset=await r.json();assert.equal((await fetch(base+'/knowledge/assets/'+asset.id+'?stammId=clp-west',{headers:{Authorization:'Bearer '+tokens.ranger}})).status,403);
 const d=doc();d.pages[0].elements.push({...text(),id:'image-a',type:'image',x:50,y:300,width:200,height:200,assetId:asset.id,alt:'Eigenes Bild'});assert.equal((await draft(0,d)).status,200);assert.equal((await publish(1)).status,200);r=await fetch(base+'/knowledge/assets/'+asset.id+'?stammId=clp-west',{headers:{Authorization:'Bearer '+tokens.ranger}});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);assert.equal((await fetch(base+'/knowledge/assets/'+asset.id+'?stammId=meppen',{headers:{Authorization:'Bearer '+tokens.other}})).status,404);assert.ok(!db.prepare('SELECT state_json FROM knowledge_stamms').get().state_json.includes(bytes.toString('base64')));
});
test('SVG rejects scripts, external requests, events and misleading mime types',()=>{
 for(const s of ['<svg><script>alert(1)</script></svg>','<svg><image href="https://example.org/a"/></svg>','<svg onload="alert(1)"></svg>','<!DOCTYPE svg><svg></svg>'])assert.throws(()=>imageBytes(Buffer.from(s),'image/svg+xml'));
 assert.ok(imageBytes(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M0 0L20 20" stroke="#000"/></svg>'),'image/svg+xml').length);assert.throws(()=>imageBytes(Buffer.from('not png'),'image/png'));
});
test('real multi-page editions above the old examination request limit save and publish',async()=>{
 const d=doc();d.pages[0].elements=Array.from({length:100},(_,i)=>({...text('Redaktioneller Text. '.repeat(80)),id:'large-text-'+i,x:40,y:40,width:800,height:100}));assert.ok(Buffer.byteLength(JSON.stringify(d))>131072);assert.equal((await draft(0,d)).status,200);assert.equal((await publish(1)).status,200);assert.equal((await get('ranger')).data.visual.published.emblem.document.pages[0].elements.length,100);
});
test('pause removes current rank and new exam rights, retains points, reactivation reuses identity',async()=>{
 assert.equal((await cmd('ranger','set-bible-chapter',{bookId:'bible-01',chapter:1,isRead:true,version:0})).status,200);const before=JSON.parse(db.prepare("SELECT state_json FROM knowledge_stamms WHERE id='clp-west'").get().state_json);assert.equal((await status('paused',0,{note:'Verwaltungsnotiz'})).status,200);assert.equal((await get('ranger')).status,200);assert.equal((await get('ranger')).data.memberships.ownStatus,'paused');assert.equal((await cmd('ranger','register-exam',{taskId:'fw-B-01-p132',meetingId:100})).status,403);assert.equal((await get('lead')).data.ranking.some(p=>p.id===11),false);assert.equal(JSON.stringify((await get('lead')).data).includes('Verwaltungsnotiz'),false);assert.equal((await status('active',1)).status,200);const after=JSON.parse(db.prepare("SELECT state_json FROM knowledge_stamms WHERE id='clp-west'").get().state_json);assert.deepEqual(after.ledger,before.ledger);assert.deepEqual(after.bibleReading,before.bibleReading);assert.equal((await get('ranger')).data.memberships.ownStatus,'active');assert.equal((await get('other','meppen')).data.memberships.ownStatus,'active');
});
test('exit revokes a real personal token; stale status writes fail and audit cannot be rewritten',async()=>{
 assert.equal((await status('left')).status,200);assert.equal((await get('ranger')).status,403);assert.equal((await status('active',0)).status,422);assert.equal((await status('active',1)).status,200);assert.equal((await get('ranger')).status,200);assert.equal(db.prepare('SELECT count(*) AS n FROM membership_events').get().n,2);assert.throws(()=>db.exec('DELETE FROM membership_events'),/append-only/);assert.throws(()=>db.exec("UPDATE membership_events SET event_json='{}'"),/append-only/);
});
test('historical attendance excludes paused/left periods and stays null without suitable records',()=>{
 const p={id:11,membership:{initialStatus:'active',events:[{effectiveFrom:'2026-02-01',newStatus:'paused'},{effectiveFrom:'2026-04-01',newStatus:'active'},{effectiveFrom:'2026-06-01',newStatus:'left'}]}};
 const dates=['2026-01-10','2026-02-10','2026-03-10','2026-04-10','2026-06-10'],meetings=dates.map((date,i)=>({id:i,date,attendance:{rangers:{11:i===0?'ANWESEND':'ABWESEND'}}}));const result=member.attendance(p,meetings,'rangers','2026-07-01T12:00Z');assert.equal(result.total,2);assert.equal(result.attended,1);assert.equal(result.percent,50);assert.equal(member.attendance(p,meetings.slice(1,3),'rangers','2026-07-01').ratio,null);assert.equal(member.status({archived:true}),'left');assert.equal(member.status({active:false}),'paused');assert.equal(member.status({}),'active');
});
test('AI is honestly unavailable without configuration and never calls an external provider',async()=>{
 const s=(await get()).data;assert.equal(s.visual.ai.configured,false);const r=await fetch(base+'/knowledge/ai?stammId=clp-west',{method:'POST',headers:{Authorization:'Bearer '+tokens.admin,'Content-Type':'application/json'},body:JSON.stringify({kind:'text',instruction:'Kürzen',text:'Redaktioneller Text'})});assert.equal(r.status,503);assert.match((await r.json()).error,/nicht konfiguriert/);
});
test('configured AI sends editorial allowlist only, proposes without publication, and rate-limits',async()=>{
 let requests=[];const ai=aiAssistant({apiKey:'synthetic-test-secret',model:'test-model',maxDaily:2,fetchImpl:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({output_text:'{"text":"Ein kürzerer redaktioneller Text."}'})};}}),actor={key:'test-actor',id:1,privateName:'Should never be sent'};
 const payload={kind:'text',instruction:'Bitte kürzen.',text:'Ein längerer redaktioneller Ausgangstext.'};const result=await ai.suggest(actor,payload);assert.equal(result.text,'Ein kürzerer redaktioneller Text.');assert.equal(requests[0].url,'https://api.openai.com/v1/responses');assert.ok(!requests[0].options.body.includes('Should never be sent'));assert.ok(!requests[0].options.body.includes('synthetic-test-secret'));await ai.suggest(actor,payload);await assert.rejects(()=>ai.suggest(actor,payload),e=>e.status===429);assert.equal(requests.length,2);await assert.rejects(()=>ai.suggest({key:'different'},{...payload,attendance:{}}),e=>e.status===400);
});
