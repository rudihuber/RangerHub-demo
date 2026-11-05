"""Build V31 from the unchanged public V30, retaining all earlier assets and modules."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
FILES=['rangerhub-bible-catalog.js','rangerhub-bible-model.js','rangerhub-bible-views.js','rangerhub-knowledge-v31.js','rangerhub-bible.css']
def build():
 source=ROOT/'RangerHub_Webapp_V30_Demo.html';raw=source.read_bytes();baseline=json.loads((ROOT/'docs/v31-baseline.json').read_text());assert hashlib.sha256(raw).hexdigest()==baseline['files'][source.name]['sha256']
 html=raw.decode().replace('<meta name="rangerhub-version" content="30">','<meta name="rangerhub-version" content="31">')
 old='<script src="rangerhub-knowledge-model-v30.js?v=30-1"></script>';assert html.count(old)==1;html=html.replace(old,old+'\n'+'\n'.join(f'<script src="{f}?v=31-2"></script>' for f in FILES[:2]),1)
 old='<script src="rangerhub-knowledge-v30.js?v=30-1"></script>';assert html.count(old)==1;html=html.replace(old,'\n'.join(f'<script src="{f}?v=31-2"></script>' for f in FILES[2:4]),1)
 html=html.replace('</head>','<link rel="stylesheet" href="rangerhub-bible.css?v=31-2" data-rangerhub-bible>\n</head>',1);assert 'data:application/pdf' not in html and "localStorage.getItem('rhv9-demo')" in html
 for f in ['index.html','RangerHub_Webapp_V31_Demo.html']:(ROOT/f).write_text(html)
 names=[source.name,'index.html','RangerHub_Webapp_V31_Demo.html',*FILES,'data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json','backend/knowledge-server.mjs','rangerhub-knowledge-model-v30.js','rangerhub-knowledge-transport-v30.js']
 records={f:{'bytes':(ROOT/f).stat().st_size,'sha256':hashlib.sha256((ROOT/f).read_bytes()).hexdigest()} for f in names}
 (ROOT/'docs/v31-build.json').write_text(json.dumps({'version':31,'files':records,'bundledPDFs':0},indent=2)+'\n');(ROOT/'docs/V31-SHA256SUMS').write_text(''.join(v['sha256']+'  '+k+'\n' for k,v in records.items()));print(json.dumps({'version':31,'bytes':len(html.encode())}))
if __name__=='__main__':build()
