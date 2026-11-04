/* One Fachwissen access boundary, using existing identities and storage namespace. */
(() => {
 'use strict';
 const RH=window.RangerHub,M=window.RHKnowledgeModel;
 const storageKey=document.querySelector('meta[name="rangerhub-storage"]')?.content;
 if(!/^rhv9(?:-demo)?$/.test(storageKey||''))throw Error('Fachwissen: vorhandener Speicher nicht zugeordnet.');
 const actor=()=>RH.messageActor();
 const read=()=>{const root=JSON.parse(localStorage.getItem(storageKey)||'null');if(!root?.__rhv24||!root.stamms)throw Error('Die vorhandenen App-Daten sind nicht lesbar.');return root;};
 function current(){const a=actor(),root=read(),tribe=root.stamms[a.stammId];if(!tribe)throw Error('Stamm nicht gefunden.');const state=tribe.knowledge??M.initial();M.check(state);return {a,root,tribe,state};}
 RH.createLocalKnowledgeTransport=()=>({
  mode:'demo',
  async load(filter={}){const {a,tribe,state}=current();return M.snapshot(state,tribe.rangers,a,filter);},
  async command(type,payload={},requestId=RH.uid()){
   const origin=actor();
   const write=()=>{
    const {a,root,tribe,state}=current();if(a.key!==origin.key)throw Error('Das Profil wurde gewechselt. Bitte erneut öffnen.');
    const next=structuredClone(state);M.apply(next,tribe.rangers,a,type,payload);tribe.knowledge=next;
    try{localStorage.setItem(storageKey,JSON.stringify(root));}catch{throw Error('Nicht gespeichert. Der Browserspeicher ist voll oder nicht verfügbar. Deine bisherigen Daten bleiben erhalten.');}
    v24Store.stamms[a.stammId].knowledge=next;if(db.__v24Stamm===a.stammId)db.knowledge=next;
    document.dispatchEvent(new CustomEvent('rangerhub:knowledge',{detail:{stammId:a.stammId,requestId}}));
   };
   if(navigator.locks?.request)await navigator.locks.request(storageKey+':knowledge',write);else write();
  },
  subscribe(callback){
   const event=()=>callback(),storage=e=>{
    if(e.key!==storageKey)return;
    try{const {a,state}=current();if(read().stamms[a.stammId].knowledge){v24Store.stamms[a.stammId].knowledge=state;if(db.__v24Stamm===a.stammId)db.knowledge=state;}callback();}catch{/* A signed-out context has no shared view. */}
   };
   document.addEventListener('rangerhub:knowledge',event);window.addEventListener('storage',storage);
   return()=>{document.removeEventListener('rangerhub:knowledge',event);window.removeEventListener('storage',storage);};
  }
 });
 // Older app actions must not overwrite newer Fachwissen records from another tab.
 const persist=v24Persist;
 v24Persist=function(...args){
  const fresh=read();
  for(const [id,tribe] of Object.entries(v24Store.stamms))if(fresh.stamms[id]?.knowledge!==undefined)tribe.knowledge=fresh.stamms[id].knowledge;
  if(fresh.stamms[v24StammId]?.knowledge!==undefined)db.knowledge=fresh.stamms[v24StammId].knowledge;
  return persist.apply(this,args);
 };
 RH.createHttpKnowledgeTransport=({baseURL,getAccessToken})=>{
  const base=new URL(baseURL);
  if(base.protocol!=='https:'&&!(base.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(base.hostname)))throw Error('Die zentrale Fachwissen-Anbindung benötigt HTTPS.');
  if(base.username||base.password||base.search||base.hash||typeof getAccessToken!=='function')throw Error('Eine persönliche Server-Anmeldung ist erforderlich.');
  async function request(method,filter={},body,providedToken){
   const a=actor(),token=providedToken??await getAccessToken();if(!token||actor().key!==a.key)throw Error('Bitte persönlich für Fachwissen anmelden.');
   if(method==='POST')await request('GET',{},undefined,token);
   if(actor().key!==a.key)throw Error('Das Profil wurde gewechselt. Bitte erneut öffnen.');
   const url=new URL(base.href.replace(/\/$/,'')+'/knowledge'+(method==='POST'?'/commands':''));url.searchParams.set('stammId',a.stammId);
   for(const [k,v] of Object.entries(filter))if(v)url.searchParams.set(k,v);
   const control=new AbortController(),timer=setTimeout(()=>control.abort(),12000);
   try{
    const response=await fetch(url,{method,credentials:'omit',signal:control.signal,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(response.status===401)throw Error('Deine persönliche Online-Anmeldung ist abgelaufen.');
    if(response.status===403)throw Error('Kein Zugriff auf diesen Stamm oder diesen Nachweis.');
    const data=await response.json();if(!response.ok)throw Error(data.error||'Der Fachwissen-Dienst ist gerade nicht erreichbar.');
    if(actor().key!==a.key)throw Error('Das Profil wurde gewechselt. Bitte erneut öffnen.');
    if(method==='GET'&&(!data.actor||String(data.actor.id)!==String(a.id)||data.actor.kind!==a.kind||data.actor.leader!==a.leader||data.actor.stammId!==a.stammId||data.actor.homeStammId!==a.homeStammId))throw Error('Die Online-Anmeldung passt nicht zum ausgewählten RangerHub-Profil. Bitte persönlich anmelden.');
    return data;
   }catch(e){if(e.name==='AbortError')throw Error('Der Fachwissen-Dienst antwortet gerade nicht. Bitte erneut versuchen.');throw e;}finally{clearTimeout(timer);}
  }
  return {mode:'online',load:filter=>request('GET',filter),command:(type,payload,requestId=RH.uid())=>request('POST',{}, {type,payload,requestId}),subscribe:()=>()=>{}};
 };
})();
