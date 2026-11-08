/* In-person examinations. One existing ledger, no uploads and no duel commands. */
(() => {
 'use strict';
 const K=window.RHKnowledgeCatalogV30,same=(a,b)=>String(a)===String(b),copy=x=>structuredClone(x);
 const fail=m=>{throw Error(m);},text=(v,max=2000)=>typeof v==='string'&&v.trim()&&v.length<=max?v.trim():fail('Bitte eine Begründung eingeben.');
 const date=(at=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(at));
 const week=at=>{const d=new Date(date(at)+'T12:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);};
 const alias=p=>p.alias?String(p.alias).slice(0,60):String(p.name||'Ranger').trim().split(/\s+/).map((s,i,a)=>i===0?s:i===a.length-1?s[0]+'.':'').filter(Boolean).join(' ');
 const active=p=>window.RHMembershipModel.active(p)&&p.knowledgeEligible!==false;
 const initial=()=>({schema:2,ledger:[],exams:[],content:K.emptyLayer(),permissions:{},audit:[],revision:0});
 function migrate(old){
  if(old==null)return initial();
  if(old.schema===2){check(old);return copy(old);}
  if(old.schema!==1||!Array.isArray(old.ledger)||!old.progress||!Array.isArray(old.challenges))fail('Unbekannter Fachwissen-Stand. Die bisherigen Daten bleiben erhalten.');
  const next=initial(),legacy=copy(old);delete legacy.ledger;next.ledger=copy(old.ledger);next.legacy=legacy;
  for(const [id,value] of Object.entries(old.resolutions||{}))next.content.overrides.tasks[id]={fields:{points:value.points},revision:1,at:value.at,by:value.by,legacySource:copy(value)};
  for(const [id,policy] of Object.entries(old.policies||{}))if(policy.published===false)next.content.overrides.tasks[id]={...(next.content.overrides.tasks[id]||{}),fields:{...(next.content.overrides.tasks[id]?.fields||{}),isActive:false},revision:1};
  if(Object.keys(next.content.overrides.tasks).length)next.content.revision=1;
  next.audit.push({type:'migration',from:1,to:2,at:new Date().toISOString(),message:'Bestand erhalten; frühere Workflows nur archiviert.'});return next;
 }
 function check(s){if(s?.schema!==2||!Array.isArray(s.ledger)||!Array.isArray(s.exams)||!s.content||!s.permissions||!Array.isArray(s.audit))fail('Unbekanntes Prüfungsformat. Bitte den aktuellen Stand verwenden.');K.validateLayer(s.content);}
 const credits=(s,rid,tid)=>s.ledger.filter(e=>e.type==='credit'&&(!rid||same(e.rangerId,rid))&&(!tid||e.taskId===tid)&&!s.ledger.some(r=>r.reversalOf===e.id));
 const categoryOf=e=>e.categoryId||K.base.tasks.find(t=>t.id===e.taskId)?.sourceCategoryId;
 const totals=(s,rid,f={})=>s.ledger.filter(e=>same(e.rangerId,rid)&&(!f.since||date(e.at)>=f.since)&&(!f.before||date(e.at)<f.before)&&(!f.category||categoryOf(e)===f.category)).reduce((n,e)=>n+e.points,0);
 function ranking(s,people,f={}){
  const rows=people.filter(active).filter(p=>!f.team||p.team===f.team).map(p=>({id:p.id,alias:alias(p),team:p.team||'',points:totals(s,p.id,f),approved:credits(s,p.id).length,weekPoints:totals(s,p.id,{since:week(new Date())})})).sort((a,b)=>b.points-a.points||a.alias.localeCompare(b.alias,'de'));
  let previous=null,rank=0;rows.forEach((r,i)=>{if(r.points!==previous)rank=i+1;r.rank=r.points>0?rank:null;previous=r.points;});
  return rows.map(r=>{const above=rows.filter(x=>x.points>r.points);return {...r,gap:above.length?Math.min(...above.map(x=>x.points))-r.points:null};});
 }
 function meetingStart(m){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(m?.date||''))return null;
  const time=/^\d{2}:\d{2}$/.test(m.start||'')?m.start:'00:00',utc=Date.parse(m.date+'T'+time+':00Z');
  const parts=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(utc)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  const localAsUTC=Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`);return new Date(utc-(localAsUTC-utc)).toISOString();
 }
 const cancelled=m=>!m||m.cancelled||m.archived||m.deleted||['cancelled','abgesagt','ausgefallen'].includes(String(m.status||'').toLowerCase());
 function eligibleMeeting(m,p){
  if(!window.RHMembershipModel.active(p,m.date)||cancelled(m)||m.cancelledRangerIds?.some(id=>same(id,p.id)))return false;
  const teams=m.teamIds||m.teams||(m.team?[m.team]:[]);return (!teams.length||teams.some(t=>same(t,p.teamId??p.team)))&&(!m.rangerIds?.length||m.rangerIds.some(id=>same(id,p.id)));
 }
 const used=(s,rid,mid)=>s.exams.filter(e=>same(e.rangerId,rid)&&same(e.meetingId,mid)&&['registered','passed','failed','no_show'].includes(e.status)).length;
 function syncCancellations(s,meetings,at){
  for(const e of s.exams)if(e.status==='registered'){
   const m=meetings.find(m=>same(m.id,e.meetingId));
   if(cancelled(m)){e.status='meeting_cancelled';e.history.push({type:'meeting_cancelled',at});}
   else if(e.meetingStart!==meetingStart(m)){e.history.push({type:'meeting_changed',at,from:e.meetingStart,to:meetingStart(m)});e.meetingStart=meetingStart(m);}
  }
 }
 function snapshot(state,env,a,global=K.emptyLayer(),filter={},at=new Date().toISOString()){
  const s=migrate(state);check(s);syncCancellations(s,env.meetings||[],at);const catalog=K.effective(global,s.content),rows=ranking(s,env.rangers,a.leader?filter:{}),rights=K.permissions(a,s);
  const permittedPerson=p=>active(p)&&(!a.teamIds?.length||a.role==='Admin'||a.role==='Stammleiter'||a.teamIds.some(t=>same(t,p.teamId??p.team)));
  const people=env.rangers.filter(permittedPerson),self=people.find(p=>same(p.id,a.id));
  const examAccess=e=>a.leader?people.some(p=>same(p.id,e.rangerId)):same(e.rangerId,a.id);
  const exams=s.exams.filter(examAccess).map(e=>copy(e)),ownCredits=credits(s,a.id),progress={};
  for(const e of exams){const k=`${e.rangerId}:${e.taskId}`,old=progress[k];if(!old||e.registeredAt>old.at)progress[k]={status:e.status,at:e.registeredAt,examId:e.id};}
  for(const e of credits(s))if(examAccess(e))progress[`${e.rangerId}:${e.taskId}`]={status:'approved',at:e.at};
  const meetings=(env.meetings||[]).filter(m=>a.leader||self&&eligibleMeeting(m,self)||exams.some(e=>same(e.meetingId,m.id))).map(m=>({id:m.id,date:m.date,start:m.start||'',end:m.end||'',place:m.place||'',theme:m.theme||'Rangertreffen',cancelled:cancelled(m),eligible:a.leader||!!(self&&eligibleMeeting(m,self)),teamIds:copy(m.teamIds||m.teams||[]),rangerIds:copy(m.rangerIds||[]),revision:m._knowledgeRevision||0})).sort((x,y)=>(meetingStart(x)||'').localeCompare(meetingStart(y)||''));
  const future=meetings.filter(m=>m.eligible&&!m.cancelled&&(meetingStart(m)||'')>at);
  const editLayers=rights.local||rights.global?{global:copy(global),local:copy(s.content)}:null;
  return {mode:'demo',catalog,progress,ledger:copy(s.ledger.filter(examAccess)),exams,ranking:rows,
   people:people.map(p=>({id:p.id,alias:alias(p),name:a.leader?p.name:undefined,team:p.team||''})),meetings,nextMeeting:future[0]||null,
   pending:exams.filter(e=>e.status==='registered').length,totalPoints:rows.reduce((n,r)=>n+r.points,0),
   actor:{id:a.id,kind:a.kind,leader:a.leader,role:a.role,stammId:a.stammId,homeStammId:a.homeStammId},rights,layers:editLayers,
   permissions:rights.correct?copy(s.permissions):undefined,revision:s.revision,globalRevision:global.revision,
   audit:rights.correct?copy(s.audit):[],ownApproved:ownCredits.length};
 }
 function apply(s,env,a,global,type,payload={},at=new Date().toISOString(),uid=()=>crypto.randomUUID()){
  check(s);const people=env.rangers,meetings=env.meetings||[],rights=K.permissions(a,s),stamp={at,by:a.id,homeStammId:a.homeStammId,role:a.role};
  const lead=()=>a.leader||fail('Nur die Leitung darf Prüfungen bewerten.'),correct=()=>rights.correct||fail('Nur Stammleitung oder Admin dürfen Ergebnisse berichtigen.');
  const person=id=>people.find(p=>same(p.id,id)&&active(p));
  const scope=p=>{if(!p)fail('Ranger nicht gefunden.');if(a.teamIds?.length&&!['Admin','Stammleiter'].includes(a.role)&&!a.teamIds.some(t=>same(t,p.teamId??p.team)))fail('Dieser Ranger gehört nicht zu deinem zugeordneten Team.');};
  const mine=()=>{if(a.leader||a.kind!=='rangers')fail('Prüfungsanmeldungen erfolgen im eigenen Rangerprofil.');const p=person(a.id);scope(p);return p;};
  const effective=()=>K.effective(global,s.content),task=id=>effective().tasks.find(t=>t.id===id);
  const meeting=id=>meetings.find(m=>same(m.id,id));
  syncCancellations(s,meetings,at);
  const audit=(action,details)=>{s.audit.push({id:uid(),type:action,...stamp,...details});s.revision++;};
  const activeCredit=(rid,tid)=>credits(s,rid,tid)[0];
  const reverse=(exam,reason)=>{const credit=s.ledger.find(e=>e.id===exam.creditId);if(!credit||s.ledger.some(e=>e.reversalOf===credit.id))return;
   s.ledger.push({id:uid(),type:'reversal',taskId:exam.taskId,rangerId:exam.rangerId,points:-credit.points,reversalOf:credit.id,examId:exam.id,reason,...stamp});};
  const award=exam=>{
   if(activeCredit(exam.rangerId,exam.taskId))fail('Diese Aufgabe ist bereits bestanden und gutgeschrieben.');
   let points=exam.taskSnapshot.points,revision=exam.taskSnapshot.revisionId;
   if(points==null){const current=task(exam.taskId);if(!current||current.points==null)fail('Punktwert ungeklärt. Zuerst den gültigen Quellwert im Katalog festlegen.');points=current.points;revision=current.revisionId;}
   const entry={id:uid(),type:'credit',taskId:exam.taskId,rangerId:exam.rangerId,points,sourcePoints:exam.taskSnapshot.originalPoints,categoryId:exam.taskSnapshot.categoryId,
    sourceReference:copy(exam.taskSnapshot.sourceReference),examId:exam.id,revisionId:revision,titleAtReview:exam.taskSnapshot.title||exam.taskSnapshot.text,...stamp};
   s.ledger.push(entry);exam.creditId=entry.id;exam.pointsAtReview=points;exam.pointsRevision=revision;
  };
  if(type==='catalog-change'){
   const id=K.edit(global,s.content,a,{...payload,_permissions:s.permissions},at,uid);audit(type,{scope:payload.scope,kind:payload.kind,sourceId:id});return {id};
  }
  if(type==='set-editor-permission'){
   correct();const p=env.leaders?.find(p=>same(p.id,payload.leaderId));if(!p||p.role==='Admin'||p.role==='Stammleiter')fail('Dieses Redaktionsrecht kann nur für normale Leiter gesetzt werden.');
   if(typeof payload.allowed!=='boolean')fail('Ungültiges Redaktionsrecht.');s.permissions[p.id]={canEditLocalKnowledge:payload.allowed,...stamp};audit(type,{leaderId:p.id,allowed:payload.allowed});return;
  }
  if(type==='register-exam'){
   const p=mine(),t=task(payload.taskId),m=meeting(payload.meetingId);
   if(!t||!t.visible)fail('Diese Aufgabe ist nicht zur Anmeldung freigegeben.');
   if(!eligibleMeeting(m,p)||!meetingStart(m)||meetingStart(m)<=at)fail('Dieses Treffen ist nicht mehr zur Anmeldung verfügbar.');
   if((env.cancellations||[]).some(c=>same(c.meetingId,m.id)&&c.kind==='rangers'&&same(c.personId,p.id)))fail('Du bist von diesem Treffen abgemeldet. Bitte zuerst deine Teilnahme klären.');
   if(activeCredit(p.id,t.id))fail('Bereits bestandene Aufgaben können nicht erneut angemeldet werden.');
   const existing=s.exams.find(e=>same(e.rangerId,p.id)&&same(e.meetingId,m.id)&&e.taskId===t.id&&e.status!=='withdrawn'&&e.status!=='meeting_cancelled');
   if(existing)return {id:existing.id,existing:true};
   if(s.exams.some(e=>same(e.rangerId,p.id)&&e.taskId===t.id&&e.status==='registered'))fail('Diese Aufgabe ist bereits für ein anderes Treffen angemeldet.');
   const previous=s.exams.filter(e=>same(e.rangerId,p.id)&&e.taskId===t.id&&['failed','no_show'].includes(e.status));
   if(previous.some(e=>(e.meetingStart||meetingStart(meeting(e.meetingId))||'')>=meetingStart(m)))fail('Ein neuer Versuch ist erst bei einem späteren Treffen möglich.');
   if(used(s,p.id,m.id)>=3)fail('Für dieses Treffen sind bereits 3 von 3 Prüfungsplätzen belegt.');
   const option=payload.pointOption?t.pointOptions?.find(o=>same(o.sourceParagraphIndex,payload.pointOption)):null;if(payload.pointOption&&!option)fail('Ungültige Aufgabenvariante.');
   const taskSnapshot={id:t.id,title:t.title,text:t.text,subItems:copy(t.displaySubItems??t.originalSubItems??[]),points:option?option.points:t.points,originalPoints:t.originalPoints,
    categoryId:t.categoryId,topicId:t.topicId,topicTitle:effective().topics.find(x=>x.id===t.topicId)?.title||t.sourceTopic,revisionId:t.revisionId,sourceReference:copy(t.sourceReference),pointOption:option?.sourceParagraphIndex};
   const exam={id:uid(),rangerId:p.id,stammId:a.stammId,meetingId:m.id,meetingStart:meetingStart(m),taskId:t.id,status:'registered',registeredAt:at,taskSnapshot,history:[{type:'registered',...stamp}]};
   s.exams.push(exam);audit(type,{examId:exam.id,meetingId:m.id,taskId:t.id});return {id:exam.id};
  }
  const exam=s.exams.find(e=>e.id===payload.examId);
  if(['withdraw-exam','reassign-exam','grade-exam','correct-exam'].includes(type)){
   if(!exam)fail('Prüfungsanmeldung nicht gefunden.');const p=person(exam.rangerId);scope(p);
   if(!a.leader&&!same(exam.rangerId,a.id))fail('Du darfst nur deine eigenen Anmeldungen bearbeiten.');
   if(type==='withdraw-exam'){
    mine();if(exam.status!=='registered'||meetingStart(meeting(exam.meetingId))<=at)fail('Eine Abmeldung ist nur vor dem Treffen und vor der Bewertung möglich.');
    exam.status='withdrawn';exam.history.push({type:'withdrawn',...stamp});audit(type,{examId:exam.id});return;
   }
   if(type==='reassign-exam'){
    if(!a.leader)mine();if(exam.status!=='meeting_cancelled')fail('Nur Anmeldungen abgesagter Treffen können umgebucht werden.');
    if(activeCredit(p.id,exam.taskId))fail('Diese Aufgabe wurde inzwischen bereits bestanden und gutgeschrieben.');
    const m=meeting(payload.meetingId);if(!eligibleMeeting(m,p)||!meetingStart(m)||meetingStart(m)<=at)fail('Bitte einen passenden zukünftigen Ersatztermin auswählen.');
    if(used(s,p.id,m.id)>=3)fail('Beim Ersatztermin sind bereits drei Prüfungsplätze belegt.');
    if(s.exams.some(e=>e.id!==exam.id&&same(e.rangerId,p.id)&&same(e.meetingId,m.id)&&e.taskId===exam.taskId&&e.status!=='withdrawn'))fail('Diese Aufgabe ist für den Ersatztermin bereits angemeldet.');
    const old=exam.meetingId;exam.meetingId=m.id;exam.meetingStart=meetingStart(m);exam.status='registered';exam.history.push({type:'reassigned',fromMeetingId:old,toMeetingId:m.id,...stamp});audit(type,{examId:exam.id,fromMeetingId:old,toMeetingId:m.id});return;
   }
   lead();const result=payload.result;if(!['passed','failed','no_show'].includes(result))fail('Ungültiges Prüfungsergebnis.');
   if(type==='grade-exam'){
    if(['passed','failed','no_show'].includes(exam.status)){if(exam.status===result)return {existing:true};fail('Diese Prüfung wurde bereits bewertet. Eine Korrektur benötigt die Stammleitung.');}
    const m=meeting(exam.meetingId);if(exam.status!=='registered'||cancelled(m))fail('Diese Anmeldung steht nicht zur Bewertung offen.');
    if(!meetingStart(m)||meetingStart(m)>at)fail('Prüfungen werden erst während des Treffens oder danach bewertet.');
   }else {correct();if(!['passed','failed','no_show'].includes(exam.status))fail('Es liegt noch kein korrigierbares Ergebnis vor.');text(payload.reason);if(exam.status===result)return {existing:true};reverse(exam,payload.reason);}
   if(result==='passed')award(exam);else exam.pointsAtReview=0;
   const previous=exam.status;exam.status=result;exam.reviewedAt=at;exam.reviewedBy=a.id;exam.reviewerHomeStammId=a.homeStammId;
   exam.history.push({type,result,previous,points:exam.pointsAtReview,...stamp,...(payload.reason?{reason:text(payload.reason)}:{})});audit(type,{examId:exam.id,result,reason:payload.reason||null});return;
  }
  if(type==='correct-legacy-credit'){
   correct();const entry=s.ledger.find(e=>e.id===payload.creditId&&e.type==='credit');if(!entry||s.ledger.some(e=>e.reversalOf===entry.id))fail('Keine aktive historische Gutschrift gefunden.');
   const reason=text(payload.reason);scope(person(entry.rangerId));s.ledger.push({id:uid(),type:'reversal',rangerId:entry.rangerId,taskId:entry.taskId,points:-entry.points,reversalOf:entry.id,reason,...stamp});audit(type,{creditId:entry.id,reason});return;
  }
  fail('Dieser frühere Ablauf ist deaktiviert. Bitte die persönliche Prüfung beim Rangertreffen verwenden.');
 }
 window.RHKnowledgeModel={initial,migrate,check,apply,snapshot,ranking,totals,credits,used,alias,active,date,week,meetingStart,eligibleMeeting,cancelled,syncCancellations,key:(rid,tid)=>`${rid}:${tid}`};
})();
