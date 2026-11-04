"""Current-release checks; historical workflow tests remain versioned in tests/."""
from pathlib import Path
import os,subprocess,sys
root=Path(__file__).resolve().parents[1]
modules=['test_v30','test_expedition','test_v27','test_v28','test_planning_and_recipes','test_v30_packaging']
if (root/'RangerHub_Webapp_V30_Kompakt.html').exists():modules+=['test_v26_roles']
else:modules+=['test_session_reload']
env={**os.environ,'PYTHONPATH':str(root/'tests')}
subprocess.run([sys.executable,'-m','unittest',*modules,'-v'],cwd=root,env=env,check=True)
subprocess.run(['node','--test','backend/test-knowledge-v30.mjs'],cwd=root,check=True)
