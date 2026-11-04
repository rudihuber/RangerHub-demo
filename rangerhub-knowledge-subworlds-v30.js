/* Five original SVG scenes and reusable, tangible buildings for the existing regions. */
(() => {
 'use strict';const RH=window.RangerHub;
 const palettes={forest:['#e9edd9','#547759','#bdc79e'],discovery:['#dce4e5','#526b77','#b0c2b3'],rescue:['#e6eadb','#688a87','#b0c8be'],craft:['#f0e0bd','#95734c','#c6ad78'],village:['#edecd4','#5f795b','#c4c59a']};
 RH.knowledgePlaceArt=(icon,scene='village')=>{
  const p=palettes[scene]||palettes.village;
  let art=`<path d="M16 49h70v42H16z" fill="#d4bd91" stroke="#7c805e" stroke-width="1.5"/><path d="m7 50 44-33 49 33z" fill="${p[1]}"/><path d="M44 91V62h20v29M23 62h12v12H23m49-12h9v12h-9" fill="#f6e9bf" stroke="#8b8966"/>`;
  if(['hut','workshop','house','hall','media','art','library','church','pot','needle','music'].includes(icon)){
   if(icon==='church')art+=`<path d="M56 26V5m-8 7h16" stroke="#6b7654" stroke-width="4"/><path d="M46 33V15h20v18" fill="#d8c39b"/><path d="M52 22v10h9V22z" fill="#a5b49b"/>`;
   else if(icon==='library')art+=`<path d="M11 85h29V54c-14-5-23-3-29-1zm29 0h29V53c-14-3-23-2-29 1z" fill="#f6e8ba" stroke="#7a805a" stroke-width="2"/><path d="M40 55v30" stroke="#7a805a"/>`;
   else if(icon==='music')art+=`<path d="M57 46v22m0-20 17-4v20" fill="none" stroke="#f8eccb" stroke-width="3"/><ellipse cx="52" cy="69" rx="6" ry="4" fill="#f8eccb"/><ellipse cx="69" cy="65" rx="6" ry="4" fill="#f8eccb"/>`;
   else if(icon==='art')art+=`<ellipse cx="54" cy="49" rx="19" ry="13" fill="#ead199"/><circle cx="46" cy="46" r="3" fill="#68907a"/><circle cx="55" cy="43" r="3" fill="#a76e4e"/><circle cx="63" cy="48" r="3" fill="#d7b94f"/>`;
   else if(icon==='workshop')art+=`<path d="m38 58 26-20m-15 2 13 15m1-24 13 16" stroke="#d7be8c" stroke-width="6" stroke-linecap="round"/>`;
   else if(icon==='media')art+=`<rect x="32" y="38" width="40" height="24" rx="2" fill="#dacba8"/><path d="m49 44 14 6-14 7z" fill="${p[1]}"/>`;
   else if(icon==='needle')art+=`<path d="m32 58 33-26q9 8 0 14L39 72m-1-11q-10-8-15 3t10 11" fill="none" stroke="#f6dfb1" stroke-width="3"/>`;
   else if(icon==='pot')art+=`<path d="M29 44h45v22q-23 15-45 0zm-4 0h53M39 35q-7-9 0-17m17 17q-7-9 0-17" fill="none" stroke="#f3ddb0" stroke-width="3"/>`;
   else if(icon==='hall')art+=`<path d="M24 54h54m-48 0v23m15-23v23m15-23v23m13-23v23" stroke="#f7e5b9" stroke-width="5"/>`;
  }
  if(['tower','observatory','mountain','tent','aid','boat','bike','fitness','lifebuoy','tree','fire','fish','garden','bird','deer','bow','globe'].includes(icon)){
   const special={
    tower:`<path d="M29 88 37 24h32l10 64M24 31h58M37 46h33M35 64h39" stroke="#7c805e" fill="#bdab83" stroke-width="3"/><path d="M24 23h58V11H24z" fill="${p[1]}"/><path d="M53 9V0l25 5-25 5" fill="#d4b25c"/>`,
    observatory:`<path d="M18 85V53h73v32z" fill="#d7c7a4"/><path d="M10 54c0-52 90-52 89 0z" fill="${p[1]}"/><path d="m52 43 28-19m-10-8 16 21" stroke="#e9d8ae" stroke-width="9"/><path d="M48 85V64h17v21" fill="#9baf9c"/>`,
    mountain:`<path d="m4 88 36-70 22 33 18-23 28 60z" fill="#81998b"/><path d="m26 45 14-27 20 30-15-7-8 9z" fill="#f7f0db"/><path d="m73 88 7-60 28 60" fill="#5c7a70"/>`,
    tent:`<path d="m5 88 42-65 56 65z" fill="#ddbd74" stroke="#8b865b" stroke-width="2"/><path d="M47 23 37 88h66z" fill="#ead3a2"/><path d="m47 47-10 41h34z" fill="#446851"/>`,
    aid:`<path d="m5 88 42-65 56 65z" fill="#eddec0" stroke="#8b865b" stroke-width="2"/><path d="M55 51v30m-15-15h30" stroke="#a6684e" stroke-width="9"/>`,
    boat:`<path d="M7 63q45 43 93 0z" fill="#a87e51"/><path d="M9 63q44-19 89 0" fill="#e2c995"/><path d="m25 20 58 64m-8-4 15 11" stroke="#7a845f" stroke-width="4"/><path d="M0 88q27-9 54 0t54 0" fill="none" stroke="#8db2b0" stroke-width="3"/>`,
    bike:`<g fill="none" stroke="#55745b" stroke-width="3"><circle cx="22" cy="73" r="17"/><circle cx="83" cy="73" r="17"/><path d="m22 73 20-35 18 35H22l27-23h25l9 23M70 30h13M35 33h14"/></g>`,
    fitness:`<path d="M13 81h87M30 24v57m46-57v57M30 27h46" stroke="#74815d" stroke-width="5"/><circle cx="53" cy="42" r="8" fill="#c9a86f"/><path d="M53 51v20m0-15-16-15m16 15 15-15m-15 29-11 15m11-15 12 15" stroke="#446c50" stroke-width="4"/>`,
    lifebuoy:`<circle cx="53" cy="55" r="31" fill="#efdeb6" stroke="#a07552" stroke-width="2"/><circle cx="53" cy="55" r="16" fill="#a4c3ba"/><path d="m31 33 11 11m22 22 11 11M31 77l11-11m22-22 11-11" stroke="#a37054" stroke-width="10"/>`,
    tree:`<path d="M52 7 24 43h12L13 74h32v20h13V74h34L69 43h13z" fill="${p[1]}"/><path d="M52 7v67h40L69 43h13z" fill="#3f644f"/>`,
    fire:`<ellipse cx="52" cy="89" rx="40" ry="9" fill="#a7aa83"/><path d="m20 87 63-10m-60 1 60 12" stroke="#8d7251" stroke-width="8"/><path d="M50 77C10 66 43 36 37 18c22 10 21-9 28-18-4 31 47 61-15 77" fill="#c98d48"/><path d="M49 70c-21-11 4-32 5-45 0 19 30 36-5 45" fill="#f0d58f"/>`,
    fish:`<path d="M13 59q34-47 73 0-39 43-73 0Zm71 0 20-18v36z" fill="#8ba59a" stroke="#627f72" stroke-width="2"/><circle cx="32" cy="52" r="3" fill="#355748"/><path d="M7 86h96M80 14Q30 5 25 34" fill="none" stroke="#a88c5c" stroke-width="3"/>`,
    garden:`<path d="M13 87h84M26 86V45m29 42V24m27 62V51" stroke="#7d8b58" stroke-width="3"/><path d="M26 58C0 58 7 28 26 45c23-17 32 12 0 13M55 36c-29 0-25-29 0-12 22-22 34 8 0 12M82 61c-27 0-23-28 0-10 22-15 33 11 0 10" fill="#89a477"/>`,
    bird:`<path d="M9 78h96M44 77V30h26v47M35 32l22-19 25 19z" fill="#c9b180" stroke="#7f855e" stroke-width="2"/><circle cx="57" cy="45" r="6" fill="#4d7256"/><path d="M9 19q10-14 20 0 11-14 21 0" fill="none" stroke="#6f8c73" stroke-width="3"/>`,
    deer:`<path d="M23 82 39 60l31 3 10 20M39 60l-6-25 18 9m19 19 5-24 15-7M36 39 27 17m6 14 12-13m33 23 8-26m-4 13 17-9" fill="none" stroke="#8e805c" stroke-width="5" stroke-linecap="round"/>`,
    bow:`<path d="M26 10q76 37 0 79l18-38z" fill="none" stroke="#98784e" stroke-width="3"/><path d="M31 51h70m-12-7 12 7-12 7" stroke="#4f7357" fill="none" stroke-width="3"/>`,
    globe:`<circle cx="55" cy="46" r="31" fill="#b4c8ac" stroke="#74896c" stroke-width="2"/><ellipse cx="55" cy="46" rx="15" ry="31" fill="none" stroke="#74896c"/><path d="M24 46h62M31 27h48M31 65h48M55 77v16M35 94h40" stroke="#74896c" fill="none" stroke-width="2"/>`
   };art=special[icon]||art;
  }
  return `<svg viewBox="0 0 110 105" aria-hidden="true" focusable="false"><ellipse cx="55" cy="95" rx="47" ry="8" fill="#7f8e5c" opacity=".15"/>${art}</svg>`;
 };
 RH.knowledgeSubworld=(region,locations,topics,tasks,progress,mini=false)=>{
  const scene=region.scene||'village',pal=palettes[scene]||palettes.village,n=locations.length,cols=n>7?4:3,rows=Math.max(2,Math.ceil(n/cols)),height=Math.max(600,rows*190),mobileHeight=Math.max(610,Math.ceil(n/2)*195+170),ns='sw-'+region.id.replace(/[^a-z0-9]/gi,'');
  const pine=(x,y,s)=>`<path d="m${x} ${y} ${-s/2} ${s}h${s/4}l${-s/2} ${s}h${s*1.5}l${-s/2} ${-s}h${s/4}z" fill="${pal[1]}" opacity=".7"/>`;
  const sceneArt=mobile=>{
   const w=mobile?480:1200,h=mobile?mobileHeight:height;
   let land=`<rect width="${w}" height="${h}" fill="${pal[0]}"/><path d="M0 ${h*.22}Q${w*.2} ${h*.02} ${w*.5} ${h*.2}T${w} ${h*.12}V${h}H0z" fill="${pal[2]}" opacity=".32"/>`;
   if(scene==='discovery')land=`<defs><linearGradient id="${ns}-${mobile?'m':'d'}" x2="0" y2="1"><stop stop-color="#274954"/><stop offset=".4" stop-color="#9db7b3"/><stop offset="1" stop-color="#e4e9d9"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${ns}-${mobile?'m':'d'})"/><circle cx="${w*.83}" cy="${h*.11}" r="32" fill="#eddb9e"/>${[[.1,.07],[.22,.13],[.36,.05],[.55,.14],[.65,.06]].map(([x,y])=>`<path d="m${w*x} ${h*y} 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#f1e7c8"/>`).join('')}<path d="M0 ${h*.35} ${w*.2} ${h*.19} ${w*.31} ${h*.31} ${w*.5} ${h*.2} ${w*.68} ${h*.38} ${w} ${h*.22}V${h}H0z" fill="#c1d0be"/>`;
   if(scene==='rescue')land+=`<path d="M${w*.52} ${-40}C${w*.1} ${h*.25} ${w*.9} ${h*.4} ${w*.6} ${h}H${w}V0z" fill="#99bcb7"/><path d="M${w*.62} 0C${w*.3} ${h*.3} ${w*.95} ${h*.45} ${w*.75} ${h}" fill="none" stroke="#d8e5cf" stroke-width="5"/>`;
   if(scene==='forest')land+=`${pine(w*.04,h*.08,55)}${pine(w*.88,h*.18,65)}${pine(w*.03,h*.47,70)}${pine(w*.89,h*.68,54)}<path d="M${w*.7} 0q${-w*.6} ${h*.35} 0 ${h*.5}t${-w*.12} ${h*.5}" fill="none" stroke="#9bb7ad" stroke-width="24"/>`;
   if(scene==='craft')land+=`<path d="M0 ${h*.82}Q${w*.4} ${h*.7} ${w} ${h*.9}V${h}H0z" fill="#b8be94" opacity=".65"/><g fill="none" stroke="#ad986b" stroke-width="2" opacity=".4"><path d="M0 ${h*.12}h${w}M0 ${h*.28}h${w}M0 ${h*.6}h${w}"/></g>`;
   if(scene==='village')land+=`<ellipse cx="${w*.49}" cy="${h*.53}" rx="${w*.23}" ry="${h*.19}" fill="#ddcfaa"/><ellipse cx="${w*.49}" cy="${h*.53}" rx="${w*.17}" ry="${h*.14}" fill="none" stroke="#b7ad7d" stroke-width="2"/>${pine(w*.02,h*.1,45)}${pine(w*.92,h*.8,55)}`;
   land+=`<path d="M${w*.15} ${h*.1}Q${w*.85} ${h*.3} ${w*.25} ${h*.55}T${w*.8} ${h*.93}" fill="none" stroke="#c5b78b" stroke-width="18" opacity=".65"/><path d="M${w*.15} ${h*.1}Q${w*.85} ${h*.3} ${w*.25} ${h*.55}T${w*.8} ${h*.93}" fill="none" stroke="#f0e6ca" stroke-width="11"/>`;
   return `<svg class="kw-sub-scene ${mobile?'is-mobile':'is-desktop'}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${land}</svg>`;
  };
  return `<div class="kw-subworld scene-${esc(scene)}" role="group" aria-label="Interaktive Unterwelt ${esc(region.title)}" style="--desktop-min-height:${rows*165+70}px;--world-height:${height}px;--mobile-height:${mobileHeight}px">${sceneArt(false)}${sceneArt(true)}<span class="kw-subworld-caption">${esc(region.description||({forest:'Zwischen Waldlager und Feuerplatz',discovery:'Unterwegs zwischen Himmel und Erde',rescue:'Helfen. Bewegen. Verantwortung übernehmen.',craft:'Aus Ideen wird etwas Eigenes.',village:'Wissen entdecken. Gemeinschaft leben.'})[scene]||'Wähle deinen nächsten Themenort.')}</span>${locations.map((l,i)=>{
   const ts=topics.filter(t=>t.locationId===l.id&&t.visible),tasklist=tasks.filter(t=>ts.some(x=>x.id===t.topicId)&&t.visible),done=tasklist.filter(t=>progress(t).status==='approved').length;
   const row=Math.floor(i/cols),col=i%cols,left=l.x??(cols===4?14+col*24:18+col*32),top=l.y??(22+row*(63/(rows-1))),mx=l.mobileX??(i%2?73:27),my=l.mobileY??((145+Math.floor(i/2)*195)/mobileHeight*100);
   return `<button class="kw-location" type="button" data-kw-action="location" data-kw-value="${esc(l.id)}" style="--lx:${left}%;--ly:${top}%;--lmx:${mx}%;--lmy:${my}%" aria-label="${esc(l.title)}, ${esc(ts.map(t=>t.title).join(', '))} öffnen">${RH.knowledgePlaceArt(l.icon,scene)}<span class="kw-location-name">${esc(l.title)}</span><small>${esc(ts.map(t=>t.title).join(' · ')||'Noch kein Thema zugeordnet')}</small><span class="kw-location-progress">${done}/${tasklist.length} bestanden</span></button>`;
  }).join('')}</div>`;
 };
})();
