/* Structured visual editions: draft, published snapshot, immutable publication history. */
(() => {
 'use strict';
 const M=window.RHKnowledgeModel,W=window.RHWisdomModel,P=window.RHMembershipModel,original=window.RHWisdomOriginalAssets||{},clone=x=>structuredClone(x),fail=m=>{throw Error(m);},same=P.same;
 const layer=()=>({schema:1,revision:0,records:{},assets:{},permissions:{},audit:[]});
 const current=(s,g,scope)=>scope==='global'?(g.visualPages||layer()):(s.visualPages||layer());
 function rights(a,s){const own=a.role==='Admin'||a.homeStammId===a.stammId;return {global:!!a.leader&&a.role==='Admin',local:!!a.leader&&own&&(['Admin','Stammleiter'].includes(a.role)||!!s.visualPages?.permissions?.[`${a.kind}:${a.id}`])};}
 const cleanHTML=s=>typeof s==='string'&&s.length<=30000&&!s.replace(/<\/?(?:b|strong|i|em|u|br|p|div|ul|ol|li)\s*\/?>/gi,'').includes('<');
 function validate(doc,assets={}){
  if(JSON.stringify(doc).length>1000000)fail('Diese Edition ist zu groß. Bitte weitere Wissensthemen verwenden.');
  if(!doc||doc.schema!==1||!Array.isArray(doc.pages)||doc.pages.length<1||doc.pages.length>60)fail('Bitte 1 bis 60 gültige Seiten anlegen.');
  const ids=new Set();for(const page of doc.pages){
   if(!/^[-\w]{1,100}$/.test(page.id)||ids.has(page.id)||typeof page.title!=='string'||page.title.length>160||typeof page.section!=='string'||page.section.length>160||typeof page.visible!=='boolean'||typeof page.archived!=='boolean'||!Number.isFinite(page.height)||page.height<300||page.height>4000||!/^#[a-f\d]{6}$/i.test(page.background)||!Array.isArray(page.elements)||page.elements.length>150)fail('Ungültige Seite.');ids.add(page.id);
   for(const e of page.elements){if(!/^[-\w]{1,100}$/.test(e.id)||ids.has(e.id)||!['text','image','icon','shape','line','hotspot'].includes(e.type))fail('Ungültiges oder doppeltes Element.');ids.add(e.id);
    if(['x','y','width','height','rotation','z','opacity'].some(k=>!Number.isFinite(e[k]))||e.x<0||e.y<0||e.width<10||e.height<10||e.x+e.width>1001||e.y+e.height>page.height+1||e.rotation< -360||e.rotation>360||e.opacity<0||e.opacity>1||Math.abs(e.z)>10000)fail('Elemente müssen innerhalb der Seite liegen.');
    if(typeof e.locked!=='boolean'||typeof (e.group||'')!=='string'||(e.group||'').length>100)fail('Ungültige Elementgruppe.');
    if(['text','hotspot'].includes(e.type)&&(!cleanHTML(e.html)||typeof e.label!=='string'||e.label.length>200))fail('Bitte ausschließlich sicheren formatierten Text verwenden.');
    if(e.type==='image'&&(!original[e.assetId]&&!assets[e.assetId]||typeof e.alt!=='string'||e.alt.length>500))fail('Das Bild ist nicht für diese Reichweite verfügbar.');
    const style=e.style||{};if(typeof style!=='object'||Array.isArray(style))fail('Ungültige Formatierung.');if(Object.keys(style).some(k=>!['fontSize','bold','italic','align','lineHeight','color','fill','font','fit','positionX','positionY','border'].includes(k)))fail('Unbekannte Formatierung.');
    for(const k of ['color','fill','border'])if(style[k]&&!/^#[a-f\d]{6}$/i.test(style[k]))fail('Ungültige Farbe.');
    if(style.fontSize!=null&&(!Number.isFinite(style.fontSize)||style.fontSize<10||style.fontSize>120)||style.lineHeight!=null&&(!Number.isFinite(style.lineHeight)||style.lineHeight<1||style.lineHeight>3)||style.align&&!['left','center','right'].includes(style.align)||style.font&&!['Georgia','system-ui'].includes(style.font)||style.fit&&!['contain','cover'].includes(style.fit))fail('Ungültige Text- oder Bildformatierung.');
    for(const k of ['positionX','positionY'])if(style[k]!=null&&(!Number.isFinite(style[k])||style[k]<0||style[k]>100))fail('Ungültiger Bildausschnitt.');
    if(e.type==='icon'&&!['compass','cross','leaf','star','arrow','camp','fleur'].includes(e.icon))fail('Bitte ein vorhandenes Symbol auswählen.');
   }
  }return true;
 }
 function checkLayers(s,g={}){for(const [scope,l] of [['global',g.visualPages],['local',s.visualPages]]){if(!l)continue;if(l.schema!==1||!Number.isSafeInteger(l.revision)||l.revision<0||!l.records||!l.assets||!l.permissions||!Array.isArray(l.audit))fail('Unbekanntes Seitenformat. Die Originaldaten bleiben erhalten.');const assets={...(g.visualPages?.assets||{}),...(scope==='local'?l.assets:{})};for(const r of Object.values(l.records)){if(!Number.isSafeInteger(r.revision)||r.revision<0||!Array.isArray(r.history)||!Array.isArray(r.audit))fail('Ungültige Seitenversion.');for(const doc of [r.draft,r.published?.document,...r.history.map(v=>v.document)].filter(Boolean))validate(doc,assets);}}}
 const previous={apply:M.apply,snapshot:M.snapshot,check:M.check};
 M.apply=(s,env,a,g,type,p={},at=new Date().toISOString(),uid=()=>crypto.randomUUID())=>{
  checkLayers(s,g);const member=a.stammId===a.homeStammId?env[a.kind]?.find(m=>same(m.id,a.id)):null;if(a.membershipStatus&&a.membershipStatus!=='active'||member&&!P.active(member))fail('Diese Mitgliedschaft erlaubt derzeit nur Lesezugriff.');
  if(type==='membership-change'){
   const m=P.change(env,a,p,at,uid);if(p.kind==='rangers')for(const e of s.exams.filter(e=>same(e.rangerId,p.personId)&&e.status==='registered')){e.membershipReviewRequired={at,by:a.id,status:p.status,effectiveFrom:p.effectiveFrom};}s.revision++;s.audit.push({type,kind:p.kind,personId:p.personId,by:a.id,at,stammId:a.stammId,membershipRevision:m.revision});return {revision:m.revision};
  }
  if(!type.startsWith('visual-'))return previous.apply(s,env,a,g,type,p,at,uid);
  const r=rights(a,s),scope=p.scope;if(!['global','local'].includes(scope)||!r[scope])fail('Keine Bearbeitungsrechte für diese Reichweite.');
  const l=clone(current(s,g,scope)),commit=()=>{l.revision++;if(scope==='global')g.visualPages=l;else s.visualPages=l;s.revision++;};
  if(type==='visual-permission'){
   if(a.role!=='Admin'||scope!=='local'||!env.leaders.some(m=>same(m.id,p.personId)))fail('Nur Admin darf vorhandenen Leitern Editorrechte geben.');
   if(typeof p.enabled!=='boolean')fail('Ungültige Berechtigung.');l.permissions['leaders:'+p.personId]=p.enabled;l.audit.push({type,by:a.id,personId:p.personId,enabled:p.enabled,at});commit();return;
  }
  if(type==='visual-asset'){
   const asset=p.asset;if(!asset||!/^upload-[a-f\d]{64}$/.test(asset.id)||!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(asset.mime)||!Number.isSafeInteger(asset.bytes)||asset.bytes<1||asset.bytes>8388608||typeof asset.alt!=='string'||asset.alt.length>500||!Number.isFinite(asset.width)||!Number.isFinite(asset.height))fail('Ungültiges Bild.');
   l.assets[asset.id]={id:asset.id,mime:asset.mime,bytes:asset.bytes,alt:asset.alt,width:asset.width,height:asset.height,source:'admin-upload',by:a.id,at,stammId:a.stammId,scope};commit();return;
  }
  const c=W.effective(g.rangerWisdom,s.rangerWisdom),module=c.modules.find(m=>m.id===p.moduleId);if(!module)fail('Wissensthema nicht gefunden.');
  const old=l.records[p.moduleId]||{revision:0,draft:null,published:null,history:[],audit:[]};if(old.revision!==p.revision)fail('Versionskonflikt: Eine andere Bearbeitung wurde gespeichert. Bitte vergleichen und neu laden.');
  const record=clone(old),assets={...(g.visualPages?.assets||{}),...(scope==='local'?s.visualPages?.assets||{}:{})};
  if(type==='visual-draft'){validate(p.document,assets);record.draft=clone(p.document);}
  else if(type==='visual-discard')record.draft=null;
  else if(type==='visual-restore'){const v=record.history.find(v=>v.version===p.version);if(!v)fail('Veröffentlichte Version fehlt.');record.draft=clone(v.document);}
  else if(type==='visual-publish'){
   if(!record.draft)fail('Zuerst einen Entwurf speichern.');validate(record.draft,assets);const version={version:record.history.length+1,document:clone(record.draft),authorId:a.id,authorKind:a.kind,authorHomeStammId:a.homeStammId,role:a.role,at,scope,stammId:a.stammId};record.history.push(version);record.published=clone(version);record.draft=null;
  }else fail('Unbekannter Editorauftrag.');
  record.revision++;record.updatedAt=at;record.authorId=a.id;record.authorHomeStammId=a.homeStammId;record.audit.push({type,at,by:a.id,homeStammId:a.homeStammId,stammId:a.stammId,scope,revision:record.revision});l.records[p.moduleId]=record;commit();return {revision:record.revision};
 };
 M.snapshot=(s,env,a,g=window.RHKnowledgeCatalogV30.emptyLayer(),...args)=>{
  checkLayers(s,g);const out=previous.snapshot(s,env,a,g,...args),r=rights(a,s),global=g.visualPages||layer(),local=s.visualPages||layer(),w=out.wisdom,records={};
  const self=a.stammId===a.homeStammId?env[a.kind]?.find(p=>same(p.id,a.id)):null,readOnly=a.membershipStatus==='paused'||self&&!P.active(self);if(readOnly){r.global=false;r.local=false;out.rights={};w.rights={global:false,local:false};Object.assign(w,W.visible(W.effective(g.rangerWisdom,s.rangerWisdom),{...a,leader:false}));delete w.layers;delete w.preview;delete out.layers;delete out.permissions;out.audit=[];if(a.leader){out.people=[];out.exams=[];out.ledger=[];out.bible.records={};}}
  const visible=W.visible(W.effective(g.rangerWisdom,s.rangerWisdom),{...a,leader:false});
  for(const module of visible.modules){const v=local.records[module.id]?.published||global.records[module.id]?.published;if(v)records[module.id]={...clone(v),document:{schema:1,pages:v.document.pages.filter(p=>p.visible&&!p.archived).map(clone)}};}
  out.visual={schema:1,revision:`${global.revision}:${local.revision}`,rights:r,published:records,assets:{...clone(global.assets),...clone(local.assets)},ai:{configured:false},...(r.local?{layers:{global:r.global?clone(global):{...layer(),records:Object.fromEntries(Object.entries(global.records).map(([id,v])=>[id,{revision:v.revision,published:clone(v.published)}])),assets:clone(global.assets)},local:clone(local)}}:{})};
  if(!r.local){const refs=new Set(Object.values(records).flatMap(v=>v.document.pages.flatMap(p=>p.elements.map(e=>e.assetId).filter(Boolean))));out.visual.assets=Object.fromEntries(Object.entries(out.visual.assets).filter(([id])=>refs.has(id)));}
  const manage=P.canManage(a)&&!readOnly;out.memberships={canManage:manage,readOnly,ownStatus:self?P.status(self):'active',people:a.leader&&!readOnly?Object.fromEntries(['rangers','leaders'].map(kind=>[kind,env[kind].map(p=>({id:p.id,name:p.name||p.alias||String(p.id),points:kind==='rangers'?M.totals(s,p.id):null,bible:kind==='rangers'?window.RHBibleModel.summary(s,p.id):null,bibleRecords:kind==='rangers'?clone(s.bibleReading?.records?.[p.id]||{}):{},pendingExams:kind==='rangers'?s.exams.filter(e=>same(e.rangerId,p.id)&&e.status==='registered').map(e=>({id:e.id,taskId:e.taskId,meetingId:e.meetingId,membershipReviewRequired:!P.active(p)})):[],membership:P.publicMembership(p,manage)}))])):{[a.kind]:self?[{id:self.id,membership:P.publicMembership(self)}]:[]}};
  return out;
 };
 window.RHVisualModel={checkLayers,layer,rights,validate,cleanHTML,current};
})();
