/* Ranger-Wissen shares the existing rhv9 state and authenticated knowledge boundary. No points. */
(() => {
 'use strict';
 const M=window.RHKnowledgeModel,base=window.RHWisdomCatalog,clone=x=>structuredClone(x),fail=m=>{throw Error(m);};
 const kinds=['groups','modules','hotspots'],fields={groups:['title','description','icon','order','archived'],modules:['groupId','title','introduction','text','icon','illustrationKey','order','published','archived'],hotspots:['moduleId','label','text','order','archived','x','y','didactic']};
 const empty=()=>({schema:1,revision:0,entries:{groups:[],modules:[],hotspots:[]},overrides:{groups:{},modules:{},hotspots:{}},audit:[]});
 function checkLayer(l){if(!l)return;if(l.schema!==1||!Number.isInteger(l.revision)||!Array.isArray(l.audit)||kinds.some(k=>!Array.isArray(l.entries?.[k])||!l.overrides?.[k]||typeof l.overrides[k]!=='object'))fail('Unbekannter Ranger-Wissen-Stand. Die vorhandenen Daten bleiben erhalten.');}
 function effective(g=empty(),l=empty()){
  checkLayer(g);checkLayer(l);const out={revision:`${g.revision}:${l.revision}`};
  for(const kind of kinds){const rows=new Map();for(const layer of [base,g.entries,l.entries])for(const item of layer[kind]){if(rows.has(item.id))fail('Doppelte Ranger-Wissen-Kennung.');rows.set(item.id,clone(item));}
   out[kind]=[...rows.values()].map(item=>{const go=g.overrides[kind][item.id],lo=l.overrides[kind][item.id];return {...item,...clone(go?.fields||{}),...clone(lo?.fields||{}),globalRevision:go?.revision||0,localRevision:lo?.revision||0};}).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
  }validate(out);return out;
 }
 function validate(c){for(const k of kinds)for(const i of c[k]){if(!/^[-a-zA-Z0-9_]{1,100}$/.test(i.id))fail('Ungültige Wissenskennung.');if(k==='modules'&&!c.groups.some(g=>g.id===i.groupId)||k==='hotspots'&&!c.modules.some(m=>m.id===i.moduleId))fail('Übergeordneter Wissensbereich fehlt.');}}
 const rights=a=>({global:!!a.leader&&a.role==='Admin',local:!!a.leader&&['Admin','Stammleiter'].includes(a.role)});
 function visible(c,a,preview=false){
  const all=!!a.leader&&!preview,groups=c.groups.filter(g=>all||!g.archived),modules=c.modules.filter(m=>groups.some(g=>g.id===m.groupId)&&(all||m.published&&!m.archived)),hotspots=c.hotspots.filter(h=>modules.some(m=>m.id===h.moduleId)&&(all||!h.archived));
  return {revision:c.revision,groups:groups.filter(g=>all||modules.some(m=>m.groupId===g.id)).map(clone),modules:modules.map(clone),hotspots:hotspots.map(clone)};
 }
 function edit(s,a,g,p,at,uid){
  const r=rights(a),scope=p.scope;if(!['global','local'].includes(scope)||!r[scope])fail('Nur Admin und Stammleitung dürfen Ranger-Wissen in ihrem Zuständigkeitsbereich ändern.');
  if(scope==='local'&&a.role!=='Admin'&&a.stammId!==a.homeStammId)fail('Die Stammleitung darf nur ihren eigenen Stamm bearbeiten.');
  const kind=p.kind;if(!kinds.includes(kind))fail('Ungültiger Wissensbereich.');
  const global=g.rangerWisdom||empty(),local=s.rangerWisdom||empty(),layer=scope==='global'?global:local,c=effective(global,scope==='global'?empty():local);
  const id=p.id||('rw-'+uid()),item=c[kind].find(i=>i.id===id),previous=layer.overrides[kind][id],revision=previous?.revision||0;
  if(!/^[-a-zA-Z0-9_]{1,100}$/.test(id)||!Number.isInteger(p.revision)||p.revision!==revision)fail('Der Inhalt wurde inzwischen geändert. Bitte den aktuellen Stand laden.');
  if(p.reset){if(!item||scope!=='local')fail('Nur lokale Anpassungen können zurückgesetzt werden.');delete layer.overrides[kind][id];}
  else {
   if(!p.fields||typeof p.fields!=='object'||Array.isArray(p.fields)||Object.keys(p.fields).some(k=>!fields[kind].includes(k)))fail('Ungültige Inhaltsfelder.');
   const f=clone(p.fields);for(const [key,v] of Object.entries(f)){
    if(['published','archived','didactic'].includes(key)){if(typeof v!=='boolean')fail('Ungültige Freigabe.');}
    else if(['order','x','y'].includes(key)){if(v!==null&&(!Number.isFinite(v)||Math.abs(v)>10000||['x','y'].includes(key)&&(v<0||v>100)))fail('Ungültige Reihenfolge oder Symbolposition.');}
    else if(typeof v!=='string'||v.length>(['text','introduction','description'].includes(key)?24000:180)||!v.trim()&&['title','label','groupId','moduleId'].includes(key))fail('Bitte gültigen Text eingeben.');
   }
   if(!item){if(scope==='global'&&c[kind].some(x=>x.id===id))fail('Kennung bereits vorhanden.');const created={id,order:0,archived:false,...(kind==='modules'?{published:false,illustrationKey:'start',text:'',introduction:'',icon:'compass'}:{}),...f};if(!(created.title||created.label))fail('Bitte einen Namen eingeben.');layer.entries[kind].push(created);}
   layer.overrides[kind][id]={fields:{...(previous?.fields||{}),...f},revision:revision+1,at,by:a.id};
  }
  layer.revision++;layer.audit.push({id:uid(),entityId:id,kind,scope,at,by:a.id,role:a.role,action:p.reset?'reset':item?'edit':'create',before:item||null,after:p.fields||null});
  if(scope==='global')effective(global,empty());effective(global,local);g.rangerWisdom=global;s.rangerWisdom=local;s.revision++;return {id};
 }
 const oldCheck=M.check,oldMigrate=M.migrate,oldApply=M.apply,oldSnapshot=M.snapshot;
 M.check=s=>{oldCheck(s);checkLayer(s.rangerWisdom);};M.migrate=s=>{const n=oldMigrate(s);checkLayer(n.rangerWisdom);return n;};
 M.apply=(s,env,a,g,type,p,at=new Date().toISOString(),uid=()=>crypto.randomUUID())=>type==='wisdom-change'?edit(s,a,g,p,at,uid):oldApply(s,env,a,g,type,p,at,uid);
 M.snapshot=(s,env,a,g,...rest)=>{const out=oldSnapshot(s,env,a,g,...rest),global=g?.rangerWisdom||empty(),local=s?.rangerWisdom||empty(),r=rights(a),c=effective(global,local);out.wisdom={...visible(c,a),rights:r,...(r.local?{preview:visible(c,a,true),layers:{global:clone(global),local:clone(local)}}:{})};return out;};
 M.validateWisdomGlobal=(g,s)=>effective(g.rangerWisdom,s.rangerWisdom);
 window.RHWisdomModel={empty,effective,visible,rights,checkLayer,validate};
})();
