/* Fachwissen domain rules. Local preview only; the online service rechecks every command. */
(() => {
  'use strict';
  const catalog = window.RangerHubKnowledgeCatalog, tasks = new Map(catalog.tasks.map(t => [t.id, t]));
  const same = (a,b) => String(a) === String(b), clone = x => structuredClone(x);
  const fail = message => { throw Error(message); };
  const clean = (s,max=6000,required=true) => typeof s === 'string' && s.trim().length <= max && (!required || s.trim()) ? s.trim() : fail('Bitte einen gültigen Text eingeben.');
  const date = (at=new Date()) => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(at));
  const week = at => { const d=new Date(date(at)+'T12:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10); };
  const alias = p => { if(p.alias)return String(p.alias).slice(0,60);const words=String(p.name||'Ranger').trim().split(/\s+/);return words[0]+(words.length>1?' '+words.at(-1)[0]+'.':''); };
  const active = p => !p.archived && p.active !== false && p.knowledgeEligible !== false;
  const initial = () => ({schema:1,progress:{},ledger:[],challenges:[],policies:{},resolutions:{},audit:[]});
  const key = (rid,tid) => `${rid}:${tid}`;
  const check = state => { if(state.schema!==1 || !Array.isArray(state.ledger) || !state.progress || !Array.isArray(state.challenges))fail('Unbekanntes Fachwissen-Datenformat. Die Daten bleiben unverändert.'); };
  const totals = (state,rid,filter={}) => state.ledger.filter(e=>same(e.rangerId,rid)&&(!filter.category||tasks.get(e.taskId)?.sourceCategoryId===filter.category)&&(!filter.since||date(e.at)>=filter.since)&&(!filter.before||date(e.at)<filter.before)).reduce((n,e)=>n+e.points,0);
  const completed = (state,rid) => Object.values(state.progress).filter(p=>same(p.rangerId,rid)&&p.status==='approved');
  const ranking = (state,people,filter={}) => {
    const rows=people.filter(active).filter(p=>!filter.team||p.team===filter.team).map(p=>({id:p.id,alias:alias(p),team:p.team||'',points:totals(state,p.id,filter),approved:completed(state,p.id).length}));
    rows.sort((a,b)=>b.points-a.points||a.alias.localeCompare(b.alias,'de'));
    let previous=null,rank=0;rows.forEach((r,i)=>{if(r.points!==previous)rank=i+1;r.rank=r.points>0?rank:null;previous=r.points;});return rows;
  };
  function snapshot(state,people,a,filter={}) {
    check(state);const now=new Date(),start=week(now), before=ranking(state,people,{before:start});
    const rows=ranking(state,people,filter).map(r=>{const prev=before.find(x=>same(x.id,r.id));return {...r,weekPoints:totals(state,r.id,{since:start}),change:!prev?.rank&&r.rank?'neu':prev?.rank&&r.rank?prev.rank-r.rank:0};});
    const own=state.progress; const progress=Object.fromEntries(Object.entries(own).filter(([,p])=>a.leader||same(p.rangerId,a.id)));
    return {mode:'demo',progress:clone(progress),ledger:clone(state.ledger.filter(e=>a.leader||same(e.rangerId,a.id))),
      challenges:clone(state.challenges.filter(c=>a.leader||c.players.some(id=>same(id,a.id))).map(c=>({...c,playerStatuses:Object.fromEntries(c.players.map(id=>[id,state.progress[key(id,c.taskId)]?.status||'new']))}))),policies:a.leader?clone(state.policies):Object.fromEntries(Object.entries(state.policies).map(([id,p])=>[id,{published:p.published,clearances:Object.fromEntries(Object.entries(p.clearances||{}).map(([rid,v])=>[rid,{eligible:v.eligible,expiresAt:v.expiresAt}]))}])),resolutions:clone(state.resolutions),
      ranking:rows,people:people.filter(active).map(p=>({id:p.id,alias:alias(p),team:p.team||''})),
      pending:a.leader?Object.values(own).filter(p=>p.status==='submitted'&&people.some(r=>same(r.id,p.rangerId)&&active(r))).length:0,
      totalPoints:rows.reduce((n,r)=>n+r.points,0),actor:{id:a.id,kind:a.kind,leader:a.leader,stammId:a.stammId,homeStammId:a.homeStammId},stats:catalog.stats};
  }
  function apply(state,people,a,type,value={},at=new Date().toISOString(),uid=()=>crypto.randomUUID()) {
    check(state);const stamp={at,by:a.id,homeStammId:a.homeStammId,kind:a.leader?'leaders':'rangers'}, person=id=>people.find(p=>same(p.id,id)&&active(p));
    const lead=()=>a.leader||fail('Nur die Leitung darf diese Änderung bestätigen.');
    const mine=id=>{if(a.leader||!same(id,a.id)||!person(id))fail('Nur die eigene Ranger-Aufgabe kann bearbeitet werden.');};
    const task=()=>{const t=tasks.get(value.taskId);if(!t)fail('Aufgabe nicht gefunden.');return t;};
    const published=t=>t.isPublished&&state.policies[t.id]?.published!==false;
    const permission=(t,rid)=>{const p=state.policies[t.id]?.clearances?.[rid];return p&&p.eligible===true&&p.expiresAt>at;};
    const available=(t,rid,challenge=false)=>{if(!published(t))fail('Diese Aufgabe ist durch die Leitung gesperrt.');if((t.safetyFlags.length||challenge)&&!permission(t,rid))fail('Die Leitung muss Eignung und gegebenenfalls Aufsicht zuerst freigeben.');};
    const record=(rid,t)=>state.progress[key(rid,t.id)] ||= {rangerId:rid,taskId:t.id,status:'new',history:[]};
    const history=(p,action,extra={})=>p.history.push({...stamp,action,...extra});
    const balance=(rid,tid)=>state.ledger.filter(e=>same(e.rangerId,rid)&&e.taskId===tid).reduce((n,e)=>n+e.points,0);
    const approve=(p,t,comment)=>{
      if(p.status==='approved')return;
      if(p.status!=='submitted')fail('Zuerst einen Nachweis einreichen oder eine Vorführung dokumentieren.');
      available(t,p.rangerId);
      const option=t.pointOptions?.find(o=>same(o.sourceParagraphIndex,p.evidence?.pointOption)),resolution=option?{points:option.points,source:'DOCX Absatz '+option.sourceParagraphIndex,reason:option.text,...stamp}:state.resolutions[t.id],points=t.points??resolution?.points;
      if(points==null)fail('Der Quellwert muss vor der Bestätigung dokumentiert geklärt werden.');
      if(balance(p.rangerId,t.id)!==0)fail('Diese Aufgabe besitzt bereits eine Gutschrift.');
      const e={id:uid(),type:'credit',taskId:t.id,rangerId:p.rangerId,points,sourcePoints:t.points,sourceReference:t.sourceReference,
        ...(t.points==null?{resolution:clone(resolution)}:{}),...stamp,comment};
      state.ledger.push(e);Object.assign(p,{status:'approved',reviewedAt:at,reviewerId:a.id,comment,creditId:e.id});history(p,'approved',{points,comment,ledgerId:e.id});
    };
    const settle=c=>{
      const ps=c.players.map(rid=>state.progress[key(rid,c.taskId)]),done=ps.map(p=>p?.status==='approved'&&p.submittedAt>=c.acceptedAt&&p.submittedAt<=c.deadline);
      if(done.every(Boolean)){
        const diff=Date.parse(ps[0].submittedAt)-Date.parse(ps[1].submittedAt);
        c.status='finished';c.result={winner:Math.abs(diff)<=60000?null:c.players[diff<0?0:1],reason:'Bestätigte Einreichungen; bis 60 Sekunden Unterschied gilt Gleichstand.',at};
      }
    };
    if(['start','submit','observe','review','revoke','policy','resolve'].includes(type)) {
      const t=task(),rid=value.rangerId??a.id;
      if(!person(rid)&&!['policy','resolve'].includes(type))fail('Dieser Ranger ist nicht für Fachwissen berechtigt.');
      if(type==='policy'){
        lead();const policy=state.policies[t.id] ||= {clearances:{}};
        if(value.published!=null)policy.published=!!value.published;
        if(value.rangerId!=null){if(!person(rid))fail('Ranger nicht gefunden.');policy.clearances ||= {};policy.clearances[rid]={eligible:!!value.eligible,expiresAt:new Date(Date.parse(at)+30*86400000).toISOString(),reason:clean(value.reason,2000),...stamp};}
        state.audit.push({type,taskId:t.id,rangerId:rid,...stamp});return;
      }
      if(type==='resolve'){
        lead();if(t.points!==null)fail('Vorhandene Originalpunktwerte werden nicht verändert.');
        const points=Number(value.points);if(!Number.isInteger(points)||points<0||points>100)fail('Bitte eine ganze, belegte Punktzahl von 0 bis 100 eingeben.');
        const resolution={points,source:clean(value.source,1000),reason:clean(value.reason,2000),...stamp};
        state.resolutions[t.id]=resolution;state.audit.push({type,taskId:t.id,...resolution});return;
      }
      if(['review','revoke','observe'].includes(type))lead();else mine(rid);
      if(type!=='revoke')available(t,rid);const p=record(rid,t);
      if(type==='start'){if(p.status==='new'||p.status==='needs-work'){p.status='working';p.startedAt ||= at;history(p,'started');}return;}
      if(type==='submit'||type==='observe'){
        if(p.status==='approved')fail('Diese Aufgabe ist bereits bestätigt.');
        if(p.status==='submitted')return;
        const text=clean(value.text),evidenceType=type==='observe'?'leader-observed':value.evidenceType;
        if(!['text','oral','practice','leader-observed'].includes(evidenceType))fail('Bitte eine Nachweisart auswählen.');
        if(type==='submit'&&!value.consent)fail('Bitte die freiwillige Einreichung bestätigen.');
        if(value.pointOption&&!t.pointOptions?.some(o=>same(o.sourceParagraphIndex,value.pointOption)))fail('Unbekannte Quellalternative.');
        p.status='submitted';p.evidence={type:evidenceType,text,...(value.pointOption?{pointOption:Number(value.pointOption)}:{})};p.submittedAt=at;history(p,type,{text,evidenceType});return;
      }
      if(type==='review'){
        const comment=clean(value.comment||'',2000,false);
        if(value.approved)approve(p,t,comment);
        else {if(p.status!=='submitted')fail('Keine offene Einreichung.');p.status='needs-work';p.comment=clean(comment,2000);p.reviewedAt=at;p.reviewerId=a.id;history(p,'needs-work',{comment});}
        state.challenges.filter(c=>c.status==='active'&&c.taskId===t.id).forEach(settle);return;
      }
      if(type==='revoke'){
        const reason=clean(value.reason,2000);const credit=state.ledger.find(e=>e.id===p.creditId&&e.type==='credit');
        if(!credit||state.ledger.some(e=>e.reversalOf===credit.id))fail('Keine aktive Gutschrift zum Widerrufen.');
        state.ledger.push({id:uid(),type:'reversal',rangerId:rid,taskId:t.id,points:-credit.points,reversalOf:credit.id,...stamp,reason});
        p.status='needs-work';p.comment=reason;history(p,'revoked',{reason});
        state.challenges.filter(c=>c.taskId===t.id&&c.players.some(id=>same(id,rid))&&c.status==='finished').forEach(c=>{c.status='active';c.result=null;c.audit.push({type:'result-reopened',...stamp,reason});});return;
      }
    }
    if(type==='invite'){
      mine(a.id);const t=task(),target=person(value.targetId);
      if(!target||same(target.id,a.id))fail('Bitte einen anderen berechtigten Ranger aus deinem Stamm wählen.');
      for(const rid of [a.id,target.id]){available(t,rid,true);if(state.progress[key(rid,t.id)]?.status==='approved')fail('Für dieses Duell muss die Aufgabe für beide Ranger noch offen sein.');}
      const open=state.challenges.filter(c=>['invited','active'].includes(c.status)&&c.deadline>at);
      if(open.filter(c=>same(c.players[0],a.id)).length>=3||open.filter(c=>c.players.some(id=>same(id,target.id))).length>=5)fail('Es sind bereits genügend Herausforderungen offen.');
      if(open.some(c=>c.taskId===t.id&&c.players.some(id=>same(id,a.id))&&c.players.some(id=>same(id,target.id))))fail('Für diese Aufgabe besteht bereits eine Herausforderung.');
      const deadline=new Date(value.deadline).toISOString(),distance=Date.parse(deadline)-Date.parse(at);
      if(!(distance>=86400000&&distance<=31*86400000))fail('Die Frist muss zwischen einem und 30 Tagen liegen.');
      state.challenges.push({id:uid(),taskId:t.id,players:[a.id,target.id],createdAt:at,deadline,status:'invited',audit:[{type:'invited',...stamp}]});return;
    }
    const c=state.challenges.find(c=>c.id===value.challengeId);
    if(!c||!a.leader&&!c.players.some(id=>same(id,a.id)))fail('Diese Herausforderung ist nicht für dein Profil verfügbar.');
    if(type==='respond'){
      mine(a.id);if(!same(c.players[1],a.id)||c.status!=='invited'||c.deadline<=at)fail('Diese Einladung kann nicht mehr angenommen werden.');
      if(value.accept){const t=tasks.get(c.taskId);for(const rid of c.players){available(t,rid,true);if(state.progress[key(rid,t.id)]?.status==='approved')fail('Die Aufgabe ist bereits abgeschlossen.');}c.status='active';c.acceptedAt=at;}
      else c.status='declined';c.audit.push({type:c.status,...stamp});return;
    }
    if(type==='cancel'){
      if(!['active','invited'].includes(c.status))fail('Diese Herausforderung ist bereits beendet.');
      c.status='cancelled';c.audit.push({type:'cancelled',...stamp});return;
    }
    if(type==='settle'){
      lead();if(c.status!=='active')fail('Keine laufende Herausforderung.');settle(c);if(c.status==='finished')return;
      if(c.deadline>at)fail('Die vereinbarte Frist ist noch nicht abgelaufen.');
      const ps=c.players.map(rid=>state.progress[key(rid,c.taskId)]);
      if(ps.some(p=>p?.status==='submitted'&&p.submittedAt<=c.deadline))fail('Zuerst rechtzeitig eingereichte Nachweise prüfen.');
      const winners=c.players.filter((rid,i)=>ps[i]?.status==='approved'&&ps[i].submittedAt>=c.acceptedAt&&ps[i].submittedAt<=c.deadline);
      c.status=winners.length?'finished':'expired';c.result={winner:winners.length===1?winners[0]:null,reason:clean(value.reason,2000),at};c.audit.push({type:'settled',...stamp});return;
    }
    fail('Unbekannte Fachwissen-Aktion.');
  }
  window.RHKnowledgeModel={initial,check,apply,snapshot,ranking,totals,alias,active,date,week,key};
})();
