"""Public V33 from unchanged V32; original-source images referenced, no PDFs/users copied."""
from pathlib import Path
import json,hashlib,re
ROOT=Path(__file__).resolve().parents[1]
JS=['rangerhub-bible-chapters-v33.js','rangerhub-wisdom-catalog-v33.js','rangerhub-bible-views-v33.js','rangerhub-wisdom-views-v33.js','rangerhub-dashboard-v33.js','rangerhub-navigation-v33.js','rangerhub-knowledge-v33.js']
CSS=['rangerhub-bible-v33.css','rangerhub-wisdom-v33.css','rangerhub-dashboard-v33.css','rangerhub-navigation-v33.css']
PAIRS=[('rangerhub-wisdom-catalog.js','rangerhub-wisdom-catalog-v33.js'),('rangerhub-bible-views-v32.js','rangerhub-bible-views-v33.js'),('rangerhub-wisdom-views.js','rangerhub-wisdom-views-v33.js'),('rangerhub-dashboard-v32.js','rangerhub-dashboard-v33.js'),('rangerhub-knowledge-v32.js','rangerhub-knowledge-v33.js')]
def build():
 source=ROOT/'RangerHub_Webapp_V32_Demo.html';raw=source.read_bytes();baseline=json.loads((ROOT/'docs/v33-baseline.json').read_text());assert hashlib.sha256(raw).hexdigest()==baseline['files'][source.name]['sha256']
 html=raw.decode().replace('<meta name="rangerhub-version" content="32">','<meta name="rangerhub-version" content="33">')
 for before,after in PAIRS:
  html,n=re.subn(r'<script src="'+re.escape(before)+r'\?v=[^"]+"></script>',f'<script src="{after}?v=33-1"></script>',html);assert n==1,before
 token='<script src="rangerhub-bible-model.js?v=31-2"></script>';assert token in html;html=html.replace(token,token+'\n<script src="rangerhub-bible-chapters-v33.js?v=33-1"></script>',1)
 token='<script src="rangerhub-knowledge-v33.js?v=33-1"></script>';html=html.replace(token,'<script src="rangerhub-navigation-v33.js?v=33-1"></script>\n'+token,1)
 html=html.replace('</head>','\n'.join(f'<link rel="stylesheet" href="{name}?v=33-1" data-rangerhub-v33>' for name in CSS)+'\n</head>',1)
 assert 'data:application/pdf' not in html and "localStorage.getItem('rhv9-demo')" in html
 for name in ['index.html','RangerHub_Webapp_V33_Demo.html']:
  path=ROOT/name;temporary=path.with_name(path.name+'.building');temporary.write_text(html);temporary.replace(path)
 names=['index.html','RangerHub_Webapp_V33_Demo.html',*JS,*CSS,'data/ranger-wissen-content-v33.json','data/library-source-map-v33.json','backend/knowledge-server.mjs',*[p.relative_to(ROOT).as_posix() for p in sorted((ROOT/'assets/ranger-library').glob('*.webp'))]]
 records={name:{'bytes':(ROOT/name).stat().st_size,'sha256':hashlib.sha256((ROOT/name).read_bytes()).hexdigest()} for name in names};(ROOT/'docs/v33-build.json').write_text(json.dumps({'version':33,'files':records,'bundledPDFs':0,'source_original_images':43},indent=2)+'\n');(ROOT/'docs/V33-SHA256SUMS').write_text(''.join(v['sha256']+'  '+name+'\n' for name,v in records.items()));print(json.dumps({'version':33,'bytes':len(html.encode())}))
if __name__=='__main__':build()
