/* V33 role dashboards. Selectors read the existing tribe records; no parallel task/progress store. */
(() => {
 'use strict';
 const RH=window.RangerHub,M=window.RHKnowledgeModel,B=window.RHBibleCatalog,same=(a,b)=>String(a)===String(b),active=p=>!!p&&!p.archived&&p.active!==false;
 const today=()=>M.date(),day=s=>Date.parse(s+'T12:00Z'),days=(a,b)=>Math.round((day(a)-day(b))/86400000),actor=()=>{try{return RH.knowledgeActor();}catch{return null;}};
 const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||''),validTime=s=>/^\d{2}:\d{2}$/.test(s||'');
 const displayDate=s=>validDate(s)?new Date(s+'T12:00Z').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Berlin'}):'Datum noch offen';
 const longDate=s=>validDate(s)?new Date(s+'T12:00Z').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Berlin'}):'Datum noch offen';
 const pct=(value,digits=1)=>value==null?'—':Number(value.toFixed(digits)).toLocaleString('de-DE')+' %';
 const notify=s=>RH.v28Notify?.(s),personName=p=>p?.name||p?.alias||'Ranger';
 let cache=null,fullObserver=null,lastUI=null,sortState={key:'',field:'points',direction:-1};
 RH.dashboardDayDifference=days;
 function rangerPeople(a=actor(),data=lastUI?.data){
  const people=(db.rangers||[]).filter(active);if(!a?.leader||['Admin','Stammleiter'].includes(a.role)||!a.teamIds?.length)return people;
  const current=data?.actor&&same(data.actor.id,a.id)&&data.actor.stammId===a.stammId&&data.actor.homeStammId===a.homeStammId;
  if(current&&Array.isArray(data.people)){const permitted=new Set(data.people.map(p=>String(p.id)));return people.filter(p=>permitted.has(String(p.id)));}
  return people.filter(p=>a.teamIds.some(t=>same(t,p.teamId??p.team)));
 }
 RH.dashboardRangers=rangerPeople;
 function eventStart(m){if(!validDate(m?.date))return null;return validTime(m.start)?M.meetingStart(m):null;}
 function future(m,now=new Date().toISOString()){
  if(M.cancelled(m)||!validDate(m?.date)||m.date<M.date(now))return false;
  const start=eventStart(m);return start?start>=now:m.date>=M.date(now);
 }
 function meetingRelevant(m,kind,p){
  if(M.cancelled(m)||!p)return false;
  if(kind==='rangers')return M.eligibleMeeting({...m,cancelledRangerIds:[]},p);
  const ids=m.leaderIds||m.leadersIds||(m.participantKind==='leaders'?m.participantIds:null);
  const teams=m.leaderTeamIds||[];
  return (!Array.isArray(ids)||!ids.length||ids.some(id=>same(id?.id??id,p.id)))&&(!teams.length||teams.some(t=>same(t,p.teamId??p.team)));
 }
 function nextEvents(a=actor(),now=new Date().toISOString()){
  if(!a)return [];
  const self=a.leader?null:db.rangers.find(p=>same(p.id,a.id));
  const ranger=(db.meetings||[]).filter(m=>future(m,now)&&(a.leader||meetingRelevant(m,'rangers',self))).map(m=>({kind:'ranger',meeting:m}));
  const leaders=a.leader?(db.leaderMeetings||[]).filter(m=>future(m,now)).map(m=>({kind:'leader',meeting:m})):[];
  return [...ranger,...leaders].sort((x,y)=>(x.meeting.date+' '+(x.meeting.start||'23:59')).localeCompare(y.meeting.date+' '+(y.meeting.start||'23:59'))||String(x.meeting.id).localeCompare(String(y.meeting.id)));
 }
 RH.dashboardNextEvent=(now)=>nextEvents(actor(),now)[0]||null;
 /* The existing definition uses only explicitly recorded ANWESEND/ABWESEND/ENTSCHULDIGT.
    Excused records remain in the denominator. Unknown, future, cancelled and unrelated meetings do not.
    The tribe mean below averages these unrounded ratios, never strings or rounded percentages. */
 function attendanceStats(kind,pid,now=new Date().toISOString()){
  const a=actor(),person=(db[kind]||[]).find(p=>same(p.id,pid));
  if(!a||!person||kind==='rangers'&&!rangerPeople(a).some(p=>same(p.id,pid))||kind==='leaders'&&same(pid,a.id)&&a.homeStammId!==a.stammId)return {attended:0,total:0,ratio:null,percent:null,lastDate:null};
  const records=(db.meetings||[]).filter(m=>meetingRelevant(m,kind,person)&&validDate(m.date)&&m.date<=M.date(now)&&(!eventStart(m)||eventStart(m)<=now)).map(m=>({m,status:m.attendance?.[kind]?.[pid]})).filter(r=>['ANWESEND','ABWESEND','ENTSCHULDIGT'].includes(r.status));
  const attended=records.filter(r=>r.status==='ANWESEND').length,total=records.length,ratio=total?attended/total:null;
  return {attended,total,ratio,percent:ratio==null?null:ratio*100,lastDate:records.map(r=>r.m.date).sort().at(-1)||null};
 }
 RH.dashboardAttendanceStats=attendanceStats;
 const idFields=['leaderId','responsibleId','responsibleLeaderId','assignedTo','assigneeId'];
 function owners(value,fallback=[]){
  if(!value||typeof value!=='object')return fallback;
  const explicit=idFields.filter(k=>value[k]!=null&&value[k]!=='').flatMap(k=>Array.isArray(value[k])?value[k]:[value[k]]);
  for(const k of ['leaderIds','responsibleIds','responsibleLeaderIds','assigneeIds'])if(Array.isArray(value[k]))explicit.push(...value[k]);
  const ids=explicit.map(x=>x?.id??x).filter(x=>x!==null&&x!==undefined&&x!=='');return ids.length?[...new Set(ids.map(String))]:fallback;
 }
 const assigned=(obj,a,fallback=[])=>owners(obj,fallback).some(id=>same(id,a.id));
 function taskState(source){
  const value=String(source?.status||'').toLocaleLowerCase('de');
  const done=typeof source?.done==='boolean'?source.done:typeof source?.completed==='boolean'?source.completed:['done','completed','erledigt'].includes(value);
  return {done,status:done?'erledigt':['in progress','in_progress','in arbeit','started'].includes(value)?'in Arbeit':'offen'};
 }
 function actionParts(m){
  const result=[],ids=new Set(),refs=new Set();
  const append=(part,key)=>{if(!part||typeof part!=='object'||refs.has(part))return;const id=part.id!=null?'id:'+part.id:null;if(id&&ids.has(id))return;refs.add(part);if(id)ids.add(id);result.push({part,key});};
  if(Array.isArray(m.actions))m.actions.forEach((p,i)=>append(p,'action:'+String(p.id??i)));
  if(Array.isArray(m.action?.actions))m.action.actions.forEach((p,i)=>append(p,'action:'+String(p.id??i)));
  const primary=m.action;
  // An empty legacy placeholder does not invent a second action beside an actual actions array.
  if(primary&&(primary.title||primary.description||primary.leaderId||!result.length))append(primary,'action');
  return result;
 }
 function ownTasks(a=actor()){
  if(!a?.leader||a.homeStammId!==a.stammId||!(db.leaders||[]).some(p=>same(p.id,a.id)&&active(p)))return [];
  const rows=[],seen=new Set(),sourceRefs=new Set();
  const add=(source,details)=>{
   if(!source||!assigned(source,a,details.fallback||[]))return;
   const row={...details,source,...taskState(source)},dedupe=details.dedupe||details.key;if(seen.has(dedupe)||sourceRefs.has(source))return;seen.add(dedupe);sourceRefs.add(source);
   row.canToggle=typeof source.done==='boolean'||typeof source.completed==='boolean';rows.push(row);
  };
  const nested=(part,m,key,kind='ranger')=>{
   for(const collection of ['doings','tasks','preparationTasks','followUpTasks'])if(Array.isArray(part?.[collection]))part[collection].forEach((t,i)=>{
    if(!t||typeof t!=='object')return;const id=t.id??`${key}:${collection}:${i}`;
    add(t,{key:`${kind}:${m.id}:task:${id}`,dedupe:`${kind}:${m.id}:task:${id}`,kind,meetingId:m.id,sourceId:t.id??null,date:t.due||t.date||m.date,title:t.title||t.text||'Zugeordnete Aufgabe',role:collection==='followUpTasks'?'Nachbereitung':'Vorbereitung / Doing',detail:part.title||m.theme||m.title||'Rangertreffen',fallback:owners(part)});
   });
  };
  for(const m of db.meetings||[]){
   if(M.cancelled(m))continue;
   for(const [key,label] of [['food','Essen'],['impulse','Impuls'],['nature','Naturphänomen']]){
    const part=m[key];if(!part||part.enabled===false)continue;
    add(part,{key:`ranger:${m.id}:program:${key}`,kind:'ranger',meetingId:m.id,sourceId:key,date:part.due||m.date,title:part.title||label+' vorbereiten',role:label+' vorbereiten',detail:m.theme||'Rangertreffen'});
    nested(part,m,key);
    if(key==='food')for(const [i,item] of (part.ingredients||[]).entries())if(item&&typeof item==='object')add(item,{key:`ranger:${m.id}:ingredient:${item.id??i}`,kind:'ingredient',meetingId:m.id,sourceId:item.id??i,date:item.due||m.date,title:item.text||item.title||'Lebensmittel',role:'Einkauf',detail:part.title||m.theme||'Essen',fallback:owners(part)});
   }
   for(const {part,key} of actionParts(m)){
    if(part.enabled===false)continue;add(part,{key:`ranger:${m.id}:program:${key}`,kind:'ranger',meetingId:m.id,sourceId:part.id??key,date:part.due||m.date,title:part.title||'Aktion vorbereiten',role:'Aktion vorbereiten',detail:m.theme||'Rangertreffen'});nested(part,m,key);
   }
   for(const collection of ['tasks','preparationTasks','followUpTasks'])if(Array.isArray(m[collection]))m[collection].forEach((t,i)=>add(t,{key:`ranger:${m.id}:task:${t?.id??collection+':'+i}`,kind:'ranger',meetingId:m.id,sourceId:t?.id??null,date:t?.due||t?.date||m.date,title:t?.title||t?.text||'Zugeordnete Aufgabe',role:collection==='followUpTasks'?'Nachbereitung':'Treffen vorbereiten',detail:m.theme||'Rangertreffen'}));
  }
  for(const m of db.leaderMeetings||[]){
   if(M.cancelled(m))continue;
   for(const collection of ['actions','tasks','preparationTasks','followUpTasks'])if(Array.isArray(m[collection]))m[collection].forEach((t,i)=>add(t,{key:`leader:${m.id}:task:${t?.id??collection+':'+i}`,kind:'leader',meetingId:m.id,sourceId:t?.id??null,date:t?.due||t?.date||m.date,title:t?.text||t?.title||'Aufgabe aus Leitertreffen',role:collection==='followUpTasks'?'Nachbereitung':'Leitertreffen',detail:m.title||m.theme||'Leitertreffen'}));
  }
  if(Array.isArray(db.tasks))db.tasks.forEach((t,i)=>{
   const kind=t?.meetingKind==='leader'||t?.leaderMeetingId!=null?'leader':'ranger',meetingId=t?.leaderMeetingId??t?.meetingId??null,sourceId=t?.sourceTaskId??t?.taskId??t?.id??i;
   const linked=meetingId!=null&&rows.some(row=>same(row.meetingId,meetingId)&&same(row.sourceId,sourceId)&&row.kind===kind);if(linked)return;
   add(t,{key:`task:${t?.id??i}`,kind:meetingId==null?'task':kind,sourceId,meetingId,date:t?.due||t?.date||'',title:t?.title||t?.text||'Meine Aufgabe',role:'Meine Aufgabe',detail:t?.description||''});
  });
  return rows.sort((x,y)=>Number(x.done)-Number(y.done)||(x.date||'9999').localeCompare(y.date||'9999')||x.key.localeCompare(y.key));
 }
 RH.dashboardOwnTasks=ownTasks;
 function openMeeting(kind,id,edit=false){
  const a=actor();if(!a)return;
  if(kind==='leader'){if(!a.leader)return;const m=(db.leaderMeetings||[]).find(m=>same(m.id,id));if(m)return edit?leaderForm(m.id):openLeaderMeeting(m.id);}
  else{const m=(db.meetings||[]).find(m=>same(m.id,id));if(m)return edit&&a.leader?meetingFormV15(m.id):a.leader?openRangerMeeting(m.id):RH.openPublicMeeting?.(m.id);}
 }
 RH.toggleDashboardTask=async(key,done)=>{
  const a=actor(),row=ownTasks(a).find(t=>t.key===key);if(!a?.leader||!row||!row.canToggle||typeof done!=='boolean')return false;
  const prop=typeof row.source.done==='boolean'?'done':'completed',old=row.source[prop];row.source[prop]=done;
  try{await v24Persist();if(actor()?.key===a.key){if(view==='dash'&&lastUI)RH.renderDashboardV33({...lastUI,force:true});else if(view==='tasks')tasks();RH.refreshNavigationV33?.();}return true;}
  catch(e){row.source[prop]=old;notify('Nicht gespeichert. Die Aufgabe bleibt unverändert.');return false;}
 };
 function growthRows(){
  return rangerPeople().map(p=>{const counts=stages.map(s=>v24Count(s,p.id));let official=0;while(official<stages.length-1&&counts[official].total>0&&counts[official].done>=counts[official].total)official++;
   const total=counts.reduce((n,c)=>n+c.total,0),done=counts.reduce((n,c)=>n+c.done,0),c=counts[official];return {id:p.id,name:personName(p),alias:M.alias(p),official,stage:stages[official],stageDone:c.done,stageTotal:c.total,stagePercent:c.total?c.done/c.total*100:null,done,total,percent:total?Math.round(done/total*100):0,score:official+(c.total?c.done/c.total:0)};
  }).sort((a,b)=>b.score-a.score||b.done-a.done||a.alias.localeCompare(b.alias,'de')).map((r,i,all)=>({...r,rank:all.findIndex(x=>x.score===r.score&&x.done===r.done)+1}));
 }
 RH.growthRanking=growthRows;
 const table=(columns,rows,cls='')=>`<div class="v33-table-wrap"><table class="v33-table v33-responsive-table ${cls}"><thead><tr>${columns.map(c=>`<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
 const cell=(label,body,cls='')=>`<td data-label="${esc(label)}" ${cls?`class="${cls}"`:''}>${body}</td>`;
 const textButton=(label,attrs='',cls='')=>`<button type="button" class="v33-link ${cls}" ${attrs}>${label}</button>`;
 function taskRows(rows){return rows.map(t=>`<tr data-todo-key="${esc(t.key)}" data-source-type="${t.kind}" data-meeting-id="${esc(t.meetingId??'')}" class="${t.done?'is-complete':''}">${cell('Aufgabe',`<b>${esc(t.title)}</b><small>${esc(t.detail)}</small>`)}${cell('Treffen / Fälligkeit',`${esc(displayDate(t.date))}${validDate(t.date)&&t.date<today()&&!t.done?'<small class="v33-overdue">Überfällig</small>':''}`)}${cell('Meine Rolle',esc(t.role))}${cell('Status',`<span class="v33-state ${t.done?'is-done':t.status==='in Arbeit'?'is-progress':''}">${esc(t.status)}</span>`)}${cell('Aktion',`<div class="v33-task-actions">${t.canToggle?`<label class="v33-check"><input type="checkbox" data-todo-toggle="${esc(t.key)}" aria-label="${esc(t.title)} ${t.done?'wieder öffnen':'erledigen'}" ${t.done?'checked':''}><span>${t.done?'Erledigt':'Erledigen'}</span></label>`:''}${textButton('Öffnen ↗',`data-todo-open="${esc(t.key)}"`)}</div>`)}</tr>`).join('');}
 function tasksBlock(a,full=false){
  const rows=ownTasks(a),open=rows.filter(t=>!t.done),done=rows.filter(t=>t.done),shown=full?open:open.slice(0,6);
  return `<section class="v33-work-section v33-tasks-block" data-dashboard-section="tasks"><header class="v33-section-title"><div><span class="section-kicker">Dein Leiteralltag</span><h2>Meine Aufgaben</h2></div>${textButton(full?'Zum Dashboard ↗':`Alle Aufgaben (${open.length}) ↗`,`data-dashboard-route="${full?'dash':'tasks'}"`)}</header>${shown.length?table(['Aufgabe','Treffen / Fälligkeit','Meine Rolle','Status','Aktion'],taskRows(shown),'v33-tasks-table'):'<p class="v33-empty">Keine offenen eigenen Aufgaben.</p>'}${!full&&open.length>shown.length?`<p class="v33-small">${open.length-shown.length} weitere Aufgaben sind in deiner Aufgabenübersicht erreichbar.</p>`:''}${done.length?`<details class="v33-done-tasks"><summary>Erledigte Aufgaben (${done.length})</summary>${table(['Aufgabe','Treffen / Fälligkeit','Meine Rolle','Status','Aktion'],taskRows(done),'v33-tasks-table')}</details>`:''}</section>`;
 }
 function namesFor(part){const ids=owners(part),names=ids.map(id=>(db.leaders||[]).find(p=>same(p.id,id)&&active(p))?.name).filter(Boolean);return names.length?names.map(esc).join(', '):'<span class="v33-unassigned">Keine Zuständigkeit</span>';}
 function planningStatus(m){
  const parts=actionParts(m),enabled=parts.filter(({part})=>part.enabled!==false),first=enabled[0]?.part;
  // Reuse the existing timing/status definition, projecting the first real action
  // when the legacy single-action placeholder is empty. Check every real owner.
  const projected={...m,action:first?{...first,leaderId:owners(first)[0]}:m.action},base=RH.planningState(projected),missing=[];
  const hasOwner=part=>owners(part).some(id=>(db.leaders||[]).some(p=>same(p.id,id)&&active(p)));
  if(!parts.length)missing.push('Aktion');
  for(const {part} of enabled){if(!part.title?.trim())missing.push('Aktionsname');if(!hasOwner(part))missing.push('Leitung für Aktion');}
  for(const [key,label] of [['nature','Naturphänomen'],['impulse','Impuls']])if(m[key]?.enabled!==false){if(!m[key]?.title?.trim())missing.push(label);if(!hasOwner(m[key]))missing.push('Leitung für '+label);}
  const food=m.food,recipe=(db.recipes||[]).find(r=>same(r.id,food?.recipeId)),foodRequired=food?.enabled!==false&&!!(food?.enabled||food?.title||food?.recipeId||owners(food).length);
  if(foodRequired){if(!(food.title||recipe?.title)?.trim())missing.push('Essen');if(!hasOwner(food))missing.push('Leitung für Essen');}
  const complete=missing.length===0;return {...base,missing,complete,kind:complete?'ready':base.days>=0&&base.days<=7?'urgent':'pending',label:complete?'Planung abgeschlossen':'Planung noch nicht abgeschlossen'};
 }
 function planningRows(m){
  const food=m.food||{},recipe=(db.recipes||[]).find(r=>same(r.id,food.recipeId));
  const rows=[{kind:'food',label:'Essen',part:food,title:food.enabled===false?'Kein Essen geplant':food.title||recipe?.title||(food.enabled===true?'Essen vorgesehen':'Noch nicht geplant'),off:food.enabled===false},
   ...actionParts(m).map(({part})=>({kind:'action',label:'Aktion',part,title:part.enabled===false?'Bewusst nicht vorgesehen':part.title||'Noch nicht geplant',off:part.enabled===false})),
   ...[['impulse','Impuls'],['nature','Naturphänomen']].map(([kind,label])=>{const part=m[kind]||{};return {kind,label,part,title:part.enabled===false?'Bewusst nicht vorgesehen':part.title||'Noch nicht geplant',off:part.enabled===false};})];
  return rows.map(r=>`<tr data-planning-kind="${r.kind}">${cell('Planung',`<b>${r.label}</b>`)}${cell('Inhalt',`${esc(r.title)}${!r.off&&Array.isArray(r.part.doings)&&r.part.doings.length?`<ul class="v33-doings">${r.part.doings.map(d=>`<li>${esc(typeof d==='string'?d:d?.title||d?.text||d?.description||'Doing')}${owners(d).length?' · '+namesFor(d):''}</li>`).join('')}</ul>`:''}`)}${cell('Verantwortliche',r.off?'—':namesFor(r.part))}</tr>`).join('');
 }
 function leaderAgenda(m){
  const agenda=Array.isArray(m.agenda)?m.agenda:Array.isArray(m.topics)?m.topics:null,actions=Array.isArray(m.actions)?m.actions:[];
  return `<div class="v33-leader-agenda"><h3>Tagesordnung & Absprachen</h3>${agenda?.length?`<ul>${agenda.map(t=>`<li>${esc(typeof t==='string'?t:t.title||t.text||'Thema')}${typeof t==='object'&&owners(t).length?' · '+namesFor(t):''}</li>`).join('')}</ul>`:m.info?.trim()?`<p class="v33-agenda-text">${esc(m.info)}</p>`:'<p class="v33-empty">Noch keine Tagesordnung hinterlegt</p>'}${actions.length?`<h4>Aufgaben aus diesem Leitertreffen</h4>${table(['Aufgabe','Verantwortlich','Fälligkeit','Status'],actions.map(t=>`<tr>${cell('Aufgabe',esc(t.text||t.title||'Aufgabe'))}${cell('Verantwortlich',namesFor(t))}${cell('Fälligkeit',esc(displayDate(t.due||m.date)))}${cell('Status',esc(taskState(t).status))}</tr>`).join(''))}`:''}</div>`;
 }
 function leaderHero(a,u){
  const events=nextEvents(a),next=events[0],m=next?.meeting,n=next?days(m.date,today()):null,nextRanger=events.find(e=>e.kind==='ranger'&&e!==next),planning=next?.kind==='ranger'&&planningStatus(m);
  return `<section class="v33-work-section v33-work-hero" data-dashboard-section="meeting" ${next?`data-next-kind="${next.kind}" data-next-id="${esc(m.id)}"`:''}><header class="v33-event-header"><div><span class="v33-event-tag">${next?(next.kind==='ranger'?'Ranger-Treffen':'Leitertreffen'):'Kalender & Planung'}</span><h1>${next?esc(m.theme||m.title||(next.kind==='ranger'?'Nächstes Ranger-Treffen':'Nächstes Leitertreffen')):'Derzeit ist kein Ranger- oder Leitertreffen geplant'}</h1>${next?`<p class="v33-event-date">${esc(longDate(m.date))}${m.start?' · '+esc(m.start):''}${m.end?'–'+esc(m.end):''}${m.start||m.end?' Uhr':''}</p><p>${esc(m.place||'Treffpunkt noch offen')}</p>`:'<p>Neue Termine und Absprachen lassen sich im Kalender planen.</p>'}</div>${next?`<div class="v33-small-countdown">${n===0?'Heute':n===1?'Morgen':`<small>Noch</small> <strong>${n}</strong> <span>Tage</span>`}</div>`:''}</header>${next?`<div class="v33-event-actions">${textButton('Treffen öffnen ↗',`data-open-meeting="${esc(m.id)}" data-meeting-kind="${next.kind}"`)}<button type="button" class="btn alt" data-edit-meeting="${esc(m.id)}" data-meeting-kind="${next.kind}">Planung bearbeiten</button>${u.button('exams',`${u.data?.pending||0} offene Fachwissen-Prüfungen`)}</div>${next.kind==='ranger'?`<div class="v33-plan-heading"><h3>Wer macht was?</h3><span class="v33-planning-status ${planning.complete?'is-ready':'is-pending'}">${esc(planning.label)}</span></div>${table(['Planung','Inhalt','Verantwortliche'],planningRows(m),'v33-planning-table')}`:leaderAgenda(m)}${nextRanger?`<div class="v33-following-meeting"><span>Danach Ranger-Treffen: ${esc(displayDate(nextRanger.meeting.date))}${nextRanger.meeting.start?' · '+esc(nextRanger.meeting.start)+' Uhr':''}</span>${textButton('Planung öffnen ↗',`data-open-meeting="${esc(nextRanger.meeting.id)}" data-meeting-kind="ranger"`)}</div>`:''}`:`<button type="button" class="btn" data-dashboard-route="calendar">Zum Kalender</button>`}</section>`;
 }
 function leaderAttendance(a){
  const people=rangerPeople(a),mine=attendanceStats('leaders',a.id),rows=people.map(p=>({p,...attendanceStats('rangers',p.id)})),valid=rows.filter(r=>r.ratio!=null),mean=valid.length?valid.reduce((n,r)=>n+r.ratio,0)/valid.length*100:null;
  return `<section class="v33-work-section v33-attendance-block" data-dashboard-section="attendance"><header class="v33-section-title"><div><span class="section-kicker">Erfasste relevante Treffen</span><h2>Anwesenheiten</h2></div>${textButton('Teilnahme öffnen ↗','data-dashboard-route="abs"')}</header><div class="v33-attendance-numbers"><div><span>Meine Anwesenheit</span><strong data-leader-attendance>${pct(mine.percent)}</strong><small>${mine.total?mine.attended+' von '+mine.total+' erfassten Treffen':'Noch keine eigene Quote erfasst'}</small></div><div><span>Durchschnitt Ranger</span><strong data-ranger-attendance-mean>${pct(mean)}</strong><small>${valid.length} Ranger mit erfasster Teilnahme</small></div></div>${table(['Ranger','Teilgenommen / erfasst','Anwesenheit','Letztes Treffen'],rows.map(r=>`<tr data-attendance-person="${esc(r.p.id)}">${cell('Ranger',esc(personName(r.p)))}${cell('Teilgenommen / erfasst',r.attended+' / '+r.total)}${cell('Anwesenheit',`<strong>${pct(r.percent)}</strong>`)}${cell('Letztes Treffen',r.lastDate?esc(displayDate(r.lastDate)):'—')}</tr>`).join(''),'v33-attendance-table')}<p class="v33-small">Nur bereits erfasste, für die Person relevante Treffen. Entschuldigte Abwesenheit zählt wie bisher im Nenner. Der Ranger-Durchschnitt mittelt die ungerundeten Einzelquoten.</p></section>`;
 }
 function leaderGrowth(){return `<section class="v33-work-section v33-growth-block" data-dashboard-section="growth"><header class="v33-section-title"><div><span class="section-kicker">Bestätigte Aufgaben</span><h2>Wachstumspfad aller Ranger</h2></div></header>${table(['Ranger','Aktuelle Stufe','Aufgaben der Stufe','Fortschritt','Gesamt'],growthRows().map(r=>`<tr data-growth-person="${esc(r.id)}">${cell('Ranger',textButton(esc(r.name)+' ↗',`data-dashboard-profile="${esc(r.id)}"`))}${cell('Aktuelle Stufe',esc(r.stage))}${cell('Aufgaben der Stufe',r.stageDone+' / '+r.stageTotal)}${cell('Fortschritt',r.stageTotal?pct(r.stagePercent):'<span class="v33-unassigned">Keine Aufgaben hinterlegt</span>')}${cell('Gesamt',r.total?r.percent+' %':'—')}</tr>`).join(''),'v33-growth-table')}</section>`;}
 function leaderStatistics(a,data){
  const rows=rangerPeople(a,data).map(p=>({id:p.id,name:personName(p),...(data?.ranking?.find(r=>same(r.id,p.id))||{}),present:!!data?.ranking?.some(r=>same(r.id,p.id))}));
  if(sortState.key!==a.key)sortState={key:a.key,field:'points',direction:-1};
  const {field,direction}=sortState;rows.sort((x,y)=>{const xv=x[field],yv=y[field];if(typeof xv==='number'||typeof yv==='number')return ((Number(xv)||0)-(Number(yv)||0))*direction||x.name.localeCompare(y.name,'de');return String(xv??'').localeCompare(String(yv??''),'de')*direction||x.name.localeCompare(y.name,'de');});
  const headers=[['name','Ranger'],['fachwissenPoints','Fachwissen'],['biblePoints','Bibelreise'],['points','Gesamtpunkte'],['rank','Rang'],['bibleChapterPercent','Bibel gelesen'],['bibleBooks','Bücher']];
  const head=headers.map(([key,label])=>`<button type="button" class="v33-sort" data-stat-sort="${key}" aria-label="Nach ${label} sortieren">${label}<span aria-hidden="true">${field===key?(direction===1?'↑':'↓'):'↕'}</span></button>`);
  const rendered=rows.map(r=>`<tr data-stat-person="${esc(r.id)}">${cell('Ranger',esc(r.name))}${cell('Fachwissen',r.present?r.fachwissenPoints+' P':'—')}${cell('Bibelreise',r.present?r.biblePoints+' / 240 P':'—')}${cell('Gesamtpunkte',r.present?`<strong>${r.points} P</strong>`:'—')}${cell('Rang',r.rank?'#'+r.rank:'—')}${cell('Bibel gelesen',r.present?`${pct(r.bibleChapterPercent??0)}<small>${r.bibleChapters??0} / 1189 Kapitel</small>`:'—')}${cell('Bücher',r.present?r.bibleBooks+' / 66':'—')}</tr>`).join('');
  return `<section class="v33-work-section v33-statistics-block" data-dashboard-section="statistics"><header class="v33-section-title"><div><span class="section-kicker">Fachwissen & Bibelreise</span><h2>Statistik und Rangliste</h2></div></header><label class="v33-stat-sort-mobile">Sortieren<select data-stat-sort-select aria-label="Statistik sortieren">${headers.flatMap(([key,label])=>[1,-1].map(dir=>`<option value="${key}:${dir}" ${field===key&&direction===dir?'selected':''}>${label} · ${key==='name'?(dir===1?'A–Z':'Z–A'):(dir===1?'aufsteigend':'absteigend')}</option>`)).join('')}</select></label>${table(head,rendered,'v33-statistics-table')}<p class="v33-small">Gesamtpunkte = bestätigtes Fachwissen + vollständig gelesene Bibelbücher. Einzelne Kapitel geben keine Punkte. Gleiche Gesamtpunkte bedeuten den gleichen Rang.</p></section>`;
 }
 function birthdays(a){
  const upcoming=[...rangerPeople(a),...(db.leaders||[])].filter(p=>active(p)&&validDate(p.birthday)).map(p=>{let date=today().slice(0,4)+p.birthday.slice(4);if(date<today())date=String(Number(today().slice(0,4))+1)+p.birthday.slice(4);return {name:a.leader?personName(p):M.alias(p),date,days:days(date,today())};}).filter(p=>p.days>=0).sort((x,y)=>x.date.localeCompare(y.date)||x.name.localeCompare(y.name,'de')).slice(0,5);
  return `<section class="v33-work-section v33-birthdays" data-dashboard-section="birthdays"><span class="section-kicker">Gemeinsam feiern</span><h2>Nächste Geburtstage</h2><div>${upcoming.map(p=>`<p><time datetime="${p.date.slice(5)}">${p.date.slice(8)}.${p.date.slice(5,7)}.</time><b>${esc(p.name)}</b></p>`).join('')||'<p class="v33-empty">Keine bevorstehenden Geburtstage</p>'}</div></section>`;
 }
 function capture(host,a){const full=host.querySelector('.expedition'),weather=host.querySelector('[data-v27-current-weather]');if(!cache||cache.key!==a.key)cache={key:a.key,full:null,scene:'',weather:null};if(full){cache.full=full;cache.scene=full.querySelector('.expedition-scene-d')?.outerHTML||'';full.remove();}if(weather)cache.weather=weather;}
 RH.hasFullExpedition=()=>!!cache?.full&&cache.key===actor()?.key;
 RH.mountFullExpedition=host=>{if(!RH.hasFullExpedition())return false;host.append(cache.full);fullObserver?.disconnect();fullObserver=new ResizeObserver(()=>RH.refreshExpeditionMap?.());fullObserver.observe(cache.full.querySelector('.expedition-landscape'));requestAnimationFrame(()=>{RH.refreshExpeditionMap?.();if(matchMedia('(max-width:767px), (max-width:1023px) and (max-height:500px)').matches)RH.locateExpeditionInstant?.();});return true;};
 function growthPreview(a,button){
  const s=RH.expeditionSnapshot(),current=s?.progress[s.officialIndex],art=(cache.scene||'').replace(/expedition-scene expedition-scene-d/,'v33-growth-scene').replaceAll('rh-','v33-rh-').replace(/data-exp-path=/g,'data-preview-path=');
  return `<section class="v33-map-section" aria-label="Deine Expedition Vorschau"><header><span class="section-kicker">Wachstumspfad</span><h2>Deine Expedition.</h2><p>${esc(s?.official||stages[0])} · ${current?.percent||0}% der aktuellen Stufe</p></header><div class="v33-growth-preview">${art}<span class="v33-preview-progress">${s?.done||0} / ${s?.total||0} bestätigt</span></div><div class="v33-five-stages">${stages.map((stage,i)=>button('expedition-stage',`${!s?.progress[i].available?'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>':''}<b>${esc(stage)}</b><small>${s?.progress[i].percent||0}%</small>`,i,'v33-stage-pin '+(i===s?.officialIndex?'is-current':'')+(!s?.progress[i].available?' is-locked':''))).join('')}</div>${button('expedition-map','Karte vollständig öffnen ↗','','v33-link')}</section>`;
 }
 function rangerHero(a,u){const self=(db.rangers||[]).find(p=>same(p.id,a.id)),now=new Date().toISOString();const list=(db.meetings||[]).filter(m=>meetingRelevant(m,'rangers',self)&&m.date>=today()&&!(m.date===today()&&validTime(m.end)&&m.end>(m.start||'00:00')&&M.meetingStart({...m,start:m.end})<=now)).sort((x,y)=>(x.date+' '+(x.start||'')).localeCompare(y.date+' '+(y.start||''))),m=list[0],n=m?days(m.date,today()):null,off=m&&(db.cancellations||[]).some(c=>same(c.meetingId,m.id)&&same(c.personId,a.id)&&c.kind==='rangers'),period=m&&RH.dashboardAbsence?.(m);
  return `<section class="v33-ranger-hero" data-dashboard-section="meeting" ${m?`data-next-kind="ranger" data-next-id="${esc(m.id)}"`:''}><div><span class="section-kicker">Nächstes Ranger-Treffen</span><h1>${m?'Das nächste Abenteuer.':'Noch kein Treffen geplant'}</h1>${m?`<p class="v33-event-date">${esc(longDate(m.date))}${m.start?' · '+esc(m.start)+' Uhr':''}</p><p>${esc(m.place||'Ort wird noch bekannt gegeben')}</p><div class="v33-rsvp"><span>${off?'Du bist abgemeldet.':period?'Für diesen Zeitraum bist du abgemeldet.':'Wir freuen uns auf dich.'}</span><button type="button" class="btn ${off?'alt':''}" data-dashboard-rsvp ${period?'disabled':''}>${off?'Abmeldung zurücknehmen':period?'Abmeldung eingetragen':'Für dieses Treffen abmelden'}</button><div data-v27-dash-cancellation></div></div>`:'<p>Sobald eure Leitung ein Treffen plant, findest du es hier.</p>'}</div><div class="v33-ranger-countdown"><span>${n===0?'Es geht los':n==null?'Ausblick':'Noch'}</span><strong>${n===0?'Heute':n??'—'}</strong>${n>0?'<span>'+ (n===1?'Tag':'Tage')+'</span>':''}<small>${n!=null?'Zeit, den Rucksack bereitzumachen.':'Raum für neue Pläne.'}</small></div>${m?`<details class="v33-meeting-weather"><summary>Wetter am Treffpunkt</summary><div id="nextWeather" data-v33-forecast></div></details>`:''}</section>`;
 }
 function rangerAttendance(a){const s=attendanceStats('rangers',a.id),p=s.percent==null?null:Math.round(s.percent),quote=p==null?'Dein erster Fußabdruck wartet schon.':p>=80?'Du bist gut dabei. Dein Lagerplatz kennt dich schon!':p>=60?'Dein Rucksack freut sich auf die nächste Runde.':p>=40?'Das Lagerfeuer vermisst deine Geschichten.':'Jede Expedition beginnt mit einem Schritt. Komm wieder mit!';return `<section class="v33-ranger-attendance" data-dashboard-section="attendance"><div class="v33-attendance-ring"><svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${p==null?'Noch keine eigene Anwesenheitsquote erfasst':p+' Prozent Anwesenheit'}"><circle cx="60" cy="60" r="51" fill="none" stroke="#dde2cd" stroke-width="5"/><circle cx="60" cy="60" r="51" fill="none" stroke="#486f50" stroke-width="5" pathLength="100" stroke-dasharray="${p||0} 100" stroke-linecap="round" transform="rotate(-90 60 60)"/><text x="60" y="61" text-anchor="middle" dominant-baseline="middle">${p??'—'}${p==null?'':'%'}</text><text class="v33-ring-label" x="60" y="79" text-anchor="middle">ANWESENHEIT</text></svg></div><div><span class="section-kicker">Meine Anwesenheit</span><h2>${quote}</h2><p>${s.total?s.attended+' von '+s.total+' erfassten Treffen dabei · '+(100-p)+'% Abwesenheit':'Die Quote erscheint nach dem ersten erfassten Treffen.'}</p>${textButton('Meine Teilnahme ansehen ↗','data-dashboard-route="abs"')}</div></section>`;}
 function biblePreview(a,data,button){
  const state={bibleReading:data?.bible||{records:{}}},summary=window.RHBibleModel.summary(state,a.id),books=B.books,rows=[books.slice(0,22),books.slice(22,44),books.slice(44)];
  return `<section class="v33-bible-dashboard" data-dashboard-section="bible"><header class="v33-bible-heading"><div><span class="section-kicker">Meine Bibelreise</span><h2>Ein Buch nach dem anderen.</h2><p><b>${summary.books} / 66</b> Bücher · <b>${summary.points} / 240</b> Punkte · <b>${summary.chapters??0} / 1189</b> Kapitel</p></div>${button('bible','Die ganze Bibelbibliothek öffnen ↗','','v33-link')}</header><div class="v33-bible-shelves">${rows.map((row,i)=>`<div class="v33-shelf-scroll" tabindex="0" role="group" aria-label="Bibelbücher ${i*22+1} bis ${Math.min(66,(i+1)*22)}"><div class="v33-book-shelf" data-book-shelf-row="${i}">${row.map(b=>{const r=window.RHBibleModel.record(state,a.id,b.id),cs=window.RHBibleModel.chapterSummary?.(state,a.id,b.id)||{read:r.isRead?b.chapters:0,total:b.chapters,percent:r.isRead?100:0,isRead:r.isRead};return `<div data-dashboard-book="${esc(b.id)}" class="v33-book ${cs.isRead?'is-read':cs.read?'is-partial':''}" style="--chapter-progress:${cs.percent}%"><button type="button" class="v33-book-body" data-kw-action="bible-book" data-kw-value="${esc(b.id)}" title="${esc(b.name)}" aria-label="${esc(b.name)}: ${cs.read} von ${cs.total} Kapiteln, ${cs.isRead?'vollständig gelesen':cs.read?'in Arbeit':'ungelesen'}. Kapitel öffnen"><span>${esc(b.name)}</span><small>${cs.read}/${cs.total}</small></button><label class="v33-book-check"><input type="checkbox" data-bible-complete data-book-id="${esc(b.id)}" data-bible-version="${r.version}" aria-label="${esc(b.name)} vollständig gelesen" ${cs.isRead?'checked':''}><span class="v33-sr-only">Buch vollständig gelesen</span></label></div>`;}).join('')}</div></div>`).join('')}</div><p class="bible-legend">Hell = Noch offen · Lesezeichen = In Arbeit · Dunkel = Gelesen</p></section>`;
 }
 RH.bibleBookcasePreview=ui=>biblePreview(typeof ui.actor==='function'?ui.actor():ui.actor,ui.data,ui.button);
 const rankList=(rows,own)=>`<ol class="v33-ranking">${rows.map(r=>`<li class="${same(r.id,own)?'is-own':''}"><span class="v33-rank">${r.rank?'#'+r.rank:'—'}</span><span><b>${esc(r.alias)}${same(r.id,own)?' · du':''}</b><small>${r.stage?esc(r.stage)+' · '+r.done+'/'+r.total+' bestätigt':r.approved+' Fachwissen-Aufgaben · '+(r.bibleBooks||0)+' Bibelbücher'}</small></span><strong>${r.stage?r.percent+'%':r.points+' P'}</strong></li>`).join('')}</ol>`;
 RH.growthRankingView=(button,a)=>`<p>Die offizielle Stufenreihenfolge zählt zuerst, danach der bestätigte Anteil der aktuellen Stufe und die bestätigten Aufgaben insgesamt. Gleicher Stand bedeutet gleicher Rang.</p>${rankList(growthRows(),a.id)}`;
 function rangerRankings(a,data,button){const growth=growthRows(),ownGrowth=growth.find(r=>same(r.id,a.id)),own=data?.ranking?.find(r=>same(r.id,a.id));return `<section class="v33-rankings" data-dashboard-section="rankings"><article><span class="section-kicker">Wachstumspfad-Rangliste</span><h2>Schritt für Schritt.</h2>${rankList(growth.slice(0,3),a.id)}<p>Dein Platz: <b>${ownGrowth?'#'+ownGrowth.rank:'—'}</b> · ${ownGrowth?.done||0} bestätigte Aufgaben</p>${button('growth-ranking','Alle anzeigen ↗','','v33-link')}</article><article><span class="section-kicker">Gesamtpunkte Fachwissen + Bibelreise</span><h2>Neugier bringt dich weiter.</h2>${data?rankList(data.ranking.slice(0,3),a.id):'<p>Rangliste wird geladen …</p>'}<p>Dein Platz: <b>${own?.rank?'#'+own.rank:'Noch ohne Punkte'}</b> · ${own?.points||0} Punkte</p>${button('ranking','Alle anzeigen ↗','','v33-link')}</article></section>`;}
 function bindLocal(host,u){
  host.querySelectorAll('[data-dashboard-route]').forEach(b=>b.onclick=()=>goV17(b.dataset.dashboardRoute));
  host.querySelectorAll('[data-open-meeting]').forEach(b=>b.onclick=()=>openMeeting(b.dataset.meetingKind,b.dataset.openMeeting));
  host.querySelectorAll('[data-edit-meeting]').forEach(b=>b.onclick=()=>openMeeting(b.dataset.meetingKind,b.dataset.editMeeting,true));
  host.querySelectorAll('[data-todo-open]').forEach(b=>b.onclick=()=>{const t=ownTasks().find(t=>t.key===b.dataset.todoOpen);if(!t)return;t.meetingId!=null?openMeeting(t.kind==='leader'?'leader':'ranger',t.meetingId):goV17('tasks');});
  host.querySelectorAll('[data-todo-toggle]').forEach(input=>input.onchange=async()=>{const desired=input.checked;input.disabled=true;const saved=await RH.toggleDashboardTask(input.dataset.todoToggle,desired);if(!saved&&input.isConnected)input.checked=!desired;if(input.isConnected)input.disabled=false;});
  host.querySelectorAll('[data-dashboard-profile]').forEach(b=>b.onclick=()=>{const a=actor(),p=db.rangers.find(p=>same(p.id,b.dataset.dashboardProfile));if(a?.leader&&p&&v24CanEditRanger(p.id))v24RangerProfile(p.id);});
  host.querySelectorAll('[data-stat-sort]').forEach(b=>b.onclick=()=>{const field=b.dataset.statSort;sortState={...sortState,field,direction:sortState.field===field?-sortState.direction:field==='name'?1:-1};RH.renderDashboardV33({...u,force:true});});
  host.querySelector('[data-stat-sort-select]')?.addEventListener('change',event=>{const [field,value]=event.target.value.split(':');if(!['name','fachwissenPoints','biblePoints','points','rank','bibleChapterPercent','bibleBooks'].includes(field))return;sortState={...sortState,field,direction:Number(value)===1?1:-1};RH.renderDashboardV33({...u,force:true});host.querySelector('[data-stat-sort-select]')?.focus({preventScroll:true});});
  const nextRsvp=host.querySelector('[data-dashboard-rsvp]');if(nextRsvp)nextRsvp.onclick=()=>{const m=db.meetings.find(m=>same(m.id,nextRsvp.closest('[data-next-id]').dataset.nextId));if(m)RH.showDashboardCancellation(m.id);};
  const weather=host.querySelector('.v33-meeting-weather');if(weather)weather.ontoggle=()=>{if(!weather.open||weather.dataset.loaded)return;weather.dataset.loaded='true';const m=db.meetings.find(m=>same(m.id,weather.closest('[data-next-id]').dataset.nextId));if(m)loadMeetingWeather(m,weather.querySelector('[data-v33-forecast]'));};
  u.bind?.(host);if(u.command)RH.bindBibleChapters?.(host,{command:u.command});
 }
 RH.renderDashboardV33=u=>{
  const a=u.actor(),host=RH.content();if(!a||view!=='dash')return;lastUI=u;capture(host,a);
  const counts=growthRows(),signature=JSON.stringify([a.key,u.data?.revision,u.data?.globalRevision,u.data?.catalog?.revision,u.data?.wisdom?.revision,db.meetings.map(m=>[m.id,m.date,m.start,m.end,m.place,m.theme,m.cancelled,m.archived,m.status,m.teamIds,m.teams,m.rangerIds,m.leaderIds,m.action,m.actions,m.impulse,m.nature,m.food,m.tasks,m.preparationTasks,m.followUpTasks,m.attendance]),db.leaderMeetings,db.cancellations,db.absences,counts,[nextEvents(a).map(e=>[e.kind,e.meeting.id]),db.meetings.filter(m=>m.date===today()).map(m=>[m.id,validTime(m.end)&&M.meetingStart({...m,start:m.end})<=new Date().toISOString()])],(db.rangers||[]).map(p=>[p.id,p.name,p.birthday,p.active,p.archived]),(db.leaders||[]).map(p=>[p.id,p.name,p.birthday,p.active,p.archived]),today(),u.error,sortState.field,sortState.direction]);
  if(!u.force&&host.querySelector('.v33-dashboard')?.dataset.signature===signature)return;
  if(host.querySelector('[data-v27-dash-cancellation] form'))return;
  const head=`<header class="v33-dash-header"><span>STAMM ${esc(v24StammName())}</span><span>${a.leader?'Leiter-Cockpit':'Dashboard'}</span><div data-v33-weather-slot></div></header>`;
  const content=a.leader?leaderHero(a,u)+tasksBlock(a)+leaderAttendance(a)+leaderGrowth()+leaderStatistics(a,u.data)+birthdays(a):rangerHero(a,u)+rangerAttendance(a)+`<div class="v33-dual-maps" data-dashboard-section="maps">${growthPreview(a,u.button)}<section class="v33-map-section"><header><span class="section-kicker">Fachwissen-Challenges</span><h2>Wissen entdecken.</h2><p>Wähle dein nächstes Gebiet.</p></header><div class="v33-knowledge-preview">${u.map(true)}</div>${u.button('map','Karte vollständig öffnen ↗','','v33-link')}</section></div>`+biblePreview(a,u.data,u.button)+rangerRankings(a,u.data,u.button)+birthdays(a);
  host.innerHTML=`<div class="v33-dashboard v32-dashboard ${a.leader?'is-leader':'is-ranger'}" data-knowledge-mode="${esc(u.data?.mode||'loading')}" data-signature="${esc(signature)}">${head}<div class="v33-dashboard-body">${content}</div>${u.error?'<p role="alert">'+esc(u.error)+'</p>':''}</div>`;
  if(cache.weather)host.querySelector('[data-v33-weather-slot]').append(cache.weather);bindLocal(host,u);
 };
 RH.renderDashboardV32=RH.renderDashboardV33;
 // Agenda edits retain the existing task identities and completion fields.
 const previousActRow=actRow;
 actRow=function(item={}){return previousActRow(item).replace('<div class="actionrow item">','<div class="actionrow item"><input type="hidden" name="rh-action-id" value="'+esc(item.id??'')+'">');};
 saveLeader=function(event,id){
  event.preventDefault();if(!isLeader())return;
  const form=new FormData(event.target),index=id?(db.leaderMeetings||[]).findIndex(m=>same(m.id,id)):-1;
  if(id&&index<0)return;
  const old=index>=0?db.leaderMeetings[index]:null,ids=form.getAll('rh-action-id'),names=form.getAll('at'),leaders=form.getAll('al'),due=form.getAll('ad');
  const actions=names.map((text,i)=>{const existing=(old?.actions||[]).find(a=>same(a.id,ids[i]));return {...(existing||{id:RH.uid(),done:false}),text,leaderId:Number(leaders[i])||null,due:due[i]||''};}).filter(a=>a.text.trim());
  const next={...(old||{id:Date.now()}),date:form.get('date'),place:form.get('place'),start:form.get('start'),end:form.get('end'),info:form.get('info'),actions};
  if(index>=0)db.leaderMeetings[index]=next;else db.leaderMeetings.push(next);
  try{v24Persist();closeM();render();}catch(error){if(index>=0)db.leaderMeetings[index]=old;else db.leaderMeetings.pop();notify('Nicht gespeichert. Die bisherigen Aufgaben bleiben erhalten.');}
 };
 // The existing task route displays the same live source references and write handlers as the cockpit.
 const originalTasks=tasks;
 tasks=function(...args){const a=actor();if(!a?.leader)return originalTasks.apply(this,args);const host=RH.content();host.innerHTML=`<div class="v33-task-page">${tasksBlock(a,true)}</div>`;bindLocal(host,lastUI||{});};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&view==='dash'&&lastUI&&actor())RH.renderDashboardV33(lastUI);});
})();
