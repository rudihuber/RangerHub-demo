"""Current complete V31 browser/integrity/server checks. Earlier releases remain archived."""
from pathlib import Path
import subprocess,sys,os
root=Path(__file__).resolve().parents[1]
modules=['test_bible_v31','test_v30','test_expedition','test_v27','test_v28','test_planning_and_recipes','test_v31_packaging']
if (root/'RangerHub_Webapp_V31_Kompakt.html').exists():modules+=['test_v26_roles']
else:modules+=['test_session_reload']
env={**os.environ,'PYTHONPATH':str(root/'tests')}
subprocess.run([sys.executable,'-m','unittest',*modules,'-v'],cwd=root,env=env,check=True)
subprocess.run(['node','--test','backend/test-bible-v31.mjs','backend/test-knowledge-v30.mjs'],cwd=root,check=True)
