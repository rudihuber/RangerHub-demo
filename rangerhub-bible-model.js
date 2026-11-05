/* Bible reading extends the existing Fachwissen state and append-only journal. */
(() => {
 'use strict';
 const M=window.RHKnowledgeModel,K=window.RHKnowledgeCatalogV30,B=window.RHBibleCatalog,base={...M},copy=x=>structuredClone(x),same=(a,b)=>String(a)===String(b);
 const book=id=>B.books.find(b=>b.id===id),fail=msg=>{throw Error(msg);};
 const empty=()=>({schema:1,catalogVersion:B.catalogVersion,records:{}});
 const isBible=e=>!!book(e.bookId||e.taskId)&&(e.source==='bible_reading'||String(e.taskId||'').startsWith('bible-'));
 const activeBible=s=>s.ledger.filter(e=>isBible(e)&&['credit','bible-credit'].includes(e.type)&&!s.ledger.some(r=>r.reversalOf===e.id));
 const record=(s,rid,bid)=>s.bibleReading?.records?.[rid]?.[bid]||{isRead:false,version:0,updatedAt:null};
 const summary=(s,rid)=>{const read=B.books.filter(b=>record(s,rid,b.id).isRead);return {books:read.length,points:read.reduce((n,b)=>n+b.points,0),AT:read.filter(b=>b.testament==='AT').length,NT:read.filter(b=>b.testament==='NT').length};};
 function checkReading(s){
  const r=s.bibleReading;if(!r||r.schema!==1||r.catalogVersion!==B.catalogVersion||!r.records||Array.isArray(r.records))fail('Unbekannter Bibellese-Stand. Deine bisherigen Daten bleiben erhalten.');
  for(const [rid,books] of Object.entries(r.records)){
   if(!rid||!books||typeof books!=='object'||Array.isArray(books))fail('Ungültige persönliche Bibellese-Daten.');
   for(const [id,x] of Object.entries(books))if(!book(id)||!x||typeof x.isRead!=='boolean'||!Number.isSafeInteger(x.version)||x.version<0||x.updatedAt!==null&&!Number.isFinite(Date.parse(x.updatedAt)))fail('Ungültiger Buchstatus. Deine bisherigen Daten bleiben erhalten.');
  }
  const active=activeBible(s),keys=new Set();
  for(const e of active){const id=e.bookId||e.taskId,k=e.rangerId+':'+id;if(keys.has(k)||!record(s,e.rangerId,id).isRead||e.points!==book(id).points)fail('Buchstatus und Bibelpunkte sind nicht konsistent. Bitte den gesicherten Stand prüfen.');keys.add(k);}
  for(const [rid,books] of Object.entries(r.records))for(const [id,x] of Object.entries(books))if(x.isRead&&!keys.has(rid+':'+id))fail('Für eine Lesemarkierung fehlt die zugehörige Bibelbuchung.');
 }
 function credit(s,rid,b,at,uid,extra={}){const e={id:uid(),type:'bible-credit',source:'bible_reading',rangerId:rid,taskId:b.id,bookId:b.id,points:b.points,titleAtReview:b.name,catalogVersion:B.catalogVersion,at,by:rid,...extra};s.ledger.push(e);return e;}
 function reverse(s,e,at,uid,extra={}){s.ledger.push({id:uid(),type:'bible-reversal',source:'bible_reading',rangerId:e.rangerId,taskId:e.taskId,bookId:e.bookId||e.taskId,points:-e.points,reversalOf:e.id,at,by:e.rangerId,...extra});}
 function migrate(old){
  const s=base.migrate(old),existing=s.bibleReading;
  if(existing?.catalogVersion===B.catalogVersion){checkReading(s);return s;}
  if(existing&&(![undefined,1,2].includes(existing.schema)||existing.catalogVersion&&!/395/.test(existing.catalogVersion)))fail('Dieser ältere Bibellese-Stand benötigt eine geprüfte Zuordnung. Es wurden keine Daten zurückgesetzt.');
  const legacy=existing||s.bibleProgress,reading=empty(),at=new Date().toISOString(),uid=()=>crypto.randomUUID(),explicit=new Map();
  if(legacy){
   const records=legacy.records||legacy.users||legacy.statuses;if(!records||typeof records!=='object'||Array.isArray(records))fail('Ältere Bibellese-Daten sind nicht eindeutig zugeordnet. Bitte zuerst den gesicherten Import prüfen.');
   s.bibleReadingLegacy=copy(legacy);
   for(const [rid,items] of Object.entries(records))for(const [id,value] of Object.entries(items)){
    if(!book(id))fail('Ein älteres Bibelbuch ist nicht im kanonischen Katalog enthalten. Bitte den Import prüfen.');
    const isRead=typeof value==='boolean'?value:value?.isRead??value?.completed??(['read','completed','gelesen'].includes(value?.status)?true:false);
    if(typeof isRead!=='boolean')fail('Ein älterer Lesestatus ist nicht eindeutig.');
    reading.records[rid]||={};reading.records[rid][id]={isRead,version:Number.isSafeInteger(value?.version)?Math.max(0,value.version):0,updatedAt:value?.updatedAt&&Number.isFinite(Date.parse(value.updatedAt))?value.updatedAt:null};explicit.set(rid+':'+id,isRead);
   }
  }
  for(const e of activeBible(s)){
   const id=e.bookId||e.taskId,rid=e.rangerId;reading.records[rid]||={};
   if(!explicit.has(rid+':'+id))reading.records[rid][id]={isRead:true,version:0,updatedAt:e.at||null};
   reverse(s,e,at,uid,{migration:true,reason:'Bibellesen auf kanonische 240-Punkte-Wertung umgestellt.'});
  }
  for(const e of s.exams)if(book(e.taskId)&&!['reading_pending','reading_archived'].includes(e.status)){
   const pending=e.status==='registered';e.history||=[];e.history.push({type:'bible-reading-migration',at,previousStatus:e.status,message:'Keine Leiterprüfung mehr erforderlich; der Ranger markiert das Buch selbst.'});e.status=pending?'reading_pending':'reading_archived';
   if(pending){reading.pendingMigration||={};reading.pendingMigration[e.rangerId]||=[];reading.pendingMigration[e.rangerId].push(e.taskId);}
  }
  s.bibleReading=reading;
  for(const [rid,items] of Object.entries(reading.records))for(const [id,value] of Object.entries(items))if(value.isRead)credit(s,rid,book(id),at,uid,{migration:true});
  if(legacy||s.ledger.some(e=>e.migration&&isBible(e))||reading.pendingMigration){s.revision++;s.audit.push({type:'bible-reading-migration',at,catalogVersion:B.catalogVersion,message:'Lesemarkierungen erhalten; Bibelpunkte aus dem 240er-Katalog neu berechnet. Übriges Fachwissen unverändert.'});}
  checkReading(s);return s;
 }
 function maxima(catalog){const tasks=catalog.tasks.filter(t=>t.visible),known=tasks.reduce((sum,t)=>{const points=[t.points,...(t.pointOptions||[]).map(o=>o.points)].filter(p=>Number.isInteger(p)&&p>=0);return sum+(points.length?Math.max(...points):0);},0);return {fachwissen:known,bible:B.maxPoints,total:known+B.maxPoints,unresolved:tasks.filter(t=>t.points==null&&!t.pointOptions?.length).length};}
 M.initial=()=>({...base.initial(),bibleReading:empty()});
 M.migrate=migrate;M.check=s=>{base.check(s);checkReading(s);};
 M.credits=(s,rid,tid)=>[...base.credits(s,rid,tid),...activeBible(s).filter(e=>e.type==='bible-credit'&&(rid==null||same(e.rangerId,rid))&&(!tid||e.taskId===tid))];
 M.snapshot=(state,env,a,global,filter={},at)=>{
  const s=migrate(state),out=base.snapshot(s,env,a,global,filter,at),allowed=a.leader?out.people.map(p=>String(p.id)):[String(a.id)],records={};
  for(const rid of allowed)records[rid]=copy(s.bibleReading.records[rid]||{});
  out.bible={catalogVersion:B.catalogVersion,records,pendingMigration:Object.fromEntries(allowed.filter(id=>s.bibleReading.pendingMigration?.[id]?.length).map(id=>[id,copy(s.bibleReading.pendingMigration[id])]))};
  out.ranking=out.ranking.map(r=>({...r,biblePoints:summary(s,r.id).points,bibleBooks:summary(s,r.id).books,fachwissenPoints:r.points-summary(s,r.id).points}));
  out.exams=out.exams.filter(e=>!book(e.taskId));out.pending=out.exams.filter(e=>e.status==='registered').length;out.maximum=maxima(out.catalog);return out;
 };
 M.apply=(s,env,a,global,type,payload={},at=new Date().toISOString(),uid=()=>crypto.randomUUID())=>{
  if(type!=='set-bible-read'){if(payload?.examId&&s.exams.some(e=>e.id===payload.examId&&book(e.taskId)))fail('Bibellesen benötigt keine Leiterprüfung. Der Ranger verwaltet seinen Lesestatus selbst.');return base.apply(s,env,a,global,type,payload,at,uid);}
  base.check(s);checkReading(s);
  if(a.kind!=='rangers'||a.leader||a.stammId!==a.homeStammId||!env.rangers.some(p=>same(p.id,a.id)&&base.active(p)))fail('Nur Ranger dürfen ihren eigenen Bibellese-Fortschritt ändern.');
  if(!payload||Object.keys(payload).some(k=>!['bookId','isRead','version'].includes(k))||typeof payload.isRead!=='boolean'||!Number.isSafeInteger(payload.version)||payload.version<0)fail('Bitte einen eindeutigen Buchstatus mit gültiger Version senden. Fremde Profile oder Punktzahlen können nicht vorgegeben werden.');
  const b=book(payload.bookId);if(!b)fail('Dieses Buch gehört nicht zum kanonischen Bibelkatalog.');
  const current=record(s,a.id,b.id);if(current.isRead===payload.isRead)return {existing:true,version:current.version};
  if(current.version!==payload.version)fail('Dieses Buch wurde inzwischen auf einem anderen Gerät geändert. Der aktuelle Stand wurde geladen; bitte prüfe ihn vor einer neuen Änderung.');
  if(payload.isRead)credit(s,a.id,b,at,uid,{homeStammId:a.homeStammId});else {const e=activeBible(s).find(e=>same(e.rangerId,a.id)&&(e.bookId||e.taskId)===b.id);if(!e)fail('Die aktuelle Lesebuchung ist nicht mehr verfügbar. Bitte neu laden.');reverse(s,e,at,uid,{homeStammId:a.homeStammId});}
  s.bibleReading.records[a.id]||={};s.bibleReading.records[a.id][b.id]={isRead:payload.isRead,version:current.version+1,updatedAt:at};
  if(s.bibleReading.pendingMigration?.[a.id])s.bibleReading.pendingMigration[a.id]=s.bibleReading.pendingMigration[a.id].filter(id=>id!==b.id);
  s.revision++;checkReading(s);return {version:current.version+1};
 };
 window.RHBibleModel={book,record,summary,activeBible,maxima};
})();
