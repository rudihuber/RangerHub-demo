/* V33 chapter plan: one existing book record, one existing append-only points journal. */
(() => {
 'use strict';
 const M=window.RHKnowledgeModel,BM=window.RHBibleModel,B=window.RHBibleCatalog,previous={check:M.check,migrate:M.migrate,apply:M.apply,snapshot:M.snapshot,summary:BM.summary};
 const same=(a,b)=>String(a)===String(b),fail=m=>{throw Error(m);},copy=x=>structuredClone(x),all=b=>Array.from({length:b.chapters},(_,i)=>i+1);
 const totals={AT:B.books.filter(b=>b.testament==='AT').reduce((n,b)=>n+b.chapters,0),NT:B.books.filter(b=>b.testament==='NT').reduce((n,b)=>n+b.chapters,0)};
 if(B.books.length!==66||totals.AT!==929||totals.NT!==260)fail('Der kanonische Bibel-Kapitelkatalog ist unvollständig. Bestehende Daten bleiben erhalten.');
 function chapterState(record){return record.chapterState?copy(record.chapterState):{schema:1,explicit:record.isRead,chapters:[]};}
 function checkChapters(s){
  for(const books of Object.values(s.bibleReading?.records||{}))for(const [id,r] of Object.entries(books))if(r.chapterState){
   const b=BM.book(id),c=r.chapterState;if(c.schema!==1||typeof c.explicit!=='boolean'||!Array.isArray(c.chapters)||c.chapters.some((n,i,a)=>!Number.isSafeInteger(n)||n<1||n>b.chapters||i>0&&n<=a[i-1])||r.isRead!==(c.explicit||c.chapters.length===b.chapters))fail('Buchstatus und Kapitelplan sind nicht konsistent. Deine bisherigen Daten bleiben erhalten.');
  }
 }
 function chapterSummary(s,rid,bid){
  const b=BM.book(bid);if(!b)return {read:0,total:0,percent:0,isRead:false,explicit:false,chapters:[]};
  const r=BM.record(s,rid,bid),c=chapterState(r),chapters=c.explicit?all(b):c.chapters;
  return {read:chapters.length,total:b.chapters,percent:chapters.length/b.chapters*100,isRead:r.isRead,explicit:c.explicit,chapters,storedChapters:c.chapters};
 }
 BM.chapterSummary=chapterSummary;BM.chapterState=chapterState;BM.chapterCount=1189;
 BM.summary=(s,rid)=>{
  const summaries=B.books.map(b=>({book:b,...chapterSummary(s,rid,b.id)})),chapters=summaries.reduce((n,r)=>n+r.read,0);
  return {...previous.summary(s,rid),chapters,chapterCount:1189,chapterPercent:chapters/1189*100,ATChapters:summaries.filter(r=>r.book.testament==='AT').reduce((n,r)=>n+r.read,0),NTChapters:summaries.filter(r=>r.book.testament==='NT').reduce((n,r)=>n+r.read,0)};
 };
 M.check=s=>{previous.check(s);checkChapters(s);};
 // Legacy read flags are interpreted as full coverage. Merely reading/migrating does not write records or points.
 M.migrate=s=>{const n=previous.migrate(s);checkChapters(n);return n;};
 M.snapshot=(state,env,a,g,...rest)=>{
  const out=previous.snapshot(state,env,a,g,...rest),s=M.migrate(state);out.bible={...out.bible,chapterSchema:1,totalChapters:1189,oldTestamentChapters:929,newTestamentChapters:260};
  const permitted=new Set(out.people.map(p=>String(p.id)));
  out.ranking=out.ranking.map(r=>{if(a.leader?!permitted.has(String(r.id)):!same(r.id,a.id))return r;const p=BM.summary(s,r.id);return {...r,bibleChapters:p.chapters,bibleChapterPercent:p.chapterPercent};});return out;
 };
 M.apply=(s,env,a,g,type,payload={},at=new Date().toISOString(),uid=()=>crypto.randomUUID())=>{
  if(!['set-bible-read','set-bible-chapter'].includes(type))return previous.apply(s,env,a,g,type,payload,at,uid);
  M.check(s);
  if(a.kind!=='rangers'||a.leader||a.stammId!==a.homeStammId||!env.rangers.some(p=>same(p.id,a.id)&&M.active(p)))fail('Nur Ranger dürfen ihren eigenen Bibellese-Fortschritt ändern.');
  const allowed=type==='set-bible-chapter'?['bookId','chapter','isRead','version']:['bookId','isRead','version'];
  if(!payload||Object.keys(payload).some(k=>!allowed.includes(k))||typeof payload.isRead!=='boolean'||!Number.isSafeInteger(payload.version)||payload.version<0)fail('Bitte einen eindeutigen Lesestatus mit gültiger Version senden. Fremde Profile oder Punktzahlen können nicht vorgegeben werden.');
  const b=BM.book(payload.bookId);if(!b)fail('Dieses Buch gehört nicht zum kanonischen Bibelkatalog.');
  const current=BM.record(s,a.id,b.id),c=chapterState(current),effective=c.explicit?all(b):c.chapters;
  if(type==='set-bible-chapter'){
   if(!Number.isSafeInteger(payload.chapter)||payload.chapter<1||payload.chapter>b.chapters)fail('Dieses Kapitel gehört nicht zu dem ausgewählten Bibelbuch.');
   if(effective.includes(payload.chapter)===payload.isRead)return {existing:true,version:current.version};
   c.explicit=false;c.chapters=payload.isRead?[...effective,payload.chapter].sort((a,b)=>a-b):effective.filter(n=>n!==payload.chapter);
  }else {
   if(current.isRead===payload.isRead)return {existing:true,version:current.version};
   if(payload.isRead)c.explicit=true;
   else {c.explicit=false;if(c.chapters.length===b.chapters)c.chapters=c.chapters.filter(n=>n!==b.chapters);}
  }
  if(current.version!==payload.version)fail('Dieses Buch wurde inzwischen auf einem anderen Gerät geändert. Der aktuelle Stand wurde geladen; bitte prüfe ihn vor einer neuen Änderung.');
  const isRead=c.explicit||c.chapters.length===b.chapters;
  if(isRead!==current.isRead)previous.apply(s,env,a,g,'set-bible-read',{bookId:b.id,isRead,version:current.version},at,uid);
  else {s.bibleReading.records[a.id]||={};s.bibleReading.records[a.id][b.id]={...current,version:current.version+1,updatedAt:at};s.revision++;}
  const next=s.bibleReading.records[a.id][b.id];s.bibleReading.records[a.id][b.id]={...current,...next,chapterState:c};M.check(s);
  return {version:next.version,isRead,chapters:isRead?b.chapters:c.chapters.length};
 };
})();
