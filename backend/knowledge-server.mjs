/** Optional central Fachwissen service. Node 24+, native SQLite, no UI dependencies.
 * Starts only with an explicit database, imported membership, personal token hashes,
 * and a configured frontend origin. No credentials or example users are created.
 */
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';
import vm from 'node:vm';
import {delegationStore,managementCollections} from './delegation-v36.mjs';
import {assetStore,imageBytes,aiAssistant,hash} from './editor-v35.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const digest=s=>createHash('sha256').update(s).digest('hex');
export function loadModel(root=ROOT){
 const catalog=JSON.parse(readFileSync(resolve(root,'data/knowledge-normalized.json'),'utf8'));
 const context=vm.createContext({window:{RangerHubKnowledgeCatalog:catalog},structuredClone,crypto:{randomUUID}});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-knowledge-catalog-v36.js'),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-membership-model-v36.js'),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-knowledge-model-v36.js'),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-bible-catalog.js'),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-bible-model.js'),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-bible-chapters-v33.js'),'utf8'),context,{timeout:1000});
 for(const file of ['rangerhub-wisdom-catalog-v33.js','rangerhub-wisdom-model-v36.js'])vm.runInContext(readFileSync(resolve(root,file),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-visual-model-v36.js'),'utf8'),context,{timeout:1000});
 return {model:context.window.RHKnowledgeModel,membership:context.window.RHMembershipModel,catalog,catalogModel:context.window.RHKnowledgeCatalogV30};
}
export function openDatabase(path){
 const db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS knowledge_stamms(id TEXT PRIMARY KEY,people_json TEXT NOT NULL,state_json TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS knowledge_ledger(id TEXT PRIMARY KEY,stamm_id TEXT NOT NULL,ranger_id TEXT NOT NULL,task_id TEXT NOT NULL,points INTEGER NOT NULL,reversal_of TEXT UNIQUE,entry_json TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS knowledge_commands(stamm_id TEXT NOT NULL,actor_key TEXT NOT NULL,request_id TEXT NOT NULL,payload_hash TEXT NOT NULL,PRIMARY KEY(stamm_id,actor_key,request_id));
 CREATE TRIGGER IF NOT EXISTS knowledge_ledger_no_update BEFORE UPDATE ON knowledge_ledger BEGIN SELECT RAISE(ABORT,'Ledger entries are append-only'); END;
 CREATE TRIGGER IF NOT EXISTS knowledge_ledger_no_delete BEFORE DELETE ON knowledge_ledger BEGIN SELECT RAISE(ABORT,'Ledger entries are append-only'); END;`);
 db.exec(`CREATE TABLE IF NOT EXISTS membership_events(id TEXT PRIMARY KEY,stamm_id TEXT NOT NULL,kind TEXT NOT NULL,person_id TEXT NOT NULL,revision INTEGER NOT NULL,event_json TEXT NOT NULL);
 CREATE TRIGGER IF NOT EXISTS membership_events_no_update BEFORE UPDATE ON membership_events BEGIN SELECT RAISE(ABORT,'Membership audit is append-only'); END;
 CREATE TRIGGER IF NOT EXISTS membership_events_no_delete BEFORE DELETE ON membership_events BEGIN SELECT RAISE(ABORT,'Membership audit is append-only'); END;`);
 const columns=db.prepare('PRAGMA table_info(knowledge_stamms)').all();
 if(!columns.some(c=>c.name==='calendar_json'))db.exec("ALTER TABLE knowledge_stamms ADD COLUMN calendar_json TEXT NOT NULL DEFAULT '[]'");
 db.exec(`CREATE TABLE IF NOT EXISTS knowledge_global_catalog(id INTEGER PRIMARY KEY CHECK(id=1),data_json TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS knowledge_exams(id TEXT PRIMARY KEY,stamm_id TEXT NOT NULL,ranger_id TEXT NOT NULL,meeting_id TEXT NOT NULL,task_id TEXT NOT NULL,status TEXT NOT NULL,exam_json TEXT NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS knowledge_exam_unique ON knowledge_exams(stamm_id,ranger_id,meeting_id,task_id) WHERE status IN ('registered','passed','failed','no_show');
 CREATE TABLE IF NOT EXISTS knowledge_active_credits(stamm_id TEXT NOT NULL,ranger_id TEXT NOT NULL,task_id TEXT NOT NULL,credit_id TEXT NOT NULL UNIQUE,PRIMARY KEY(stamm_id,ranger_id,task_id));
 CREATE TABLE IF NOT EXISTS knowledge_bible_reading(stamm_id TEXT NOT NULL,ranger_id TEXT NOT NULL,book_id TEXT NOT NULL,is_read INTEGER NOT NULL CHECK(is_read IN (0,1)),version INTEGER NOT NULL CHECK(version>=0),updated_at TEXT,PRIMARY KEY(stamm_id,ranger_id,book_id));`);
 return db;
}
export function importExisting(db,exported,model,{includeVerifiedKnowledge=false}={}){
 if(!exported?.__rhv24||!exported.stamms)throw Error('An existing RangerHub JSON export is required.');
 db.exec('BEGIN IMMEDIATE');
 try{
  if(exported.shared?.knowledgeCatalog&&!db.prepare('SELECT id FROM knowledge_global_catalog WHERE id=1').get()){
   if(!includeVerifiedKnowledge)throw Error('Existing global knowledge requires operator audit and explicit includeVerifiedKnowledge; nothing was reset.');
   const {catalogModel}=loadModel();catalogModel.validate(catalogModel.effective(exported.shared.knowledgeCatalog,catalogModel.emptyLayer()));
   db.prepare('INSERT INTO knowledge_global_catalog VALUES(1,?)').run(JSON.stringify(exported.shared.knowledgeCatalog));
  }
  for(const [id,original] of Object.entries(exported.stamms)){
   const s=structuredClone(original);loadModel().membership.recoverArchives(s,id);
   if(!Array.isArray(s.rangers)||!Array.isArray(s.leaders))throw Error('Membership missing: '+id);
   // Import existing IDs and roles. No birthdays, addresses, photos or new accounts.
   db.exec("CREATE TABLE IF NOT EXISTS management_v36(stamm_id TEXT PRIMARY KEY,revision INTEGER NOT NULL DEFAULT 0,data_json TEXT NOT NULL DEFAULT '{}')");db.prepare('INSERT OR IGNORE INTO management_v36 VALUES(?,0,?)').run(id,JSON.stringify(Object.fromEntries(managementCollections.filter(k=>Array.isArray(s[k])).map(k=>[k,s[k]]))));
   const safePerson=p=>Object.fromEntries(['name','team','stage','mobile','phone','email','birthday','address','address2','church','region','photo','photoData','profileRevision'].filter(k=>p[k]!==undefined).map(k=>[k,p[k]]));
   const people={rangers:s.rangers.map(p=>({...safePerson(p),id:p.id,alias:model.alias(p),name:p.name||model.alias(p),team:p.team||'',teamId:p.teamId,membership:p.membership,archived:!!p.archived,active:p.active!==false,knowledgeEligible:p.knowledgeEligible!==false})),
    leaders:s.leaders.map(p=>({...safePerson(p),id:p.id,name:p.name||String(p.id),membership:p.membership,role:p.role||'Leiter',teamIds:p.managedTeamIds||p.knowledgeTeamIds||[],membership:p.membership,archived:!!p.archived,active:p.active!==false}))};
   const previous=db.prepare('SELECT state_json,calendar_json,people_json FROM knowledge_stamms WHERE id=?').get(id);
   if(previous){const oldPeople=JSON.parse(previous.people_json);for(const kind of ['rangers','leaders'])for(const p of people[kind]){const old=oldPeople[kind].find(x=>String(x.id)===String(p.id));if(old?.membership)p.membership=old.membership;}}
   if(!previous&&s.knowledge&&!includeVerifiedKnowledge)throw Error('Existing local knowledge requires operator audit and explicit includeVerifiedKnowledge; nothing was reset.');
   const state=model.migrate(previous?JSON.parse(previous.state_json):(s.knowledge??model.initial()));model.check(state);
   db.prepare('INSERT INTO knowledge_stamms(id,people_json,state_json) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET people_json=excluded.people_json').run(id,JSON.stringify(people),JSON.stringify(state));
   if(!previous){for(const e of state.ledger)appendLedger(db,id,e);}
   else for(const e of state.ledger.slice(JSON.parse(previous.state_json).ledger.length))appendLedger(db,id,e);
   if(!previous||!JSON.parse(previous.calendar_json||'[]').length)db.prepare('UPDATE knowledge_stamms SET calendar_json=? WHERE id=?').run(JSON.stringify((s.meetings||[]).map(m=>({...calendarItem(m,1),cancelledRangerIds:(s.cancellations||[]).filter(c=>String(c.meetingId)===String(m.id)&&c.kind==='rangers').map(c=>c.personId)}))),id);
   db.prepare('UPDATE knowledge_stamms SET state_json=? WHERE id=?').run(JSON.stringify(state),id);
   project(db,id,state,model);
  }
  db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e;}
}
function calendarItem(m,revision){return {id:m.id,date:m.date,start:m.start||'',end:m.end||'',place:m.place||'',theme:m.theme||'Rangertreffen',cancelled:!!(m.cancelled||m.archived||m.deleted||['cancelled','abgesagt','ausgefallen'].includes(String(m.status||'').toLowerCase())),teamIds:m.teamIds||m.teams||(m.team?[m.team]:[]),rangerIds:m.rangerIds||[],attendance:m.attendance||{},action:m.action,actions:m.actions,nature:m.nature,impulse:m.impulse,food:m.food,tasks:m.tasks,cancelledRangerIds:m.cancelledRangerIds||[],_knowledgeRevision:revision};}
function project(db,tribe,s,model){
 for(const [rid,books] of Object.entries(s.bibleReading?.records||{}))for(const [bookId,r] of Object.entries(books))db.prepare('INSERT INTO knowledge_bible_reading VALUES(?,?,?,?,?,?) ON CONFLICT(stamm_id,ranger_id,book_id) DO UPDATE SET is_read=excluded.is_read,version=excluded.version,updated_at=excluded.updated_at').run(tribe,rid,bookId,Number(r.isRead),r.version,r.updatedAt);
 for(const e of s.exams)db.prepare('INSERT INTO knowledge_exams VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET meeting_id=excluded.meeting_id,status=excluded.status,exam_json=excluded.exam_json').run(e.id,tribe,String(e.rangerId),String(e.meetingId),e.taskId,e.status,JSON.stringify(e));
 db.prepare('DELETE FROM knowledge_active_credits WHERE stamm_id=?').run(tribe);
 for(const c of model.credits(s))db.prepare('INSERT INTO knowledge_active_credits VALUES(?,?,?,?)').run(tribe,String(c.rangerId),c.taskId,c.id);
}
function appendLedger(db,tribe,e){db.prepare('INSERT INTO knowledge_ledger VALUES(?,?,?,?,?,?,?)').run(e.id,tribe,String(e.rangerId),e.taskId,e.points,e.reversalOf??null,JSON.stringify(e));}
export function createKnowledgeService({db,principals,origin,root=ROOT,assetDirectory=process.env.RANGERHUB_ASSET_DIR,ai={apiKey:process.env.RANGERHUB_AI_API_KEY,model:process.env.RANGERHUB_AI_MODEL,maxDaily:Number(process.env.RANGERHUB_AI_DAILY_LIMIT||100)}}){
 if(!origin||new URL(origin).origin!==origin)throw Error('Configure one exact frontend origin, without trailing slash.');
 if(new URL(origin).protocol!=='https:'&&!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('The frontend must use HTTPS.');
 if(!Array.isArray(principals)||!principals.length||principals.some(p=>!p.homeStammId||!['rangers','leaders'].includes(p.kind)||p.id==null||!/^[0-9a-f]{64}$/i.test(p.tokenHash)||!Number.isFinite(Date.parse(p.expiresAt))))throw Error('Explicit personal token hashes, existing IDs and expiry dates are required.');
 if(new Set(principals.map(p=>p.tokenHash)).size!==principals.length)throw Error('Each credential must belong to one person.');
 const {model,catalog,catalogModel,membership}=loadModel(root),rates=new Map(),assets=assetStore(db,assetDirectory),assistant=aiAssistant(ai);
 db.exec('BEGIN IMMEDIATE');
 try{if(!db.prepare('SELECT id FROM knowledge_global_catalog WHERE id=1').get())db.prepare('INSERT INTO knowledge_global_catalog VALUES(1,?)').run(JSON.stringify(catalogModel.emptyLayer()));
 for(const row of db.prepare('SELECT id,state_json,calendar_json FROM knowledge_stamms').all()){const previous=JSON.parse(row.state_json),state=model.migrate(previous);for(const e of state.ledger.slice(previous.ledger.length))appendLedger(db,row.id,e);model.syncCancellations(state,JSON.parse(row.calendar_json),new Date().toISOString());db.prepare('UPDATE knowledge_stamms SET state_json=? WHERE id=?').run(JSON.stringify(state),row.id);project(db,row.id,state,model);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 const getGlobal=()=>JSON.parse(db.prepare('SELECT data_json FROM knowledge_global_catalog WHERE id=1').get().data_json);
 const same=(a,b)=>String(a)===String(b);
 const getTribe=id=>{const row=db.prepare('SELECT * FROM knowledge_stamms WHERE id=?').get(id);return row?{people:JSON.parse(row.people_json),state:JSON.parse(row.state_json),meetings:JSON.parse(row.calendar_json)}:null;};
 const delegations=delegationStore(db,{getTribe,membership});
 function authenticate(req,tribe){
  const bearer=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9._~-]{32,512})$/)?.[1];if(!bearer)throw Object.assign(Error('Persönliche Anmeldung erforderlich.'),{status:401});
  const hash=Buffer.from(digest(bearer),'hex'),p=principals.find(p=>{try{return timingSafeEqual(Buffer.from(p.tokenHash,'hex'),hash);}catch{return false;}});
  if(!p||Date.parse(p.expiresAt)<=Date.now())throw Object.assign(Error('Anmeldung abgelaufen oder ungültig.'),{status:401});
  const home=getTribe(p.homeStammId),member=home?.people[p.kind].find(m=>same(m.id,p.id)&&membership.status(m)!=='left');
  const originalMember=home?.people[p.kind].find(m=>same(m.id,p.id));if(!originalMember||membership.status(originalMember)==='left')throw Object.assign(Error('Die Mitgliedschaft in diesem Stamm ist beendet.'),{status:403,code:'membership_revoked'});
  const delegation=member&&membership.active(member)?delegations.effective(p,tribe):null;const admin=p.kind==='leaders'&&membership.active(member)&&(member?.role==='Admin'||delegation?.scope==='global');
  if(!member||p.kind==='leaders'&&!['Admin','Stammleiter','Leiter'].includes(member.role)||p.kind==='rangers'&&member.knowledgeEligible===false||tribe!==p.homeStammId&&!admin&&!delegation||!getTribe(tribe))throw Object.assign(Error('Kein Zugriff auf diesen Stamm.'),{status:403});
  const a={...p,membershipStatus:membership.status(member),originalRole:member.role||'Ranger',role:member.role==='Admin'?'Admin':delegation?(delegation.scope==='global'?'Admin':'Stammleiter'):member.role||'Ranger',delegation,authorizedStammId:delegation?tribe:undefined,teamIds:member.teamIds||[],stammId:tribe,leader:p.kind==='leaders',key:`${tribe}:${p.homeStammId}:${p.kind}:${p.id}`};delete a.tokenHash;if(req.method==='POST'&&a.membershipStatus!=='active')throw Object.assign(Error('Pausierte Mitgliedschaft: nur Lesezugriff.'),{status:403});
  if(req.method!=='POST')rate(a);
  return a;
 }
 function rate(a,bible=false){const key=a.key+(bible?':reading':''),now=Date.now(),old=rates.get(key);if(!old||old.until<now)rates.set(key,{until:now+60000,count:1});else if(++old.count>(bible?600:120))throw Object.assign(Error('Bitte kurz warten und erneut versuchen.'),{status:429});if(rates.size>10000)for(const [key,value] of rates)if(value.until<now)rates.delete(key);}
 async function handler(req,res){
  const cors=req.headers.origin===origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'",...cors});res.end(JSON.stringify(data));};
  try{
   if(req.headers.origin&&req.headers.origin!==origin)return send(403,{error:'Origin nicht zugelassen.'});
   if(req.method==='OPTIONS'){res.writeHead(204,{...cors,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'});return res.end();}
   const url=new URL(req.url,'http://localhost'),tribe=url.searchParams.get('stammId');
   if(!tribe||tribe.length>100)return send(400,{error:'Stamm fehlt.'});
   let a=authenticate(req,tribe);
   if(req.method==='GET'&&url.pathname==='/knowledge'){
    const data=getTribe(tribe),filter={};
    for(const k of ['since','before','category','team']){const v=url.searchParams.get(k);if(v){if(v.length>100||(['since','before'].includes(k)&&!/^\d{4}-\d{2}-\d{2}$/.test(v)))return send(400,{error:'Ungültiger Filter.'});filter[k]=v;}}
    const snap=model.snapshot(data.state,{...data.people,meetings:data.meetings},a,getGlobal(),filter);snap.mode='online';snap.delegation=delegations.snapshot(a);snap.management=delegations.managementSnapshot(a);snap.visual.ai={configured:assistant.configured};snap.visual.mediaConfigured=assets.configured;return send(200,snap);
   }
   if(req.method==='POST'&&url.pathname==='/knowledge/ai'){
    const data=getTribe(tribe),snap=model.snapshot(data.state,{...data.people,meetings:data.meetings},a,getGlobal());if(!snap.visual.rights.local)return send(403,{error:'Keine Editorrechte.'});
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>32768)return send(413,{error:'KI-Auftrag zu groß.'});}let p;try{p=JSON.parse(raw);}catch{return send(400,{error:'Ungültiger KI-Auftrag.'});}a=authenticate(req,tribe);const latest=getTribe(tribe);if(!model.snapshot(latest.state,{...latest.people,meetings:latest.meetings},a,getGlobal()).visual.rights.local)return send(403,{error:'Editorrechte wurden entzogen.'});return send(200,await assistant.suggest(a,p));
   }
   if(url.pathname==='/knowledge/assets'&&req.method==='POST'){
    const data=getTribe(tribe),global=getGlobal(),scope=url.searchParams.get('scope'),snap=model.snapshot(data.state,{...data.people,meetings:data.meetings},a,global);if(!['local','global'].includes(scope)||!snap.visual.rights[scope])return send(403,{error:'Keine Bildrechte in dieser Reichweite.'});
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8388608)return send(413,{error:'Bild zu groß.'});chunks.push(chunk);}const mime=(req.headers['content-type']||'').split(';')[0],bytes=imageBytes(Buffer.concat(chunks),mime),meta={id:'upload-'+hash(bytes),mime,bytes:bytes.length,width:Math.max(1,Math.min(20000,Number(url.searchParams.get('width'))||1)),height:Math.max(1,Math.min(20000,Number(url.searchParams.get('height'))||1)),alt:(url.searchParams.get('alt')||'Eigenes Bild').slice(0,500),scope,stammId:tribe};
    a=authenticate(req,tribe);const latest=getTribe(tribe);if(!model.snapshot(latest.state,{...latest.people,meetings:latest.meetings},a,getGlobal()).visual.rights[scope])return send(403,{error:'Bildrechte wurden entzogen.'});db.exec('BEGIN IMMEDIATE');try{const id=assets.save(bytes,meta);model.apply(data.state,{...data.people,meetings:data.meetings},a,global,'visual-asset',{scope,asset:meta});db.prepare('UPDATE knowledge_stamms SET state_json=? WHERE id=?').run(JSON.stringify(data.state),tribe);if(scope==='global')db.prepare('UPDATE knowledge_global_catalog SET data_json=? WHERE id=1').run(JSON.stringify(global));db.exec('COMMIT');return send(200,{id,...meta});}catch(e){db.exec('ROLLBACK');throw e;}
   }
   if(url.pathname.startsWith('/knowledge/assets/')&&req.method==='GET'){
    const id=url.pathname.slice('/knowledge/assets/'.length),asset=assets.get(id,tribe);if(!asset)return send(404,{error:'Bild nicht gefunden.'});const data=getTribe(tribe),snap=model.snapshot(data.state,{...data.people,meetings:data.meetings},a,getGlobal()),refs=Object.values(snap.visual.published).some(v=>v.document.pages.some(p=>p.elements.some(e=>e.assetId===id)));if(!snap.visual.rights.local&&!refs)return send(403,{error:'Bild ist nicht veröffentlicht.'});res.writeHead(200,{'Content-Type':asset.meta.mime,'Content-Length':asset.bytes.length,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",...cors});return res.end(asset.bytes);
   }
   if(req.method==='POST'&&url.pathname==='/knowledge/commands'){
    req.setEncoding('utf8');
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>(a.leader?4194304:131072))return send(413,{error:'Auftrag zu groß.'});}
    let cmd;try{cmd=JSON.parse(raw);}catch{return send(400,{error:'Ungültiges JSON.'});}
    if(!cmd||!['person-change','delegation-grant','delegation-revoke','management-change','membership-change','visual-draft','visual-publish','visual-discard','visual-restore','visual-permission','wisdom-change','set-bible-read','set-bible-chapter','register-exam','withdraw-exam','reassign-exam','grade-exam','correct-exam','correct-legacy-credit','catalog-change','set-editor-permission','calendar-change','participation-change'].includes(cmd.type)||!cmd.payload||Array.isArray(cmd.payload)||!/^[-\w]{8,100}$/.test(cmd.requestId||''))return send(400,{error:'Ungültiger Fachwissen-Auftrag.'});
    if(['set-bible-read','set-bible-chapter'].includes(cmd.type)&&a.leader)return send(403,{error:'Die Ranger verwalten ihren eigenen Lesefortschritt selbst.'});
    // Reading has its own burst protection; undo never consumes an examination/API write quota.
    const readingCommand=['set-bible-read','set-bible-chapter'].includes(cmd.type);
    if(!readingCommand||cmd.payload.isRead!==false)rate(a,readingCommand);
    if(['register-exam','reassign-exam'].includes(cmd.type)&&Object.keys(cmd.payload).some(k=>!['taskId','meetingId','examId','pointOption'].includes(k)))return send(400,{error:'Prüfungsanmeldungen enthalten keine digitalen Nachweise oder vorgegebenen Punkte.'});
    if(['wisdom-change','grade-exam','correct-exam','correct-legacy-credit','catalog-change','set-editor-permission','calendar-change'].includes(cmd.type)&&!a.leader)return send(403,{error:'Nur die Leitung darf diese Aktion bestätigen.'});
    a=authenticate(req,tribe);
    db.exec('BEGIN IMMEDIATE');
    try{
     const commandHash=digest(JSON.stringify({type:cmd.type,payload:cmd.payload}));
     const previous=db.prepare('SELECT payload_hash FROM knowledge_commands WHERE stamm_id=? AND actor_key=? AND request_id=?').get(tribe,a.key,cmd.requestId);
     if(previous){db.exec('ROLLBACK');return send(previous.payload_hash===commandHash?200:409,previous.payload_hash===commandHash?{ok:true,replayed:true}:{error:'Auftrags-ID bereits für einen anderen Auftrag verwendet.'});}
     const data=getTribe(tribe),old=data.state.ledger.map(e=>JSON.stringify(e)),global=getGlobal();
     // Client-provided roles, points and timestamps are never used by the model.
     if(cmd.type==='person-change'){delegations.personChange(a,cmd.payload,data.people);db.prepare('UPDATE knowledge_stamms SET people_json=? WHERE id=?').run(JSON.stringify(data.people),tribe);}
     else if(cmd.type==='delegation-grant'||cmd.type==='delegation-revoke'){delegations.command(a,cmd.type,cmd.payload);}
     else if(cmd.type==='management-change'){delegations.management(a,cmd.payload);}
     else if(cmd.type==='calendar-change'){
      const c=cmd.payload,m=c.meeting,id=m?.id??c.meetingId;if(id==null)throw Error('Vorhandene Kalender-ID fehlt.');
      const previous=data.meetings.find(m=>String(m.id)===String(id));if((previous?._knowledgeRevision||0)!==c.revision)throw Error('Kalenderkonflikt. Bitte die aktuellen Termine laden.');
      if(!m&&!previous)throw Error('Treffen nicht gefunden.');const next=calendarItem(m?{...previous,...m}:{...previous,cancelled:true},(previous?._knowledgeRevision||0)+1);next.cancelledRangerIds=previous?.cancelledRangerIds||[];
      if(!/^\d{4}-\d{2}-\d{2}$/.test(next.date)||!model.meetingStart(next))throw Error('Ungültiger Kalendertermin.');
      if(previous)data.meetings[data.meetings.indexOf(previous)]=next;else data.meetings.push(next);
      model.syncCancellations(data.state,data.meetings,new Date().toISOString());data.state.revision++;
      data.state.audit.push({type:'calendar-change',by:a.id,homeStammId:a.homeStammId,at:new Date().toISOString(),meetingId:id,before:previous||null,after:next});
      db.prepare('UPDATE knowledge_stamms SET calendar_json=? WHERE id=?').run(JSON.stringify(data.meetings),tribe);
     }else if(cmd.type==='participation-change'){
      if(a.kind!=='rangers'||typeof cmd.payload.cancelled!=='boolean')throw Error('Nur die eigene Teilnahme darf geändert werden.');
      const m=data.meetings.find(m=>String(m.id)===String(cmd.payload.meetingId));if(!m)throw Error('Treffen nicht gefunden.');
      m.cancelledRangerIds=(m.cancelledRangerIds||[]).filter(id=>String(id)!==String(a.id));if(cmd.payload.cancelled)m.cancelledRangerIds.push(a.id);
      m._knowledgeRevision++;db.prepare('UPDATE knowledge_stamms SET calendar_json=? WHERE id=?').run(JSON.stringify(data.meetings),tribe);
     }else {if(cmd.type==='membership-change')delegations.protectMember(a,cmd.payload);model.apply(data.state,{...data.people,meetings:data.meetings},a,global,cmd.type,cmd.payload,new Date().toISOString(),randomUUID);}
     if((['catalog-change','wisdom-change'].includes(cmd.type)||cmd.type.startsWith('visual-'))&&cmd.payload.scope==='global'){
      for(const other of db.prepare('SELECT state_json FROM knowledge_stamms').all()){const state=model.migrate(JSON.parse(other.state_json));catalogModel.validate(catalogModel.effective(global,state.content));model.validateWisdomGlobal(global,state);}
      db.prepare('UPDATE knowledge_global_catalog SET data_json=? WHERE id=1').run(JSON.stringify(global));
     }
     if(cmd.type==='membership-change'){const person=data.people[cmd.payload.kind].find(p=>String(p.id)===String(cmd.payload.personId)),event=person.membership.events.at(-1);db.prepare('INSERT INTO membership_events VALUES(?,?,?,?,?,?)').run(event.id,tribe,cmd.payload.kind,String(person.id),person.membership.revision,JSON.stringify(event));db.prepare('UPDATE knowledge_stamms SET people_json=? WHERE id=?').run(JSON.stringify(data.people),tribe);}
     project(db,tribe,data.state,model);
     if(old.some((e,i)=>JSON.stringify(data.state.ledger[i])!==e)||data.state.ledger.length<old.length)throw Error('Ledger mutation rejected.');
     for(const e of data.state.ledger.slice(old.length))appendLedger(db,tribe,e);
     db.prepare('UPDATE knowledge_stamms SET state_json=? WHERE id=?').run(JSON.stringify(data.state),tribe);
     db.prepare('INSERT INTO knowledge_commands VALUES(?,?,?,?)').run(tribe,a.key,cmd.requestId,commandHash);
     db.exec('COMMIT');return send(200,{ok:true});
    }catch(e){db.exec('ROLLBACK');return send(e.status||422,{error:e.message});}
   }
   return send(404,{error:'Endpunkt nicht gefunden.'});
  }catch(e){return send(e.status||500,{error:e.status?e.message:'Der Fachwissen-Dienst konnte die Daten nicht sicher verarbeiten.',...(e.code==='membership_revoked'?{code:e.code}:{})});}
 }
 return {handler,model,catalog};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {RANGERHUB_KNOWLEDGE_DB:dbPath,RANGERHUB_PRINCIPALS:credentials,RANGERHUB_ORIGIN:origin}=process.env;
 if(!dbPath||!credentials||!origin)throw Error('Set RANGERHUB_KNOWLEDGE_DB, RANGERHUB_PRINCIPALS and RANGERHUB_ORIGIN; see docs/V30-BACKEND.md.');
 const db=openDatabase(dbPath),service=createKnowledgeService({db,principals:JSON.parse(readFileSync(credentials,'utf8')),origin});
 const server=createServer(service.handler);server.requestTimeout=40000;server.headersTimeout=10000;
 server.listen(Number(process.env.RANGERHUB_KNOWLEDGE_PORT||8787),'127.0.0.1',()=>process.stdout.write('Fachwissen service listening on loopback; HTTPS reverse proxy required for deployment.\n'));
}
