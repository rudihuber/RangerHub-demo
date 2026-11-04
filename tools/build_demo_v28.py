"""Build the public V28 entry without publishing private data or bundled PDFs."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
original = root / 'RangerHub_Webapp_V27_Demo.html'
baseline = json.loads((root/'docs/v28-baseline.json').read_text())
assert hashlib.sha256(original.read_bytes()).hexdigest() == baseline['files'][original.name]['sha256']
html = original.read_text().replace('<meta name="rangerhub-version" content="27">', '<meta name="rangerhub-version" content="28">')
html = html.replace('</head>', '<meta name="rangerhub-storage" content="rhv9-demo">\n<link rel="stylesheet" href="rangerhub-v28.css?v=28-1" data-rangerhub-v28>\n</head>', 1)
html = html.replace('</body>', '<script src="rangerhub-library-v28.js?v=28-1"></script>\n<script src="rangerhub-v28.js?v=28-1"></script>\n<script src="rangerhub-chat-transport.js?v=28-1"></script>\n<script src="rangerhub-messages.js?v=28-1"></script>\n</body>', 1)
assert "localStorage.getItem('rhv9-demo')" in html and "localStorage.getItem('rhv9')" not in html
assert 'data:application/pdf' not in html
for name in ['index.html', 'RangerHub_Webapp_V28_Demo.html']:
    (root/name).write_text(html)
files = ['RangerHub_Webapp_V27_Demo.html', 'RangerHub_Webapp_V28_Demo.html', 'index.html', 'rangerhub-library-v28.js', 'rangerhub-v28.js', 'rangerhub-v28.css', 'rangerhub-chat-transport.js', 'rangerhub-messages.js', 'assets/growth-journey-clean.png']
records = {name: {'bytes': (root/name).stat().st_size, 'sha256': hashlib.sha256((root/name).read_bytes()).hexdigest()} for name in files}
(root/'docs/v28-build.json').write_text(json.dumps({'version': 28, 'files': records, 'bundled_pdfs': 0}, indent=2)+'\n')
(root/'docs/V28-SHA256SUMS').write_text(''.join(v['sha256']+'  '+k+'\n' for k,v in records.items()))
print(json.dumps({'version': 28, 'bytes': len(html.encode()), 'backup_preserved': True}))
