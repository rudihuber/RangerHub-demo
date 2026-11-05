"""Public V32 demo; retain aliases, assets and previous versions, never embed PDFs."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[1]
NEW=['rangerhub-wisdom-catalog.js','rangerhub-wisdom-model.js','rangerhub-wisdom-views.js','rangerhub-dashboard-v32.js','rangerhub-knowledge-v32.js','rangerhub-bible-views-v32.js','rangerhub-knowledge-transport-v32.js','rangerhub-v27-v32.js','rangerhub-v32.css','rangerhub-expedition-v32.js']
def build():
 source=ROOT/'RangerHub_Webapp_V31_Demo.html';raw=source.read_bytes();baseline=json.loads((ROOT/'docs/v32-baseline.json').read_text());assert hashlib.sha256(raw).hexdigest()==baseline['files'][source.name]['sha256']
 html=raw.decode().replace('<meta name="rangerhub-version" content="31">','<meta name="rangerhub-version" content="32">')
 for old,new in [('rangerhub-expedition.js','rangerhub-expedition-v32.js'),('rangerhub-logbook.js','rangerhub-logbook-v32.js'),('rangerhub-v27.js','rangerhub-v27-v32.js'),('rangerhub-knowledge-transport-v30.js','rangerhub-knowledge-transport-v32.js'),('rangerhub-bible-views.js','rangerhub-bible-views-v32.js')]:
  import re
  html,n=re.subn(r'<script src="'+re.escape(old)+r'\?v=[^"]+"></script>',f'<script src="{new}?v=32-1"></script>',html);assert n==1,old
 token='<script src="rangerhub-knowledge-transport-v32.js?v=32-1"></script>';html=html.replace(token,'\n'.join(f'<script src="{f}?v=32-1"></script>' for f in NEW[:2])+'\n'+token,1)
 html,n=re.subn(r'<script src="rangerhub-knowledge-v31.js\?v=[^"]+"></script>','\n'.join(f'<script src="{f}?v=32-1"></script>' for f in NEW[2:5]),html);assert n==1
 html=html.replace('</head>','<link rel="stylesheet" href="rangerhub-v32.css?v=32-1" data-rangerhub-v32>\n</head>',1);assert 'data:application/pdf' not in html and "localStorage.getItem('rhv9-demo')" in html
 for f in ['index.html','RangerHub_Webapp_V32_Demo.html']:(ROOT/f).write_text(html)
 names=['rangerhub-logbook-v32.js','index.html','RangerHub_Webapp_V32_Demo.html',*NEW,'data/ranger-wissen-content.json','backend/knowledge-server.mjs'];records={f:{'bytes':(ROOT/f).stat().st_size,'sha256':hashlib.sha256((ROOT/f).read_bytes()).hexdigest()} for f in names}
 (ROOT/'docs/v32-build.json').write_text(json.dumps({'version':32,'files':records,'bundledPDFs':0},indent=2)+'\n');(ROOT/'docs/V32-SHA256SUMS').write_text(''.join(v['sha256']+'  '+f+'\n' for f,v in records.items()));print(json.dumps({'version':32,'bytes':len(html.encode())}))
if __name__=='__main__':build()
