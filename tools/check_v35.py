"""Complete V35 acceptance; historical source files and screenshots remain untouched."""
from pathlib import Path
import json,os,shutil,subprocess,sys,tempfile
root=Path(__file__).resolve().parents[1];private=(root/'RangerHub_Webapp_V35_Kompakt.html').exists()
entry='RangerHub_Webapp_V35_Kompakt.html' if private else 'RangerHub_Webapp_V35_Demo.html'
env={**os.environ,'PYTHONPATH':str(root/'tests'),'RANGERHUB_TEST_FILE':entry}
modules=['test_v35','test_v34','test_v33','test_v33_review','test_v33_regressions']+(['test_v26_roles'] if private else [])
baseline=json.loads((root/'docs/v35-baseline.json').read_text())
images=[name for name in baseline['files'] if name.startswith('docs/screenshots/') and name.endswith('.png')]
with tempfile.TemporaryDirectory(prefix='rh-v35-old-evidence-') as temp:
    temp=Path(temp)
    for name in images:
        target=temp/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,target)
    try:subprocess.run([sys.executable,'-m','unittest',*modules,'-v'],cwd=root,env=env,check=True)
    finally:
        for name in images:
            p=root/name;original=temp/name
            if p.read_bytes()!=original.read_bytes():
                out=root/'docs/screenshots/v35-regression'/Path(name).relative_to('docs/screenshots');out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,out);shutil.copy2(original,p)
subprocess.run([sys.executable,'-m','unittest','test_v35_packaging','-v'],cwd=root,env=env,check=True)
for name in ['test_navigation_v33.mjs','test_library_v33.mjs']:subprocess.run(['node','tests/'+name],cwd=root,check=True)
subprocess.run(['node','--test','backend/test-editor-membership-v35.mjs','backend/test-knowledge-v30.mjs','backend/test-bible-v31.mjs','backend/test-bible-chapters-v33.mjs','backend/test-wisdom-v33.mjs'],cwd=root,check=True)
