/* Editable display layers over the immutable FECG source catalog. */
(() => {
 'use strict';
 const source=window.RangerHubKnowledgeCatalog,same=(a,b)=>String(a)===String(b),copy=x=>structuredClone(x);
 const fail=message=>{throw Error(message);},kinds=['categories','regions','locations','topics','tasks'];
 const places={
  'A-01':['Kunsthaus','art'],'A-02':['Filmhaus','media'],'A-03':['Musikpavillon','music'],'A-04':['Redaktionshaus','media'],
  'A-05':['Begegnungsplatz','house'],'A-06':['Rathaus','hall'],'A-07':['Rangerhaus','tent'],'A-08':['Bibelbibliothek','library'],
  'A-09':['Geschichtenturm','tower'],'A-10':['Gemeindehaus','church'],'A-11':['Haus des Dienens','house'],'A-12':['Missionsstation','globe'],
  'B-01':['Sternwarte','observatory'],'B-02':['Wetterturm','tower'],'B-03':['Vogelwarte','bird'],'B-04':['Naturgarten','garden'],
  'B-05':['Tierpfad','deer'],'B-06':['Rangerhütte','hut'],'B-07':['Winterberg','mountain'],'B-08':['Zeltplatz','tent'],
  'B-09':['Bauplatz','tower'],'B-10':['Feuerplatz','fire'],'B-11':['Campküche','pot'],'B-12':['Waldstation','tree'],
  'C-01':['Trainingsplatz','fitness'],'C-02':['Wasserwacht','lifebuoy'],'C-03':['Erste-Hilfe-Zelt','aid'],'C-04':['Kanuanleger','boat'],
  'C-05':['Fahrradstation','bike'],'C-06':['Motorwerkstatt','workshop'],'C-07':['Holzwerkstatt','workshop'],'C-08':['Nähstube','needle'],
  'C-09':['Bogenplatz','bow'],'C-10':['Dorfküche','pot'],'C-11':['Angelsteg','fish'],'C-12':['Gartenhaus','garden']};
 const theme={wildnis:'forest',entdecker:'discovery',rettung:'rescue',werkstatt:'craft',gemeinschaft:'village',arena:'ranking'};
 const base={
  categories:source.categories.map((x,i)=>({...copy(x),description:'',sortOrder:i,isActive:true,revision:0})),
  regions:source.regions.map((x,i)=>({...copy(x),title:x.id==='arena'?'Ranger-Rangliste':x.title,scene:theme[x.id],description:'',sortOrder:i,isActive:true,revision:0})),
  locations:source.topics.map((t,i)=>({id:'place-'+t.id,title:places[t.id][0],icon:places[t.id][1],regionId:t.mapRegionId,description:'',sortOrder:i,isActive:true,revision:0})),
  topics:source.topics.map((t,i)=>({...copy(t),categoryId:t.sourceCategoryId,locationId:'place-'+t.id,description:'',sortOrder:i,isActive:true,revision:0})),
  tasks:source.tasks.map((t,i)=>({...copy(t),title:'',text:t.originalText,description:'',sortOrder:i,isActive:t.isPublished,revision:0,originalPoints:t.points}))
 };
 const emptyLayer=()=>({schema:1,revision:0,entries:Object.fromEntries(kinds.map(k=>[k,{}])),overrides:Object.fromEntries(kinds.map(k=>[k,{}])),audit:[]});
 const validateLayer=l=>{if(!l||l.schema!==1||!l.entries||!l.overrides||!Array.isArray(l.audit))fail('Unbekanntes Katalogformat. Die Inhalte bleiben unverändert.');for(const k of kinds)if(!l.entries[k]||!l.overrides[k])fail('Der Katalog ist unvollständig.');};
 function effective(global=emptyLayer(),local=emptyLayer()){
  validateLayer(global);validateLayer(local);const out={};
  for(const kind of kinds){
   const all=[...base[kind],...Object.values(global.entries[kind]),...Object.values(local.entries[kind])];
   out[kind]=all.map(x=>{const g=global.overrides[kind][x.id],l=local.overrides[kind][x.id];return {...copy(x),...copy(g?.fields||{}),...copy(l?.fields||{}),id:x.id,
    originalText:x.originalText,originalPoints:x.originalPoints,sourceReference:copy(x.sourceReference),sourceCategoryId:x.sourceCategoryId,sourceTopic:x.sourceTopic,
    originalSubItems:copy(x.subItems||[]),globalRevision:g?.revision??x.revision??0,localRevision:l?.revision??local.entries[kind][x.id]?.revision??0,
    revisionId:`${x.id}@${g?.revision??x.revision??0}:${l?.revision??0}`,hasLocalOverride:!!l,isLocal:!!local.entries[kind][x.id]};}).sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)||a.id.localeCompare(b.id));
  }
  const region=id=>out.regions.find(x=>x.id===id),location=id=>out.locations.find(x=>x.id===id),topic=id=>out.topics.find(x=>x.id===id),category=id=>out.categories.find(x=>x.id===id);
  out.topics.forEach(t=>{t.mapRegionId=location(t.locationId)?.regionId;t.visible=t.isActive&&!t.archived&&location(t.locationId)?.isActive&&!location(t.locationId)?.archived&&region(t.mapRegionId)?.isActive&&!region(t.mapRegionId)?.archived&&category(t.categoryId)?.isActive&&!category(t.categoryId)?.archived;});
  out.locations.forEach(l=>{l.topicIds=out.topics.filter(t=>t.locationId===l.id).map(t=>t.id);l.visible=l.isActive&&!l.archived&&region(l.regionId)?.isActive&&!region(l.regionId)?.archived;});
  out.tasks.forEach(t=>{t.mapRegionId=topic(t.topicId)?.mapRegionId;t.categoryId=topic(t.topicId)?.categoryId;t.visible=t.isActive&&!t.archived&&topic(t.topicId)?.visible;t.safetyFlags=t.safetyFlags||[];});
  out.revision=`${global.revision}:${local.revision}`;out.stats=source.stats;return out;
 }
 function validate(c){
  for(const kind of kinds){if(new Set(c[kind].map(x=>x.id)).size!==c[kind].length)fail('Doppelte Katalog-ID.');for(const x of c[kind])if(!x.id||!String(x.title||x.text||'').trim())fail('Titel oder Aufgabentext fehlt.');}
  for(const l of c.locations)if(!c.regions.some(r=>r.id===l.regionId&&r.id!=='arena'))fail('Ein Themenort benötigt eine Lern-Unterwelt.');
  for(const t of c.topics)if(!c.locations.some(l=>l.id===t.locationId)||!c.categories.some(k=>k.id===t.categoryId))fail('Jedes Thema benötigt genau einen Ort und eine Kategorie.');
  for(const t of c.tasks)if(!c.topics.some(topic=>topic.id===t.topicId))fail('Jede Aufgabe benötigt ein Thema.');
  for(const t of source.topics)if(c.topics.filter(x=>x.id===t.id).length!==1)fail('Ein Originalthema fehlt oder ist doppelt.');
  return c;
 }
 const allowed={categories:['title','description','sortOrder','isActive','archived'],regions:['title','description','scene','sortOrder','isActive','archived'],locations:['title','description','regionId','icon','sortOrder','isActive','archived','x','y','mobileX','mobileY'],topics:['title','description','categoryId','locationId','sortOrder','isActive','archived'],tasks:['title','description','text','displaySubItems','points','topicId','sortOrder','isActive','archived']};
 const permissions=(a,state)=>({global:a.leader&&a.role==='Admin',local:a.leader&&(a.role==='Admin'||(a.homeStammId===a.stammId||a.authorizedStammId===a.stammId))&&state.permissions?.[a.id]?.canEditLocalKnowledge!==false,correct:a.leader&&['Admin','Stammleiter'].includes(a.role)});
 function edit(global,local,a,command,at,uid){
  const kind=command.kind,scope=command.scope,rights=permissions(a,{permissions:command._permissions});
  if(!kinds.includes(kind)||!['global','local'].includes(scope))fail('Ungültiger Bearbeitungsbereich.');
  if(scope==='global'&&!rights.global||scope==='local'&&!rights.local)fail('Keine Bearbeitungsrechte für diesen Katalogbereich.');
  const layer=scope==='global'?global:local;validateLayer(layer);
  const beforeCatalog=effective(global,scope==='global'?emptyLayer():local);let id=command.id,previous;
  if(command.create){id=`${scope==='global'?'global':a.stammId}:${kind}:${uid()}`;previous=null;}
  else {previous=beforeCatalog[kind].find(x=>x.id===id);if(!previous)fail('Katalogeintrag nicht gefunden.');
   if(scope==='global'&&(local.entries[kind][id]||(!base[kind].some(x=>x.id===id)&&!global.entries[kind][id])))fail('Lokale Inhalte können nicht global überschrieben werden.');
   const revision=layer.overrides[kind][id]?.revision??layer.entries[kind][id]?.revision??0;
   if(command.revision!==revision)fail('Dieser Inhalt wurde inzwischen geändert. Bitte neu laden und erneut prüfen.');
  }
  if(command.reset){if(scope!=='local'||!local.overrides[kind][id])fail('Kein lokaler Override vorhanden.');delete local.overrides[kind][id];}
  else {
   const fields={};for(const [key,value] of Object.entries(command.fields||{})){
    if(!allowed[kind].includes(key))fail('Dieses Feld kann nicht verändert werden.');
    if(key==='displaySubItems'){if(!Array.isArray(value)||value.length>100||value.some(s=>typeof s!=='string'||s.length>16000))fail('Ungültige Unterpunkte.');fields[key]=copy(value);}
    else if(['isActive','archived'].includes(key)){if(typeof value!=='boolean')fail('Ungültige Sichtbarkeit.');fields[key]=value;}
    else if(['sortOrder','x','y','mobileX','mobileY'].includes(key)){if(value===null&&key!=='sortOrder'){fields[key]=null;continue;}if(!Number.isFinite(value)||Math.abs(value)>100000||key!=='sortOrder'&&(value<5||value>95))fail('Ungültige Reihenfolge oder Position.');fields[key]=value;}
    else if(key==='points'){if(value!==null&&(!Number.isInteger(value)||value<0||value>1000))fail('Punkte müssen ganzzahlig zwischen 0 und 1000 oder ungeklärt sein.');fields[key]=value;}
    else {if(typeof value!=='string'||value.length>(['text','description'].includes(key)?16000:180))fail('Ungültiger Inhalt oder zu langer Text.');fields[key]=value.trim();}
   }
   if(kind!=='tasks'&&fields.title!==undefined&&!fields.title||fields.text!==undefined&&!fields.text)fail('Titel und Aufgabentext dürfen nicht leer sein.');
   if(!command.create&&kind==='tasks'&&Object.hasOwn(fields,'points')&&fields.points!==previous.points&&!String(command.reason||'').trim())fail('Eine Punktänderung benötigt eine Begründung oder Quellenangabe.');
   if(kind==='regions'&&id==='arena'&&(fields.archived||fields.isActive===false||fields.scene&&fields.scene!=='ranking'))fail('Der Ranglistenraum bleibt erhalten.');
   if(fields.archived){
    const descendants=kind==='regions'?beforeCatalog.tasks.filter(t=>t.mapRegionId===id):kind==='categories'?beforeCatalog.tasks.filter(t=>t.categoryId===id):kind==='locations'?beforeCatalog.tasks.filter(t=>beforeCatalog.topics.some(x=>x.id===t.topicId&&x.locationId===id)):kind==='topics'?beforeCatalog.tasks.filter(t=>t.topicId===id):[];
    if(descendants.length&&!command.cascadeConfirmed)fail('Die enthaltenen Themen und Aufgaben müssen ausdrücklich mit ausgeblendet werden.');
   }
   const revision=(layer.overrides[kind][id]?.revision??layer.entries[kind][id]?.revision??0)+1;
   if(command.create){
    const item={id,title:'',description:'',isActive:true,sortOrder:10000,revision,...fields};
    if(kind==='tasks'){if(!item.text)fail('Aufgabentext fehlt.');Object.assign(item,{originalText:null,originalPoints:null,sourceReference:{file:scope==='global'?'Eigener globaler Katalog':'Eigener Stammeskatalog',paragraphs:[]},subItems:[],safetyFlags:[],pointOptions:[]});if(item.points===undefined)item.points=null;}
    if(kind==='regions')item.scene ||= 'village';if(kind==='locations')item.icon ||= 'house';
    layer.entries[kind][id]=item;
   }else layer.overrides[kind][id]={fields:{...(layer.overrides[kind][id]?.fields||{}),...fields},revision,at,by:a.id,homeStammId:a.homeStammId};
  }
  validate(effective(global,local));layer.revision++;
  layer.audit.push({id:uid(),kind,sourceId:id,scope,stammId:scope==='global'?null:a.stammId,by:a.id,homeStammId:a.homeStammId,at,reason:String(command.reason||'Redaktionelle Änderung').slice(0,2000),before:previous?copy(previous):null,after:copy(effective(global,scope==='global'?emptyLayer():local)[kind].find(x=>x.id===id))});
  return id;
 }
 window.RHKnowledgeCatalogV30={base,source,places,kinds,emptyLayer,validateLayer,effective,validate,permissions,edit};
})();
