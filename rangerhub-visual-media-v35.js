/* Images are immutable original references or scoped blobs, never base64 in rhv9. */
(() => {
 'use strict';const RH=window.RangerHub,storageKey=document.querySelector('meta[name=rangerhub-storage]').content,cache=new Map();
 const open=()=>new Promise((resolve,reject)=>{const req=indexedDB.open(storageKey+'-media-v35',1);req.onupgradeneeded=()=>req.result.createObjectStore('images');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('Der lokale Bildspeicher ist nicht verfügbar.'));});
 async function blobStore(key,value){const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('images',value===undefined?'readonly':'readwrite'),store=tx.objectStore('images'),r=value===undefined?store.get(key):store.put(value,key);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(Error('Bild konnte nicht gespeichert werden.'));});}finally{db.close();}}
 RH.editorRequestV35=async(path,{method='GET',body,query={},raw=false}={})=>{
  const transport=RH.transportV35(),actor=RH.knowledgeActor();if(transport.mode!=='online')throw Error('Diese Funktion benötigt die eingerichtete persönliche Server-Anbindung.');
  await transport.load();const token=await transport.getAccessToken();if(RH.knowledgeActor().key!==actor.key)throw Error('Profil gewechselt.');
  const url=new URL(transport.baseURL.replace(/\/$/,'')+'/knowledge'+path);url.searchParams.set('stammId',actor.stammId);for(const [k,v] of Object.entries(query))url.searchParams.set(k,String(v));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);try{const response=await fetch(url,{method,credentials:'omit',signal:controller.signal,headers:{Authorization:'Bearer '+token,...(body instanceof Blob?{'Content-Type':body.type}:body?{'Content-Type':'application/json'}:{})},...(body?{body:body instanceof Blob?body:JSON.stringify(body)}:{})});if(!response.ok){const data=await response.json();throw Error(data.error||'Serveranfrage fehlgeschlagen.');}if(RH.knowledgeActor().key!==actor.key)throw Error('Profil gewechselt.');return raw?await response.blob():await response.json();}finally{clearTimeout(timer);}
 };
 async function dimensions(blob){const url=URL.createObjectURL(blob);try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight,img});img.onerror=()=>reject(Error('Dieses Bild kann nicht gelesen werden.'));img.src=url;});}finally{URL.revokeObjectURL(url);}}
 async function sanitizeFile(file){
  if(!file||file.size>8388608||!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(file.type))throw Error('Bitte PNG, JPG, WebP oder SVG bis 8 MB wählen.');let blob=file;const signature=new Uint8Array(await file.slice(0,16).arrayBuffer());if(file.type==='image/png'&&![137,80,78,71,13,10,26,10].every((v,i)=>signature[i]===v)||file.type==='image/jpeg'&&!(signature[0]===255&&signature[1]===216&&signature[2]===255)||file.type==='image/webp'&&!(String.fromCharCode(...signature.slice(0,4))==='RIFF'&&String.fromCharCode(...signature.slice(8,12))==='WEBP'))throw Error('Bildinhalt und Dateityp stimmen nicht überein.');
  if(file.type==='image/svg+xml'){
   const doc=new DOMParser().parseFromString(await file.text(),'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Ungültiges SVG.');
   const tags=new Set(['svg','g','path','circle','ellipse','rect','line','polygon','polyline','defs','linearGradient','radialGradient','stop','clipPath','title','desc']);for(const el of doc.querySelectorAll('*')){if(!tags.has(el.localName))throw Error('Aktives SVG-Element nicht erlaubt.');for(const a of [...el.attributes])if(/^on/i.test(a.name)||['href','xlink:href','style'].includes(a.name)||/(?:javascript:|data:|https?:)/i.test(a.value)&&a.name!=='xmlns'||/url\((?!#[\w-]+\))/i.test(a.value))throw Error('Externe oder aktive SVG-Inhalte sind nicht erlaubt.');}if(doc.doctype)throw Error('SVG-Dokumenttyp nicht erlaubt.');blob=new Blob([new XMLSerializer().serializeToString(doc.documentElement)],{type:file.type});
  }
  const d=await dimensions(blob);if(d.width<1||d.height<1||d.width>20000||d.height>20000)throw Error('Ungültige Bildgröße.');
  if(blob.type!=='image/svg+xml'&&(d.width>2048||d.height>2048)){
   const canvas=document.createElement('canvas'),scale=Math.min(1,2048/Math.max(d.width,d.height));canvas.width=Math.round(d.width*scale);canvas.height=Math.round(d.height*scale);canvas.getContext('2d').drawImage(d.img,0,0,canvas.width,canvas.height);blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.92));if(!blob)throw Error('Bildoptimierung fehlgeschlagen.');return {blob,width:canvas.width,height:canvas.height};
  }return {blob,width:d.width,height:d.height};
 }
 RH.prepareVisualFileV35=sanitizeFile;
 RH.uploadVisualAssetV35=async(file,scope)=>{
  const {blob,width,height}=await sanitizeFile(file),actor=RH.knowledgeActor(),alt=file.name.replace(/\.[^.]+$/,'').slice(0,500)||'Eigenes Bild';
  if(RH.transportV35().mode==='online')return RH.editorRequestV35('/assets',{method:'POST',body:blob,query:{scope,width,height,alt}});
  const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()),id='upload-'+[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join(''),key=(scope==='global'?'global':actor.stammId)+':'+id,meta={id,mime:blob.type,bytes:blob.size,width,height,alt};await blobStore(key,blob);
  if(RH.knowledgeActor().key!==actor.key)throw Error('Profil gewechselt.');await RH.commandV35('visual-asset',{scope,asset:meta});cache.delete(actor.stammId+':'+id);return meta;
 };
 RH.mediaBackupV35=async()=>{const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('images','readonly'),store=tx.objectStore('images'),keys=store.getAllKeys(),values=store.getAll();tx.oncomplete=()=>resolve(keys.result.map((key,i)=>({key,blob:values.result[i]})));tx.onerror=()=>reject(Error('Bildsicherung fehlgeschlagen.'));});}finally{db.close();}};
 RH.restoreMediaV35=async entries=>{const db=await open();try{await new Promise((resolve,reject)=>{const tx=db.transaction('images','readwrite'),store=tx.objectStore('images');for(const item of entries)store.put(item.blob,item.key);tx.oncomplete=resolve;tx.onerror=()=>reject(Error('Der Bildspeicher hat die Wiederherstellung abgebrochen.'));});cache.clear();}finally{db.close();}};
 RH.visualAssetURLV35=async id=>{
  const original=window.RHWisdomOriginalAssets[id];if(original)return original.src;const a=RH.knowledgeActor(),key=a.stammId+':'+id;if(!cache.has(key))cache.set(key,(async()=>{let blob;if(RH.transportV35().mode==='online')blob=await RH.editorRequestV35('/assets/'+encodeURIComponent(id),{raw:true});else blob=await blobStore(a.stammId+':'+id)||await blobStore('global:'+id);if(!blob)throw Error('Bild fehlt in diesem Browserprofil.');return URL.createObjectURL(blob);})().catch(e=>{cache.delete(key);throw e;}));return cache.get(key);
 };
 RH.hydrateVisualV35=host=>{host.querySelectorAll('img[data-visual-asset]').forEach(async img=>{try{const url=await RH.visualAssetURLV35(img.dataset.visualAsset);if(img.isConnected)img.src=url;}catch(e){img.alt=e.message;img.classList.add('vp35-image-error');}});};
})();
