"""Build the V35 public demo from its verified, unchanged V34 predecessor."""
from pathlib import Path
import re,json,hashlib
from v35_build_shared import PAIRS,SUPPLEMENTS,MODELS,legacy
ROOT=Path(__file__).resolve().parents[1]
def build():
 source=ROOT/'RangerHub_Webapp_V34_Demo.html';raw=source.read_bytes();baseline=json.loads((ROOT/'docs/v35-baseline.json').read_text());assert hashlib.sha256(raw).hexdigest()==baseline['files'][source.name]['sha256'];html=raw.decode()
 for before,after in PAIRS:
  html,n=re.subn(r'<script src="'+re.escape(before)+r'\?v=[^"]+"></script>',f'<script src="{after}?v=35-1"></script>',html);assert n==1,before
 token=re.search(r'<script src="rangerhub-wisdom-model.js\?v=[^"]+"></script>',html).group();html=html.replace(token,token+f'\n<script src="{MODELS[1]}?v=35-1"></script>',1)
 token='<script src="rangerhub-knowledge-v35.js?v=35-1"></script>';html=html.replace(token,'\n'.join(f'<script src="{n}?v=35-1"></script>' for n in SUPPLEMENTS)+'\n'+token,1)
 html=re.sub(r'<script(?![^>]*src=)[^>]*>.*?</script>',lambda m:legacy(m.group()),html,flags=re.S)
 html=html.replace('</head>',f'<script src="{MODELS[0]}?v=35-1"></script>\n<link rel="stylesheet" href="rangerhub-v35.css?v=35-1" data-rangerhub-v35>\n</head>',1).replace('<meta name="rangerhub-version" content="34">','<meta name="rangerhub-version" content="35">').replace('name="rangerhub-revision" content="34.0"','name="rangerhub-revision" content="35.0"')
 assert 'data:application/pdf' not in html
 for n in ['index.html','RangerHub_Webapp_V35_Demo.html']:(ROOT/n).write_text(html)
 names=['index.html','RangerHub_Webapp_V35_Demo.html',*[a for _,a in PAIRS],*SUPPLEMENTS,*MODELS,'rangerhub-v35.css','backend/knowledge-server.mjs','backend/editor-v35.mjs'];records={n:{'bytes':(ROOT/n).stat().st_size,'sha256':hashlib.sha256((ROOT/n).read_bytes()).hexdigest()} for n in names};(ROOT/'docs/v35-build.json').write_text(json.dumps({'version':35,'files':records,'original_images':43,'bundledPDFs':0},indent=2)+'\n');(ROOT/'docs/V35-SHA256SUMS').write_text(''.join(v['sha256']+'  '+n+'\n' for n,v in records.items()));print('V35 demo bytes:',len(html.encode()))
if __name__=='__main__':build()
