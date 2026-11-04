/* Fachwissen is a new entrance into RangerHub, with the existing roles and tribe. */
(() => {
 'use strict';
 const RH=window.RangerHub,C=window.RangerHubKnowledgeCatalog,M=window.RHKnowledgeModel;
 const icon='<svg class="rh-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m16 7-2 7-7 3 3-7z"/></svg>';
 const labels={new:'Noch nicht gestartet',working:'In Arbeit',submitted:'Zur Prüfung eingereicht',approved:'Bestätigt','needs-work':'Überarbeitung nötig'};
 const task=id=>C.tasks.find(t=>t.id===id),topic=id=>C.topics.find(t=>t.id===id),same=(a,b)=>String(a)===String(b);
 const actor=()=>{try{return RH.messageActor();}catch{return null;}},host=()=>RH.content();
 const pretty=at=>at?new Date(at).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Berlin'}):'—';
 const title=t=>t.originalText.replace(/^\d+\.\s*/,'').split(/(?<=[.!?])\s/)[0].replace(/\s*\(\d+\s*Punkte?\)/g,'').slice(0,170);
 const source=t=>`${t.sourceCategoryId} · ${t.sourceTopic} · DOCX Absatz ${t.sourceReference.paragraphs.join(', ')}`;
 const points=t=>t.points??data?.resolutions[t.id]?.points??null;
 const pointsLabel=t=>points(t)==null?(t.pointOptions?'8 P bei Sportabzeichen · sonst offen':'Punkte offen – Leiter klärt'):`${points(t)} P`;
 const person=id=>data?.people.find(p=>same(p.id,id));
 const progress=(t,rid=actor()?.id)=>data?.progress[M.key(rid,t.id)]||{status:'new',history:[]};
 const visible=t=>actor()?.leader||(t.isPublished&&data?.policies[t.id]?.published!==false);
 const known=ts=>ts.reduce((sum,t)=>sum+(points(t)||0),0);
 const done=ts=>ts.filter(t=>progress(t).status==='approved').length;
 const button=(action,text,value='',cls='btn alt')=>`<button type="button" class="${cls}" data-kw-action="${action}" data-kw-value="${esc(value)}">${text}</button>`;
 let transport=RH.createLocalKnowledgeTransport(),data=null,loadError='',generation=0,step=null,trail=[],dialog=null,origin=null,currentContext=null,busy=false,unsubscribe=null;
 let filters={period:'all',category:'',team:'',search:''};const drafts=new Map();
 const demo=()=>transport.mode==='demo';
 const modeLabel=()=>`<p class="kw-mode ${demo()?'':'is-online'}" role="note">${demo()?'Demo / nur lokale Daten · Diese Rangliste gilt für dieses Browserprofil.':'Zentrale Fachwissen-Daten · persönlich angemeldet'}</p>`;
 function feedback(message){RH.v28Notify(message);}
 function queries(){const q={category:filters.category,team:filters.team};if(filters.period==='week')q.since=M.week(new Date());if(filters.period==='month')q.since=M.date().slice(0,7)+'-01';return q;}
 async function load(){
  const a=actor();if(!a)return;const ticket=++generation;
  try{const next=await transport.load(queries());if(ticket!==generation||actor()?.key!==a.key)return false;
   if(!Array.isArray(next.ranking)||!Array.isArray(next.people)||!next.progress||!Array.isArray(next.challenges)||!Array.isArray(next.ledger)||!next.policies||!next.resolutions)throw Error('Unvollständige Antwort des Fachwissen-Dienstes.');
   data=next;loadError='';return true;
  }catch(e){if(ticket===generation&&actor()?.key===a.key){loadError=e.message;return false;}}
 }
 function errorHTML(){return `<div class="kw-empty" role="alert"><h2>Fachwissen gerade nicht verfügbar</h2><p>${esc(loadError||'Daten werden geladen …')}</p>${button('reload','Erneut versuchen')}</div>`;}
 function scoreStrip(){
  const a=actor(),own=data.ranking.find(r=>same(r.id,a.id)),approved=Object.values(data.progress).filter(p=>p.status==='approved'&&(a.leader||same(p.rangerId,a.id))).length;
  const started=C.topics.filter(t=>C.tasks.some(x=>x.topicId===t.id&&progress(x).status!=='new')).length,finished=C.topics.filter(t=>{const ts=C.tasks.filter(x=>x.topicId===t.id);return ts.length&&ts.every(x=>progress(x).status==='approved');}).length;
  return `<div class="kw-score-strip"><div><span>${a.leader?'Bestätigte Stammpunkte':'Offizielle Fachwissenpunkte'}</span><strong>${a.leader?data.totalPoints:own?.points||0}</strong></div><div><span>${a.leader?'Warten auf Freigabe':'Dein Rangplatz'}</span><strong>${a.leader?data.pending:own?.rank?'#'+own.rank:'—'}</strong></div><div><span>${a.leader?'Bestandene Aufgaben':'Punkte diese Woche'}</span><strong>${a.leader?approved:own?.weekPoints||0}</strong></div><div><span>${a.leader?'Berechtigte Ranger':'Bestandene Aufgaben'}</span><strong>${a.leader?data.people.length:approved}</strong></div></div>${!a.leader?`<div class="kw-topic-progress"><progress value="${approved}" max="${C.tasks.length}" aria-label="Bestandene Fachwissenaufgaben"></progress><small>${started} von 36 Themen begonnen · ${finished} vollständig bestanden</small></div>`:''}`;
 }
 function podium(){
  const scored=data.ranking.filter(r=>r.rank&&r.rank<=3);
  return scored.length?`<ol class="kw-podium">${scored.map(r=>`<li><span class="kw-rank">${r.rank.toString().padStart(2,'0')}</span><span>${esc(r.alias)}<small>${r.approved} Aufgaben bestätigt</small></span><strong>${r.points}<small>Punkte</small></strong></li>`).join('')}</ol>`:'<p class="kw-empty-inline">Die ersten Plätze entstehen mit den ersten Leiterbestätigungen. Jeder beginnt bei null.</p>';
 }
 function highlights(){
  const a=actor(),open=data.challenges.filter(c=>['active','invited'].includes(c.status));
  const movers=data.ranking.filter(r=>r.weekPoints>0&&(r.change==='neu'||r.change>0));
  const own=data.ranking.find(r=>same(r.id,a.id));
  return `<div class="kw-highlights"><section><div class="kw-section-title"><h2>Rangliste · ${esc(v24StammName())}</h2>${button('ranking','Alle Rangplätze')}</div>${podium()}${!a.leader?`<p class="kw-own-rank">Deine Platzierung <b>${own?.rank?'#'+own.rank:'Noch ohne Punkte'}</b> · ${own?.points||0} Punkte</p>`:''}<details class="kw-movers"><summary>Diese Woche aufgestiegen</summary>${movers.length?movers.map(r=>`<p>${esc(r.alias)} · ${r.change==='neu'?'neu dabei':r.change+' Plätze vorgerückt'} · ${r.weekPoints} P diese Woche</p>`).join(''):'<p>Mit jeder bestätigten Aufgabe geht es weiter.</p>'}</details></section><section class="kw-challenge-highlight"><span class="section-kicker">Gemeinsam weiterkommen</span><h2>${a.leader?'Begleite eure Expedition.':'Ein Ziel. Zwei Ranger.'}</h2><p>${a.leader?`${data.pending} Aufgaben warten auf deine Prüfung.`:`${open.length} offene Herausforderungen. Lade jemanden ein und lernt miteinander.`}</p><div class="row">${button(a.leader?'reviews':'choose-task',a.leader?'Freigaben prüfen':'Ranger herausfordern','','btn')}${button('arena','Challenges ansehen')}</div></section></div>`;
 }
 function map(){
  const pos=[[20,44,26,33],[50,32,68,17],[81,43,23,57],[75,73,69,73],[31,76,31,88],[87,91,77,94]];
  return `<div class="kw-map" role="group" aria-label="Abenteuerkarte mit sechs anklickbaren Regionen">${RH.knowledgeMapScene(false)}${RH.knowledgeMapScene(true)}<span class="kw-map-note">DEIN NÄCHSTES ABENTEUER BEGINNT HIER</span>${C.regions.map((r,i)=>{const ts=C.tasks.filter(t=>t.mapRegionId===r.id&&visible(t)),count=done(ts);return `<button type="button" class="kw-map-pin kw-pin-${r.id}" data-kw-action="region" data-kw-value="${r.id}" style="--dx:${pos[i][0]}%;--dy:${pos[i][1]}%;--mx:${pos[i][2]}%;--my:${pos[i][3]}%" aria-label="${esc(r.title)} öffnen${ts.length?', '+ts.length+' Aufgaben':''}"><span class="kw-pin-number">${String(i+1).padStart(2,'0')}</span><b>${esc(r.title)}</b><small>${ts.length?(actor().leader?`${C.topics.filter(t=>t.mapRegionId===r.id).length} Themen entdecken`:`${count}/${ts.length} bestanden`):'Duelle & Rangliste'}</small></button>`;}).join('')}<span class="kw-map-scale" aria-hidden="true">ENTDECKEN · AUSPROBIEREN · WACHSEN</span></div>`;
 }
 function renderPage(){
  if(!actor())return;
  host().innerHTML=`<section class="kw-page"><header class="kw-heading"><div><span class="section-kicker">Fachwissen · Dein Logbuch wird lebendig</span><h1 aria-label="Fachwissen – Deine Ranger Expedition">Deine Ranger <em>Expedition.</em></h1><p>Entdecke Wissen. Bestehe Aufgaben. Sammle Punkte.</p></div><span class="kw-heading-compass" aria-hidden="true">${icon}<small>36 THEMEN<br>EIN ABENTEUER</small></span></header>${modeLabel()}${loadError?errorHTML():data?scoreStrip()+map()+highlights():'<p role="status">Deine Expedition wird geladen …</p>'}<footer class="kw-source-note">Originale FECG-Fachwissenaufgaben. Punkte zählen nach Leiterbestätigung. Challenges vergeben keine zusätzlichen Fachwissenpunkte.</footer></section>`;
  bind(host());RH.decorateBack?.();
 }
 function dashboard(){
  if(view!=='dash'||!actor())return;
  host().querySelector('[data-knowledge-dashboard]')?.remove();
  const section=document.createElement('section');section.className='kw-dashboard';section.dataset.knowledgeDashboard='';
  section.innerHTML=`<header class="kw-section-title"><div><span class="section-kicker">Fachwissen</span><h2>Deine Expedition</h2></div>${button('map','Karte entdecken','','btn')}</header>${modeLabel()}${loadError?errorHTML():data?scoreStrip()+highlights():'<p role="status">Fachwissen wird geladen …</p>'}`;
  const anchor=host().querySelector('.expedition,.dash-intro');if(anchor)anchor.before(section);else host().prepend(section);bind(section);
 }
 function menus(){
  const nav=root.querySelector('.nav');if(!actor()||!nav)return;
  let b=nav.querySelector('[data-knowledge-nav]');if(!b){b=document.createElement('button');b.type='button';b.dataset.knowledgeNav='';b.setAttribute('aria-label','Fachwissen');b.innerHTML=icon+'<span class="rh-nav-label">Fachwissen</span>';b.onclick=()=>goV17('knowledge');nav.querySelector('[data-message-nav]')?.after(b);if(!b.isConnected)nav.prepend(b);}
  b.classList.toggle('active',view==='knowledge');if(view==='knowledge')b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 }
 function closeSheet(){if(dialog){dialog.close();dialog.remove();dialog=null;}step=null;trail=[];if(origin?.isConnected)origin.focus();if(filters.period!=='all'||filters.category||filters.team){filters={period:'all',category:'',team:'',search:''};if(actor())queueMicrotask(refresh);}}
 function open(next,push=true){
  if(!actor()||!data)return;
  if(!dialog){origin=document.activeElement;dialog=document.createElement('dialog');dialog.id='rh-knowledge-sheet';dialog.className='kw-sheet';dialog.setAttribute('aria-labelledby','kw-sheet-title');document.body.append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();back();});dialog.addEventListener('click',e=>{if(e.target===dialog)back();});dialog.showModal();}
  if(push&&step)trail.push(step);step=next;paint();
 }
 function back(){if(trail.length){step=trail.pop();paint();}else closeSheet();}
 function sheetShell(name,sub,body){
  dialog.innerHTML=`<div class="kw-sheet-header"><button type="button" class="kw-back" data-kw-action="back">${RH.icon('back')}<span>${trail.length?'Zurück':'Zur Karte'}</span></button><button type="button" class="kw-close" data-kw-action="close" aria-label="Fachwissen-Details schließen">×</button></div><div class="kw-sheet-content"><span class="section-kicker">${esc(sub)}</span><h2 id="kw-sheet-title" tabindex="-1">${esc(name)}</h2>${modeLabel()}${body}<p data-kw-error role="alert"></p></div>`;
  dialog.scrollTop=0;bind(dialog);dialog.querySelector('#kw-sheet-title').focus({preventScroll:true});
 }
 function rows(ts,rid){return ts.map(t=>{const p=progress(t,rid);return `<button type="button" class="kw-task-row" data-kw-action="task" data-kw-value="${t.id}"><span><b>${esc(title(t))}</b><small>${esc(t.sourceTopic)} · ${esc(labels[p.status])}${t.safetyFlags.length?' · Leiteraufsicht prüfen':''}</small></span><span class="kw-task-points">${esc(pointsLabel(t))}<small aria-hidden="true">${p.status==='approved'?'✓':'→'}</small></span></button>`;}).join('');}
 function taskDetail(t){
  const a=actor(),rid=step.rid??a.id,p=progress(t,rid),people=data.people,policy=data.policies[t.id],permitted=policy?.clearances?.[rid]?.eligible&&policy.clearances[rid].expiresAt>new Date().toISOString();
  const draftKey=a.key+':'+rid+':'+t.id,draft=drafts.get(draftKey)||{};
  const target=a.leader?`<label class="kw-person-select">Ranger auswählen<select data-kw-person><option value="">Bitte wählen</option>${people.map(r=>`<option value="${esc(r.id)}" ${same(r.id,rid)?'selected':''}>${esc(r.alias)}</option>`).join('')}</select></label>`:'';
  const chosen=!a.leader||people.some(r=>same(r.id,rid));
  const optionField=t.pointOptions?`<label>Welche Quellalternative?<select name="pointOption"><option value="">Trainingsziele · Punkte müssen geklärt werden</option>${t.pointOptions.map(o=>`<option value="${o.sourceParagraphIndex}" ${same(draft.pointOption||p.evidence?.pointOption,o.sourceParagraphIndex)?'selected':''}>Sportabzeichen Silber · ${o.points} Punkte</option>`).join('')}</select></label>`:'';
  let controls='';
  if(chosen){
   if(a.leader){
    controls=`<section class="kw-review"><h3>Leiterprüfung · ${esc(person(rid)?.alias||'Ranger')}</h3>${p.evidence?`<div class="kw-evidence"><small>${esc(p.evidence.type)} · eingereicht ${pretty(p.submittedAt)}</small><p>${esc(p.evidence.text)}</p>${p.evidence.pointOption?'<p>Gewählte Alternative: Sportabzeichen Silber</p>':''}</div>`:''}
     ${p.status==='submitted'?`<form data-kw-form="review"><label>Rückmeldung<textarea name="comment" maxlength="2000" rows="3"></textarea></label><div class="row"><button class="btn" name="decision" value="approve">Bestätigen${points(t)!=null?' · '+points(t)+' Punkte':''}</button><button class="btn alt" name="decision" value="reject">Überarbeitung anfordern</button></div></form>`:p.status==='approved'?`<form data-kw-form="revoke"><label>Begründung für Widerruf<textarea name="reason" required maxlength="2000"></textarea></label><button class="btn red">Bestätigung widerrufen und Punkte zurückbuchen</button></form>`:`<details><summary>Praktischen oder mündlichen Nachweis dokumentieren</summary><form data-kw-form="observe">${optionField}<label>Beobachtung / Vorführung<textarea name="text" required maxlength="6000" rows="4"></textarea></label><button class="btn">Zur Prüfung dokumentieren</button></form></details>`}
     <details><summary>Eignung, Aufsicht und Freigabe</summary><p>Die Freigabe gilt für diesen Ranger und diese Aufgabe für 30 Tage. Prüfe Alter, Können und erforderliche Aufsicht persönlich.</p><form data-kw-form="policy"><label>Entscheidung<select name="eligible"><option value="true">Für diesen Ranger freigeben</option><option value="false">Freigabe zurücknehmen</option></select></label><label>Prüfung / vereinbarte Aufsicht<textarea name="reason" maxlength="2000" required></textarea></label><button class="btn">Freigabe speichern</button></form></details></section>`;
   }else if(p.status==='approved')controls='<p class="kw-success">✓ Von deiner Leitung bestätigt. Diese Aufgabe zählt einmal für deine Fachwissenpunkte.</p>';
   else if(p.status==='submitted')controls='<p class="kw-success">Dein Ergebnis liegt bei der Leitung. Bis zur Bestätigung werden keine Punkte gutgeschrieben.</p>';
   else controls=`<div class="row">${button('start','Aufgabe starten',t.id,'btn alt')}${button('invite-form','Ranger herausfordern',t.id,'btn')}</div><form class="kw-submit" data-kw-form="submit"><h3>Dein Ergebnis</h3><label>Nachweisart<select name="evidenceType"><option value="text">Schriftlicher Nachweis</option><option value="oral">Mündliche Vorführung mit Leiterprüfung</option><option value="practice">Praktische Vorführung mit Leiterprüfung</option></select></label>${optionField}<label>Ergebnis / vereinbarte Vorführung<textarea name="text" required maxlength="6000" rows="5">${esc(draft.text||'')}</textarea></label><label class="kw-consent"><input type="checkbox" name="consent" required>Ich reiche meinen Nachweis freiwillig zur Leiterprüfung ein. Andere Ranger sehen ihn nicht.</label><button class="btn">Ergebnis einreichen</button></form>`;
  }
  const records=(p.history||[]).map(h=>`<li><time>${pretty(h.at)}</time> · ${esc(({started:'Begonnen',submit:'Eingereicht',observe:'Vorführung dokumentiert',approved:'Bestätigt','needs-work':'Überarbeitung nötig',revoked:'Widerrufen'})[h.action]||h.action)}${h.kind==='leaders'?' · '+esc(db.leaders.find(l=>same(l.id,h.by))?.name||'Leitung'):''}${h.points!=null?' · '+h.points+' Punkte':''}${h.comment||h.reason?'<p>'+esc(h.comment||h.reason)+'</p>':''}</li>`).join('');
  return `${target}<div class="kw-task-meta"><span>${esc(pointsLabel(t))}</span><span>${esc(labels[p.status])}</span></div><section class="kw-original"><small>ORIGINALAUFGABE</small><p>${esc(t.originalText)}</p>${t.subItems.length?`<ul>${t.subItems.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}</section><p class="kw-source-ref">${esc(source(t))}</p>${t.safetyFlags.length?`<aside class="kw-safety"><b>Leiteraufsicht / Sicherheitsprüfung</b><p>${esc(t.safetyFlags.join(' · '))}. ${permitted?'Eine persönliche Freigabe ist hinterlegt.':'Vor der Bearbeitung muss die Leitung deine Eignung und die Aufsicht freigeben.'}</p></aside>`:''}${policy?.published===false?'<p class="kw-safety">Diese Aufgabe ist derzeit durch die Leitung gesperrt.</p>':''}${p.comment?`<p class="kw-feedback"><b>Rückmeldung deiner Leitung</b><br>${esc(p.comment)}</p>`:''}${!a.leader&&p.evidence?`<details class="kw-history"><summary>Dein eingereichter Nachweis</summary><p>${esc(p.evidence.text)}</p><small>${pretty(p.submittedAt)}</small></details>`:''}${controls}${a.leader?`<details class="kw-admin"><summary>Quellwert und Veröffentlichung verwalten</summary><form data-kw-form="publish"><label><input type="checkbox" name="published" ${policy?.published===false?'':'checked'}>Aufgabe für Ranger veröffentlichen</label><button class="btn alt">Veröffentlichung speichern</button></form>${t.points==null?`<p>Originalwert bleibt unverändert offen. Eine Klärung benötigt eine überprüfbare Quelle und Begründung.${t.pointOptions?' Die 8-Punkte-Alternative kann nur mit dem entsprechenden Sportabzeichen-Nachweis bestätigt werden.':''}</p><form data-kw-form="resolve"><label>Belegter Punktwert<input name="points" type="number" min="0" max="100" required></label><label>Quelle / genaue Fundstelle<input name="source" required maxlength="1000"></label><label>Begründung<textarea name="reason" required maxlength="2000"></textarea></label><button class="btn alt">Quellklärung dokumentieren</button></form>`:'<p>Der Originalpunktwert ist fest und kann nicht geändert werden.</p>'}</details>`:''}${records?`<details class="kw-history"><summary>Verlauf und Bestätigungen</summary><ol>${records}</ol></details>`:''}`;
 }
 function challenges(){
  const a=actor();return `<p>Es zählen nur bestätigte Fachwissenaufgaben. Keine Bonuspunkte für Siege. Die frühere bestätigte Einreichung gewinnt; bis 60 Sekunden Unterschied gilt Gleichstand. Offene Nachweise werden vor der Entscheidung geprüft.</p>${!a.leader?button('choose-task','Eine Aufgabe für ein Duell auswählen','','btn'):''}${data.challenges.length?data.challenges.map(c=>{
   const t=task(c.taskId),p=c.players.map(id=>person(id)?.alias||'Archivierter Ranger'),result=c.status==='finished'?(c.result?.winner==null?'Unentschieden':(person(c.result.winner)?.alias||'Ranger')+' hat gewonnen'):({invited:'Einladung offen',active:'Gemeinsam unterwegs',declined:'Einladung abgelehnt',cancelled:'Beendet',expired:'Frist abgelaufen'})[c.status];
   return `<article class="kw-duel"><small>${esc(result)}</small><h3>${esc(p.join(' & '))}</h3><p>${esc(title(t))}</p><p class="muted">Frist: ${pretty(c.deadline)} · ${esc(pointsLabel(t))}</p><div class="kw-duel-progress">${c.players.map(id=>`<span><b>${esc(person(id)?.alias||'Ranger')}</b><small>${esc(labels[c.playerStatuses?.[id]||'new'])}</small></span>`).join('')}</div><div class="row">${!a.leader&&same(c.players[1],a.id)&&c.status==='invited'?button('accept','Annehmen',c.id,'btn')+button('decline','Ablehnen',c.id):''}${c.status==='active'?button('task','Zur Aufgabe',t.id):''}${['active','invited'].includes(c.status)?button('cancel','Challenge beenden',c.id):''}${a.leader&&c.status==='active'&&c.deadline<new Date().toISOString()?button('settle','Frist prüfen und abschließen',c.id):''}</div></article>`;
  }).join(''):'<div class="kw-empty"><h3>Raum für euer erstes Duell.</h3><p>Eine Aufgabe auswählen, die Leitung um Freigabe bitten und einen Ranger einladen.</p></div>'}`;
 }
 function rankingHTML(){
  const a=actor(),rows=data.ranking.filter(r=>r.alias.toLocaleLowerCase('de').includes(filters.search.toLocaleLowerCase('de')));
  return `<div class="kw-ranking-filters"><label>Wertung<select data-kw-filter="period"><option value="all" ${filters.period==='all'?'selected':''}>Gesamtwertung</option><option value="week" ${filters.period==='week'?'selected':''}>Diese Woche</option>${a.leader?`<option value="month" ${filters.period==='month'?'selected':''}>Diesen Monat</option>`:''}</select></label>${a.leader?`<label>Kategorie<select data-kw-filter="category"><option value="">Alle Kategorien</option>${C.categories.map(c=>`<option value="${c.id}" ${filters.category===c.id?'selected':''}>Kategorie ${c.id}</option>`).join('')}</select></label>${data.people.some(p=>p.team)?`<label>Team<select data-kw-filter="team"><option value="">Alle Teams</option>${[...new Set(data.people.map(p=>p.team).filter(Boolean))].map(team=>`<option ${filters.team===team?'selected':''}>${esc(team)}</option>`).join('')}</select></label>`:''}<label>Ranger suchen<input type="search" data-kw-search value="${esc(filters.search)}"></label>`:''}</div><p class="muted">Gleiche Punkte bedeuten denselben Rang. Ohne bestätigte Punkte gibt es noch keine Platzierung.</p><ol class="kw-ranking">${rows.map(r=>`<li class="${same(r.id,a.id)?'is-own':''}"><strong>${r.rank?'#'+r.rank:'—'}</strong><span>${esc(r.alias)}${same(r.id,a.id)?' · du':''}<small>${r.approved} Aufgaben bestätigt${filters.period==='all'&&r.change?' · '+(r.change==='neu'?'neu dabei':r.change>0?r.change+' Plätze vorgerückt':'Platzierung verändert'):''}</small></span><b>${r.points}<small>Punkte</small></b>${a.leader?button('ranger-audit','Nachweise',r.id):button('choose-task','Herausfordern',r.id)}</li>`).join('')}</ol><p class="kw-source-note">Nur aktive, berechtigte Ranger aus ${esc(v24StammName())}. Nachweise bleiben bei dem jeweiligen Ranger und der Leitung.</p>`;
 }
 function paint(){
  if(!dialog||!step||!data)return;
  if(step.kind==='region'){
   if(step.id==='arena')return sheetShell('Challenge-Arena','Freundschaftlicher Wettbewerb',challenges()+button('ranking','Zur Rangliste'));
   const r=C.regions.find(r=>r.id===step.id);if(!r)return closeSheet();
   const topics=C.topics.filter(t=>t.mapRegionId===r.id&&C.tasks.some(x=>x.topicId===t.id&&visible(x)));
   sheetShell(r.title,'Wähle dein nächstes Thema',`<div class="kw-topic-list">${topics.map(t=>{const ts=C.tasks.filter(x=>x.topicId===t.id&&visible(x)),d=done(ts);return `<button class="kw-topic-row" data-kw-action="topic" data-kw-value="${t.id}"><span><small>QUELLKATEGORIE ${t.sourceCategoryId}</small><b>${esc(t.title)}</b><small>${actor().leader?ts.length+' Aufgaben':d+'/'+ts.length+' bestanden'} · ${known(ts)} bekannte Quellpunkte</small></span><span aria-hidden="true">↗</span></button>`;}).join('')}</div>`);return;
  }
  if(step.kind==='topic'){
   const t=topic(step.id),ts=C.tasks.filter(x=>x.topicId===step.id&&visible(x)),notes=t.notes.map(n=>`<p class="kw-note">${esc(n.text)}</p>`).join('');
   const earned=data.ledger.filter(e=>task(e.taskId)?.topicId===t.id&&same(e.rangerId,actor().id)).reduce((sum,e)=>sum+e.points,0),remaining=known(ts.filter(t=>progress(t).status!=='approved'));
   sheetShell(t.title,`Kategorie ${t.sourceCategoryId} · Originales Fachwissen`,`${notes}<p>${actor().leader?ts.length+' Aufgaben':done(ts)+' von '+ts.length+' Aufgaben bestätigt'} · ${known(ts)} bekannte Quellpunkte${ts.some(t=>points(t)==null)?' · ungeklärte Werte enthalten':''}</p>${!actor().leader?`<p class="kw-topic-balance"><b>${earned} Punkte bestätigt</b><br>${remaining} bekannte Punkte bei offenen Aufgaben</p>`:''}<label>Aufgaben filtern<select data-kw-task-filter><option value="all">Alle Aufgaben</option><option value="new">Noch nicht begonnen</option><option value="working">In Arbeit</option><option value="submitted">Zur Prüfung eingereicht</option><option value="approved">Bestätigt</option><option value="needs-work">Überarbeitung nötig</option></select></label><div data-kw-task-list>${rows(ts)}</div>`);return;
  }
  if(step.kind==='task'&&!visible(task(step.id)))return sheetShell('Aufgabe derzeit gesperrt','Fachwissen','<p>Deine Leitung hat diese Aufgabe vorübergehend ausgeblendet.</p>');
  if(step.kind==='task')return sheetShell(topic(task(step.id).topicId).title,'Dein digitaler Logbuch-Eintrag',taskDetail(task(step.id)));
  if(step.kind==='ranking')return sheetShell('Eure Rangliste',v24StammName(),rankingHTML());
  if(step.kind==='arena')return sheetShell('Challenge-Arena','Zwei Ranger. Ein gemeinsames Ziel.',challenges());
  if(step.kind==='reviews'){
   if(!actor().leader)return closeSheet();
   const ps=Object.values(data.progress).filter(p=>p.status==='submitted');
   sheetShell('Aufgaben prüfen','Leiterbereich',`<p>${ps.length} Aufgaben warten auf Bestätigung.</p>${ps.map(p=>`<button class="kw-task-row" data-kw-action="review-task" data-kw-value="${esc(p.rangerId+'|'+p.taskId)}"><span><b>${esc(person(p.rangerId)?.alias||'Ranger')}</b><small>${esc(title(task(p.taskId)))} · ${pretty(p.submittedAt)}</small></span><span>Prüfen →</span></button>`).join('')||'<p>Alle eingereichten Aufgaben sind geprüft.</p>'}${button('issues','Quellwerte prüfen · '+C.issues.length+' Fälle')}`);return;
  }
  if(step.kind==='issues')return sheetShell('Quellwerte prüfen','Leiterbereich · keine Punkte raten',C.issues.map(i=>`<article class="kw-issue"><h3>${esc(i.topic)}</h3><p>${esc(i.reason)}</p>${button('task','Quelle und Klärung öffnen',i.taskId)}</article>`).join(''));
  if(step.kind==='ranger-audit'){
   const entries=data.ledger.filter(e=>same(e.rangerId,step.id));
   return sheetShell(person(step.id)?.alias||'Ranger','Leiterbereich · Punktnachweis',entries.map(e=>`<article class="kw-ledger"><b>${e.points>0?'+':''}${e.points} Punkte</b><p>${esc(title(task(e.taskId)))}</p><small>${pretty(e.at)} · ${esc(e.type==='reversal'?'Rückbuchung':'Gutschrift')}</small>${e.reason?'<p>'+esc(e.reason)+'</p>':''}${button('review-task','Nachweis öffnen',e.rangerId+'|'+e.taskId)}</article>`).join('')||'<p>Noch keine bestätigten Punkte.</p>');
  }
  if(step.kind==='choose-task')return sheetShell('Ein Ziel für euer Duell','Wähle zuerst eine Originalaufgabe',`<label>Aufgabe oder Thema suchen<input type="search" data-kw-choose-search placeholder="Zum Beispiel Astronomie …"></label><p>Die Leitung muss die Aufgabe für beide Ranger freigeben. Bereits bestandene Aufgaben sind ausgeschlossen.</p><div data-kw-choice-list>${rows(C.tasks.filter(t=>t.isPublished&&data.policies[t.id]?.published!==false&&progress(t).status!=='approved'))}</div>`);
  if(step.kind==='invite-form'){
   const t=task(step.id),deadline=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
   return sheetShell('Fordere einen Ranger heraus',t.sourceTopic,`<h3>${esc(title(t))}</h3><p>${esc(pointsLabel(t))} · keine Bonuspunkte</p><form data-kw-form="invite"><label>Mit wem möchtest du antreten?<select name="targetId" required><option value="">Ranger auswählen</option>${data.people.filter(p=>!same(p.id,actor().id)).map(p=>`<option value="${esc(p.id)}" ${same(step.targetId,p.id)?'selected':''}>${esc(p.alias)}</option>`).join('')}</select></label><label>Gemeinsame Frist<input name="deadline" type="date" required value="${deadline}"></label><p>Beide brauchen eine persönliche Leiterfreigabe. Nach Annahme zählt die frühere, später bestätigte Einreichung. Bis 60 Sekunden Unterschied: Unentschieden. Maximal drei eigene offene Einladungen. Ablehnen hat keine Nachteile.</p><button class="btn">Einladung speichern</button></form>`);
  }
 }
 async function command(type,payload){
  if(busy)return;busy=true;const before=actor()?.key;
  const buttons=dialog?.querySelectorAll('button')||[];buttons.forEach(b=>b.disabled=true);
  try{await transport.command(type,payload);if(actor()?.key!==before)return;await load();if(view==='knowledge')renderPage();if(view==='dash')dashboard();if(dialog)paint();feedback('Gespeichert.');}
  catch(e){if(actor()?.key===before){const el=dialog?.querySelector('[data-kw-error]');if(el){el.textContent=e.message;el.scrollIntoView({block:'nearest',behavior:'instant'});}else feedback(e.message);}}
  finally{busy=false;buttons.forEach(b=>b.disabled=false);}
 }
 function bind(scope){
  scope.querySelectorAll('[data-kw-action]').forEach(b=>b.onclick=async()=>{
   const id=b.dataset.kwValue,action=b.dataset.kwAction;
   if(action==='back')return back();if(action==='close')return closeSheet();
   if(action==='reload'){await refresh();return;}
   if(action==='map'){closeSheet();return goV17('knowledge');}
   if(action==='review-task'){const [rid,tid]=id.split('|');return open({kind:'task',id:tid,rid});}
   if(action==='task'){
    if(step?.kind==='choose-task')return open({kind:'invite-form',id,targetId:step.targetId});
    return open({kind:'task',id,rid:step?.rid});
   }
   if(action==='start')return command('start',{taskId:id});
   if(action==='accept'||action==='decline')return command('respond',{challengeId:id,accept:action==='accept'});
   if(action==='cancel')return command('cancel',{challengeId:id});
   if(action==='settle'){const reason=prompt('Begründung für den Abschluss nach Ablauf der Frist:');if(reason)return command('settle',{challengeId:id,reason});return;}
   open({kind:action,id,targetId:action==='choose-task'?id:undefined});
  });
  scope.querySelector('[data-kw-person]')?.addEventListener('change',e=>{step.rid=e.target.value;paint();});
  scope.querySelector('[data-kw-task-filter]')?.addEventListener('change',e=>{const ts=C.tasks.filter(t=>t.topicId===step.id&&visible(t)&&(e.target.value==='all'||progress(t).status===e.target.value));const list=scope.querySelector('[data-kw-task-list]');list.innerHTML=rows(ts)||'<p>Keine Aufgaben mit diesem Status.</p>';bind(list);});
  scope.querySelector('[data-kw-choose-search]')?.addEventListener('input',e=>{const q=e.target.value.toLocaleLowerCase('de');const list=scope.querySelector('[data-kw-choice-list]');list.innerHTML=rows(C.tasks.filter(t=>(t.originalText+' '+t.sourceTopic).toLocaleLowerCase('de').includes(q)&&progress(t).status!=='approved'&&data.policies[t.id]?.published!==false))||'<p>Keine passende Aufgabe.</p>';bind(list);});
  scope.querySelectorAll('[data-kw-filter]').forEach(el=>el.onchange=async()=>{filters[el.dataset.kwFilter]=el.value;await load();paint();});
  scope.querySelector('[data-kw-search]')?.addEventListener('input',e=>{filters.search=e.target.value;const caret=e.target.selectionStart;paint();const input=dialog.querySelector('[data-kw-search]');input.focus();input.setSelectionRange(caret,caret);});
  scope.querySelectorAll('[data-kw-form]').forEach(form=>{
   form.oninput=()=>{if(['submit','observe'].includes(form.dataset.kwForm))drafts.set(actor().key+':'+(step.rid??actor().id)+':'+step.id,Object.fromEntries(new FormData(form)));};
   form.onsubmit=e=>{
    e.preventDefault();if(!form.reportValidity())return;
    const f=Object.fromEntries(new FormData(form)),kind=form.dataset.kwForm,payload={...f,taskId:step.id,rangerId:step.rid??actor().id};
    if(kind==='review')payload.approved=e.submitter?.value==='approve';
    if(kind==='submit')payload.consent=!!f.consent;
    if(kind==='policy')payload.eligible=f.eligible==='true';
    if(kind==='publish'){payload.published=!!f.published;delete payload.rangerId;}
    if(kind==='invite')payload.deadline=f.deadline+'T21:59:59Z';
    command(kind==='publish'?'policy':kind,payload);
   };
  });
 }
 async function refresh(){
  const before=JSON.stringify(data);
  await load();if(!actor())return;
  if(view==='knowledge')renderPage();if(view==='dash')dashboard();
  if(dialog&&!busy&&before!==JSON.stringify(data)&&!dialog.querySelector('input:focus,textarea:focus,select:focus'))paint();
 }
 RH.setKnowledgeTransport=next=>{if(!next||!['load','command','subscribe'].every(k=>typeof next[k]==='function')||!['demo','online'].includes(next.mode))throw Error('Ungültiger Fachwissen-Transport.');unsubscribe?.();closeSheet();transport=next;data=null;unsubscribe=transport.subscribe(refresh);refresh();};
 RH.knowledgeTransportMode=()=>transport.mode;RH.refreshKnowledge=refresh;
 RH.openKnowledge=(kind='map',id)=>{if(kind==='map')goV17('knowledge');else open({kind,id});};
 // Dashboard opens at its new summary. Explicit growth-map returns keep locating.
 let returningToGrowth=false,lastView=null;
 const originalReturn=RH.returnToExpedition;
 RH.returnToExpedition=function(...args){returningToGrowth=true;try{return originalReturn.apply(this,args);}finally{returningToGrowth=false;}};
 const originalGo=goV17;
 goV17=function(next){const result=originalGo(next);if(next==='knowledge')window.scrollTo({top:0,behavior:'instant'});return result;};
 const originalRender=render;
 render=function(){
  const before=currentContext,next=actor()?.key,y=window.scrollY,previousView=lastView;if(before!==next){++generation;data=null;loadError='';filters={period:'all',category:'',team:'',search:''};closeSheet();currentContext=next;}
  else if(dialog&&view!=='knowledge'&&view!=='dash')closeSheet();
  originalRender();if(!actor())return;
  menus();if(view==='knowledge')renderPage();if(view==='dash')dashboard();refresh();lastView=view;
  if(view==='dash'&&actor()?.kind==='rangers'&&!returningToGrowth){
   const target=before===next&&previousView==='dash'?y:0;
   requestAnimationFrame(()=>{if(actor()?.key===next&&view==='dash')window.scrollTo({top:target,behavior:'instant'});});
  }
 };
 unsubscribe=transport.subscribe(refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&actor()&&['knowledge','dash'].includes(view))refresh();});
 const timer=setInterval(()=>{if(transport.mode==='online'&&!document.hidden&&actor()&&['knowledge','dash'].includes(view))refresh();},30000);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 render();RH.knowledgeReady=true;
})();
