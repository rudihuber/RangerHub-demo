/* Library views derive reuse dates from the existing meeting history. */
(() => {
 'use strict';
 const RH=window.RangerHub, M=window.RHKnowledgeModel, host=()=>RH.content();
 const same=(a,b)=>String(a)===String(b), norm=s=>String(s||'').trim().toLocaleLowerCase('de'), collator=new Intl.Collator('de',{numeric:true,sensitivity:'base'});
 const leader=()=>isLeader()&&!!v24Principal()&&(v24IsAdmin()||session.homeStammId===v24StammId);
 const context=()=>session&&`${v24StammId}:${session.homeStammId}:${session.kind}:${session.id}`;
 const dateString=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 function anniversary(date){const [y,m,d]=date.split('-').map(Number),last=new Date(Date.UTC(y+2,m,0)).getUTCDate();return `${y+2}-${String(m).padStart(2,'0')}-${String(Math.min(d,last)).padStart(2,'0')}`;}
 function parts(kind,m){
  if(kind==='nature')return [m.nature];
  if(kind==='impulse')return [m.impulse,...(Array.isArray(m.impulses)?m.impulses:[])];
  return [{...m.action,libraryId:m.actionLibraryId??m.action?.libraryId},...(Array.isArray(m.actions)?m.actions:[])];
 }
 RH.libraryUsageV34=(kind,item,now=new Date())=>{
  const today=dateString(new Date(now));let lastUsed=null;
  for(const meeting of db.meetings||[]){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(meeting.date||'')||meeting.date>today||M?.cancelled(meeting)||meeting.cancelled||meeting.archived||meeting.deleted)continue;
   if(meeting.date===today){const start=M?.meetingStart(meeting);if(!/^\d{2}:\d{2}$/.test(meeting.start||'')||!start||start>new Date(now).toISOString())continue;}
   if(parts(kind,meeting).some(p=>{if(!p||p.enabled===false)return false;const id=kind==='impulse'?p.suggestionId??p.libraryId:p.libraryId??p.actionLibraryId;return id!=null&&id!==''?same(id,item.id):norm(p.title)&&norm(p.title)===norm(item.title);}))lastUsed=!lastUsed||meeting.date>lastUsed?meeting.date:lastUsed;
  }
  const reusableOn=lastUsed?anniversary(lastUsed):null;return {lastUsed,reusableOn,used:!!reusableOn&&today<reusableOn};
 };
 const filters=new Map();
 const state=kind=>{const key=context()+':'+kind;if(!filters.has(key))filters.set(key,{bucket:'templates',query:''});return filters.get(key);};
 const impulses=()=>db.actionLibrary.flatMap(a=>(a.impulseSuggestions||[]).map(p=>({...p,actionId:a.id,actionTitle:a.title})));
 function decorate(kind,list,items,selector){
  if(!list||!leader())return;
  const records=[...list.querySelectorAll(selector)].map((node,i)=>({node,item:items[i]})).filter(r=>r.item);
  if(kind==='nature'){records.sort((a,b)=>collator.compare(a.item.title,b.item.title));records.forEach(r=>list.append(r.node));}
  const s=state(kind),tools=document.createElement('section');tools.className='v34-library-tools';tools.setAttribute('aria-label','Vorlagen filtern');
  tools.innerHTML='<div class="v34-library-tabs" role="group" aria-label="Verwendung"><button type="button" data-library-bucket="templates"></button><button type="button" data-library-bucket="used"></button></div><p class="v34-reuse-note">Nach zwei Jahren ab dem letzten durchgeführten Treffen ist eine Vorlage wieder verfügbar. Geplante Treffen zählen noch nicht als Verwendung.</p>';
  list.before(tools);
  let search=host().querySelector(kind==='nature'?'.v28-search input':kind==='action'?'.v27-library-search input':'.v34-impulse-search input');
  if(!search){const label=document.createElement('label');label.className='v34-impulse-search';label.innerHTML='Vorschlag suchen<input type="search" placeholder="Titel oder Inhalt …">';tools.append(label);search=label.querySelector('input');}
  search.value=s.query;if(kind==='nature')search.placeholder='Tier oder Besonderheit …';
  const empty=document.createElement('p');empty.className='muted';empty.dataset.libraryEmpty='';empty.textContent='Keine passenden Vorlagen in dieser Ansicht.';list.after(empty);
  function apply(){
   const counts={templates:0,used:0};let found=0;
   for(const {node,item} of records){const use=RH.libraryUsageV34(kind,item),bucket=use.used?'used':'templates';counts[bucket]++;node.dataset.libraryBucket=bucket;node.hidden=bucket!==s.bucket||!norm(node.textContent).includes(norm(s.query));if(!node.hidden)found++;
    let info=node.querySelector('[data-library-use]');if(!info){info=document.createElement('p');info.dataset.libraryUse='';info.className='v34-library-use';node.querySelector('details')?.append(info);}info.textContent=use.lastUsed?`Zuletzt verwendet: ${fmt(use.lastUsed)} · ${use.used?'Wieder als Vorlage ab: ':'Wieder als Vorlage seit: '}${fmt(use.reusableOn)}`:'';info.hidden=!use.lastUsed;
   }
   for(const b of tools.querySelectorAll('[data-library-bucket]')){const bucket=b.dataset.libraryBucket;b.setAttribute('aria-pressed',String(bucket===s.bucket));b.textContent=`${bucket==='used'?'Schon verwendet':'Vorlagen'} (${counts[bucket]})`;}
   empty.hidden=!!found;const oldEmpty=host().querySelector('[data-nature-empty]');if(oldEmpty)oldEmpty.hidden=true;
  }
  tools.querySelectorAll('[data-library-bucket]').forEach(b=>b.onclick=()=>{s.bucket=b.dataset.libraryBucket;apply();});
  search.removeAttribute('oninput');search.oninput=()=>{s.query=search.value;apply();};list._v34Filter=query=>{s.query=query;search.value=query;apply();};apply();
 }
 const oldNature=nature;nature=function(){oldNature();if(!leader())return;const list=host().querySelector('.v28-nature-list');list?.querySelectorAll('.v28-verse,.v28-question').forEach(p=>p.remove());decorate('nature',list,db.natureLibrary||[],'[data-nature-id]');};
 RH.filterNature=query=>host().querySelector('.v28-nature-list')?._v34Filter?.(query);
 const oldActivities=activities;activities=function(){oldActivities();decorate('action',host().querySelector('.v27-actions'),db.actionLibrary||[],'[data-action-id]');};
 RH.filterActions=query=>host().querySelector('.v27-actions')?._v34Filter?.(query);
 const oldImpulses=RH.impulses;RH.impulses=function(){oldImpulses();decorate('impulse',host().querySelector('.v28-impulse-list'),impulses(),'article');};
 RH.natureDescription=n=>[n.fact,n.creation?'Gottes Schöpfung\n'+n.creation:''].filter(Boolean).join('\n\n');
 const chooseNature=RH.chooseNature;RH.chooseNature=(id,force=false)=>{chooseNature(id,force);const f=document.getElementById('meeting-planning-form'),n=db.natureLibrary?.find(n=>same(n.id,id));if(n&&f&&same(f._meeting.nature.libraryId,id)){f.elements.natureDescription.value=RH.natureDescription(n);RH.refreshPlanning();}};
 RH.editNature=(id='')=>{
  if(!leader())return;const n=id?db.natureLibrary?.find(n=>same(n.id,id)):null;if(id&&!n)return;const originalContext=context();
  box.innerHTML=`<div class="top"><h2>${n?'Naturphänomen bearbeiten':'Naturphänomen festhalten'}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><form id="v28-nature-form" class="form"><label class="full">Name<input name="title" required maxlength="120" value="${esc(n?.title||'')}"></label><label class="full">Besonderheit · kurz und verständlich<textarea name="fact" required maxlength="4000" rows="4">${esc(n?.fact||'')}</textarea></label><label class="full">Gedanke zu Gottes Schöpfung<textarea name="creation" maxlength="4000" rows="3">${esc(n?.creation||'')}</textarea></label><button class="btn full">Speichern</button></form>`;
  box.querySelector('form').onsubmit=e=>{e.preventDefault();if(!leader()||context()!==originalContext||!e.target.reportValidity())return;const f=e.target.elements,old=db.natureLibrary,item={...n,id:n?.id||'nature-'+RH.uid(),title:f.title.value.trim(),fact:f.fact.value.trim(),creation:f.creation.value.trim()};if(!item.title||!item.fact)return;try{db.natureLibrary=n?old.map(x=>x===n?item:x):[...old,item];v24Persist();closeM();goV17('nature');}catch{db.natureLibrary=old;RH.v28Notify('Nicht gespeichert. Deine bisherigen Daten bleiben erhalten.');}};openM();
 };
 const categories=['Suppen & Eintöpfe','Hauptgerichte','Frühstück & Brot','Snacks & Beilagen','Süßes & Backen','Getränke','Weitere Rezepte'];
 RH.recipeCategoryV34=r=>{
  if(String(r.category||'').trim())return String(r.category).trim();const t=norm(r.title);
  if(/suppe|eintopf|chili|gulasch/.test(t))return categories[0];
  if(/kuchen|keks|muffin|dessert|pudding|waffel|pfannkuchen|schoko|apfelring|süß/.test(t))return categories[4];
  if(/tee\b|kakao|saft|limonade|punsch|getränk|smoothie/.test(t))return categories[5];
  if(/brot|brötchen|frühstück|porridge|müsli|rührei/.test(t))return categories[2];
  if(/snack|salat|dip|beilage|popcorn|spieß|chips/.test(t))return categories[3];
  if(/nudel|pasta|reis|pizza|kartoffel|curry|burger|auflauf|fisch|fleisch|hähnchen/.test(t))return categories[1];return categories[6];
 };
 RH.recipeCategoriesV34=categories;
 const recipes=RH.renderRecipes;RH.renderRecipes=()=>{
  recipes();const grid=host().querySelector('.recipe-grid');if(!grid||!db.recipes.length)return;
  const nodes=[...grid.querySelectorAll('.recipe-entry')],groups=new Map();
  db.recipes.forEach((r,i)=>{const category=RH.recipeCategoryV34(r);if(!groups.has(category))groups.set(category,[]);if(nodes[i])groups.get(category).push({r,node:nodes[i]});});
  const order=[...groups.keys()].sort((a,b)=>{const ai=categories.indexOf(a),bi=categories.indexOf(b);return ai<0&&bi<0?collator.compare(a,b):ai<0?1:bi<0?-1:ai-bi;});
  const tools=document.createElement('div');tools.className='v34-recipe-filters';tools.innerHTML='<label>Rezepte suchen<input type="search" placeholder="Rezeptname …"></label><label>Kategorie<select><option value="">Alle Kategorien</option>'+order.map(c=>`<option>${esc(c)}</option>`).join('')+'</select></label>';grid.before(tools);grid.classList.add('v34-recipe-groups');grid.replaceChildren();
  order.forEach((category,i)=>{const group=document.createElement('details');group.className='v34-recipe-category';group.open=i===0;group.dataset.category=category;group.innerHTML=`<summary>${esc(category)} <span>${groups.get(category).length}</span></summary><div class="recipe-grid"></div>`;for(const {node} of groups.get(category))group.lastElementChild.append(node);grid.append(group);});
  const empty=document.createElement('p');empty.className='muted';empty.textContent='Keine passenden Rezepte gefunden.';empty.hidden=true;grid.after(empty);
  const filter=()=>{const query=norm(tools.querySelector('input').value),category=tools.querySelector('select').value;let count=0;for(const group of grid.children){let shown=0;for(const {r,node} of groups.get(group.dataset.category)){node.hidden=!norm(r.title).includes(query);if(!node.hidden)shown++;}group.hidden=!shown||!!category&&category!==group.dataset.category;if(!group.hidden)count+=shown;if(query||category)group.open=!group.hidden;}empty.hidden=!!count;};tools.querySelector('input').oninput=filter;tools.querySelector('select').onchange=filter;
 };
 RH.libraryV34Ready=true;
})();
