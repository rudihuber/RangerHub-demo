"""Use the existing public V29, changing only the superseded Fachwissen workflow."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
FILES=['rangerhub-knowledge-catalog-v30.js','rangerhub-knowledge-model-v30.js','rangerhub-knowledge-transport-v30.js','rangerhub-knowledge-subworlds-v30.js','rangerhub-knowledge-exams-v30.js','rangerhub-knowledge-editor-v30.js','rangerhub-knowledge-v30.js','rangerhub-knowledge-v30.css']
def build():
 source=ROOT/'RangerHub_Webapp_V29_Demo.html';raw=source.read_bytes();b=json.loads((ROOT/'docs/v30-baseline.json').read_text());assert hashlib.sha256(raw).hexdigest()==b['files'][source.name]['sha256']
 html=raw.decode().replace('<meta name="rangerhub-version" content="29">','<meta name="rangerhub-version" content="30">')
 replacements={'rangerhub-knowledge-model.js':FILES[:2],'rangerhub-knowledge-transport.js':FILES[2:3],'rangerhub-knowledge.js':FILES[3:7]}
 for old,new in replacements.items():
  tag=f'<script src="{old}?v=29-1"></script>';assert html.count(tag)==1,old
  html=html.replace(tag,'\n'.join(f'<script src="{name}?v=30-1"></script>' for name in new),1)
 html=html.replace('</head>','<link rel="stylesheet" href="rangerhub-knowledge-v30.css?v=30-1" data-rangerhub-knowledge-v30>\n</head>',1)
 assert 'data:application/pdf' not in html and "localStorage.getItem('rhv9-demo')" in html
 for name in ['index.html','RangerHub_Webapp_V30_Demo.html']:(ROOT/name).write_text(html)
 names=[source.name,'index.html','RangerHub_Webapp_V30_Demo.html',*FILES,'rangerhub-knowledge-catalog.js','rangerhub-knowledge-map.js','backend/knowledge-server.mjs','backend/import-existing.mjs','data/RangerHub_Fachwissen_Quellkatalog.json']
 records={n:{'bytes':(ROOT/n).stat().st_size,'sha256':hashlib.sha256((ROOT/n).read_bytes()).hexdigest()} for n in names}
 (ROOT/'docs/v30-build.json').write_text(json.dumps({'version':30,'files':records,'bundledPDFs':0},indent=2)+'\n');(ROOT/'docs/V30-SHA256SUMS').write_text(''.join(v['sha256']+'  '+k+'\n' for k,v in records.items()))
 print(json.dumps({'version':30,'bytes':len(html.encode()),'archivePreserved':True}))
if __name__=='__main__':build()
