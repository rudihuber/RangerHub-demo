"""Public V34 from the verified V33.1 demo, keeping all historic files."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
PAIRS=[('rangerhub-dashboard-v33.js','rangerhub-dashboard-v34.js'),('rangerhub-navigation-v33.js','rangerhub-navigation-v34.js'),('rangerhub-wisdom-views-v33.js','rangerhub-wisdom-views-v34.js'),('rangerhub-recipes.js','rangerhub-recipes-v34.js')]
def build():
 source=ROOT/'RangerHub_Webapp_V33_Demo.html';raw=source.read_bytes();baseline=json.loads((ROOT/'docs/v34-baseline.json').read_text());assert hashlib.sha256(raw).hexdigest()==baseline['files'][source.name]['sha256'];html=raw.decode()
 for before,after in PAIRS:
  html,n=re.subn(r'<script src="'+re.escape(before)+r'\?v=[^"]+"></script>',f'<script src="{after}?v=34-1"></script>',html);assert n==1,before
 token='<script src="rangerhub-knowledge-v33.js?v=33-2"></script>';assert html.count(token)==1;html=html.replace(token,'<script src="rangerhub-library-v34.js?v=34-1"></script>\n'+token+'\n<script>window.RangerHub.revisionV34Ready=true;</script>',1)
 html=html.replace('<meta name="rangerhub-version" content="33">','<meta name="rangerhub-version" content="34">').replace('<meta name="rangerhub-revision" content="33.1">','<meta name="rangerhub-revision" content="34.0">')
 html=html.replace('</head>','<link rel="stylesheet" href="rangerhub-v34.css?v=34-1" data-rangerhub-v34>\n</head>',1)
 assert 'data:application/pdf' not in html and "localStorage.getItem('rhv9-demo')" in html
 for name in ['index.html','RangerHub_Webapp_V34_Demo.html']:
  p=ROOT/name;t=p.with_name(p.name+'.building');t.write_text(html);t.replace(p)
 names=['index.html','RangerHub_Webapp_V34_Demo.html',*[n for _,n in PAIRS],'rangerhub-library-v34.js','rangerhub-v34.css',*[p.relative_to(ROOT).as_posix() for p in sorted((ROOT/'assets/ranger-library').glob('*.webp'))]]
 records={n:{'bytes':(ROOT/n).stat().st_size,'sha256':hashlib.sha256((ROOT/n).read_bytes()).hexdigest()} for n in names}
 (ROOT/'docs/v34-build.json').write_text(json.dumps({'version':34,'revision':'34.0','baseline_commit':baseline['commit'],'files':records,'bundledPDFs':0,'source_original_images':43},indent=2)+'\n');(ROOT/'docs/V34-SHA256SUMS').write_text(''.join(v['sha256']+'  '+n+'\n' for n,v in records.items()));print(json.dumps({'version':34,'bytes':len(html.encode())}))
if __name__=='__main__':build()
