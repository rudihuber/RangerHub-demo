"""Normalize the unmodified DOCX paragraph export; never infer official points."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
REGIONS = [
 ('wildnis', 'Wildnis & Lager', ['Lagerbau','Zeltbau','Waldläufer','Feuerbohren','Campkochen','Naturschutz']),
 ('entdecker', 'Entdeckerland', ['Astronomie','Wetterkunde','Naturkunde','Tierkunde','Vogelkunde','Winterkunde']),
 ('rettung', 'Rettung & Bewegung', ['Erste Hilfe','Fitness','Rettungsschwimmer','Kanu','Fahrrad']),
 ('werkstatt', 'Werkstatt & Kreativität', ['Motor','Hobby','Handarbeiten','Bogenschießen','Kochen','Angeln','Garten','Bilder','Videos','Musik']),
 ('gemeinschaft', 'Glaube & Gemeinschaft', ['Die Bibel','Biblische Ereignisse','Gemeinde','Geistlicher Dienst','Missionsarbeit','FECG-Rangers','Gäste','Bürgerkunde','Medien']),
 ('arena', 'Challenge-Arena', []),
]

def normalize(source):
 categories=[]; topics=[]; tasks=[]; issues=[]; audit=[]; assigned=[]
 for category in source['categories']:
  categories.append({'id':category['id'],'title':category['title']})
  for topic in category['topics']:
   matches=[r[0] for r in REGIONS if topic['title'] in r[2]]
   assert len(matches)==1, topic['title']
   record={'id':topic['id'],'title':topic['title'],'sourceCategoryId':category['id'],'mapRegionId':matches[0],'notes':[]}
   topics.append(record); current=None
   for p in topic['sourceParagraphs']:
    index=p['sourceParagraphIndex']; body=p['text']; pts=p['pointMentions']
    # A uses numbered main tasks. Other categories use unnumbered paragraphs.
    # Fitness 275–286 is ONE main task with a specifically scored alternative.
    main=bool(re.match(r'^\d+\.\s',body)) if category['id']=='A' else bool(pts)
    if topic['id']=='C-01': main=index in [272,273,274,275,287]
    if category['id']=='A' and not current and not main:
     record['notes'].append({'text':body,'sourceParagraphIndex':index}); assigned.append(index);continue
    if main:
     current={'id':f"fw-{topic['id']}-p{index:03}",'topicId':topic['id'],'sourceCategoryId':category['id'],
      'sourceTopic':topic['title'],'mapRegionId':matches[0],'originalText':body,'subItems':[],
      'points':pts[0] if len(pts)==1 else None,'sourceReference':{'file':source['source']['canonical'],'paragraphs':[index]},
      'safetyFlags':[],'evidenceType':['text','oral','practice'],'isPublished':True}
     tasks.append(current)
    else:
     assert current, (topic['id'],body)
     current['subItems'].append(body);current['sourceReference']['paragraphs'].append(index)
     if pts:
      current.setdefault('pointOptions',[]).append({'text':body,'points':pts[0],'sourceParagraphIndex':index})
    assigned.append(index)
    for value in pts:audit.append({'paragraph':index,'taskId':current['id'],'value':value,'isSubItem':not main})
   for task in [t for t in tasks if t['topicId']==topic['id']]:
    alltext=' '.join([task['originalText'],*task['subItems']]).lower()
    for flag,pattern in [('Feuer',r'feuer|zunder|siedestein|glut'),('Werkzeuge',r'messer|säge|axt|beil|bohrer|motor|werkzeug|bogen|löten'),('Wasser',r'schwimm|kanu|paddel|angelschein'),('Winter & Übernachtung',r'übernacht|schlafe|schlafen|winterunterkunft'),('Natur & Lebensmittel',r'giftig|wildbeeren|nahrungsmittel aus der natur|bratrezept|bereite.*zu|koche|dampfgaren')]:
     if re.search(pattern,alltext):task['safetyFlags'].append(flag)
    if topic['title'] in ['Lagerbau','Feuerbohren','Bogenschießen','Rettungsschwimmer','Motor'] and not task['safetyFlags']:
     task['safetyFlags'].append('Praxisprüfung')
    if task['points'] is None:
     issue={'taskId':task['id'],'topic':topic['title'],'paragraph':task['sourceReference']['paragraphs'][0],
      'reason':'Punkte fehlen in der Quelle.' if not task.get('pointOptions') else '8 Punkte stehen ausschließlich bei der Alternative Sportabzeichen Silber; Trainingsziele sind nicht ausdrücklich bepunktet.'}
     issues.append(issue)
 assert len(topics)==36 and len(categories)==3 and len({t['id'] for t in tasks})==len(tasks)
 assert len(assigned)==len(set(assigned))==sum(len(t['sourceParagraphs']) for c in source['categories'] for t in c['topics'])
 assert len(audit)==source['stats']['pointMentions']==250
 assert all(len([t for t in topics if t['sourceCategoryId']==c['id']])==12 for c in categories)
 return {'schemaVersion':1,'source':source['source'],'categories':categories,'regions':[{'id':a,'title':b} for a,b,_ in REGIONS],
  'topics':topics,'tasks':tasks,'issues':issues,'stats':{'categories':len(categories),'topics':len(topics),'tasks':len(tasks),'sourceParagraphs':len(assigned),'pointMentions':len(audit)},'pointAudit':audit}

def main():
 raw=(ROOT/'data/RangerHub_Fachwissen_Quellkatalog.json').read_bytes(); source=json.loads(raw)
 catalog=normalize(source);catalog['sourceSha256']=hashlib.sha256(raw).hexdigest()
 normalized=json.dumps(catalog,ensure_ascii=False,separators=(',',':'))
 (ROOT/'data/knowledge-normalized.json').write_text(normalized+'\n')
 (ROOT/'rangerhub-knowledge-catalog.js').write_text('/* Generated from the unchanged source; tools/prepare_knowledge.py. */\nwindow.RangerHubKnowledgeCatalog='+normalized+';\n')
 report={**catalog['stats'],'sourceSha256':catalog['sourceSha256'],'issues':catalog['issues'],'pointAudit':catalog['pointAudit'],
  'notes':['Original DOCX/PDF files were not separately available; no comparison claimed.','Fitness 275–286 grouped as one task; 8 points apply only to its documented alternative.','No maximum score calculated from raw point mentions.']}
 (ROOT/'docs/v29-catalog-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({**catalog['stats'],'issues':catalog['issues']},ensure_ascii=False))

if __name__=='__main__':main()
