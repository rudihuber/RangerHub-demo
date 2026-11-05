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

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const digest=s=>createHash('sha256').update(s).digest('hex');
export function loadModel(root=ROOT){
 const catalog=JSON.parse(readFileSync(resolve(root,'data/knowledge-normalized.json'),'utf8'));
 const context=vm.createContext({window:{RangerHubKnowledgeCatalog:catalog},structuredClone,crypto:{randomUUID}});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-knowledge-catalog-v30.js'),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-knowledge-model-v30.js'),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-bible-catalog.js'),'utf8'),context,{timeout:1000});
 vm.runInContext(readFileSync(resolve(root,'rangerhub-bible-model.js'),'utf8'),context,{timeout:1000});
 return {model:context.window.RHKnowledgeModel,catalog,catalogModel:context.window.RHKnowledgeCatalogV30};
}
export function openDatabase(path){
 const db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS knowledge_stamms(id TEXT PRIMARY KEY,people_json TEXT NOT NULL,state_json TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS knowledge_ledger(id TEXT PRIMARY KEY,stamm_id TEXT NOT NULL,ranger_id TEXT NOT NULL,task_id TEXT NOT NULL,points INTEGER NOT NULL,reversal_of TEXT UNIQUE,entry_json TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS knowledge_commands(stamm_id TEXT NOT NULL,actor_key TEXT NOT NULL,request_id TEXT NOT NULL,payload_hash TEXT NOT NULL,PRIMARY KEY(stamm_id,actor_key,request_id));
 CREATE TRIGGER IF NOT EXISTS knowledge_ledger_no_update BEFORE UPDATE ON knowledge_ledger BEGIN SELECT RAISE(ABORT,'Ledger entries are append-only'); END;
 CREATE TRIGGER IF NOT EXISTS knowledge_ledger_no_delete BEFORE DELETE ON knowledge_ledger BEGIN SELECT RAISE(ABORT,'Ledger entries are append-only'); END;`);
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
  for(const [id,s] of Object.entries(exported.stamms)){
   if(!Array.isArray(s.rangers)||!Array.isArray(s.leaders))throw Error('Membership missing: '+id);
   // Import existing IDs and roles. No birthdays, addresses, photos or new accounts.
   const people={rangers:s.rangers.map(p=>({id:p.id,alias:model.alias(p),name:p.name||model.alias(p),team:p.team||'',teamId:p.teamId,archived:!!p.archived,active:p.active!==false,knowledgeEligible:p.knowledgeEligible!==false})),
    leaders:s.leaders.map(p=>({id:p.id,role:p.role||'Leiter',teamIds:p.managedTeamIds||p.knowledgeTeamIds||[],archived:!!p.archived,active:p.active!==false}))};
   const previous=db.prepare('SELECT state_json,calendar_json FROM knowledge_stamms WHERE id=?').get(id);
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
function calendarItem(m,revision){return {id:m.id,date:m.date,start:m.start||'',end:m.end||'',place:m.place||'',theme:m.theme||'Rangertreffen',cancelled:!!(m.cancelled||m.archived||m.deleted||['cancelled','abgesagt','ausgefallen'].includes(String(m.status||'').toLowerCase())),teamIds:m.teamIds||m.teams||(m.team?[m.team]:[]),rangerIds:m.rangerIds||[],cancelledRangerIds:m.cancelledRangerIds||[],_knowledgeRevision:revision};}
function project(db,tribe,s,model){
 for(const [rid,books] of Object.entries(s.bibleReading?.records||{}))for(const [bookId,r] of Object.entries(books))db.prepare('INSERT INTO knowledge_bible_reading VALUES(?,?,?,?,?,?) ON CONFLICT(stamm_id,ranger_id,book_id) DO UPDATE SET is_read=excluded.is_read,version=excluded.version,updated_at=excluded.updated_at').run(tribe,rid,bookId,Number(r.isRead),r.version,r.updatedAt);
 for(const e of s.exams)db.prepare('INSERT INTO knowledge_exams VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET meeting_id=excluded.meeting_id,status=excluded.status,exam_json=excluded.exam_json').run(e.id,tribe,String(e.rangerId),String(e.meetingId),e.taskId,e.status,JSON.stringify(e));
 db.prepare('DELETE FROM knowledge_active_credits WHERE stamm_id=?').run(tribe);
 for(const c of model.credits(s))db.prepare('INSERT INTO knowledge_active_credits VALUES(?,?,?,?)').run(tribe,String(c.rangerId),c.taskId,c.id);
}
function appendLedger(db,tribe,e){db.prepare('INSERT INTO knowledge_ledger VALUES(?,?,?,?,?,?,?)').run(e.id,tribe,String(e.rangerId),e.taskId,e.points,e.reversalOf??null,JSON.stringify(e));}
export function createKnowledgeService({db,principals,origin,root=ROOT}){
 if(!origin||new URL(origin).origin!==origin)throw Error('Configure one exact frontend origin, without trailing slash.');
 if(new URL(origin).protocol!=='https:'&&!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('The frontend must use HTTPS.');
 if(!Array.isArray(principals)||!principals.length||principals.some(p=>!p.homeStammId||!['rangers','leaders'].includes(p.kind)||p.id==null||!/^[0-9a-f]{64}$/i.test(p.tokenHash)||!Number.isFinite(Date.parse(p.expiresAt))))throw Error('Explicit personal token hashes, existing IDs and expiry dates are required.');
 if(new Set(principals.map(p=>p.tokenHash)).size!==principals.length)throw Error('Each credential must belong to one person.');
 const {model,catalog,catalogModel}=loadModel(root),rates=new Map();
 db.exec('BEGIN IMMEDIATE');
 try{if(!db.prepare('SELECT id FROM knowledge_global_catalog WHERE id=1').get())db.prepare('INSERT INTO knowledge_global_catalog VALUES(1,?)').run(JSON.stringify(catalogModel.emptyLayer()));
 for(const row of db.prepare('SELECT id,state_json,calendar_json FROM knowledge_stamms').all()){const previous=JSON.parse(row.state_json),state=model.migrate(previous);for(const e of state.ledger.slice(previous.ledger.length))appendLedger(db,row.id,e);model.syncCancellations(state,JSON.parse(row.calendar_json),new Date().toISOString());db.prepare('UPDATE knowledge_stamms SET state_json=? WHERE id=?').run(JSON.stringify(state),row.id);project(db,row.id,state,model);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 const getGlobal=()=>JSON.parse(db.prepare('SELECT data_json FROM knowledge_global_catalog WHERE id=1').get().data_json);
 const same=(a,b)=>String(a)===String(b);
 const getTribe=id=>{const row=db.prepare('SELECT * FROM knowledge_stamms WHERE id=?').get(id);return row?{people:JSON.parse(row.people_json),state:JSON.parse(row.state_json),meetings:JSON.parse(row.calendar_json)}:null;};
 function authenticate(req,tribe){
  const bearer=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9._~-]{32,512})$/)?.[1];if(!bearer)throw Object.assign(Error('Persönliche Anmeldung erforderlich.'),{status:401});
  const hash=Buffer.from(digest(bearer),'hex'),p=principals.find(p=>{try{return timingSafeEqual(Buffer.from(p.tokenHash,'hex'),hash);}catch{return false;}});
  if(!p||Date.parse(p.expiresAt)<=Date.now())throw Object.assign(Error('Anmeldung abgelaufen oder ungültig.'),{status:401});
  const home=getTribe(p.homeStammId),member=home?.people[p.kind].find(m=>same(m.id,p.id)&&!m.archived&&m.active!==false);
  const admin=p.kind==='leaders'&&member?.role==='Admin';
  if(!member||p.kind==='leaders'&&!['Admin','Stammleiter','Leiter'].includes(member.role)||p.kind==='rangers'&&member.knowledgeEligible===false||tribe!==p.homeStammId&&!admin||!getTribe(tribe))throw Object.assign(Error('Kein Zugriff auf diesen Stamm.'),{status:403});
  const a={...p,role:member.role||'Ranger',teamIds:member.teamIds||[],stammId:tribe,leader:p.kind==='leaders',key:`${tribe}:${p.homeStammId}:${p.kind}:${p.id}`};delete a.tokenHash;
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
   const a=authenticate(req,tribe);
   if(req.method==='GET'&&url.pathname==='/knowledge'){
    const data=getTribe(tribe),filter={};
    for(const k of ['since','before','category','team']){const v=url.searchParams.get(k);if(v){if(v.length>100||(['since','before'].includes(k)&&!/^\d{4}-\d{2}-\d{2}$/.test(v)))return send(400,{error:'Ungültiger Filter.'});filter[k]=v;}}
    const snap=model.snapshot(data.state,{...data.people,meetings:data.meetings},a,getGlobal(),filter);snap.mode='online';return send(200,snap);
   }
   if(req.method==='POST'&&url.pathname==='/knowledge/commands'){
    req.setEncoding('utf8');
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>131072)return send(413,{error:'Auftrag zu groß.'});}
    let cmd;try{cmd=JSON.parse(raw);}catch{return send(400,{error:'Ungültiges JSON.'});}
    if(!cmd||!['set-bible-read','register-exam','withdraw-exam','reassign-exam','grade-exam','correct-exam','correct-legacy-credit','catalog-change','set-editor-permission','calendar-change','participation-change'].includes(cmd.type)||!cmd.payload||Array.isArray(cmd.payload)||!/^[-\w]{8,100}$/.test(cmd.requestId||''))return send(400,{error:'Ungültiger Fachwissen-Auftrag.'});
    if(cmd.type==='set-bible-read'&&a.leader)return send(403,{error:'Die Ranger verwalten ihren eigenen Lesefortschritt selbst.'});
    // Reading has its own burst protection; undo never consumes an examination/API write quota.
    if(cmd.type!=='set-bible-read'||cmd.payload.isRead!==false)rate(a,cmd.type==='set-bible-read');
    if(['register-exam','reassign-exam'].includes(cmd.type)&&Object.keys(cmd.payload).some(k=>!['taskId','meetingId','examId','pointOption'].includes(k)))return send(400,{error:'Prüfungsanmeldungen enthalten keine digitalen Nachweise oder vorgegebenen Punkte.'});
    if(['grade-exam','correct-exam','correct-legacy-credit','catalog-change','set-editor-permission','calendar-change'].includes(cmd.type)&&!a.leader)return send(403,{error:'Nur die Leitung darf diese Aktion bestätigen.'});
    db.exec('BEGIN IMMEDIATE');
    try{
     const commandHash=digest(JSON.stringify({type:cmd.type,payload:cmd.payload}));
     const previous=db.prepare('SELECT payload_hash FROM knowledge_commands WHERE stamm_id=? AND actor_key=? AND request_id=?').get(tribe,a.key,cmd.requestId);
     if(previous){db.exec('ROLLBACK');return send(previous.payload_hash===commandHash?200:409,previous.payload_hash===commandHash?{ok:true,replayed:true}:{error:'Auftrags-ID bereits für einen anderen Auftrag verwendet.'});}
     const data=getTribe(tribe),old=data.state.ledger.map(e=>JSON.stringify(e)),global=getGlobal();
     // Client-provided roles, points and timestamps are never used by the model.
     if(cmd.type==='calendar-change'){
      const c=cmd.payload,m=c.meeting,id=m?.id??c.meetingId;if(id==null)throw Error('Vorhandene Kalender-ID fehlt.');
      const previous=data.meetings.find(m=>String(m.id)===String(id));if((previous?._knowledgeRevision||0)!==c.revision)throw Error('Kalenderkonflikt. Bitte die aktuellen Termine laden.');
      if(!m&&!previous)throw Error('Treffen nicht gefunden.');const next=calendarItem(m||{...previous,cancelled:true},(previous?._knowledgeRevision||0)+1);next.cancelledRangerIds=previous?.cancelledRangerIds||[];
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
     }else model.apply(data.state,{...data.people,meetings:data.meetings},a,global,cmd.type,cmd.payload,new Date().toISOString(),randomUUID);
     if(cmd.type==='catalog-change'&&cmd.payload.scope==='global'){
      for(const other of db.prepare('SELECT state_json FROM knowledge_stamms').all())catalogModel.validate(catalogModel.effective(global,model.migrate(JSON.parse(other.state_json)).content));
      db.prepare('UPDATE knowledge_global_catalog SET data_json=? WHERE id=1').run(JSON.stringify(global));
     }
     project(db,tribe,data.state,model);
     if(old.some((e,i)=>JSON.stringify(data.state.ledger[i])!==e)||data.state.ledger.length<old.length)throw Error('Ledger mutation rejected.');
     for(const e of data.state.ledger.slice(old.length))appendLedger(db,tribe,e);
     db.prepare('UPDATE knowledge_stamms SET state_json=? WHERE id=?').run(JSON.stringify(data.state),tribe);
     db.prepare('INSERT INTO knowledge_commands VALUES(?,?,?,?)').run(tribe,a.key,cmd.requestId,commandHash);
     db.exec('COMMIT');return send(200,{ok:true});
    }catch(e){db.exec('ROLLBACK');return send(422,{error:e.message});}
   }
   return send(404,{error:'Endpunkt nicht gefunden.'});
  }catch(e){return send(e.status||500,{error:e.status?e.message:'Der Fachwissen-Dienst konnte die Daten nicht sicher verarbeiten.'});}
 }
 return {handler,model,catalog};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {RANGERHUB_KNOWLEDGE_DB:dbPath,RANGERHUB_PRINCIPALS:credentials,RANGERHUB_ORIGIN:origin}=process.env;
 if(!dbPath||!credentials||!origin)throw Error('Set RANGERHUB_KNOWLEDGE_DB, RANGERHUB_PRINCIPALS and RANGERHUB_ORIGIN; see docs/V30-BACKEND.md.');
 const db=openDatabase(dbPath),service=createKnowledgeService({db,principals:JSON.parse(readFileSync(credentials,'utf8')),origin});
 const server=createServer(service.handler);server.requestTimeout=15000;server.headersTimeout=10000;
 server.listen(Number(process.env.RANGERHUB_KNOWLEDGE_PORT||8787),'127.0.0.1',()=>process.stdout.write('Fachwissen service listening on loopback; HTTPS reverse proxy required for deployment.\n'));
}
