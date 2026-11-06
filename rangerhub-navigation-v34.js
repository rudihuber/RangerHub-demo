/* One menu declaration, existing RangerHub identities/routes, and preferences inside rhv9. */
(() => {
 'use strict';
 const RH=window.RangerHub;
 const storageKey=document.querySelector('meta[name="rangerhub-storage"]')?.content;
 const remembered=new Map();let latest=null;
 const knownLegacy=new Set(['dash','messages','meetings','tasks','calendar','abs','rangers','leaders','leadermeetings','path','activities','nature','recipes','impulses','lastmeeting']);
 const leaderOnly=new Set(['meetings','leadermeetings','tasks','rangers','leaders','nature','activities','recipes','impulses','lastmeeting']);
 const icons={
  dashboard:'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>',
  messages:'<path d="M21 14a3 3 0 0 1-3 3H9l-6 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3ZM7 7h10M7 11h7"/>',
  trophy:'<path d="M7 3h10v6a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 5 4M17 5h4v3a4 4 0 0 1-5 4M12 14v5M8 21h8M9 19h6"/>',
  bible:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  growth:'<path d="m2 21 8-17 4 8 3-5 5 14ZM7 11l3 2 3-2m3 6 2-2 2 2"/>',
  calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 2v4m10-4v4M3 10h18m-13 5h3m3 0h3m-9 3h3"/>',
  participation:'<path d="M8 3h8v4H8ZM7 5H4v17h16V5h-3M8 14l3 3 5-6"/>',
  wisdom:'<path d="M4 3h16v18H4ZM8 3v8l3-2 3 2V3M8 16h8"/>',
  meetings:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 2v4m10-4v4M3 10h18m-13 5 3 3 5-5"/>',
  tasks:'<path d="M9 5h12M9 12h12M9 19h12M2 4l2 2 3-4M2 11l2 2 3-4M2 18l2 2 3-4"/>',
  rangers:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m2 11v-3a6 6 0 0 0-2-4"/>',
  leaders:'<circle cx="12" cy="7" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2M2 4l2 1m16 0 2-1M2 10h3m14 0h3"/>',
  leadermeetings:'<circle cx="12" cy="5" r="2"/><circle cx="4" cy="11" r="2"/><circle cx="20" cy="11" r="2"/><path d="M8 12a4 4 0 0 1 8 0M1 21v-3a3 3 0 0 1 6 0v3m10 0v-3a3 3 0 0 1 6 0v3M8 19h8"/>',
  actions:'<path d="m12 2 2.5 6 6.5 1-5 4.5 1.5 6.5-5.5-3.5L6.5 20 8 13.5 3 9l6.5-1Z"/>',
  nature:'<path d="M19 3C9 1 2 8 5 15c4 7 16 1 14-12ZM4 21 15 9M8 16l-1-5m5 1 5 1"/>',
  recipes:'<path d="M6 10a4 4 0 0 1 1-8 6 6 0 0 1 10 0 4 4 0 0 1 1 8v11H6Zm0 6h12M9 10v3m6-3v3"/>',
  impulses:'<path d="M8 15c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7M8 18h8m-7 3h6M12 4v6m-3-3h6"/>',
  edit:'<path d="m15 3 6 6-11 11-7 1 1-7ZM12 6l6 6M3 21h18"/>',
  logout:'<path d="M9 3H3v18h6m6-14 5 5-5 5m-8-5h13"/>'
 };
 const svg=id=>`<svg class="rh-nav-icon rh33-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[id]||icons.edit}</svg>`;
 const rows={
  dashboard:{label:'Dashboard',icon:'dashboard',legacy:'dash'},messages:{label:'Nachrichten',icon:'messages',legacy:'messages',attr:'data-message-nav'},
  knowledge:{label:'Fachwissen-Challenges',icon:'trophy',kind:'map',hint:'Aufgaben meistern · Punkte sammeln',attr:'data-knowledge-nav'},
  bible:{label:'Bibelreise',icon:'bible',kind:'bible',hint:'66 Bücher entdecken',attr:'data-bible-nav'},
  growth:{label:'Wachstumspfad',icon:'growth',legacy:'path',hint:'Deine Stufen und Fortschritte'},
  calendar:{label:'Kalender',rangerLabel:'Kalender & Treffen',icon:'calendar',legacy:'calendar'},participation:{label:'Teilnahme',icon:'participation',legacy:'abs'},
  wisdom:{label:'Ranger-Bibliothek',icon:'wisdom',kind:'wisdom',hint:'Regeln, Emblem, Kluft & Werte',attr:'data-wisdom-nav'},
  meetings:{label:'Ranger-Treffen',icon:'meetings',legacy:'meetings'},exams:{label:'Fachwissen-Prüfungen',icon:'tasks',kind:'exams',attr:'data-knowledge-exams-nav',counter:'exams'},
  tasks:{label:'Meine Aufgaben',icon:'tasks',legacy:'tasks',counter:'tasks'},rangers:{label:'Ranger-Team',icon:'rangers',legacy:'rangers'},leaders:{label:'Leiterteam',icon:'leaders',legacy:'leaders'},
  leadermeetings:{label:'Leitermeetings',icon:'leadermeetings',legacy:'leadermeetings'},actions:{label:'Aktionen',icon:'actions',legacy:'activities'},nature:{label:'Naturphänomene',icon:'nature',legacy:'nature'},
  recipes:{label:'Rezepte',icon:'recipes',legacy:'recipes',attr:'data-recipe-nav'},impulses:{label:'Impulse',icon:'impulses',legacy:'impulses',attr:'data-impulse-nav'},
  'knowledge-manage':{label:'Fachwissen verwalten',icon:'edit',kind:'manage',attr:'data-knowledge-manage-nav',permission:'knowledge'},
  'wisdom-manage':{label:'Ranger-Bibliothek verwalten',icon:'edit',kind:'wisdom-manage',attr:'data-wisdom-manage-nav',permission:'wisdom'},
  logout:{label:'Benutzer wechseln',icon:'logout',logout:true}
 };
 const groups=[
  {id:'adventure',label:'DEIN ABENTEUER',audience:'ranger',items:['knowledge','bible','growth']},
  {id:'stamm',label:'STAMMLEBEN',audience:'ranger',items:['calendar','participation']},
  {id:'foundations',label:'WISSEN & GRUNDLAGEN',audience:'ranger',items:['wisdom']},
  {id:'cockpit',label:'LEITER-COCKPIT',audience:'leader',items:['meetings','exams','tasks','calendar','participation']},
  {id:'teams',label:'STAMM & TEAMS',audience:'leader',accordion:true,items:['rangers','leaders','leadermeetings']},
  {id:'development',label:'ENTWICKLUNG & WISSEN',audience:'leader',accordion:true,items:['knowledge','bible','growth','wisdom']},
  {id:'ideas',label:'IDEEN & MATERIAL',audience:'leader',accordion:true,items:['actions','nature','recipes','impulses']},
  {id:'management',label:'VERWALTUNG',audience:'leader',accordion:true,items:['knowledge-manage','wisdom-manage']}
 ];
 function permissions(a,data){
  const privileged=a?.leader===true&&['Admin','Stammleiter'].includes(a.role);
  return {knowledge:data?.rights?data.rights.local===true:privileged,wisdom:data?.wisdom?.rights?data.wisdom.rights.local===true:privileged,correct:data?.rights?data.rights.correct===true:privileged};
 }
 RH.navigationConfigurationV33=(a,data)=>{
  const role=a?.leader===true?'leader':'ranger',rights=permissions(a,data);
  return {role,top:['dashboard','messages'],groups:groups.filter(g=>g.audience===role).map(g=>({...g,items:g.items.filter(id=>!rows[id].permission||rights[rows[id].permission])})).filter(g=>g.items.length),footer:['logout']};
 };
 RH.navigationRouteAllowedV33=(targetView,route,a,data)=>{
  if(!a)return false;const lead=a.leader===true,rights=permissions(a,data),kind=route?.kind||'map';
  if(!lead&&leaderOnly.has(targetView))return false;
  if(targetView!=='knowledge')return true;
  if(['manage','edit'].includes(kind))return lead&&rights.knowledge;
  if(['wisdom-manage','wisdom-edit'].includes(kind))return lead&&rights.wisdom;
  if(kind==='correct')return lead&&rights.correct;
  if(['exams','grade-confirm','ranger-audit'].includes(kind))return lead;
  if(kind==='expedition-map')return !lead&&a.kind==='rangers';
  return true;
 };
 function readPreferences(){
  try{if(!/^rhv9(?:-demo)?$/.test(storageKey||''))return {};const stored=JSON.parse(localStorage.getItem(storageKey)||'null');return stored?.shared?.interfacePreferences?.navigationGroups||{};}catch{return {};}
 }
 function savedGroups(role){if(!remembered.has(role))remembered.set(role,{...(readPreferences()[role]||{})});return remembered.get(role);}
 async function rememberGroup(role,id,open){
  savedGroups(role)[id]=open;
  const save=()=>{
   const fresh=JSON.parse(localStorage.getItem(storageKey)||'null');if(!fresh?.__rhv24||!fresh.shared)throw Error('Menüzustand konnte nicht gespeichert werden.');
   fresh.shared.interfacePreferences={...(fresh.shared.interfacePreferences||{}),navigationGroups:{...(fresh.shared.interfacePreferences?.navigationGroups||{}),[role]:{...(fresh.shared.interfacePreferences?.navigationGroups?.[role]||{}),[id]:open}}};
   localStorage.setItem(storageKey,JSON.stringify(fresh));v24Store.shared.interfacePreferences=structuredClone(fresh.shared.interfacePreferences);
  };
  try{if(navigator.locks?.request)await navigator.locks.request(storageKey+':knowledge',save);else save();}
  catch{RH.v28Notify?.('Die Menüauswahl gilt vorerst nur bis zum Neuladen.');}
 }
 // App writes keep the latest UI preferences, just as the existing transport keeps the latest journal.
 const previousPersist=v24Persist;
 v24Persist=function(...args){
  try{const fresh=JSON.parse(localStorage.getItem(storageKey)||'null');if(fresh?.shared?.interfacePreferences)v24Store.shared.interfacePreferences=structuredClone(fresh.shared.interfacePreferences);}catch{/* The original persistence reports real storage failures. */}
  return previousPersist.apply(this,args);
 };
 const currentRole=a=>a?.role||(a?.leader?'Leiter':'Ranger');
 const legacyTarget=b=>b.getAttribute('onclick')?.match(/(?:goV17\(|view\s*=\s*)['"]([^'"]+)['"]/)?.[1];
 function isActive(id,u){
  const item=rows[id],kind=u.route?.kind||'map';
  if(item.legacy)return u.view===item.legacy||(id==='growth'&&u.view==='knowledge'&&['expedition-map','growth-ranking'].includes(kind));
  if(u.view!=='knowledge')return false;
  if(id==='bible')return kind.startsWith('bible');
  if(id==='wisdom')return kind.startsWith('wisdom')&&!['wisdom-manage','wisdom-edit'].includes(kind);
  if(id==='wisdom-manage')return ['wisdom-manage','wisdom-edit'].includes(kind);
  if(id==='knowledge-manage')return ['manage','edit'].includes(kind);
  if(id==='exams')return ['exams','grade-confirm','correct'].includes(kind);
  if(id==='knowledge')return !kind.startsWith('bible')&&!kind.startsWith('wisdom')&&!['manage','edit','exams','grade-confirm','correct','expedition-map','growth-ranking','ranger-audit'].includes(kind);
  return false;
 }
 function link(id,role){
  const item=rows[id],label=role==='ranger'&&item.rangerLabel?item.rangerLabel:item.label;
  return `<button type="button" class="rh33-nav-link" data-nav-id="${id}" ${item.attr||''} aria-label="${esc(label)}"${item.hint?` aria-describedby="rh33-hint-${id}"`:''}>${svg(item.icon)}<span class="rh33-link-copy"><span class="rh-nav-label">${esc(label)}</span>${item.hint?`<small id="rh33-hint-${id}" class="rh33-nav-hint">${esc(item.hint)}</small>`:''}</span>${item.counter?`<span class="rh33-nav-badge" data-nav-count="${item.counter}" hidden aria-hidden="true"></span>`:''}${id==='messages'?'<span data-message-badge hidden aria-hidden="true"></span>':''}</button>`;
 }
 const closeDrawer=(focus=false)=>{
  const side=document.querySelector('.side');if(!side)return;const toggle=side.querySelector('[data-menu-toggle]'),open=side.classList.contains('menu-open');
  side.classList.remove('menu-open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Menü öffnen');if(open&&focus)toggle?.focus();
 };
 function drawer(side,nav){
  side.classList.add('rh33-side');if(latest?.actor?.role!=='Admin')side.querySelectorAll('.v24-tribeLabel').forEach(n=>n.remove());side.querySelector('#v24-mobile-menu')?.remove();side.querySelectorAll('.v22-sidefoot').forEach(n=>n.remove());
  let panel=side.querySelector('.mobile-nav-panel');
  if(!panel){panel=document.createElement('div');panel.className='mobile-nav-panel';panel.id='rangerhub-navigation';const tribe=side.querySelector('.v24-switcher,.v24-tribeLabel');if(tribe)panel.append(tribe);panel.append(nav);side.append(panel);}
  panel.id='rangerhub-navigation';panel.classList.add('rh33-navigation-panel');
  let toggle=side.querySelector('[data-menu-toggle]');
  if(!toggle){toggle=document.createElement('button');toggle.type='button';toggle.className='menu-toggle';toggle.dataset.menuToggle='';toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';side.querySelector('.brand')?.after(toggle);}
  toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded',String(side.classList.contains('menu-open')));toggle.setAttribute('aria-label',side.classList.contains('menu-open')?'Menü schließen':'Menü öffnen');
  toggle.onclick=()=>{const open=side.classList.toggle('menu-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');};
  const brand=side.querySelector('.brand');if(brand){
   if(!brand.querySelector('[data-ranger-crest]')){const asset=window.RHWisdomOriginalAssets?.[window.RHWisdomModuleAssets?.emblem?.hero],small=brand.querySelector('small'),copy=document.createElement('span');copy.className='rh34-brand-copy';copy.innerHTML='<span>Ranger Hub</span>';if(small)copy.append(small);const crest=document.createElement('img');crest.src=asset?.src||'';crest.alt='Rangers-Wappen';crest.dataset.rangerCrest='';crest.width=38;crest.height=46;brand.replaceChildren(crest,copy);}
brand.setAttribute('role','button');brand.tabIndex=0;brand.setAttribute('aria-label','RangerHub · Zum Dashboard');brand.onclick=()=>{closeDrawer();if(RH.goDashboard)RH.goDashboard();else goV17('dash');};brand.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();brand.click();}};}
 }
 function updateActive(nav,u,config){
  const active=[];nav.querySelectorAll('[data-nav-id]').forEach(button=>{const selected=isActive(button.dataset.navId,u);button.classList.toggle('active',selected);if(selected){button.setAttribute('aria-current','page');active.push(button.dataset.navId);}else button.removeAttribute('aria-current');});
  const saved=savedGroups(currentRole(u.actor)),activeRoute=active.join('|'),changed=nav.dataset.activeRoute!==activeRoute;nav.dataset.activeRoute=activeRoute;
  for(const group of config.groups){const details=nav.querySelector(`details[data-nav-group="${group.id}"]`);if(!details)continue;if(changed)details.open=group.items.some(id=>active.includes(id))||saved[group.id]===true;details.querySelector('summary').setAttribute('aria-expanded',String(details.open));}
  let count=0;try{count=RH.dashboardOwnTasks?.().filter(t=>!t.done).length||0;}catch{/* No authenticated selector yet. */}
  const counts={exams:Number.isInteger(u.data?.pending)?u.data.pending:(u.data?.exams||[]).filter(e=>e.status==='registered').length,tasks:count};
  nav.querySelectorAll('[data-nav-count]').forEach(b=>{const n=counts[b.dataset.navCount]||0;b.hidden=n===0;b.textContent=n>99?'99+':String(n);b.title=n+' offene '+(b.dataset.navCount==='tasks'?'Aufgaben':'Prüfungen');});
 }
 RH.mountNavigationV33=u=>{
  if(!u?.actor)return;const side=root.querySelector('.side'),nav=side?.querySelector('.nav');if(!side||!nav)return;
  latest=u;const config=RH.navigationConfigurationV33(u.actor,u.data),role=currentRole(u.actor),key=JSON.stringify([u.actor.key||`${u.actor.stammId}:${u.actor.kind}:${u.actor.id}`,role,config.groups.map(g=>[g.id,g.items])]);
  if(nav.dataset.navigationSignature!==key){
   const messageBadge=nav.querySelector('[data-message-badge]'),badge=messageBadge?{hidden:messageBadge.hidden,text:messageBadge.textContent}:null;
   const extra=u.actor.leader?[...nav.querySelectorAll('button')].filter(b=>{const target=legacyTarget(b);return target&&!knownLegacy.has(target)&&target!=='logout'&&!b.matches('[data-knowledge-nav],[data-knowledge-exams-nav],[data-knowledge-manage-nav],[data-bible-nav],[data-wisdom-nav],[data-wisdom-manage-nav]');}):[];
   nav.classList.add('rh33-navigation');nav.dataset.navigationRole=config.role;nav.setAttribute('aria-label',config.role==='leader'?'Navigation für die Leitung':'Deine Ranger-Navigation');nav.dataset.navigationSignature=key;delete nav.dataset.activeRoute;
   const gs=config.groups.map(g=>g.accordion?`<details class="rh33-nav-group" data-nav-group="${g.id}"><summary aria-expanded="false">${esc(g.label)}<span aria-hidden="true"></span></summary><div class="rh33-nav-items">${g.items.map(id=>link(id,config.role)).join('')}</div></details>`:`<section class="rh33-nav-group" data-nav-group="${g.id}"><h2 class="rh33-nav-heading">${esc(g.label)}</h2><div class="rh33-nav-items">${g.items.map(id=>link(id,config.role)).join('')}</div></section>`).join('');
   nav.innerHTML=`<div class="rh33-nav-top">${config.top.map(id=>link(id,config.role)).join('')}</div>${gs}<div class="rh33-nav-footer">${config.footer.map(id=>link(id,config.role)).join('')}</div>`;
   if(extra.length){let management=nav.querySelector('[data-nav-group=management]');if(!management){management=document.createElement('details');management.className='rh33-nav-group';management.dataset.navGroup='management';management.innerHTML='<summary aria-expanded="false">VERWALTUNG<span aria-hidden="true"></span></summary><div class="rh33-nav-items"></div>';nav.querySelector('.rh33-nav-footer').before(management);}for(const b of extra){b.classList.add('rh33-nav-link');management.querySelector('.rh33-nav-items').append(b);}}
   if(badge){const b=nav.querySelector('[data-message-badge]');b.hidden=badge.hidden;b.textContent=badge.text;}
   nav.querySelectorAll('details[data-nav-group]>summary').forEach(summary=>summary.onclick=e=>{e.preventDefault();const details=summary.parentElement;details.open=!details.open;summary.setAttribute('aria-expanded',String(details.open));rememberGroup(role,details.dataset.navGroup,details.open);});
   nav.querySelectorAll('[data-nav-id]').forEach(b=>b.onclick=()=>{const live=latest;if(!live?.actor)return;const item=rows[b.dataset.navId];closeDrawer();if(item.logout){if(live.logout)live.logout();else logout();}else if(item.kind)live.navigate({kind:item.kind,...(item.kind==='wisdom-manage'?{scope:'local'}:{})});else live.openLegacy(item.legacy);});
  }
  drawer(side,nav);updateActive(nav,u,config);RH.navigationV33Ready=true;
 };
 RH.refreshNavigationV33=()=>{if(latest)RH.mountNavigationV33(latest);};
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDrawer(true);},true);
 document.addEventListener('click',event=>{if(!event.target.closest('.side'))closeDrawer();});
 window.addEventListener('storage',event=>{if(event.key!==storageKey)return;remembered.clear();if(latest?.actor&&root.querySelector('.rh33-navigation'))RH.mountNavigationV33(latest);});
})();
