/** Central, append-only, revocable delegation. No authority is read from clients. */
import {randomUUID} from 'node:crypto';
const same=(a,b)=>String(a)===String(b),deny=m=>{throw Object.assign(Error(m),{status:403});},conflict=()=>{throw Object.assign(Error('Revisionskonflikt. Bitte den aktuellen Stand laden.'),{status:409});};
export const managementCollections=['leaderMeetings','custom','tasks','actionLibrary','natureLibrary','impulseLibrary','recipes','teams','absences'];
export function delegationStore(db,{getTribe,membership,now=()=>new Date().toISOString()}){
 db.exec(`CREATE TABLE IF NOT EXISTS delegation_events_v36(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,event_json TEXT NOT NULL);
 CREATE TRIGGER IF NOT EXISTS delegation_no_update BEFORE UPDATE ON delegation_events_v36 BEGIN SELECT RAISE(ABORT,'append-only');END;
 CREATE TRIGGER IF NOT EXISTS delegation_no_delete BEFORE DELETE ON delegation_events_v36 BEGIN SELECT RAISE(ABORT,'append-only');END;
 CREATE TABLE IF NOT EXISTS management_v36(stamm_id TEXT PRIMARY KEY,revision INTEGER NOT NULL DEFAULT 0,data_json TEXT NOT NULL DEFAULT '{}');`);
 const events=()=>db.prepare('SELECT event_json FROM delegation_events_v36 ORDER BY seq').all().map(r=>JSON.parse(r.event_json));
 const revision=()=>db.prepare('SELECT count(*) AS n FROM delegation_events_v36').get().n;
 const person=(home,id)=>getTribe(home)?.people.leaders.find(p=>same(p.id,id));
 const principalActive=a=>a.kind==='leaders'&&membership.active(person(a.homeStammId,a.id));
 function valid(g,all=events(),at=now()){
  const target=person(g.homeStammId,g.personId),issuer=person(g.issuerHome,g.issuerId);
  return !!target&&!!issuer&&membership.active(target)&&membership.active(issuer)&&issuer.role===g.issuerRole&&(target.membership?.revision||0)===g.memberRevision&&(issuer.membership?.revision||0)===g.issuerRevision&&g.startsAt<=at&&(!g.expiresAt||g.expiresAt>at)&&!all.some(e=>e.type==='delegation_revoked'&&e.grantId===g.id);
 }
 function effective(a,tribe){const all=events(),grants=all.filter(e=>e.type==='delegation_granted'&&same(e.personId,a.id)&&e.homeStammId===a.homeStammId&&(e.scope==='global'||e.stammId===tribe)&&valid(e,all));const grant=grants.find(g=>g.scope==='global')||grants[0];return grant||null;}
 const canGrant=a=>principalActive(a)&&((a.originalRole||a.role)==='Admin'||(a.originalRole||a.role)==='Stammleiter'&&a.stammId===a.homeStammId);
 function snapshot(a){const all=events(),grant=effective(a,a.stammId),can=canGrant(a),isAdmin=(a.originalRole||a.role)==='Admin';return {revision:revision(),originalRole:a.originalRole||a.role,effectiveRole:a.role,grant,canGrant:can,mode:'online',events:all.filter(e=>same(e.personId,a.id)&&e.homeStammId===a.homeStammId||can&&(isAdmin||e.scope==='local'&&e.stammId===a.homeStammId)).map(e=>({...e,active:e.type==='delegation_granted'&&valid(e,all)}))};}
 function command(a,type,p){
  if(!canGrant(a))deny('Nur originäre Admins oder Stammleiter dürfen Vertretungen verwalten.');
  if(!p||Object.keys(p).some(k=>!['personId','homeStammId','scope','stammId','startsAt','expiresAt','revision','confirmed','reason','grantId'].includes(k))||p.confirmed!==true)throw Error('Vertretung ausdrücklich bestätigen.');
  if(p.revision!==revision())conflict();
  const all=events(),stamp=now(),original=a.originalRole||a.role,reason=String(p.reason||'').slice(0,1000);let e;
  if(type==='delegation-grant'){
   const target=person(p.homeStammId,p.personId);if(!target||!membership.active(target))deny('Nur bestehende aktive Leiter können vertreten.');
   if(same(a.id,p.personId)&&a.homeStammId===p.homeStammId)deny('Keine Selbstvergabe.');
   if(!['local','global'].includes(p.scope)||p.scope==='global'&&original!=='Admin'||p.scope==='local'&&!getTribe(p.stammId)||original==='Stammleiter'&&(p.scope!=='local'||p.stammId!==a.homeStammId||p.homeStammId!==a.homeStammId))deny('Diese Reichweite darf nicht vergeben werden.');
   if(['Admin','Stammleiter'].includes(target.role)&&original!=='Admin')deny('Originäre Verwaltungsrollen werden nicht durch Vertretung verändert.');
   const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
   if(!iso(p.startsAt)||p.expiresAt&&(!iso(p.expiresAt)||p.expiresAt<=p.startsAt||p.expiresAt<=stamp))throw Error('Gültigen Beginn und Ablauf angeben.');
   e={id:randomUUID(),type:'delegation_granted',personId:target.id,homeStammId:p.homeStammId,scope:p.scope,stammId:p.scope==='global'?null:p.stammId,startsAt:p.startsAt,expiresAt:p.expiresAt||null,memberRevision:target.membership?.revision||0,issuerId:a.id,issuerHome:a.homeStammId,issuerRole:original,issuerRevision:person(a.homeStammId,a.id)?.membership?.revision||0,at:stamp,reason};
  }else{
   const g=all.find(g=>g.id===p.grantId&&g.type==='delegation_granted');if(!g)throw Error('Vertretung nicht gefunden.');if(original!=='Admin'&&(g.scope!=='local'||g.stammId!==a.homeStammId))deny('Keine Berechtigung für diesen Widerruf.');if(all.some(e=>e.type==='delegation_revoked'&&e.grantId===g.id))throw Error('Bereits widerrufen.');
   e={...g,id:randomUUID(),type:'delegation_revoked',grantId:g.id,issuerId:a.id,issuerHome:a.homeStammId,at:stamp,reason};
  }
  db.prepare('INSERT INTO delegation_events_v36(id,event_json) VALUES(?,?)').run(e.id,JSON.stringify(e));return e;
 }
 function protectMember(a,p){if(p.kind!=='leaders'||p.status==='active')return;const target=getTribe(a.stammId)?.people.leaders.find(x=>same(x.id,p.personId));if(!target)return;if(a.delegation&&['Admin','Stammleiter'].includes(target.role))deny('Vertreter dürfen keine originären Verwaltungskonten deaktivieren.');if(target.role==='Admin'&&(a.originalRole||a.role)!=='Admin')deny('Nur ein originärer Admin darf ein Adminprofil verwalten.');if(['Admin','Stammleiter'].includes(target.role)){const count=getTribe(a.stammId).people.leaders.filter(x=>x.role===target.role&&membership.active(x)).length;if(count<=1)deny('Der letzte originäre Verwaltungszugang muss erhalten bleiben.');}}
 function management(a,p){
  if(!a.leader||a.membershipStatus!=='active')deny('Aktive Leitung erforderlich.');
  if(!managementCollections.includes(p.collection)||Object.keys(p).some(k=>!['collection','revision','items'].includes(k))||!Array.isArray(p.items)||p.items.length>10000)throw Error('Ungültige Verwaltungsdaten.');
  if(p.collection==='teams'&&!['Admin','Stammleiter'].includes(a.role))deny('Stammverwaltung erforderlich.');
  const safeIds=x=>{if(!x||typeof x!=='object')return;for(const [k,v] of Object.entries(x)){if(k==='id'&&!/^[-\w]{1,100}$/.test(String(v)))throw Error('Ungültige Kennung.');safeIds(v);}};safeIds(p.items);const raw=JSON.stringify(p.items);if(raw.length>1000000||/"(?:__proto__|constructor|prototype)"\s*:/.test(raw))throw Error('Ungültige Verwaltungsdaten.');
  const row=db.prepare('SELECT * FROM management_v36 WHERE stamm_id=?').get(a.stammId),rev=row?.revision||0;if(p.revision!==rev)conflict();const data=JSON.parse(row?.data_json||'{}');data[p.collection]=structuredClone(p.items);db.prepare('INSERT INTO management_v36 VALUES(?,?,?) ON CONFLICT(stamm_id) DO UPDATE SET revision=excluded.revision,data_json=excluded.data_json').run(a.stammId,rev+1,JSON.stringify(data));
 }
 function personChange(a,p,people){
  const fields=['name','team','teamId','stage','mobile','phone','email','birthday','address','address2','church','region','photo','photoData'];
  if(!p||!['rangers','leaders'].includes(p.kind)||!p.fields||Object.keys(p).some(k=>!['kind','personId','fields','revision'].includes(k))||Object.keys(p.fields).some(k=>!fields.includes(k)))throw Error('Keine Rollen-, Status- oder Kontenänderungen über Profildaten.');
  let person=people[p.kind].find(x=>same(x.id,p.personId));if(!person){if(!a.leader||!['Admin','Stammleiter'].includes(a.role)||p.revision!==0||!/^[-\w]{1,100}$/.test(String(p.personId)))deny('Keine Berechtigung zum Anlegen dieses Profils.');person={id:p.personId,...(p.kind==='leaders'?{role:'Leiter'}:{})};people[p.kind].push(person);}
  const own=a.homeStammId===a.stammId&&a.kind===p.kind&&same(a.id,p.personId),manage=a.leader&&['Admin','Stammleiter'].includes(a.role);
  if(!manage&&!own&&!(a.leader&&p.kind==='rangers'&&a.homeStammId===a.stammId))deny('Keine Berechtigung für diese Person.');
  if(person.role==='Admin'&&(a.originalRole||a.role)!=='Admin')deny('Nur ein originärer Admin darf dieses Adminprofil verwalten.');if(a.delegation&&['Admin','Stammleiter'].includes(person.role))deny('Originäre Verwaltungskonten dürfen Vertreter nicht ändern.');
  if((person.profileRevision||0)!==p.revision)conflict();
  if(Object.entries(p.fields).some(([k,v])=>typeof v!=='string'||v.length>(['photo','photoData'].includes(k)?1000000:1000)))throw Error('Ungültige Profildaten.');
  if(Object.entries(p.fields).some(([k,v])=>['photo','photoData'].includes(k)&&v&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v))||p.fields.birthday&&!membership.validDate(p.fields.birthday))throw Error('Ungültiges Profilbild oder Geburtsdatum.');Object.assign(person,p.fields);person.profileRevision=(person.profileRevision||0)+1;
 }
 function managementSnapshot(a){if(a.membershipStatus!=='active')return null;if(!a.leader){const own=getTribe(a.stammId).people[a.kind].find(p=>same(p.id,a.id));return {revision:0,collections:{},people:{rangers:a.kind==='rangers'?[{...structuredClone(own),...(own.membership?{membership:membership.publicMembership(own,false)}:{})}]:[],leaders:[]}};}const row=db.prepare('SELECT * FROM management_v36 WHERE stamm_id=?').get(a.stammId);return {revision:row?.revision||0,collections:JSON.parse(row?.data_json||'{}'),people:Object.fromEntries(Object.entries(getTribe(a.stammId).people).map(([kind,list])=>[kind,list.map(p=>({...structuredClone(p),...(p.membership?{membership:membership.publicMembership(p,membership.canManage(a))}:{})}))]))};}
 return {effective,snapshot,command,protectMember,management,managementSnapshot,personChange,revision};
}
