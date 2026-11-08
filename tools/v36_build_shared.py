"""V36 builds from immutable V35 artifacts; original source assets remain exact."""
from pathlib import Path
import re,json,hashlib
PAIRS=[('rangerhub-membership-v35.js', 'rangerhub-membership-v36.js'), ('rangerhub-membership-model-v35.js', 'rangerhub-membership-model-v36.js'), ('rangerhub-knowledge-model-v35.js', 'rangerhub-knowledge-model-v36.js'), ('rangerhub-knowledge-transport-v35.js', 'rangerhub-knowledge-transport-v36.js'), ('rangerhub-knowledge-v35.js', 'rangerhub-knowledge-v36.js'), ('rangerhub-dashboard-v35.js', 'rangerhub-dashboard-v36.js'), ('rangerhub-navigation-v35.js', 'rangerhub-navigation-v36.js'), ('rangerhub-planning-v35.js', 'rangerhub-planning-v36.js'), ('rangerhub-visual-model-v35.js', 'rangerhub-visual-model-v36.js'), ('rangerhub-wisdom-model.js', 'rangerhub-wisdom-model-v36.js'), ('rangerhub-knowledge-catalog-v30.js', 'rangerhub-knowledge-catalog-v36.js')]
ROOT=Path(__file__).resolve().parents[1]
def manifest(names):
 records={n:{'bytes':(ROOT/n).stat().st_size,'sha256':hashlib.sha256((ROOT/n).read_bytes()).hexdigest()} for n in names}
 (ROOT/'docs/v36-build.json').write_text(json.dumps({'version':36,'files':records},indent=2)+'\n')
 (ROOT/'docs/V36-SHA256SUMS').write_text(''.join(x['sha256']+'  '+n+'\n' for n,x in records.items()))
def extras():return [b for a,b in PAIRS]+['rangerhub-app-v36.js','rangerhub-v36.css','backend/delegation-v36.mjs','backend/knowledge-server.mjs']
