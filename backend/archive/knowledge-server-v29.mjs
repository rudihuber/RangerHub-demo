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
 vm.runInContext(readFileSync(resolve(root,'rangerhub-knowledge-model.js'),'utf8'),context,{timeout:1000});
 return {model:context.window.RHKnowledgeModel,catalog};
}
export function openDatabase(path){
 const db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS knowledge_stamms(id TEXT PRIMARY KEY,people_json TEXT NOT NULL,state_json TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS knowledge_ledger(id TEXT PRIMARY KEY,stamm_id TEXT NOT NULL,ranger_id TEXT NOT NULL,task_id TEXT NOT NULL,points INTEGER NOT NULL,reversal_of TEXT UNIQUE,entry_json TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS knowledge_commands(stamm_id TEXT NOT NULL,actor_key TEXT NOT NULL,request_id TEXT NOT NULL,payload_hash TEXT NOT NULL,PRIMARY KEY(stamm_id,actor_key,request_id));
 CREATE TRIGGER IF NOT EXISTS knowledge_ledger_no_update BEFORE UPDATE ON knowledge_ledger BEGIN SELECT RAISE(ABORT,'Ledger entries are append-only'); END;
 CREATE TRIGGER IF NOT EXISTS knowledge_ledger_no_delete BEFORE DELETE ON knowledge_ledger BEGIN SELECT RAISE(ABORT,'Ledger entries are append-only'); END;`);
 return db;
}
export function importExisting(db,exported,model,{includeVerifiedKnowledge=false}={}){
 if(!exported?.__rhv24||!exported.stamms)throw Error('An existing RangerHub JSON export is required.');
 db.exec('BEGIN IMMEDIATE');
 try{
  for(const [id,s] of Object.entries(exported.stamms)){
   if(!Array.isArray(s.rangers)||!Array.isArray(s.leaders))throw Error('Membership missing: '+id);
   // Import existing IDs and roles. No birthdays, addresses, photos or new accounts.
   const people={rangers:s.rangers.map(p=>({id:p.id,alias:model.alias(p),name:model.alias(p),team:p.team||'',archived:!!p.archived,active:p.active!==false,knowledgeEligible:p.knowledgeEligible!==false})),
    leaders:s.leaders.map(p=>({id:p.id,role:p.role||'Leiter',archived:!!p.archived,active:p.active!==false}))};
   const previous=db.prepare('SELECT state_json FROM knowledge_stamms WHERE id=?').get(id);
   if(!previous&&s.knowledge&&!includeVerifiedKnowledge)throw Error('Existing local knowledge requires operator audit and explicit includeVerifiedKnowledge; nothing was reset.');
   const state=previous?JSON.parse(previous.state_json):(s.knowledge??model.initial());model.check(state);
   db.prepare('INSERT INTO knowledge_stamms(id,people_json,state_json) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET people_json=excluded.people_json').run(id,JSON.stringify(people),JSON.stringify(state));
   if(!previous)for(const e of state.ledger)appendLedger(db,id,e);
  }
  db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e;}
}
function appendLedger(db,tribe,e){db.prepare('INSERT INTO knowledge_ledger VALUES(?,?,?,?,?,?,?)').run(e.id,tribe,String(e.rangerId),e.taskId,e.points,e.reversalOf??null,JSON.stringify(e));}
export function createKnowledgeService({db,principals,origin,root=ROOT}){
 if(!origin||new URL(origin).origin!==origin)throw Error('Configure one exact frontend origin, without trailing slash.');
 if(new URL(origin).protocol!=='https:'&&!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('The frontend must use HTTPS.');
 if(!Array.isArray(principals)||!principals.length||principals.some(p=>!p.homeStammId||!['rangers','leaders'].includes(p.kind)||p.id==null||!/^[0-9a-f]{64}$/i.test(p.tokenHash)||!Number.isFinite(Date.parse(p.expiresAt))))throw Error('Explicit personal token hashes, existing IDs and expiry dates are required.');
 if(new Set(principals.map(p=>p.tokenHash)).size!==principals.length)throw Error('Each credential must belong to one person.');
 const {model,catalog}=loadModel(root),rates=new Map();
 const same=(a,b)=>String(a)===String(b);
 const getTribe=id=>{const row=db.prepare('SELECT * FROM knowledge_stamms WHERE id=?').get(id);return row?{people:JSON.parse(row.people_json),state:JSON.parse(row.state_json)}:null;};
 function authenticate(req,tribe){
  const bearer=req.headers.authorization?.match(/^Bearer ([A-Za-z0-9._~-]{32,512})$/)?.[1];if(!bearer)throw Object.assign(Error('Persönliche Anmeldung erforderlich.'),{status:401});
  const hash=Buffer.from(digest(bearer),'hex'),p=principals.find(p=>{try{return timingSafeEqual(Buffer.from(p.tokenHash,'hex'),hash);}catch{return false;}});
  if(!p||Date.parse(p.expiresAt)<=Date.now())throw Object.assign(Error('Anmeldung abgelaufen oder ungültig.'),{status:401});
  const home=getTribe(p.homeStammId),member=home?.people[p.kind].find(m=>same(m.id,p.id)&&!m.archived&&m.active!==false);
  const admin=p.kind==='leaders'&&member?.role==='Admin';
  if(!member||p.kind==='leaders'&&!['Admin','Stammleiter','Leiter'].includes(member.role)||p.kind==='rangers'&&member.knowledgeEligible===false||tribe!==p.homeStammId&&!admin||!getTribe(tribe))throw Object.assign(Error('Kein Zugriff auf diesen Stamm.'),{status:403});
  const a={...p,stammId:tribe,leader:p.kind==='leaders',key:`${tribe}:${p.homeStammId}:${p.kind}:${p.id}`};delete a.tokenHash;
  const now=Date.now(),old=rates.get(a.key);if(!old||old.until<now)rates.set(a.key,{until:now+60000,count:1});else if(++old.count>120)throw Object.assign(Error('Bitte kurz warten und erneut versuchen.'),{status:429});
  if(rates.size>10000)for(const [key,value] of rates)if(value.until<now)rates.delete(key);
  return a;
 }
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
    for(const k of ['since','before','category','team']){const v=url.searchParams.get(k);if(v){if(v.length>100||(['since','before'].includes(k)&&!/^\d{4}-\d{2}-\d{2}$/.test(v))||(k==='category'&&!['A','B','C'].includes(v)))return send(400,{error:'Ungültiger Filter.'});filter[k]=v;}}
    const snap=model.snapshot(data.state,data.people.rangers,a,filter);snap.mode='online';return send(200,snap);
   }
   if(req.method==='POST'&&url.pathname==='/knowledge/commands'){
    req.setEncoding('utf8');
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>24576)return send(413,{error:'Nachweis zu groß.'});}
    let cmd;try{cmd=JSON.parse(raw);}catch{return send(400,{error:'Ungültiges JSON.'});}
    if(!cmd||!['start','submit','observe','review','revoke','policy','resolve','invite','respond','cancel','settle'].includes(cmd.type)||!cmd.payload||Array.isArray(cmd.payload)||!/^[-\w]{8,100}$/.test(cmd.requestId||''))return send(400,{error:'Ungültiger Fachwissen-Auftrag.'});
    if(['review','revoke','policy','resolve','observe','settle'].includes(cmd.type)&&!a.leader)return send(403,{error:'Nur die Leitung darf diese Aktion bestätigen.'});
    db.exec('BEGIN IMMEDIATE');
    try{
     const commandHash=digest(JSON.stringify({type:cmd.type,payload:cmd.payload}));
     const previous=db.prepare('SELECT payload_hash FROM knowledge_commands WHERE stamm_id=? AND actor_key=? AND request_id=?').get(tribe,a.key,cmd.requestId);
     if(previous){db.exec('ROLLBACK');return send(previous.payload_hash===commandHash?200:409,previous.payload_hash===commandHash?{ok:true,replayed:true}:{error:'Auftrags-ID bereits für einen anderen Auftrag verwendet.'});}
     const data=getTribe(tribe),old=data.state.ledger.map(e=>JSON.stringify(e));
     // Client-provided roles, points and timestamps are never used by the model.
     model.apply(data.state,data.people.rangers,a,cmd.type,cmd.payload,new Date().toISOString(),randomUUID);
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
 if(!dbPath||!credentials||!origin)throw Error('Set RANGERHUB_KNOWLEDGE_DB, RANGERHUB_PRINCIPALS and RANGERHUB_ORIGIN; see docs/V29-BACKEND.md.');
 const db=openDatabase(dbPath),service=createKnowledgeService({db,principals:JSON.parse(readFileSync(credentials,'utf8')),origin});
 const server=createServer(service.handler);server.requestTimeout=15000;server.headersTimeout=10000;
 server.listen(Number(process.env.RANGERHUB_KNOWLEDGE_PORT||8787),'127.0.0.1',()=>process.stdout.write('Fachwissen service listening on loopback; HTTPS reverse proxy required for deployment.\n'));
}
