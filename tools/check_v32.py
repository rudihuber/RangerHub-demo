"""Current V32 browser, storage, source/backup and server acceptance."""
from pathlib import Path
import subprocess,sys,os
root=Path(__file__).resolve().parents[1]
entry='RangerHub_Webapp_V32_Kompakt.html' if (root/'RangerHub_Webapp_V32_Kompakt.html').exists() else 'RangerHub_Webapp_V32_Demo.html'
modules=['test_v32','test_v32_regressions','test_v32_packaging','test_v32_planning_recipes']
modules+=['test_v26_roles'] if 'Kompakt' in entry else ['test_v32_session']
env={**os.environ,'PYTHONPATH':str(root/'tests'),'RANGERHUB_TEST_FILE':entry}
subprocess.run([sys.executable,'-m','unittest',*modules,'-v'],cwd=root,env=env,check=True)
subprocess.run(['node','--test','backend/test-wisdom-v32.mjs','backend/test-bible-v31.mjs','backend/test-knowledge-v30.mjs'],cwd=root,check=True)
