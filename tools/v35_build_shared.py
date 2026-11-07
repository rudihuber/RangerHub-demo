"""V35 source substitutions and narrowly scoped legacy membership integration."""
import re
PAIRS=[('rangerhub-wisdom-views-v34.js','rangerhub-wisdom-views-v35.js'),('rangerhub-planning.js','rangerhub-planning-v35.js'),('rangerhub-v27-v32.js','rangerhub-v27-v35.js'),('rangerhub-knowledge-model-v30.js','rangerhub-knowledge-model-v35.js'),('rangerhub-knowledge-transport-v32.js','rangerhub-knowledge-transport-v35.js'),('rangerhub-dashboard-v34.js','rangerhub-dashboard-v35.js'),('rangerhub-navigation-v34.js','rangerhub-navigation-v35.js'),('rangerhub-knowledge-v33.js','rangerhub-knowledge-v35.js')]
SUPPLEMENTS=['rangerhub-backup-v35.js','rangerhub-membership-v35.js','rangerhub-visual-media-v35.js','rangerhub-visual-views-v35.js','rangerhub-visual-editor-v35.js']
MODELS=['rangerhub-membership-model-v35.js','rangerhub-visual-model-v35.js']
def legacy(text):
 text=text.replace('p.id===session.id&&!p.archived',"p.id===session.id&&RHMembershipModel.status(p)!=='left'").replace('p.id===id&&!p.archived',"p.id===id&&RHMembershipModel.status(p)!=='left'")
 text=text.replace('!p.archived&&p.active!==false','RHMembershipModel.active(p)')
 text=text.replace('!p.archived','RHMembershipModel.active(p)').replace('!r.archived','RHMembershipModel.active(r)')
 text=text.replace('${db.leaders.map(', '${db.leaders.filter(p=>RHMembershipModel.active(p)).map(')
 text=text.replace('${db.rangers.map(', '${db.rangers.filter(p=>RHMembershipModel.active(p)).map(')
 text=text.replace('db.leaders.length','db.leaders.filter(p=>RHMembershipModel.active(p)).length').replace('db.rangers.length','db.rangers.filter(p=>RHMembershipModel.active(p)).length')
 text=text.replace('.filter(p=>p.birthday)', '.filter(p=>p.birthday&&RHMembershipModel.active(p))')
 text=text.replace("const stats=(db.meetings||[]).filter(m=>m.date<=TODAY&&m.attendance?.rangers?.[id]);", "const stats=(db.meetings||[]).filter(m=>m.date<=RangerHub.localDate()&&m.attendance?.rangers?.[id]&&RHMembershipModel.active(r,m.date)&&(!m.start||RHKnowledgeModel.meetingStart(m)<=new Date().toISOString())&&!RHKnowledgeModel.cancelled(m)&&RHKnowledgeModel.eligibleMeeting({...m,cancelledRangerIds:[]},r));")
 text=re.sub(r'function login\(\)\{.*?\}\s*function choose',lambda m:m.group().replace('filter(p=>RHMembershipModel.active(p))',"filter(p=>RHMembershipModel.status(p)!=='left')"),text,flags=re.S)
 text=text.replace("(db.rangers||[]).forEach(r=>{ if(v23SyncRangerStage(r))", "(db.rangers||[]).filter(r=>RHMembershipModel.active(r)).forEach(r=>{ if(v23SyncRangerStage(r))")
 text=text.replace('<select name="al"><option value="">Leiter</option>${db.leaders.filter(p=>RHMembershipModel.active(p)).map(l=>', '<select name="al"><option value="">Leiter</option>${db.leaders.filter(p=>RHMembershipModel.active(p)||String(p.id)===String(a.leaderId)).map(l=>')
 return text
