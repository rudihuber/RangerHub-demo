"""Run actual archived/current browsers and server checks without replacing old evidence."""
from pathlib import Path
import os,json,shutil,subprocess,sys,tempfile,argparse
ROOT=Path(__file__).resolve().parents[1];private=(ROOT/'RangerHub_Webapp_V35_Kompakt.html').exists()
parser=argparse.ArgumentParser();parser.add_argument('--phase',choices=['archived-browser','current-browser','new-browser','server','packaging','all'],default='all');args=parser.parse_args()
log=ROOT/'docs/tests';log.mkdir(exist_ok=True)
def run(name,command,env=None):
 path=log/('v36-'+name+'.log');print('Running',name,flush=True)
 with path.open('w') as f:r=subprocess.run(command,cwd=ROOT,env=env,stdout=f,stderr=subprocess.STDOUT)
 print(name,'PASS' if r.returncode==0 else 'FAIL',path,flush=True)
 return r.returncode

def browsers(version,only_new=False):
 env={**os.environ,'PYTHONPATH':str(ROOT/'tests'),'RANGERHUB_TEST_FILE':f'RangerHub_Webapp_V{version}_'+('Kompakt.html' if private else 'Demo.html')}
 base=json.loads((ROOT/'docs/v36-baseline.json').read_text());images=[n for n in base['files'] if n.startswith('docs/screenshots/') and n.endswith('.png')]
 with tempfile.TemporaryDirectory(prefix='rh-v36-evidence-') as td:
  td=Path(td)
  for n in images:
   p=td/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/n,p)
  try:
   command=[sys.executable,str(ROOT/'tests/run_v36_browser_regression.py'),*(['--new-only'] if only_new else ['--archived'] if version==35 else [])]
   return run(('new-browser' if only_new else 'archived-browser' if version==35 else 'current-browser'),command,env)
  finally:
   for n in images:
    p=ROOT/n;old=td/n
    if p.read_bytes()!=old.read_bytes():
     out=ROOT/'docs/screenshots/v36-regression'/str(version)/Path(n).relative_to('docs/screenshots');out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,out);shutil.copy2(old,p)

phases=['archived-browser','current-browser','server','packaging'] if args.phase=='all' else [args.phase];failed=[]
for phase in phases:
 if phase=='archived-browser':code=browsers(35)
 elif phase=='current-browser':code=browsers(36)
 elif phase=='new-browser':code=browsers(36,True)
 elif phase=='server':
  code=run('server',['node','--test','backend/test-delegation-v36.mjs','backend/test-editor-membership-v35.mjs','backend/test-knowledge-v30.mjs','backend/test-bible-v31.mjs','backend/test-bible-chapters-v33.mjs','backend/test-wisdom-v33.mjs'])
  for name in ['test_navigation_v33.mjs','test_library_v33.mjs']:code|=run(name,['node','tests/'+name])
 else:code=run('packaging',[sys.executable,'-m','unittest','discover','-s','tests','-p','test_v36_packaging.py','-v'])
 if code:failed.append(phase)
raise SystemExit(bool(failed))
