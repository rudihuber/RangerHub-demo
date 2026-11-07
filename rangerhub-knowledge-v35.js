/* In-place Fachwissen evolution: existing map, identities, calendar and app shell. */
(() => {
 'use strict';
 const RH=window.RangerHub,M=window.RHKnowledgeModel,K=window.RHKnowledgeCatalogV30,same=(a,b)=>String(a)===String(b);
 let C=K.effective(),data=null,transport=RH.createLocalKnowledgeTransport(),error='',generation=0,busy=false,dialog=null,origin=null,route={kind:'map'},mainToken='',sheetToken='',context=null,lastView=null,returningGrowth=false;
 let entry='knowledge',depth=0,popping=false,editorFilters={kind:'categories',scope:'local',query:''},examFilters={status:'registered'},syncRunning=false;
 const calendarBaselines=new Map(),unsynced=new Set(),pendingCommands=new Map();let unsubscribe,undoBible=null,undoTimer;const readingFilters={status:'all',query:''},readingPositions=new Map();
 const actor=()=>{try{return RH.knowledgeActor();}catch{return null;}},host=()=>RH.content(),key=()=>actor()?.key;
 const pretty=v=>v?new Date(v).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Berlin'}):'—';
 const task=id=>C.tasks.find(t=>t.id===id),topic=id=>C.topics.find(t=>t.id===id),person=id=>data?.people.find(p=>same(p.id,id));
 const title=t=>t?.title||String(t?.text||t?.originalText||'Fachwissen').replace(/^\d+\.\s*/,'').split(/(?<=[.!?])\s/)[0].replace(/\s*\(\d+\s*Punkte?\)/g,'').slice(0,160);
 const progress=(t,rid=actor()?.id)=>data?.progress[`${rid}:${t.id}`]||{status:'new'},done=ts=>ts.filter(t=>progress(t).status==='approved').length;
 const pointsLabel=t=>t.points==null?(t.pointOptions?.length?'Variante 8 P · sonst ungeklärt':'Punkte ungeklärt'):t.points+' P';
 const button=(action,label,value='',cls='btn alt')=>`<button type="button" class="${cls}" data-kw-action="${action}" data-kw-value="${esc(value)}">${label}</button>`;
 const compass='<svg class="rh-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m16 7-2 7-7 3 3-7z"/></svg>';
 const mode=()=>`<p class="kw-mode">${transport.mode==='demo'?'Demo / nur lokale Daten · Anmeldungen und Rangliste gelten für dieses Browserprofil.':'Zentrale Prüfungen und Rangliste · persönlich angemeldet'}</p>`;
 const ui=()=>({data,C,actor,button,pretty,progress,pointsLabel,title,person,step:route,editorFilters,examFilters,readingFilters});
 const wisdom=()=>RH.wisdomViews(ui());
 const bible=()=>RH.bibleViews(ui()),exams=()=>RH.knowledgeExamViews(ui()),editor=()=>RH.knowledgeEditorViews(ui()),canEdit=()=>data?.rights.local;
 const cleanURL=()=>location.pathname+location.search;
 const hash=r=>r.kind.startsWith('bible')?'#bibelreise/'+r.kind+(r.id?'/'+encodeURIComponent(r.id):'')+(r.rangerId?'/'+encodeURIComponent(r.rangerId):''):r.kind.startsWith('wisdom')?'#ranger-bibliothek/'+r.kind+(r.kind==='wisdom-edit'?'/'+r.entityKind+'/'+encodeURIComponent(r.id||'')+'/'+(r.scope||'local'):r.kind==='wisdom-manage'?'/'+(r.scope||'local'):(r.id?'/'+encodeURIComponent(r.id):'')+(r.hotspot?'/'+encodeURIComponent(r.hotspot):'')):r.kind==='expedition-map'?'#expedition':r.kind==='growth-ranking'?'#wachstum-rangliste':'#fw/'+r.kind+(r.kind==='edit'?'/'+r.entityKind+'/'+encodeURIComponent(r.id||'')+'/'+(r.scope||'local'):r.id?'/'+encodeURIComponent(r.id):'');
 function parseHash(){try{const p=location.hash.slice(1).split('/').map(decodeURIComponent);if(p[0]==='expedition')return {kind:'expedition-map'};if(p[0]==='wachstum-rangliste')return {kind:'growth-ranking'};if(['ranger-wissen','ranger-bibliothek'].includes(p[0]))return p[1]==='wisdom-edit'?{kind:p[1],entityKind:p[2],id:p[3]||'',scope:p[4]||'local'}:p[1]==='wisdom-manage'?{kind:p[1],scope:p[2]||'local'}:{kind:p[1]||'wisdom',id:p[2],hotspot:p[3]};if(p[0]==='bibelreise')return {kind:p[1]||'bible',id:p[2],rangerId:p[3]};if(p[0]!=='fw')return null;return p[1]==='edit'?{kind:'edit',entityKind:p[2],id:p[3]||'',scope:p[4]||'local'}:{kind:p[1]||'map',id:p[2],...(p[1]?.startsWith('bible')&&p[3]?{rangerId:p[3]}:{})};}catch{return {kind:'map'};}}
 const dirty=()=>!!dialog?.querySelector('form[data-dirty=true]')||!!host()?.querySelector('[data-rw-form][data-dirty=true]');
 function closeSheet(){dialog?.close();dialog?.remove();dialog=null;sheetToken='';if(origin?.isConnected)origin.focus({preventScroll:true});}
 function parent(r=route){
  if(r.kind==='wisdom-edit')return {kind:'wisdom-manage',scope:r.scope||wisdom().settings.scope};if(r.kind==='wisdom-module')return r.hotspot?{kind:'wisdom-module',id:r.id}:{kind:'wisdom-group',id:data?.wisdom.modules.find(m=>m.id===r.id)?.groupId};if(r.kind==='wisdom-group'||r.kind==='wisdom-manage')return {kind:'wisdom'};
  if(r.kind==='wisdom'||r.kind==='expedition-map'||r.kind==='growth-ranking')return {kind:'dashboard-return'};
  if(r.kind==='bible-book')return {kind:'bible-shelf',id:window.RHBibleModel.book(r.id)?.testament,rangerId:r.rangerId};if(r.kind==='bible-shelf')return {kind:'bible',rangerId:r.rangerId};if(r.kind==='bible')return {kind:'dashboard-return'};
  if(r.kind==='task')return {kind:'topic',id:task(r.id)?.topicId};if(r.kind==='topic')return {kind:'region',id:topic(r.id)?.mapRegionId};
  if(r.kind==='register-confirm')return {kind:'task',id:r.id};if(r.kind==='reschedule')return {kind:'exam-detail',id:r.id};
  if(['grade-confirm','correct','exam-detail'].includes(r.kind))return {kind:actor()?.leader?'exams':'own-exams'};if(r.kind==='edit')return {kind:'manage'};return {kind:'map'};
 }
 function navigate(next,replace=false){
  if(actor()&&!RH.navigationRouteAllowedV33('knowledge',next,actor(),data)){RH.v28Notify('Dieser Bereich ist für deine Rolle nicht freigegeben.');return;}
  if(next.kind==='dashboard-return'){closeSheet();history.replaceState(null,'',cleanURL());return originalGo('dash');}
  if(next.kind==='expedition-map'&&!actor()?.leader&&!RH.hasFullExpedition?.())originalGo('dash');
  if(!actor()||dirty()&&!confirm('Ungespeicherte redaktionelle Änderungen verwerfen?'))return;
  const beforeY=scrollY;if(view==='knowledge'&&(route.kind.startsWith('bible')||route.kind.startsWith('wisdom'))){readingPositions.set(JSON.stringify(route),beforeY);history.replaceState({...history.state,knowledgeY:beforeY},'',location.href);}
  if(view!=='knowledge'){entry=view;depth=0;history.replaceState({rhKnowledgeAnchor:true,context:key(),view,y:scrollY},'',cleanURL());}
  route=next;if(!popping){if(!replace)depth++;history[replace?'replaceState':'pushState']({rhKnowledge:true,context:key(),route,depth,entry},'',hash(route));}
  closeSheet();mainToken='';if(view!=='knowledge')originalGo('knowledge');else renderPage(true);if(next.kind==='wisdom-module'&&next.hotspot)requestAnimationFrame(()=>{const detail=host().querySelector('[data-wisdom-detail]');detail?.focus({preventScroll:true});if(matchMedia('(max-width:767px)').matches)detail?.scrollIntoView({block:'start',behavior:'instant'});});if(next.kind.startsWith('bible')||next.kind.startsWith('wisdom')&&!next.hotspot)requestAnimationFrame(()=>scrollTo({top:next.kind==='bible-book'?beforeY:readingPositions.get(JSON.stringify(next))||0,behavior:'instant'}));else scrollTo({top:0,behavior:'instant'});
 }
 function back(){
  if(dirty()&&!confirm('Ungespeicherte redaktionelle Änderungen verwerfen?'))return;
  if(history.state?.rhKnowledge&&history.state.context===key()&&depth>0)return history.back();
  if(route.kind==='map'){closeSheet();history.replaceState(null,'',cleanURL());return originalGo(entry==='knowledge'?'dash':entry);}navigate(parent(),true);
 }
 window.addEventListener('popstate',e=>{
  if(!actor())return;if(dirty()&&!confirm('Ungespeicherte redaktionelle Änderungen verwerfen?'))return history.forward();
  closeSheet();popping=true;
  try{if(e.state?.context&&e.state.context!==key()){history.replaceState(null,'',cleanURL());route={kind:'map'};depth=0;return originalGo('dash');}
   if(e.state?.rhKnowledge){route=e.state.route;depth=e.state.depth;entry=e.state.entry||'knowledge';mainToken='';originalGo('knowledge');}
   else if(e.state?.rhKnowledgeAnchor){route={kind:'map'};depth=0;mainToken='';originalGo(e.state.view||'dash');requestAnimationFrame(()=>scrollTo({top:e.state.y||0,behavior:'instant'}));}
   else {route=parseHash()||{kind:'map'};depth=0;mainToken='';if(parseHash())originalGo('knowledge');else if(view==='knowledge')originalGo('dash');}
  }finally{popping=false;if(route.kind.startsWith('bible')&&location.hash.startsWith('#fw/bible')||route.kind.startsWith('wisdom')&&location.hash.startsWith('#ranger-wissen'))history.replaceState(history.state,'',hash(route));if(route.kind.startsWith('bible')||route.kind.startsWith('wisdom'))requestAnimationFrame(()=>scrollTo({top:e.state?.knowledgeY??readingPositions.get(JSON.stringify(route))??0,behavior:'instant'}));}
 });
 function menus(){if(actor())RH.mountNavigationV33({actor:actor(),data,route,view,navigate,openLegacy:next=>goV17(next)});}
 function score(){
  const a=actor(),own=data.ranking.find(r=>same(r.id,a.id)),next=data.nextMeeting,n=next?M.used({exams:data.exams},a.id,next.id):0;
  return `<div class="kw-score-strip"><div><span>${a.leader?'Gesamtpunkte im Stamm':'Deine Gesamtpunkte'}</span><strong>${a.leader?data.totalPoints:own?.points||0}</strong></div><div><span>${a.leader?'Offene Prüfungen':'Deine Platzierung'}</span><strong>${a.leader?data.pending:own?.rank?'#'+own.rank:'—'}</strong></div><div><span>Bestandene Aufgaben</span><strong>${a.leader?data.ranking.reduce((n,r)=>n+r.approved,0):own?.approved||0}</strong></div><div><span>${a.leader?'Berechtigte Ranger':'Prüfungen fürs nächste Treffen'}</span><strong>${a.leader?data.people.length:n+' / 3'}</strong></div></div>`;
 }
 function podium(){const rows=data.ranking.filter(r=>r.rank).slice(0,3);return rows.length?`<ol class="kw-podium kw-podium-v30">${rows.map(r=>`<li class="podium-rank-${r.rank}"><span class="kw-rank">${r.rank.toString().padStart(2,'0')}</span><span>${esc(r.alias)}<small>${r.approved} Aufgaben bestanden · ${r.bibleBooks||0} Bücher gelesen</small></span><strong>${r.points}<small>Punkte</small></strong></li>`).join('')}</ol>`:'<p class="kw-empty-inline">Eure Rangliste wächst mit bestätigten Fachwissen-Aufgaben und vollständig gelesenen Bibelbüchern. Alle starten ohne erfundene Punkte.</p>';}
 function ranking(){
  const own=data.ranking.find(r=>same(r.id,actor().id));return `${!actor().leader?`<div class="kw-personal-rank"><span>Dein Platz</span><strong>${own?.rank?'#'+own.rank:'—'}</strong><span>${own?.points||0} Gesamtpunkte${own?.gap!=null?' · '+own.gap+' Punkte bis zum nächsthöheren Platz':''}</span></div>`:''}${podium()}<p>Gleiche Punkte bedeuten denselben Platz. Ohne Fachwissen- oder Bibellesepunkte gibt es noch keine Rangplatzierung.</p><ol class="kw-ranking">${data.ranking.map(r=>`<li class="${same(r.id,actor().id)?'is-own':''}"><strong>${r.rank?'#'+r.rank:'—'}</strong><span>${esc(r.alias)}${same(r.id,actor().id)?' · du':''}<small>${r.approved} Aufgaben bestanden · ${r.bibleBooks||0} Bücher gelesen</small></span><b>${r.points}<small>Punkte</small></b>${actor().leader?button('ranger-audit','Punkteverlauf',r.id):''}</li>`).join('')}</ol>`;
 }
 function map(preview=false){
  const positions={wildnis:[20,44,26,33],entdecker:[50,preview?28:32,68,17],rettung:[81,43,23,57],werkstatt:[75,73,69,73],gemeinschaft:[31,76,31,88],arena:[87,91,77,94]},regions=C.regions.filter(r=>r.isActive&&!r.archived),custom=regions.some(r=>!positions[r.id]),customHeight=Math.max(460,Math.ceil(regions.length/3)*160+80),customMobileHeight=Math.max(780,Math.ceil(regions.length/2)*170+100);
  return `<div class="kw-map ${preview?'is-preview':''} ${custom?'is-custom':''}" style="--kw-custom-height:${customHeight}px;--kw-custom-mobile-height:${customMobileHeight}px" role="group" aria-label="Interaktive Fachwissen-Oberwelt">${preview?RH.knowledgeMapScene(false).replace('<svg ','<svg preserveAspectRatio="none" '):RH.knowledgeMapScene(false)}${preview?RH.knowledgeMapScene(true).replace('<svg ','<svg preserveAspectRatio="none" '):RH.knowledgeMapScene(true)}<span class="kw-map-note">WÄHLE DEIN NÄCHSTES GEBIET</span>${regions.map((r,i)=>{const p=custom?[18+i%3*32,(90+Math.floor(i/3)*160)/customHeight*100,26+i%2*48,(90+Math.floor(i/2)*170)/customMobileHeight*100]:positions[r.id],ts=C.tasks.filter(t=>t.mapRegionId===r.id&&t.visible);return `<button class="kw-map-pin kw-pin-${r.id==='arena'?'arena':'region'}" data-kw-action="${r.id==='arena'?'ranking':'region'}" data-kw-value="${esc(r.id)}" style="--dx:${p[0]}%;--dy:${p[1]}%;--mx:${p[2]}%;--my:${p[3]}%" aria-label="${esc(r.title)} öffnen"><span class="kw-pin-number">${String(i+1).padStart(2,'0')}</span><b>${esc(r.title)}</b><small data-kw-region-count="${esc(r.id)}">${r.id==='arena'?'Platzierung & Punkte':done(ts)+'/'+ts.length+' bestanden'}</small></button>`;}).join('')}</div>`;
 }
 function updateCounts(scope=host()){
  scope.querySelectorAll('[data-kw-region-count]').forEach(el=>{const ts=C.tasks.filter(t=>t.mapRegionId===el.dataset.kwRegionCount&&t.visible);el.textContent=el.dataset.kwRegionCount==='arena'?'Platzierung & Punkte':done(ts)+'/'+ts.length+' bestanden';});
  scope.querySelectorAll('.kw-location').forEach(el=>{const l=C.locations.find(l=>l.id===el.dataset.kwValue),ts=C.tasks.filter(t=>t.visible&&C.topics.some(x=>x.id===t.topicId&&x.locationId===l?.id));el.querySelector('.kw-location-progress').textContent=done(ts)+'/'+ts.length+' bestanden';});
 }
 function worldFor(r){if(r.kind==='region')return r.id;if(r.kind==='location-topics')return C.locations.find(l=>l.id===r.id)?.regionId;if(r.kind==='topic')return topic(r.id)?.mapRegionId;if(['task','register-confirm'].includes(r.kind))return task(r.id)?.mapRegionId;if(['exam-detail','reschedule'].includes(r.kind))return task(data.exams.find(e=>e.id===r.id)?.taskId)?.mapRegionId;return null;}
 function renderPage(force=false){
  if(!actor())return;if(!RH.navigationRouteAllowedV33('knowledge',route,actor(),data)){closeSheet();route={kind:'map'};history.replaceState(null,'',cleanURL());return originalGo('dash');}if(route.kind.startsWith('wisdom')||['expedition-map','growth-ranking'].includes(route.kind))return renderExtra(force);const wid=data?worldFor(route):null,world=C.regions.find(r=>r.id===wid),main=route.kind==='bible'||route.kind==='bible-shelf'?route.kind:route.kind==='bible-book'?'bible-shelf':world?'region':['grade-confirm','correct'].includes(route.kind)?'exams':['exams','manage','ranking','own-exams','ranger-audit'].includes(route.kind)?route.kind:'map';
  const token=key()+':'+main+':'+(wid||(route.kind==='bible-book'?window.RHBibleModel.book(route.id)?.testament:route.id)||'')+':'+(route.rangerId||'')+':'+C.revision+':'+(data?'ready':'loading')+':'+error+(['bible','bible-shelf','exams','manage','ranking','own-exams','ranger-audit'].includes(main)?':'+data?.revision+':'+JSON.stringify(main.startsWith('bible')?readingFilters:main==='exams'?examFilters:editorFilters):'');
  if(!force&&mainToken===token&&host().querySelector('.kw-page')){updateCounts();host().querySelectorAll('[data-kw-score]').forEach(el=>el.innerHTML=score());showSheet();return;}mainToken=token;
  const heading=world?.title||({bible:'Deine Bibelbibliothek.','bible-shelf':(route.kind==='bible-book'?window.RHBibleModel.book(route.id)?.testament:route.id)==='NT'?'Neues Testament.':'Altes Testament.',exams:'Fachwissen-Prüfungen',manage:'Fachwissen verwalten',ranking:'Ranger-Rangliste','own-exams':'Deine Prüfungsanmeldungen','ranger-audit':'Punkteverlauf'})[main]||'Deine Ranger Expedition.';
  let body='';
  if(error)body=`<div class="kw-empty" role="alert"><h2>Daten gerade nicht verfügbar</h2><p>${esc(error)}</p>${button('reload','Erneut versuchen')}</div>`;
  else if(!data)body='<p role="status">Deine Rangerwelt wird geladen …</p>';
  else if(main==='bible')body=bible().library();
  else if(main==='bible-shelf')body=bible().shelf();
  else if(world){const locations=C.locations.filter(l=>l.regionId===wid&&l.visible).map(l=>l.id==='place-A-08'?{...l,title:'Bibelwissen'}:l);body=`<div class="kw-world-toolbar">${canEdit()?button('edit','Unterwelt bearbeiten','regions|'+world.id)+button('manage-locations','Orte verwalten',world.id):''}</div>${RH.knowledgeSubworld(world,locations,C.topics,C.tasks,progress)}${locations.length?'':'<p>Noch keine Themenorte in dieser Unterwelt.</p>'}`;}
  else if(main==='exams')body=actor().leader?exams().center():'<p>Diese Prüfungszentrale ist für die Leitung bestimmt.</p>';
  else if(main==='manage')body=canEdit()?editor().management():'<p>Keine redaktionellen Rechte für diesen Bereich.</p>';
  else if(main==='ranking')body=ranking();
  else if(main==='own-exams')body=actor().leader?exams().center():exams().own();
  else if(main==='ranger-audit')body=actor().leader?data.ledger.filter(e=>same(e.rangerId,route.id)).map(e=>`<article class="kw-ledger"><h3>${e.points>0?'+':''}${e.points} Punkte</h3><p>${esc(e.titleAtReview||title(task(e.taskId)))}</p><small>${pretty(e.at)} · Profil ${esc(e.by)}</small>${e.reason?'<p>'+esc(e.reason)+'</p>':''}${data.rights.correct&&e.type==='credit'&&!data.ledger.some(r=>r.reversalOf===e.id)?button('legacy-reverse','Gutschrift berichtigen',e.id):''}</article>`).join(''):'<p>Diese Ansicht gehört zur Leitung.</p>';
  else body=`<div data-kw-score>${score()}</div>${map()}<p class="bible-maxima">Aktuell bepunkteter Katalog: ${data.maximum.fachwissen} Fachwissen + ${data.maximum.bible} Bibellesen = ${data.maximum.total} Punkte${data.maximum.unresolved?' · '+data.maximum.unresolved+' weitere Aufgaben mit noch ungeklärtem Punktwert':''}.</p><div class="kw-home-actions">${button(actor().leader?'exams':'own-exams',actor().leader?'Fachwissen-Prüfungen':'Deine Prüfungsanmeldungen','','btn')}${button('ranking','Ranger-Rangliste')}${canEdit()?button('manage','Fachwissen verwalten'):''}</div>`;
  host().innerHTML=`<section class="kw-page kw-v30-page"><nav class="kw-breadcrumb" aria-label="Fachwissen-Navigation">${button('back',RH.icon('back')+' Zurück')}${main.startsWith('bible')?button('bible','Bibelreise'):world?button('map','Oberwelt'):'<span>Fachwissen</span>'}</nav><header class="kw-heading"><div><span class="section-kicker">${main.startsWith('bible')?'Bibelreise':world?'Deine Unterwelt':'Fachwissen'}</span><h1>${esc(heading)}</h1>${world?'<p>Wähle einen Ort und entdecke das Thema dahinter.</p>':''}</div></header>${mode()}${body}</section>`;bind(host());showSheet();
 }
 function sheet(name,body){
  if(!dialog){origin=document.activeElement;dialog=document.createElement('dialog');dialog.id='rh-knowledge-sheet';dialog.className='kw-sheet';dialog.setAttribute('aria-labelledby','kw-sheet-title');document.body.append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();back();});dialog.addEventListener('click',e=>{if(e.target===dialog)back();});dialog.showModal();}
  dialog.innerHTML=`<div class="kw-sheet-header">${button('back',RH.icon('back')+' Zurück')}<button class="kw-close" data-kw-action="close" aria-label="Fachwissen-Details schließen">×</button></div><div class="kw-sheet-content"><span class="section-kicker">${route.kind.startsWith('bible')?'Bibelreise':'Fachwissen · Dein Logbuch'}</span><h2 id="kw-sheet-title" tabindex="-1">${esc(name)}</h2>${mode()}${body}<p data-kw-error role="alert"></p></div>`;bind(dialog);dialog.querySelector('#kw-sheet-title').focus({preventScroll:true});
 }
 function rows(ts){return ts.map(t=>`<button class="kw-task-row" data-kw-action="task" data-kw-value="${esc(t.id)}"><span><b>${esc(title(t))}</b><small>${esc(exams().labels[progress(t).status]||'Noch nicht angemeldet')}</small></span><span class="kw-task-points">${esc(pointsLabel(t))}<small>${progress(t).status==='approved'?'✓':'→'}</small></span></button>`).join('');}
 function showSheet(force=false){
  if(!data||view!=='knowledge')return;
  if(!['topic','task','location-topics','register-confirm','exam-detail','reschedule','grade-confirm','correct','edit','bible-book'].includes(route.kind)){closeSheet();return;}
  const token=JSON.stringify(route)+':'+data.revision+':'+C.revision;if(!force&&sheetToken===token&&dialog||dirty()&&!force)return;sheetToken=token;
  if(route.kind==='bible-book'){const b=window.RHBibleModel.book(route.id);return sheet(b?.name||'Buch nicht verfügbar',b?bible().detail(b):'<p>Bitte wähle ein Buch aus dem Bibelregal.</p>');}
  if(route.kind==='topic'){const t=topic(route.id);if(!t)return sheet('Thema nicht verfügbar','<p>Bitte einen anderen Themenort auswählen.</p>');const ts=C.tasks.filter(x=>x.topicId===t.id&&x.visible),earned=data.ledger.filter(e=>same(e.rangerId,actor().id)&&ts.some(t=>t.id===e.taskId)).reduce((n,e)=>n+e.points,0);
   sheet(t.title,`<p>${esc(t.description||'Wähle eine Aufgabe und bereite dich auf die persönliche Prüfung vor.')}</p>${t.notes?.map(n=>`<p class="kw-note">${esc(n.text)}</p>`).join('')||''}<p>${done(ts)}/${ts.length} bestanden · ${earned} Punkte bestätigt</p>${canEdit()?`<div class="row">${button('edit','Thema bearbeiten','topics|'+t.id)}${button('edit','Ort bearbeiten','locations|'+t.locationId)}${button('create-task','+ Aufgabe',t.id)}</div>`:''}<label>Aufgaben filtern<select data-kw-task-filter><option value="all">Alle Aufgaben</option><option value="registered">Angemeldet</option><option value="approved">Bestanden</option><option value="new">Noch nicht angemeldet</option><option value="failed">Erneut möglich</option></select></label><div data-kw-task-list>${rows(ts)||'<p>Noch keine sichtbaren Aufgaben in diesem Thema.</p>'}</div>`);
  }else if(route.kind==='task'){const t=task(route.id);sheet(topic(t?.topicId)?.title||t?.sourceTopic||'Aufgabe',t&&(t.visible||canEdit())?exams().task(t):'<p>Diese Aufgabe ist derzeit nicht zur Anmeldung freigegeben.</p>');}
  else if(route.kind==='location-topics'){const l=C.locations.find(l=>l.id===route.id);sheet(l?.title||'Themenort',C.topics.filter(t=>t.locationId===route.id&&t.visible).map(t=>button('topic',esc(t.title),t.id,'kw-topic-row')).join('')||`<p>Diesem Ort ist noch kein Thema zugeordnet.</p>${canEdit()?button('create-topic','Thema hinzufügen',route.id):''}`);}
  else if(route.kind==='register-confirm')sheet('Persönliche Prüfung anmelden',exams().register(task(route.id)));
  else if(route.kind==='edit')sheet(route.id?'Inhalt bearbeiten':'Inhalt hinzufügen',canEdit()?editor().editor():'<p>Keine Bearbeitungsrechte.</p>');
  else {const e=data.exams.find(e=>e.id===route.id);if(!e)return sheet('Anmeldung nicht verfügbar','<p>Diese Anmeldung gehört nicht zu deinem aktuellen Profil oder Stamm.</p>');
   if(route.kind==='exam-detail')sheet('Deine Prüfungsanmeldung',exams().detail(e));if(route.kind==='reschedule')sheet('Ersatztermin auswählen',exams().register(task(e.taskId),e));
   if(route.kind==='grade-confirm')sheet('Prüfung bewerten',exams().grade(e,route.result));if(route.kind==='correct')sheet('Ergebnis berichtigen',data.rights.correct?exams().grade(e,e.status,true):'<p>Nur Stammleitung oder Admin dürfen berichtigen.</p>');
  }
 }
 function renderExtra(force=false){
  if(!force&&dirty()&&route.kind==='wisdom-edit')return;
  const token=key()+':'+JSON.stringify(route)+':'+data?.wisdom?.revision+':'+data?.revision+':'+error;if(!force&&token===mainToken&&host().querySelector('.v32-extra'))return;mainToken=token;closeSheet();
  const isWisdom=route.kind.startsWith('wisdom'),w=data?.wisdom?wisdom():null;
  let heading=isWisdom?w?.heading||'Ranger-Bibliothek':route.kind==='growth-ranking'?'Wachstumspfad-Rangliste':'Deine Expedition.',body='';
  if(error)body='<p role="alert">'+esc(error)+'</p>'+button('reload','Erneut versuchen');else if(!data)body='<p role="status">Inhalte werden geladen …</p>';else if(isWisdom){if(!w)body='<p>Der zentrale Dienst benötigt das Bibliotheks-Update.</p>';else body=route.kind==='wisdom-group'?w.group():route.kind==='wisdom-module'?w.module():route.kind==='wisdom-manage'?w.management():route.kind==='wisdom-edit'?w.form():w.world();}else if(route.kind==='growth-ranking')body=RH.growthRankingView(button,actor());else if(actor().leader)body='<p>Die persönliche Expeditionskarte gehört zum Rangerprofil.</p>';
  host().innerHTML=`<section class="v32-extra ${isWisdom?'rw-page':'kw-page'}"><nav class="kw-breadcrumb" aria-label="Bereichsnavigation">${button('back',RH.icon('back')+' Zurück')}${isWisdom&&route.kind!=='wisdom'?button('wisdom','Wissenswelt'):''}</nav><header class="kw-heading"><div><span class="section-kicker">${isWisdom?'Ranger-Bibliothek · Euer Logbuch':'Dein Wachstumspfad'}</span><h1>${esc(heading)}</h1></div></header>${body}</section>`;
  if(route.kind==='expedition-map'&&!actor().leader)RH.mountFullExpedition(host().querySelector('.v32-extra'));bind(host());
 }
 function dashboard(){if(view==='dash')RH.renderDashboardV33({data,actor,button,map,bind,error,command});}
 const priorDash=dash;dash=function(...args){const result=priorDash.apply(this,args);if(actor())dashboard();return result;};
 async function load(){const a=actor();if(!a)return false;const ticket=++generation;try{const next=await transport.load();if(ticket!==generation||actor()?.key!==a.key)return false;if(!next.wisdom||!next.catalog||!next.bible||next.bible.chapterSchema!==1||!next.maximum||!Array.isArray(next.exams)||!Array.isArray(next.ranking))throw Error('Der Dienst unterstützt die neue Bibellese-Funktion noch nicht. Bitte den zentralen Dienst aktualisieren.');RH.acceptMembershipSnapshotV35?.(next);data=next;C=next.catalog;error='';observeCalendar(next);return true;}catch(e){if(ticket===generation&&actor()?.key===a.key)error=e.message;return false;}}
 function profileScore(id){
  const hero=host().querySelector('.v24-rangerHero');if(!hero||!data)return;const row=data.ranking.find(r=>same(r.id,id));if(!row)return;
  let info=hero.querySelector('[data-kw-profile]');if(!info){info=document.createElement('div');info.className='kw-profile-score';info.dataset.kwProfile=id;hero.querySelector('div').append(info);}
  info.innerHTML=`<span>Fachwissen</span><strong>${row.points} Punkte</strong><small>${row.rank?'Platz '+row.rank:'Noch ohne Platzierung'} · ${row.approved} Aufgaben bestanden · ${row.bibleBooks||0} Bibelbücher gelesen</small>`;
 }
 const originalProfile=v24RangerProfile;v24RangerProfile=function(id,...args){const result=originalProfile.call(this,id,...args);profileScore(id);return result;};
 async function refresh(){await load();if(!actor())return;menus();if(view==='knowledge')renderPage();if(view==='dash')dashboard();const p=host().querySelector('[data-kw-profile]');if(p)profileScore(p.dataset.kwProfile);}
 function localCalendar(){return (db.meetings||[]).map(m=>({id:m.id,date:m.date,start:m.start||'',end:m.end||'',place:m.place||'',theme:m.theme||'Rangertreffen',cancelled:!!(m.cancelled||m.archived||m.deleted),teamIds:m.teamIds||m.teams||(m.team?[m.team]:[]),rangerIds:m.rangerIds||[]}));}
 function observeCalendar(next){
  if(transport.mode!=='online')return;const k=key(),previous=calendarBaselines.get(k);
  const merge=()=>{for(const m of next.meetings){const old=db.meetings.find(x=>same(x.id,m.id));if(old){for(const f of ['date','start','end','place','theme','teamIds','rangerIds'])old[f]=m[f];old.cancelled=m.cancelled;}else db.meetings.push({...m,nature:{enabled:false},impulse:{enabled:false},action:{title:''},food:{enabled:false},attendance:{rangers:{},leaders:{}}});}};
  if(!previous){merge();calendarBaselines.set(k,{local:JSON.stringify(localCalendar()),cancellations:JSON.stringify(db.cancellations||[]),remote:next.meetings});}
  else {previous.remote=next.meetings;if(!unsynced.has(k)&&previous.local===JSON.stringify(localCalendar())){merge();previous.local=JSON.stringify(localCalendar());}}
 }
 RH.syncKnowledgeCalendar=async()=>{
  if(transport.mode!=='online'||!actor()||syncRunning||!data)return;const a=actor(),k=a.key,b=calendarBaselines.get(k);if(!b)return;
  const current=localCalendar(),previous=JSON.parse(b.local),changed=current.filter(m=>JSON.stringify(previous.find(x=>same(x.id,m.id)))!==JSON.stringify(m)),deleted=previous.filter(m=>!current.some(x=>same(x.id,m.id)));
  const oldCancels=JSON.parse(b.cancellations),cancels=db.cancellations||[],ownChanged=a.kind==='rangers'&&JSON.stringify(oldCancels.filter(c=>c.kind==='rangers'&&same(c.personId,a.id)))!==JSON.stringify(cancels.filter(c=>c.kind==='rangers'&&same(c.personId,a.id)));
  if(!changed.length&&!deleted.length&&!ownChanged)return;syncRunning=true;unsynced.add(k);
  try{
   if(a.leader)for(const m of [...changed,...deleted]){const remote=b.remote.find(x=>same(x.id,m.id));await transport.command('calendar-change',{...(deleted.includes(m)?{meetingId:m.id}:{meeting:m}),revision:remote?.revision||0});}
   if(ownChanged){const ids=[...new Set([...oldCancels,...cancels].filter(c=>c.kind==='rangers'&&same(c.personId,a.id)).map(c=>c.meetingId))];for(const meetingId of ids)await transport.command('participation-change',{meetingId,cancelled:cancels.some(c=>same(c.meetingId,meetingId)&&c.kind==='rangers'&&same(c.personId,a.id))});}
   b.local=JSON.stringify(current);b.cancellations=JSON.stringify(cancels);unsynced.delete(k);await refresh();
  }catch(e){RH.v28Notify('Kalenderänderung noch nicht zentral bestätigt: '+e.message);}finally{syncRunning=false;}
 };
 async function command(type,payload){
  if(busy)return;busy=true;const before=key(),signature=before+':'+type+':'+JSON.stringify(payload),requestId=pendingCommands.get(signature)||RH.uid(),disabled=[...dialog?.querySelectorAll('button')||[]].map(b=>[b,b.disabled]);pendingCommands.set(signature,requestId);disabled.forEach(([b])=>b.disabled=true);
  try{await transport.command(type,payload,requestId);pendingCommands.delete(signature);if(before!==key())return;dialog?.querySelector('form')?.removeAttribute('data-dirty');host()?.querySelector('[data-rw-form]')?.removeAttribute('data-dirty');const loaded=await load();if(type==='set-bible-read'&&(!loaded||data.bible.records[actor().id]?.[payload.bookId]?.isRead!==payload.isRead))throw Error(error||'Der Lesestatus wurde inzwischen auf einem anderen Gerät geändert. Der aktuelle Stand ist jetzt sichtbar.');mainToken='';sheetToken='';
   if(['set-bible-read','set-bible-chapter'].includes(type)){if(view==='knowledge')renderPage(true);if(type==='set-bible-read')showBibleUndo(payload);}else if(['grade-exam','correct-exam'].includes(type))navigate({kind:'exams'},true);else if(['register-exam','reassign-exam'].includes(type))navigate({kind:'exam-detail',id:data.exams.filter(e=>e.taskId===payload.taskId||e.id===payload.examId).at(-1)?.id},true);else if(type==='wisdom-change')navigate({kind:'wisdom-manage',scope:wisdom().settings.scope},true);else if(type==='catalog-change')navigate({kind:'manage'},true);else if(view==='knowledge')renderPage(true);if(view==='dash')dashboard();RH.v28Notify('Gespeichert.');
  }catch(e){if(before===key()){if(['set-bible-read','set-bible-chapter'].includes(type)){await load();if(view==='knowledge')renderPage(true);if(view==='dash')dashboard();}const p=dialog?.querySelector('[data-kw-error]')||host()?.querySelector('[data-rw-error]');if(p){p.textContent=e.message;p.scrollIntoView({block:'nearest',behavior:'instant'});}else RH.v28Notify(e.message);}}
  finally{busy=false;disabled.forEach(([b,was])=>{if(b.isConnected)b.disabled=was;});}
 }
 function showBibleUndo(payload){
  clearTimeout(undoTimer);document.querySelector('.bible-undo-notice')?.remove();undoBible={...payload,isRead:!payload.isRead,version:data.bible.records[actor().id]?.[payload.bookId]?.version||0,key:key()};
  const b=window.RHBibleModel.book(payload.bookId),el=document.createElement('aside');el.className='bible-undo-notice';el.setAttribute('role','status');el.innerHTML=`<span>${esc(b.name)}: ${payload.isRead?'als gelesen markiert':'Markierung zurückgenommen'}.</span><button type="button" data-bible-undo>Rückgängig</button><button type="button" aria-label="Hinweis schließen">×</button>`;
  el.querySelector('[data-bible-undo]').onclick=()=>{if(undoBible?.key!==key())return;const {bookId,isRead,version}=undoBible;el.remove();command('set-bible-read',{bookId,isRead,version});};el.querySelector('button:last-child').onclick=()=>el.remove();(dialog||document.body).append(el);undoTimer=setTimeout(()=>{el.remove();undoBible=null;},9000);
 }
 function bind(scope){
  RH.bindBibleChapters?.(scope,{command});
  scope.querySelectorAll('[data-kw-action]').forEach(b=>b.onclick=()=>{
   const action=b.dataset.kwAction,id=b.dataset.kwValue;
   if(action==='wisdom-manage')return navigate({kind:'wisdom-manage',scope:wisdom().settings.scope});
   if(action==='wisdom-preview'){const s=wisdom().settings;s.preview=!s.preview;return navigate({kind:'wisdom'},true);}
   if(action==='wisdom-hotspot')return navigate({...route,hotspot:id});
   if(action==='wisdom-edit'||action==='wisdom-new'){const [entityKind,entityId]=id.split('|');return navigate({kind:'wisdom-edit',entityKind,id:entityId,scope:wisdom().settings.scope});}
   if(action==='wisdom-archive'||action==='wisdom-restore'){
    const w=wisdom(),scope=w.settings.scope;let kind,entityId,fields;
    if(action==='wisdom-restore'){const h=data.wisdom.layers[scope].audit.find(h=>h.id===id);if(!h?.before)return;kind=h.kind;entityId=h.entityId;const allowed={groups:['title','description','icon','order','archived'],modules:['groupId','title','introduction','text','icon','illustrationKey','order','published','archived'],hotspots:['moduleId','label','text','order','archived','x','y','didactic']}[kind];fields=Object.fromEntries(Object.entries(h.before).filter(([k])=>allowed.includes(k)));}else{[kind,entityId]=id.split('|');fields={archived:!wisdom().c[kind].find(i=>i.id===entityId).archived};}
    const i=data.wisdom[kind].find(i=>i.id===entityId);if(!confirm(action==='wisdom-restore'?'Diese frühere Fassung wiederherstellen?':fields.archived?'Inhalt archivieren? Alle bestehenden Punkte und Nutzerdaten bleiben erhalten.':'Inhalt wiederherstellen?'))return;
    return command('wisdom-change',{kind,id:entityId,scope,revision:scope==='global'?i.globalRevision:i.localRevision,fields});
   }
   if(action==='expedition-stage')return RH.openExpeditionStation(Number(id));
   if(action==='back')return back();if(action==='close')return navigate(worldFor(route)?{kind:'region',id:worldFor(route)}:parent(),true);
   if(['bible','bible-shelf','bible-book'].includes(action))return navigate({kind:action,...(id?{id}:{}),...(actor().leader&&route.rangerId?{rangerId:route.rangerId}:{})});
   if(action==='bible-read'||action==='bible-unread'){const b=window.RHBibleModel.book(id);if(!b||actor().leader)return;const current=bible().record(b);if(action==='bible-read'&&!confirm('Hast du das ganze Buch '+b.name+' gelesen?'))return;return command('set-bible-read',{bookId:b.id,isRead:action==='bible-read',version:current.version});}
   if(action==='reload'){mainToken='';return refresh();}
   if(action==='location'){const ts=C.topics.filter(t=>t.locationId===id&&t.visible);return navigate(ts.length===1?{kind:'topic',id:ts[0].id}:{kind:'location-topics',id});}
   if(action==='region'&&id==='arena')return navigate({kind:'ranking'});
   if(action==='edit'){const [entityKind,entityId,scope]=id.split('|');return navigate({kind:'edit',entityKind,id:entityId,scope:scope||editorFilters.scope||'local'});}
   if(action==='create-editor')return navigate({kind:'edit',entityKind:id,scope:editorFilters.scope||'local'});
   if(action==='create-task')return navigate({kind:'edit',entityKind:'tasks',scope:'local',parent:id});
   if(action==='create-topic')return navigate({kind:'edit',entityKind:'topics',scope:'local',parent:id});
   if(action==='manage-locations'){editorFilters={...editorFilters,kind:'locations',parent:id};return navigate({kind:'manage'});}
   if(action==='permission'){const [leaderId,allowed]=id.split('|');return command('set-editor-permission',{leaderId,allowed:allowed==='true'});}
   if(action==='archive-editor'||action==='reset-editor'){
    const [kind,entityId,scope='local']=id.split('|'),item=C[kind].find(x=>x.id===entityId);if(!confirm(action==='reset-editor'?'Lokale Anpassung bewusst auf die globale Standardfassung zurücksetzen?':'Inhalt '+(item.archived?'aus dem Archiv zurückholen?':'mit enthaltenen Themen ausblenden? Historische Prüfungen und Punkte bleiben erhalten.')))return;
    return command('catalog-change',{kind,id:entityId,scope,revision:scope==='global'?item.globalRevision:item.localRevision,...(action==='reset-editor'?{reset:true}:{fields:{archived:!item.archived},cascadeConfirmed:true}),reason:action==='reset-editor'?'Bewusst auf globale Basis zurückgesetzt':'Archivstatus geändert'});
   }
   if(action==='withdraw-exam'){if(confirm('Diese Prüfungsanmeldung vor dem Treffen zurückziehen?'))return command(action,{examId:id});return;}
   if(action==='grade'){const [examId,result]=id.split('|');return navigate({kind:'grade-confirm',id:examId,result});}
   if(action==='legacy-reverse'){const reason=prompt('Begründung der historischen Punkteberichtigung:');if(reason)return command('correct-legacy-credit',{creditId:id,reason});return;}
   if(action==='growth-stage'){originalGo('path');return stageClickV19(stages[Number(id)],Number(id));}
   navigate({kind:action,id});
  });
  scope.querySelectorAll('[data-rw-setting]').forEach(el=>el.onchange=()=>{wisdom().settings[el.dataset.rwSetting]=el.value;if(el.dataset.rwSetting==='scope'){route.scope=el.value;history.replaceState({...history.state,route},'',hash(route));}mainToken='';renderPage(true);});
  scope.querySelector('[data-rw-search]')?.addEventListener('input',e=>{const value=e.target.value,caret=e.target.selectionStart;wisdom().settings.query=value;renderPage(true);const el=host().querySelector('[data-rw-search]');el.focus();el.setSelectionRange(caret,caret);});
  scope.querySelectorAll('[data-rw-publish]').forEach(el=>el.onclick=()=>{const w=wisdom(),scope=w.settings.scope,c=scope==='global'?window.RHWisdomModel.effective(data.wisdom.layers.global,window.RHWisdomModel.empty()):data.wisdom,m=c.modules.find(m=>m.id===el.dataset.rwPublish);command('wisdom-change',{kind:'modules',id:m.id,scope,revision:scope==='global'?m.globalRevision:m.localRevision,fields:{published:!m.published}});});
  scope.querySelector('[data-rw-form]')?.addEventListener('input',e=>e.currentTarget.dataset.dirty='true');
  scope.querySelector('[data-rw-form]')?.addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const f=Object.fromEntries(new FormData(form)),kind=f.kind,id=f.id,revision=Number(f.revision);delete f.kind;delete f.id;delete f.revision;f.order=Number(f.order);if(kind==='modules')f.published=form.elements.published.checked;if(kind==='hotspots')for(const k of ['x','y'])f[k]=f[k]===''?null:Number(f[k]);command('wisdom-change',{kind,...(id?{id}:{}),revision,scope:wisdom().settings.scope,fields:f});});
  scope.querySelector('[data-bible-reader]')?.addEventListener('change',e=>{if(e.target.value)navigate({...route,rangerId:e.target.value},true);});
  scope.querySelector('[data-bible-status]')?.addEventListener('change',e=>{readingFilters.status=e.target.value;mainToken='';renderPage(true);});
  scope.querySelector('[data-bible-query]')?.addEventListener('input',e=>{const value=e.target.value,caret=e.target.selectionStart;readingFilters.query=value;mainToken='';renderPage(true);const input=host().querySelector('[data-bible-query]');input.focus();input.setSelectionRange(caret,caret);});
  scope.querySelector('[data-kw-task-filter]')?.addEventListener('change',e=>{const ts=C.tasks.filter(t=>t.topicId===route.id&&t.visible&&(e.target.value==='all'||progress(t).status===e.target.value));const list=scope.querySelector('[data-kw-task-list]');list.innerHTML=rows(ts)||'<p>Keine Aufgaben in dieser Auswahl.</p>';bind(list);});
  scope.querySelector('[data-kw-meeting-choice]')?.addEventListener('change',e=>{route.meetingId=e.target.value;sheetToken='';showSheet(true);});
  scope.querySelectorAll('[data-exam-filter]').forEach(el=>el.onchange=()=>{const f=el.dataset.examFilter;examFilters[f]=el.value;if(f==='meetingId')examFilters.allMeetings=el.value==='all';mainToken='';renderPage(true);});
  scope.querySelectorAll('[data-editor-filter]').forEach(el=>el.onchange=()=>{editorFilters[el.dataset.editorFilter]=el.value;editorFilters.parent='';mainToken='';renderPage(true);});
  scope.querySelector('[data-editor-query]')?.addEventListener('input',e=>{const value=e.target.value,caret=e.target.selectionStart;editorFilters.query=value;mainToken='';renderPage(true);const input=host().querySelector('[data-editor-query]');input.focus();input.setSelectionRange(caret,caret);});
  scope.querySelector('select[data-editor-scope]')?.addEventListener('change',e=>{if(dirty()&&!confirm('Ungespeicherte redaktionelle Änderungen verwerfen?')){e.target.value=route.scope||'local';return;}editorFilters.scope=e.target.value;if(route.kind==='edit'){route.scope=e.target.value;sheetToken='';showSheet(true);}else {mainToken='';renderPage(true);}});
  scope.querySelectorAll('[data-remove-subitem]').forEach(b=>b.onclick=()=>{b.closest('label').remove();scope.querySelector('form').dataset.dirty='true';});
  scope.querySelector('[data-add-subitem]')?.addEventListener('click',()=>{const label=document.createElement('label');label.textContent='Unterpunkt';const input=document.createElement('textarea');input.name='displaySubItem';input.maxLength=16000;label.append(input);scope.querySelector('[data-editor-subitems]').append(label);scope.querySelector('form').dataset.dirty='true';});
  scope.querySelectorAll('[data-kw-form]').forEach(form=>{form.oninput=()=>{if(form.dataset.kwForm==='catalog-change')form.dataset.dirty='true';};form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const type=form.dataset.kwForm;try{command(type,type==='catalog-change'?editor().payload(form):Object.fromEntries(new FormData(form)));}catch(e){const p=dialog?.querySelector('[data-kw-error]')||host()?.querySelector('[data-rw-error]');if(p)p.textContent=e.message;}};});
 }
 RH.setKnowledgeTransport=next=>{if(!next||!['load','command','subscribe'].every(k=>typeof next[k]==='function')||!['demo','online'].includes(next.mode))throw Error('Ungültiger Fachwissen-Transport.');unsubscribe?.();closeSheet();transport=next;data=null;mainToken='';calendarBaselines.clear();unsubscribe=transport.subscribe(refresh);refresh();};
 RH.loadV35=()=>transport.load();RH.commandV35=(type,payload)=>transport.command(type,payload);RH.transportV35=()=>transport;
 RH.openBible=()=>navigate({kind:'bible'});RH.openWisdom=()=>navigate({kind:'wisdom'});RH.openExpeditionMap=()=>navigate({kind:'expedition-map'});RH.knowledgeTransportMode=()=>transport.mode;RH.refreshKnowledge=refresh;RH.openKnowledge=(kind='map',id)=>navigate({kind:kind==='arena'?'ranking':kind,id});
 const originalGo=goV17;goV17=function(next){if(actor()&&!RH.navigationRouteAllowedV33(next,next==='knowledge'?{kind:'map'}:route,actor(),data)){RH.v28Notify('Dieser Bereich ist für deine Rolle nicht freigegeben.');return;}if(dirty()&&!confirm('Ungespeicherte redaktionelle Änderungen verwerfen?'))return;if(next==='knowledge'&&!popping)return navigate({kind:'map'});closeSheet();mainToken='';return originalGo(next);};
 const oldBack=RH.goBack;RH.goBack=()=>view==='knowledge'&&!modal.classList.contains('show')?back():oldBack();
 const previousGrowthTasks=RH.openExpeditionTasks;RH.openExpeditionTasks=function(i){if(RH.expeditionSnapshot()?.progress[Number(i)]?.available){history.replaceState(null,'',cleanURL());originalGo('path');}return previousGrowthTasks(i);};
 const previousGrowthLogbook=RH.openExpeditionLogbook;RH.openExpeditionLogbook=function(i){if(Number(i)===0&&RH.expeditionSnapshot()?.progress[0]?.available){history.replaceState(null,'',cleanURL());originalGo('path');}return previousGrowthLogbook(i);};
 const oldReturn=RH.returnToExpedition;RH.returnToExpedition=function(...args){returningGrowth=true;try{const r=oldReturn.apply(this,args);navigate({kind:'expedition-map'},true);return r;}finally{returningGrowth=false;}};
 const oldRender=render;render=function(){
  const previous=context,next=key(),priorView=lastView,y=scrollY;
  if(previous!==next){document.querySelector('.bible-undo-notice')?.remove();clearTimeout(undoTimer);undoBible=null;readingFilters.query='';readingFilters.status='all';readingPositions.clear();data=null;C=K.effective();error='';generation++;mainToken='';closeSheet();context=next;calendarBaselines.clear();if(previous){route={kind:'map'};depth=0;history.replaceState(null,'',cleanURL());}else if(parseHash())route=history.state?.context===next&&history.state?.route?history.state.route:parseHash();}
  if(view==='knowledge'&&route.kind==='expedition-map'&&actor()&&!actor().leader&&!RH.hasFullExpedition()){view='dash';oldRender();dashboard();view='knowledge';}
  if(actor()&&!RH.navigationRouteAllowedV33(view,route,actor(),data)){view='dash';route={kind:'map'};history.replaceState(null,'',cleanURL());}
  oldRender();if(!actor())return;menus();if(view==='knowledge')renderPage();if(view==='dash')dashboard();refresh();lastView=view;
  if(view==='dash'&&actor().kind==='rangers'&&!returningGrowth){const target=previous===next&&priorView==='dash'?y:0;requestAnimationFrame(()=>{if(key()===next&&view==='dash')scrollTo({top:target,behavior:'instant'});});}
 };
 unsubscribe=transport.subscribe(refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&actor())refresh();});
 const timer=setInterval(()=>{if(!document.hidden&&actor()){if(transport.mode==='online')refresh();else if(view==='dash')dashboard();}},30000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
 if(session&&parseHash()){route=parseHash();depth=history.state?.depth||0;entry=history.state?.entry||'knowledge';view='knowledge';}
 if(session&&parseHash()&&(location.hash.startsWith('#fw/bible')||location.hash.startsWith('#ranger-wissen')))history.replaceState(history.state,'',hash(route));
 render();RH.revisionV35Ready=true;RH.revisionV33Ready=true;RH.wisdomReady=true;RH.knowledgeReady=true;RH.knowledgeV30Ready=true;RH.bibleReady=true;
})();
