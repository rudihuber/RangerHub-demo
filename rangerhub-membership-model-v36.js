/* Membership is local to the existing tribe/person record. Dates use Europe/Berlin. */
(() => {
 'use strict';
 const same=(a,b)=>String(a)===String(b),clone=x=>structuredClone(x),fail=m=>{throw Error(m);};
 const today=(at=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(at));
 const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d+'T12:00Z'))&&new Date(d+'T12:00Z').toISOString().slice(0,10)===d;
 const legacy=p=>p?.archived||p?.archivedAt?'left':p?.active===false?'paused':'active';
 function status(p,date=today()){
  if(!p)return 'left';let value=p.membership?.events?.length?p.membership.initialStatus:legacy(p);
  const events=(p.membership?.events||[]).map((e,i)=>({...e,index:i})).filter(e=>e.effectiveFrom<=date).sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom)||a.index-b.index);
  for(const e of events)value=e.newStatus;
  return value;
 }
 const active=(p,date)=>!!p&&status(p,date)==='active';
 const canManage=a=>!!a?.leader&&['Admin','Stammleiter'].includes(a.role)&&(a.role==='Admin'||(a.stammId===a.homeStammId||a.authorizedStammId===a.stammId));
 function change(env,a,p,at=new Date().toISOString(),uid=()=>crypto.randomUUID()){
  if(!canManage(a))fail('Nur Admin oder die eigene Stammleitung dürfen den Mitgliederstatus ändern.');
  if(!p||Object.keys(p).some(k=>!['kind','personId','status','effectiveFrom','until','note','revision','confirmed'].includes(k))||!['rangers','leaders'].includes(p.kind)||!['active','paused','left'].includes(p.status))fail('Ungültiger Mitgliederstatus.');
  const person=env[p.kind]?.find(x=>same(x.id,p.personId));if(!person)fail('Mitglied nicht gefunden.');
  if((person.membership?.revision||0)!==p.revision)fail('Statuskonflikt: Ein anderes Gerät hat diesen Eintrag geändert. Bitte neu laden.');
  if(!validDate(p.effectiveFrom)||p.until&&(!validDate(p.until)||p.until<p.effectiveFrom||p.status!=='paused')||typeof (p.note||'')!=='string'||(p.note||'').length>1000)fail('Bitte gültige Statusdaten eingeben.');
  if(p.confirmed!==true)fail('Bitte den Statuswechsel ausdrücklich bestätigen.');
  if(a.homeStammId===a.stammId&&a.kind===p.kind&&same(a.id,p.personId)&&p.status!=='active')fail('Den eigenen Verwaltungszugang kann nur eine andere berechtigte Person deaktivieren.');
  const oldStatus=status(person,p.effectiveFrom),m=person.membership||{schema:1,initialStatus:legacy(person),revision:0,events:[]};
  if(!m.events.length)m.initialStatus=legacy(person);
  m.events.push({id:uid(),actorId:a.id,actorKind:a.kind,actorHomeStammId:a.homeStammId,timestamp:at,oldStatus,newStatus:p.status,effectiveFrom:p.effectiveFrom,until:p.until||null,stammId:a.stammId,note:(p.note||'').trim()});m.revision++;person.membership=m;return clone(m);
 }
 function publicMembership(p,notes=false){const m=p.membership||{schema:1,initialStatus:legacy(p),revision:0,events:[]};return {...clone(m),status:status(p),events:m.events.map(e=>{const n=clone(e);if(!notes)delete n.note;return n;})};}
 function attendance(person,meetings,kind,at=new Date().toISOString(),relevant=()=>true){
  const date=today(at),records=meetings.filter(m=>validDate(m.date)&&m.date<=date&&!m.cancelled&&!m.archived&&!m.deleted&&!['cancelled','abgesagt','ausgefallen'].includes(String(m.status||'').toLowerCase())&&active(person,m.date)&&relevant(m)).map(m=>({date:m.date,value:m.attendance?.[kind]?.[person.id]})).filter(r=>['ANWESEND','ABWESEND','ENTSCHULDIGT'].includes(r.value));
  const total=records.length,attended=records.filter(r=>r.value==='ANWESEND').length,ratio=total?attended/total:null;return {total,attended,ratio,percent:ratio===null?null:ratio*100,lastDate:records.map(r=>r.date).sort().at(-1)||null};
 }
 function recoverArchives(data,stammId){let added=0;for(const kind of ['rangers','leaders'])for(const archived of data[kind==='rangers'?'archivedRangers':'archivedLeaders']||[]){if(data[kind].some(p=>same(p.id,archived.id)))continue;const p=clone(archived),date=validDate(String(p.archivedAt||'').slice(0,10))?String(p.archivedAt).slice(0,10):'0001-01-01';p.membership||={schema:1,initialStatus:date==='0001-01-01'?'left':'active',revision:0,events:[{id:'legacy-'+kind+'-'+p.id,actorId:null,actorKind:'legacy',timestamp:p.archivedAt||new Date().toISOString(),oldStatus:'active',newStatus:'left',effectiveFrom:date,until:null,stammId,imported:true}]};data[kind].push(p);added++;}return added;}
 window.RHMembershipModel={recoverArchives,status,active,legacy,change,canManage,publicMembership,attendance,validDate,today,same};
})();
