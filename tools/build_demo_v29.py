"""Append Fachwissen to the public V28 without private PDFs or personal records."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MODULES=['rangerhub-knowledge-catalog.js','rangerhub-knowledge-model.js','rangerhub-knowledge-transport.js','rangerhub-knowledge-map.js','rangerhub-knowledge.js','rangerhub-knowledge.css']
def build():
 original=ROOT/'RangerHub_Webapp_V28_Demo.html';raw=original.read_bytes();baseline=json.loads((ROOT/'docs/v29-baseline.json').read_text())
 assert hashlib.sha256(raw).hexdigest()==baseline['files'][original.name]['sha256']
 html=raw.decode().replace('<meta name="rangerhub-version" content="28">','<meta name="rangerhub-version" content="29">')
 html=html.replace('</head>','<link rel="stylesheet" href="rangerhub-knowledge.css?v=29-1" data-rangerhub-knowledge>\n</head>',1)
 html=html.replace('</body>',''.join(f'<script src="{name}?v=29-1"></script>\n' for name in MODULES[:-1])+'</body>',1)
 assert 'data:application/pdf' not in html and "localStorage.getItem('rhv9-demo')" in html
 for name in ['index.html','RangerHub_Webapp_V29_Demo.html']:(ROOT/name).write_text(html)
 files=[original.name,'index.html','RangerHub_Webapp_V29_Demo.html',*MODULES,'data/RangerHub_Fachwissen_Quellkatalog.json','data/knowledge-normalized.json','backend/knowledge-server.mjs','backend/import-existing.mjs','tools/prepare_knowledge.py','tools/build_demo_v29.py','tools/capture_knowledge.py']
 records={name:{'bytes':(ROOT/name).stat().st_size,'sha256':hashlib.sha256((ROOT/name).read_bytes()).hexdigest()} for name in files}
 (ROOT/'docs/v29-build.json').write_text(json.dumps({'version':29,'files':records,'bundled_pdfs':0},indent=2)+'\n');(ROOT/'docs/V29-SHA256SUMS').write_text(''.join(v['sha256']+'  '+k+'\n' for k,v in records.items()))
 print(json.dumps({'version':29,'bytes':len(html.encode()),'backup_preserved':True}))
if __name__=='__main__':build()
