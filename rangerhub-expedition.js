/* V26: a view of existing progress, with no new storage or role model. */
(() => {
  'use strict';
  const RH = window.RangerHub;
  const colors = ['#dfbd50', '#6badd0', '#3d4744', '#f5f3e8', '#957354'];
  const places = ['Waldlager im Tal', 'Fluss und Kompassstation', 'Felslager und Höhle', 'Aussicht im Hochgebirge', 'Gipfelkreuz und Rangerfahne'];
  const wide = { width: 1200, height: 650, points: [[120,535],[360,440],[590,350],[830,250],[1055,145],[1120,85]], paths: ['M120 535 C170 480 190 575 235 515 S300 420 360 440','M360 440 C400 465 415 375 475 405 S535 365 590 350','M590 350 C630 320 670 390 705 325 S770 225 830 250','M830 250 C880 275 905 175 960 200 S1015 105 1055 145','M1055 145 C1080 170 1105 115 1120 85'] };
  const narrow = { width: 400, height: 1450, points: [[115,1290],[285,1050],[125,800],[282,540],[145,290],[215,150]], paths: ['M115 1290 C45 1200 340 1225 285 1050','M285 1050 C350 940 75 925 125 800','M125 800 C55 690 340 685 282 540','M282 540 C340 430 70 435 145 290','M145 290 C95 230 255 245 215 150'] };
  const lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L20 5"/></svg>';
  const compass = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor"/><path d="m21 10-3 9-8 3 3-9z" fill="currentColor"/></svg>';
  const mobileView = () => matchMedia('(max-width:767px), (max-width:1023px) and (max-height:500px)').matches;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isOwnRanger = () => session?.kind === 'rangers' && !!v24Principal() && session.homeStammId === v24StammId && db.rangers.some(r => r.id === session.id && !r.archived);
  // This cache contains only the last visual position, never task records, and is never persisted.
  const seen = new Map();
  let resizeObserver = null, mountGeneration = 0, refreshQueued = false, dialogOrigin = null, activeAnimation = null;
  const ownKey = () => `${v24StammId}:${session.id}`;
  function snapshot() {
    if (!isOwnRanger()) return null;
    const progress = stages.map((stage, index) => {
      const c = v24Count(stage, session.id), total = Math.max(0, Number(c.total) || 0), done = Math.min(total, Math.max(0, Number(c.done) || 0));
      return { stage, index, done, total, fraction: total ? done / total : 0, percent: total ? Math.round(done / total * 100) : 0, complete: total > 0 && done === total, available: stageUnlockedForRanger(index, session.id) };
    });
    let officialIndex = 0;
    while (officialIndex < progress.length - 1 && progress[officialIndex].complete) officialIndex++;
    const total = progress.reduce((sum, p) => sum + p.total, 0), done = progress.reduce((sum, p) => sum + p.done, 0);
    return { key: ownKey(), officialIndex, official: stages[officialIndex], progress, total, done, percent: total ? Math.round(done / total * 100) : 0, position: officialIndex + progress[officialIndex].fraction };
  }
  RH.expeditionSnapshot = snapshot;
  const pine = (x, y, size, variant = '') => `<use href="#rh-tree-${variant || 'd'}" x="${x}" y="${y}" width="${size}" height="${size * 1.6}"/>`;
  function landscape(mobile) {
    const g = mobile ? narrow : wide, id = mobile ? 'm' : 'd';
    const defs = `<defs><linearGradient id="rh-sky-${id}" x2="0" y2="1"><stop stop-color="#f7f0df"/><stop offset="1" stop-color="#e4e9df"/></linearGradient><linearGradient id="rh-rock-${id}" x2=".8" y2="1"><stop stop-color="#aeb9b2"/><stop offset="1" stop-color="#697f79"/></linearGradient><linearGradient id="rh-ground-${id}" x2=".3" y2="1"><stop stop-color="#c8d4b6"/><stop offset="1" stop-color="#91aa83"/></linearGradient><symbol id="rh-tree-${id}" viewBox="0 0 30 48"><path d="M15 0 3 22h6L0 36h13v12h4V36h13L21 22h6z" fill="#456a58"/><path d="M15 7v29h12l-9-14h5z" fill="#345746"/></symbol><symbol id="rh-tent-${id}" viewBox="0 0 90 60"><path d="M5 52 41 4l41 48z" fill="#d5b579" stroke="#6f7255" stroke-width="2"/><path d="M41 4 34 52h48z" fill="#ead7a7"/><path d="m41 23-7 29h24z" fill="#4b604b"/><path d="M1 56h87M15 39l-9 17M71 39l13 17" fill="none" stroke="#6f7255" stroke-width="2"/></symbol><symbol id="rh-fire-${id}" viewBox="0 0 36 40"><ellipse cx="18" cy="34" rx="17" ry="5" fill="#7d8370"/><path d="m6 34 24-4M7 29l23 6" stroke="#775c40" stroke-width="4"/><path d="M18 30C1 28 14 17 13 11c8 4 5-8 9-11 0 13 18 23-4 30" fill="#d99e4a"/><path d="M18 28c-6-5 0-12 2-15 0 7 8 11-2 15" fill="#f3d47f"/></symbol><symbol id="rh-cross-${id}" viewBox="0 0 90 100"><path d="M34 90V5M12 30h44" stroke="#6b6651" stroke-width="6" stroke-linecap="round"/><path d="M63 92V15" stroke="#6b6651" stroke-width="3"/><path d="M65 16c11-9 18 6 27-2v32c-10 8-17-8-27 1z" fill="#315b48"/><path d="m77 22 2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="#e5d18c"/></symbol></defs>`;
    const scenery = mobile ? `
      <rect width="400" height="1450" fill="url(#rh-sky-m)"/><circle cx="305" cy="92" r="40" fill="#e9dcb6" opacity=".7"/>
      <path d="M0 365 80 235 140 282 213 105 295 223 345 175 400 275v1175H0z" fill="#c4cdc6"/><path d="m0 472 83-187 58 61 70-223 189 293v1034H0z" fill="url(#rh-rock-m)"/><path d="m161 268 50-145 75 115-49-26-21 31-17-22z" fill="#f1f1e6"/><path d="m250 442 70-116 80 90v1034H0V625l98-167 95 102z" fill="#a7b8a7"/>
      <path d="M0 820c125-95 210 45 400-80v710H0z" fill="#b5c5a7"/><path d="M0 1120c150-100 210 15 400-66v396H0z" fill="url(#rh-ground-m)"/>
      <path d="M340 940c-180 85 55 142-95 225s-140 177-86 285" fill="none" stroke="#94bdc7" stroke-width="28"/><path d="M340 940c-180 85 55 142-95 225s-140 177-86 285" fill="none" stroke="#c4dadd" stroke-width="3"/>
      ${[[18,1150,43],[320,1180,45],[30,1320,45],[304,1305,50],[190,1380,40],[17,985,45],[336,880,39],[15,890,31],[45,1080,33]].map(a=>pine(...a,'m')).join('')}
      <use href="#rh-tent-m" x="35" y="1222" width="86" height="58"/><use href="#rh-fire-m" x="171" y="1298" width="27" height="30"/>
      <g transform="translate(250 1012) rotate(-8)"><path d="M0 0h80v21H0z" fill="#9c835d"/><path d="M2 3h76M2 18h76M12-7v34M66-7v34" stroke="#6e775c" stroke-width="3"/></g>
      <g transform="translate(325 977)"><path d="M0 0v-38" stroke="#6a7255" stroke-width="4"/><circle cy="-39" r="13" fill="#f0e8ce" stroke="#7b8266" stroke-width="2"/><path d="m0-48 5 12-10-2z" fill="#5e7d64"/></g>
      <path d="m50 767 35-69 67 5 43 68z" fill="#8b9991"/><path d="M78 767c-2-58 66-70 69 0z" fill="#3d5550"/><path d="m32 842 27-20 30 20-8 12H35zM194 710l18-19 25 14-7 15z" fill="#8e9c91"/>
      <g transform="translate(268 493)"><path d="M0 0h70v14H0z" fill="#ae9670"/><path d="M7-23V0M63-23V0M7-19h56M20 14v15M56 14v22" stroke="#6d775d" stroke-width="3"/></g>
      <path d="m55 640 25-22 31 10-5 20zM327 392l27-35 32 27-7 23z" fill="#9ba99c"/><use href="#rh-cross-m" x="187" y="103" width="67" height="75"/>` : `
      <rect width="1200" height="650" fill="url(#rh-sky-d)"/><circle cx="150" cy="100" r="58" fill="#ece0bb" opacity=".7"/>
      <path d="M0 335 150 235 235 282 390 154 480 235 640 119 735 211 900 54 982 142 1110 35 1200 160v490H0z" fill="#d3dcd3"/>
      <path d="M310 650 535 289 617 335 790 130 875 227 1108 55 1200 200v450z" fill="url(#rh-rock-d)"/><path d="m1014 149 94-94 66 105-44-30-22 20-22-21-35 34zM747 197l43-67 64 80-38-20-23 10-13-20z" fill="#f3f1e5"/>
      <path d="M0 395c160-150 242-32 354-90s187 80 288 58 178-95 315-2 187 0 243 15v274H0z" fill="#b7c7b0"/>
      <path d="M0 500c177-70 242 43 403-20s203-65 344-18 272-93 453 13v175H0z" fill="url(#rh-ground-d)"/>
      <path d="M390 329c-125 64 74 117-35 169s-75 102-65 152" fill="none" stroke="#91b8c0" stroke-width="29"/><path d="M390 329c-125 64 74 117-35 169s-75 102-65 152" fill="none" stroke="#c6dfe0" stroke-width="3"/>
      ${[[10,410,54],[72,357,48],[161,368,52],[211,460,40],[13,535,57],[170,565,42],[420,475,43],[464,540,37],[250,323,35],[316,304,28],[693,409,31],[748,440,30],[928,382,28]].map(a=>pine(...a,'d')).join('')}
      <use href="#rh-tent-d" x="44" y="465" width="91" height="61"/><use href="#rh-fire-d" x="181" y="526" width="28" height="31"/>
      <g transform="translate(322 421) rotate(-15)"><path d="M0 0h76v22H0z" fill="#a88d65"/><path d="M2 3h72M2 19h72M12-8v37M64-8v37" stroke="#6f795c" stroke-width="3"/></g>
      <g transform="translate(407 405)"><path d="M0 0v-38" stroke="#6a7255" stroke-width="4"/><circle cy="-39" r="13" fill="#f0e8ce" stroke="#7b8266" stroke-width="2"/><path d="m0-48 5 12-10-2z" fill="#5e7d64"/></g>
      <path d="m520 330 37-69 68 8 36 66z" fill="#899990"/><path d="M550 332c-2-63 65-72 72 0z" fill="#3d5550"/><path d="m485 371 28-19 32 17-10 14zM665 304l21-22 30 14-9 20z" fill="#909e92"/>
      <g transform="translate(807 220)"><path d="M0 0h65v13H0z" fill="#b09b76"/><path d="M7-23V0M59-23V0M7-18h52M16 13v18M52 13v20" stroke="#707860" stroke-width="3"/></g>
      <path d="m900 303 28-27 32 20-10 18zM972 250l23-20 27 17-9 14z" fill="#9fae9f"/><use href="#rh-cross-d" x="1088" y="31" width="70" height="78"/>`;
    return `<svg class="expedition-scene expedition-scene-${id}" viewBox="0 0 ${g.width} ${g.height}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${defs}${scenery}<g class="expedition-trails">${g.paths.map((d,i)=>`<path d="${d}" class="trail-edge"/><path d="${d}" class="trail-base"/><path d="${d}" class="trail-walked" data-exp-path="${i}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>`).join('')}</g><g fill="#567054" opacity=".3">${g.points.slice(0,5).map(([x,y])=>`<ellipse cx="${x}" cy="${y+9}" rx="21" ry="8"/>`).join('')}</g></svg>`;
  }
  const activeGeometry = () => mobileView() ? narrow : wide;
  function pointAt(position) {
    const mobile = mobileView(), g = mobile ? narrow : wide;
    const index = Math.min(g.paths.length - 1, Math.max(0, Math.floor(position))), fraction = Math.min(1, Math.max(0, position - index));
    const path = document.querySelector(`.expedition-scene-${mobile?'m':'d'} [data-exp-path="${index}"]`);
    if (!path) return g.points[0];
    const point = path.getPointAtLength(path.getTotalLength() * fraction); return [point.x, point.y];
  }
  function positionMarker(position, from = position) {
    const map = document.querySelector('.expedition-landscape'), marker = map?.querySelector('.expedition-marker'); if (!map || !marker) return;
    const g = activeGeometry(), scaleX = map.clientWidth / g.width, scaleY = map.clientHeight / g.height;
    const transform = pos => { const [x,y] = pointAt(pos); return `translate3d(${x*scaleX}px,${y*scaleY}px,0) translate(-50%,-100%)`; };
    activeAnimation?.cancel(); marker.style.transform = transform(position);
    if (!reduced() && Math.abs(position-from)>0.0001 && marker.animate) {
      const frames = Array.from({length:25},(_,i)=>({transform:transform(from+(position-from)*i/24)}));
      activeAnimation = marker.animate(frames,{duration:750,easing:'cubic-bezier(.22,.61,.36,1)'});
    }
  }
  function updateMap(previous = null) {
    const state = snapshot(), section = document.querySelector('.expedition'); if (!state || !section) return;
    const current = state.progress[state.officialIndex];
    section.querySelector('[data-exp-current]').textContent = state.official;
    section.querySelector('[data-exp-percent]').textContent = current.total ? `${current.percent}%` : '—';
    section.querySelector('[data-exp-count]').textContent = current.total ? `${current.done} von ${current.total} Aufgaben bestätigt` : 'Noch keine Aufgaben hinterlegt';
    section.querySelector('[data-exp-total]').textContent = `${state.done} / ${state.total} auf dem gesamten Weg`;
    section.querySelectorAll('[data-exp-station]').forEach(button => {
      const p = state.progress[Number(button.dataset.expStation)];
      button.dataset.state = p.complete ? 'complete' : p.available ? 'open' : 'locked';
      button.classList.toggle('is-current', p.index === state.officialIndex);
      button.setAttribute('aria-label',`${p.stage}, ${places[p.index]}, ${p.total?p.percent+' Prozent':'keine Aufgaben hinterlegt'}, ${p.complete?'Aufgaben abgeschlossen':p.available?'freigeschaltet':'gesperrt'}`);
      button.querySelector('.exp-station-symbol').innerHTML = p.complete ? check : !p.available ? lock : String(p.index+1).padStart(2,'0');
      button.querySelector('.exp-station-percent').textContent = p.total ? `${p.percent}%` : '—';
      if (previous && !previous.progress[p.index].available && p.available) button.classList.add('just-unlocked');
    });
    section.querySelectorAll('[data-exp-path]').forEach(path => {
      const i = Number(path.dataset.expPath), fraction = i < state.officialIndex ? 1 : i === state.officialIndex ? current.fraction : 0;
      path.style.strokeDashoffset = String(100-fraction*100);
    });
    positionMarker(state.position,previous?.position ?? state.position);
    const feedback = section.querySelector('.expedition-feedback');
    if (previous) {
      const newly = state.progress.filter((p,i)=>p.available&&!previous.progress[i].available);
      const completed = state.progress.filter((p,i)=>p.complete&&!previous.progress[i].complete);
      feedback.textContent = completed.length ? `${completed.map(p=>p.stage).join(', ')} abgeschlossen.${previous.officialIndex!==state.officialIndex?' Deine offizielle Stufe ist jetzt '+state.official+'.':''}` : newly.length ? `${newly.map(p=>p.stage).join(', ')} ist jetzt freigeschaltet.` : '';
    }
    seen.set(state.key,{position:state.position,officialIndex:state.officialIndex,progress:state.progress.map(p=>({available:p.available,complete:p.complete}))});
  }
  function mount() {
    const state = snapshot(), host = RH.content(); if (!state || !host || view !== 'dash') return;
    const anchor = host.querySelector('.dash-intro'); if (!anchor) return;
    const countdown = anchor.querySelector('.countdown-note');
    const previous = seen.get(state.key), firstVisit = !previous;
    const guide = typeof v21PathArt === 'string' ? `<svg class="expedition-guide" viewBox="375 195 285 355" aria-hidden="true"><image href="${esc(v21PathArt)}" x="0" y="0" width="1112" height="1578"/></svg>` : '';
    anchor.outerHTML = `<section class="expedition" aria-label="Deine persönliche Expeditionskarte"><header class="expedition-heading"><div><span class="expedition-eyebrow">DEIN PERSÖNLICHES LOGBUCH</span><h1>Deine Expedition.</h1><p>Vom Waldlager bis zum Gipfel.</p></div>${guide}</header><div class="expedition-status"><span class="expedition-current"><small>Offizielle Stufe</small><b data-exp-current></b></span><strong data-exp-percent></strong><span class="expedition-count"><span data-exp-count></span><small data-exp-total></small></span><button type="button" class="expedition-locate" aria-label="Meinen Standort auf der Karte anzeigen">${compass}</button></div><div class="expedition-landscape">${landscape(false)}${landscape(true)}<div class="expedition-stations">${stages.map((stage,i)=>`<button type="button" class="expedition-station" data-exp-station="${i}" style="--station-color:${colors[i]};--dx:${wide.points[i][0]/12}%;--dy:${wide.points[i][1]/6.5}%;--mx:${narrow.points[i][0]/4}%;--my:${narrow.points[i][1]/14.5}%"><span class="exp-station-symbol" aria-hidden="true"></span><span class="exp-station-label"><b>${stage}</b><small>${places[i]}</small></span><span class="exp-station-percent"></span></button>`).join('')}</div><div class="expedition-marker" aria-hidden="true"><span>${compass}</span><small>Dein Standort</small></div></div><div class="expedition-bottom"><p>Die nächste Stufe öffnet sich ab 80%. Deine offizielle Stufe wechselt erst bei vollständigem Abschluss.</p><span class="expedition-legend"><i></i>Dein zurückgelegter Weg</span></div><p class="expedition-feedback" role="status" aria-live="polite"></p></section>`;
    const map = host.querySelector('.expedition');
    const side=document.querySelector('.side');
    const stickyTop=()=>side&&['sticky','fixed'].includes(getComputedStyle(side).position)?side.offsetHeight:0;
    map.style.setProperty('--expedition-sticky-top',stickyTop()+'px');
    if (countdown) { const followup=document.createElement('div');followup.className='expedition-followup';followup.appendChild(countdown);map.after(followup); }
    const weather=host.querySelector('.dash-editorial>.current-weather');if(weather)map.after(weather);
    map.querySelectorAll('[data-exp-station]').forEach(button => button.onclick = () => RH.openExpeditionStation(Number(button.dataset.expStation)));
    const locate=behavior=>{
      const marker=map.querySelector('.expedition-marker'),r=marker.getBoundingClientRect(),sticky=mobileView()?stickyTop()+map.querySelector('.expedition-status').offsetHeight:0;
      const top=Math.max(0,window.scrollY+r.top+r.height/2-(innerHeight+sticky)/2);
      if(behavior==='instant'){
        const root=document.documentElement,old=root.style.getPropertyValue('scroll-behavior'),priority=root.style.getPropertyPriority('scroll-behavior');
        root.style.setProperty('scroll-behavior','auto','important');window.scrollTo({top,behavior:'auto'});
        if(old)root.style.setProperty('scroll-behavior',old,priority);else root.style.removeProperty('scroll-behavior');
      }else window.scrollTo({top,behavior});
    };
    map.querySelector('.expedition-locate').onclick = () => locate(reduced()?'instant':'smooth');
    updateMap(previous);
    const terrain=map.querySelector('.expedition-landscape');let lastWidth=terrain.clientWidth,lastHeight=terrain.clientHeight,lastTop=stickyTop();
    resizeObserver?.disconnect(); resizeObserver = new ResizeObserver(()=>{const top=stickyTop();if(terrain.clientWidth===lastWidth&&terrain.clientHeight===lastHeight&&top===lastTop)return;lastWidth=terrain.clientWidth;lastHeight=terrain.clientHeight;lastTop=top;map.style.setProperty('--expedition-sticky-top',top+'px');const s=snapshot();if(s&&map.isConnected)positionMarker(s.position);}); resizeObserver.observe(terrain);if(side)resizeObserver.observe(side);
    const generation = ++mountGeneration;
    if (mobileView()) requestAnimationFrame(()=>{if(generation===mountGeneration&&map.isConnected)locate('instant');});
    if (firstVisit) map.dataset.initialVisit = 'true';
  }
  function addReturn(scope = RH.content()) {
    if (!isOwnRanger() || !scope || scope.querySelector('[data-exp-return]')) return;
    const back = document.createElement('button'); back.type='button';back.className='btn alt expedition-return';back.dataset.expReturn='';back.textContent='← Zur Expeditionskarte';back.onclick=RH.returnToExpedition;scope.prepend(back);
  }
  RH.returnToExpedition = () => { if (!isOwnRanger()) return; closeM();view='dash';render(); };
  const oldClose = closeM;
  closeM = function () {
    const expDialog = box.dataset.expeditionDialog === 'true', origin = dialogOrigin;
    if (expDialog) { delete box.dataset.expeditionDialog;box.removeAttribute('role');box.removeAttribute('aria-modal');box.removeAttribute('aria-labelledby');box.removeEventListener('keydown',trapFocus);dialogOrigin=null; }
    oldClose(); if(expDialog&&origin?.isConnected)origin.focus({preventScroll:true});
  };
  function trapFocus(event) {
    if(event.key==='Escape'){event.preventDefault();closeM();return;}
    if(event.key!=='Tab')return;
    const focusable=[...box.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&(document.activeElement===first||document.activeElement.tagName==='H2')){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||document.activeElement.tagName==='H2')){event.preventDefault();first?.focus();}
  }
  const pdfs = () => typeof v19Pdfs !== 'undefined' ? v19Pdfs : typeof obsPdfs !== 'undefined' ? obsPdfs : {};
  RH.expeditionDownload = key => {
    if(!isOwnRanger()||!['A','B','C','R'].includes(key)||!pdfs()[key])return;
    if(RH.packageUnlocked&&!RH.packageUnlocked(session.id,key))return;
    downloadData(pdfs()[key],`Beobachter_${key==='R'?'Reflexionsbogen':'Aufgabenpaket_'+key}.pdf`);
  };
  RH.openExpeditionStation = index => {
    const state=snapshot();index=Number(index);if(!state||!Number.isInteger(index)||!state.progress[index])return;
    const p=state.progress[index], current=state.progress[state.officialIndex], earned=p.complete&&state.progress.slice(0,index).every(x=>x.complete);
    const blocker=state.progress.slice(0,index).find(x=>!x.total||x.fraction<.8);
    const message=!p.available?`Erreiche zunächst 80% bei ${blocker?.stage||stages[index-1]}, um ${p.stage} freizuschalten.`:!p.total?'Für diese Stufe sind noch keine Aufgaben hinterlegt.':p.complete?'Alle Aufgaben dieser Etappe sind abgeschlossen.':index<4&&p.fraction<.8?`Ab 80% bei ${p.stage} wird ${stages[index+1]} zugänglich.`:index<4?`${stages[index+1]} ist bereits zugänglich. Die offizielle Hochstufung folgt bei 100%.`:'Der Gipfel ist dein Ziel. Mit allen bestätigten Aufgaben ist diese Etappe abgeschlossen.';
    dialogOrigin=document.activeElement;
    box.innerHTML=`<div class="expedition-detail"><div class="exp-detail-top"><span class="expedition-eyebrow">${places[index]}</span><button type="button" class="btn alt" onclick="closeM()" aria-label="Stationsdetails schließen">Schließen</button></div><span class="exp-detail-scarf ${earned?'is-earned':''}" style="--station-color:${colors[index]}" aria-hidden="true"></span><h2 id="expedition-detail-title" tabindex="-1">${p.stage}</h2><p class="exp-detail-subtitle">${esc(v21StageSubtitles[index])}${earned?' · erreicht':''}</p><div class="exp-detail-progress"><strong>${p.total?p.percent+'%':'—'}</strong><span>${p.done} erledigt<br>${Math.max(0,p.total-p.done)} offen</span></div><div class="exp-detail-track" role="progressbar" aria-label="Fortschritt ${p.stage}" aria-valuemin="0" aria-valuemax="${p.total||1}" aria-valuenow="${p.done}"><i style="width:${p.percent}%"></i></div><p class="exp-detail-notice">${!p.available?lock:''}${message}</p>${p.available?`<p class="exp-detail-official">Deine offizielle Stufe: <b>${state.official}</b>${index!==state.officialIndex&&!p.complete?' · Diese Etappe ist bereits freigeschaltet.':''}</p><div class="exp-detail-actions"><button type="button" class="btn" onclick="RangerHub.openExpeditionTasks(${index})">Aufgaben öffnen</button><button type="button" class="btn alt" onclick="RangerHub.openExpeditionLogbook(${index})">Logbuch und Inhalte</button></div>${index===0&&Object.keys(pdfs()).some(k=>pdfs()[k])?`<div class="exp-detail-pdfs"><h3>Logbuch-PDFs</h3>${['A','B','C','R'].filter(k=>pdfs()[k]).map(k=>`<button type="button" class="btn alt sm" ${RH.packageUnlocked&&!RH.packageUnlocked(session.id,k)?'disabled':''} onclick="RangerHub.expeditionDownload('${k}')">${k==='R'?'Reflexionsbogen':'Aufgabenpaket '+k} herunterladen</button>`).join('')}</div>`:''}`:''}<button type="button" class="exp-detail-back" onclick="closeM()">← Zur Expeditionskarte</button></div>`;
    box.dataset.expeditionDialog='true';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','expedition-detail-title');box.addEventListener('keydown',trapFocus);
    openM();box.querySelector('h2').focus({preventScroll:true});
  };
  RH.openExpeditionTasks = index => {
    const state=snapshot(), p=state?.progress[Number(index)];if(!p||!p.available)return;
    closeM();if(p.index===0)observerTasks(session.id);else openRangerStageV19(p.stage,session.id);addReturn();
  };
  RH.openExpeditionLogbook = index => {
    const state=snapshot(),p=state?.progress[Number(index)];if(!p||!p.available)return;
    closeM();if(p.index===0){openObserverIntro();addReturn();}else{openStageV15(p.stage);addReturn(box);}
  };
  for(const name of ['observerTasks','openRangerStageV19','openObserverIntro']) {
    const previous=window[name];window[name]=function(...args){const result=previous.apply(this,args);if(isOwnRanger())addReturn();return result;};
  }
  const previousPersist=v24Persist;
  v24Persist=function(...args){const result=previousPersist.apply(this,args);if(!refreshQueued){refreshQueued=true;queueMicrotask(()=>{refreshQueued=false;if(isOwnRanger()&&view==='dash'&&document.querySelector('.expedition'))updateMap(seen.get(ownKey()));});}return result;};
  const previousDash=dash;
  dash=function(){previousDash();if(isOwnRanger())mount();};
  const previousRender=render;
  render=function(){resizeObserver?.disconnect();activeAnimation?.cancel();mountGeneration++;return previousRender();};
  const stylesheet=document.querySelector('[data-rangerhub-expedition]');if(stylesheet)document.head.appendChild(stylesheet);
  render();RH.expeditionReady=true;
})();
