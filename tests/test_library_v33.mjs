import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';

const root=new URL('../',import.meta.url);
const text=path=>readFileSync(new URL(path,root),'utf8');
const json=path=>JSON.parse(text(path));
const catalog=json('data/ranger-wissen-content-v33.json');
const previous=json('data/ranger-wissen-content.json');
const proof=json('data/library-source-map-v33.json');
function setup(){
 const context={structuredClone,console,esc:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),db:{rangers:[],leaders:[]},v24StammName:()=> 'Eigener Stamm'};
 context.window=context;context.RangerHub={};
 context.RHKnowledgeModel={check(){},migrate:s=>s,apply(){},snapshot:()=>({}),alias:p=>p.name};
 for(const path of ['rangerhub-wisdom-catalog-v33.js','rangerhub-wisdom-model.js','rangerhub-wisdom-views-v33.js'])runInNewContext(text(path),context,{filename:path});
 return context;
}
test('16 module and 76 hotspot identities and initial release flags survive source correction',()=>{
 for(const kind of ['groups','modules','hotspots'])assert.deepEqual(catalog[kind].map(i=>i.id),previous[kind].map(i=>i.id));
 assert.equal(catalog.modules.length,16);assert.equal(catalog.hotspots.length,76);
 assert.deepEqual(catalog.modules.map(m=>[m.id,m.published]),previous.modules.map(m=>[m.id,m.published]));
 assert.ok(!/pdf_page|pdfPage|source_blocks|printed_pages|sourcePages/.test(JSON.stringify(catalog)));
 for(const h of catalog.hotspots)assert.equal(h.text,proof.text_passages.find(p=>p.hotspot===h.id).quote);
 for(const m of catalog.modules)assert.equal(m.introduction,proof.text_passages.find(p=>p.module===m.id&&'introduction'in p).introduction);
});
test('43 checked original files are used; motto retains its own source typography',()=>{
 const c=setup(),assets=c.RHWisdomOriginalAssets,modules=c.RHWisdomModuleAssets;
 assert.equal(Object.keys(assets).length,43);
 const used=new Set(Object.values(modules).flatMap(m=>m.gallery));
 assert.deepEqual([...used].sort(),Object.keys(assets).sort());
 for(const row of proof.assets){
  const bytes=readFileSync(new URL(row.file,root));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
  assert.equal(bytes.length,row.bytes);assert.equal(assets[row.key].src,row.file);
  assert.match(assets[row.key].alt,/\S/);assert.match(row.file,/^assets\/ranger-library\/lb4-[a-f0-9]{12}\.webp$/);
 }
 assert.equal(modules.motto.hero,null);assert.equal(modules.motto.gallery.length,0);
});
test('old edits, publication flags and custom entries remain authoritative without state mutation',()=>{
 const c=setup(),M=c.RHWisdomModel,g=M.empty(),l=M.empty();
 g.overrides.modules.emblem={revision:7,fields:{title:'Global bearbeiteter Titel',published:false,illustrationKey:'emblem'}};
 l.overrides.modules.emblem={revision:9,fields:{title:'Lokal bearbeiteter Titel',published:true}};
 l.overrides.hotspots['emblem-1']={revision:2,fields:{text:'Eigener gespeicherter Text',x:25,y:40}};
 l.entries.modules.push({id:'custom-topic',groupId:'grundlagen',title:'Eigenes Thema',order:90,published:true,archived:false,illustrationKey:'unknown-custom-art',introduction:'Gespeicherte Einleitung',text:''});
 l.entries.hotspots.push({id:'custom-point',moduleId:'custom-topic',label:'Eigener Punkt',text:'Eigener Text',order:0,archived:false});
 const before=JSON.stringify([g,l]),effective=M.effective(g,l),m=effective.modules.find(m=>m.id==='emblem');
 assert.equal(m.title,'Lokal bearbeiteter Titel');assert.equal(m.published,true);assert.equal(m.globalRevision,7);assert.equal(m.localRevision,9);
 assert.equal(effective.hotspots.find(h=>h.id==='emblem-1').text,'Eigener gespeicherter Text');
 assert.ok(effective.modules.some(m=>m.id==='custom-topic'));assert.equal(JSON.stringify([g,l]),before);
 const a={key:'test',leader:true,role:'Stammleiter'},w={...effective,rights:M.rights(a),layers:{global:g,local:l},preview:M.visible(effective,a,true)};
 const factory=step=>c.RangerHub.wisdomViews({data:{wisdom:w},actor:()=>a,button:()=>'',step});
 assert.match(factory({kind:'wisdom-module',id:'emblem',hotspot:'emblem-1'}).module(),/Eigener gespeicherter Text/);
 assert.match(factory({kind:'wisdom-module',id:'custom-topic'}).module(),/Keine Abbildung hinterlegt/);
 assert.match(factory({kind:'wisdom-edit',id:'emblem',entityKind:'modules'}).form(),/data-rw-form/);
 assert.match(factory({kind:'wisdom-manage'}).management(),/data-rw-publish/);
});
test('all module views use original images or exact motto typography and original source text',()=>{
 const c=setup(),M=c.RHWisdomModel,a={key:'all-topics',leader:true,role:'Admin'},effective=M.effective(),w={...effective,rights:M.rights(a),layers:{global:M.empty(),local:M.empty()},preview:M.visible(effective,a,true)};
 for(const m of catalog.modules){
  const hs=catalog.hotspots.filter(h=>h.moduleId===m.id),view=c.RangerHub.wisdomViews({data:{wisdom:w},actor:()=>a,button:()=>'',step:{kind:'wisdom-module',id:m.id,hotspot:hs[0].id}}),html=view.module();
  assert.ok(!html.includes('<svg'));assert.match(html,/data-wisdom-detail/);
  assert.ok(html.includes(c.esc(hs[0].text.split(/\n\s*\n/)[0])));
  if(m.id==='motto'){assert.match(html,/>SEI BEREIT</);assert.ok(!html.includes('<img'));}
  else assert.match(html,/<img[^>]+data-original-asset="lb4-[a-f0-9]{12}"/);
 }
 const group=c.RangerHub.wisdomViews({data:{wisdom:w},actor:()=>a,button:()=>'',step:{kind:'wisdom-group',id:'werte'}}).group();
 const mottoCard=group.match(/<button[^>]+data-kw-value="motto"[\s\S]*?<\/button>/)?.[0];
 assert.ok(mottoCard);assert.match(mottoCard,/>SEI BEREIT</);assert.ok(!mottoCard.includes('<img'));
});
