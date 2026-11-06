"""Current V33 source/role/cockpit/chapter acceptance; historical tests stay archived."""
from pathlib import Path
import subprocess,sys,os
root=Path(__file__).resolve().parents[1]
entry='RangerHub_Webapp_V33_Kompakt.html' if (root/'RangerHub_Webapp_V33_Kompakt.html').exists() else 'RangerHub_Webapp_V33_Demo.html'
modules=['test_v33','test_v33_review']
if (root/'tests/test_v33_packaging.py').exists():modules+=['test_v33_packaging']
if (root/'tests/test_v33_regressions.py').exists():modules+=['test_v33_regressions']
modules+=['test_v26_roles'] if 'Kompakt' in entry else []
env={**os.environ,'PYTHONPATH':str(root/'tests'),'RANGERHUB_TEST_FILE':entry}
subprocess.run([sys.executable,'-m','unittest',*modules,'-v'],cwd=root,env=env,check=True)
server=['backend/test-knowledge-v30.mjs','backend/test-bible-v31.mjs']
units=[str(p.relative_to(root)) for p in sorted((root/'tests').glob('test_*_v33.mjs'))]
for unit in units:subprocess.run(['node',unit],cwd=root,check=True)
server += [str(p.relative_to(root)) for p in sorted((root/'backend').glob('*v33*.mjs')) if p.name.startswith('test-')]
subprocess.run(['node','--test',*server],cwd=root,check=True)
