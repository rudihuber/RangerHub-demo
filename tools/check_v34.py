"""Current V34 acceptance plus retained business regressions, without altering old evidence."""
from pathlib import Path
import os,subprocess,sys,shutil
root=Path(__file__).resolve().parents[1]
private=(root/'RangerHub_Webapp_V34_Kompakt.html').exists()
entry='RangerHub_Webapp_V34_Kompakt.html' if private else 'RangerHub_Webapp_V34_Demo.html'
env={**os.environ,'PYTHONPATH':str(root/'tests'),'RANGERHUB_TEST_FILE':entry}
modules=['test_v34','test_v33','test_v33_review','test_v33_regressions']+(['test_v26_roles'] if private else [])
old=root/'docs/screenshots/v33';saved={p:p.read_bytes() for p in old.glob('*.png')}
try:subprocess.run([sys.executable,'-m','unittest',*modules,'-v'],cwd=root,env=env,check=True)
finally:
    out=root/'docs/screenshots/v34-regression'
    for p in old.glob('*.png'):
        if p not in saved or p.read_bytes()!=saved[p]:
            out.mkdir(parents=True,exist_ok=True);shutil.copy2(p,out/p.name)
        if p in saved:p.write_bytes(saved[p])
        else:p.unlink()
subprocess.run([sys.executable,'-m','unittest','test_v34_packaging','-v'],cwd=root,env=env,check=True)
for unit in sorted((root/'tests').glob('test_*_v33.mjs')):subprocess.run(['node',str(unit)],cwd=root,check=True)
subprocess.run(['node','--test','backend/test-knowledge-v30.mjs','backend/test-bible-v31.mjs','backend/test-bible-chapters-v33.mjs','backend/test-wisdom-v33.mjs'],cwd=root,check=True)
