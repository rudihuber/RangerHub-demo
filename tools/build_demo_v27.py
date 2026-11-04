"""Build the public V27 entry without publishing private data or bundled PDFs."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
original = root / 'RangerHub_Webapp_V26_Demo.html'
baseline = json.loads((root/'docs/v27-baseline.json').read_text())
assert hashlib.sha256(original.read_bytes()).hexdigest() == baseline['files'][original.name]['sha256']
html = original.read_text().replace('<meta name="rangerhub-version" content="26">', '<meta name="rangerhub-version" content="27">')
html = html.replace('</head>', '<link rel="stylesheet" href="rangerhub-v27.css?v=27-1" data-rangerhub-v27>\n</head>', 1)
html = html.replace('</body>', '<script src="rangerhub-library-v27.js?v=27-1"></script>\n<script src="rangerhub-v27.js?v=27-1"></script>\n</body>', 1)
assert "localStorage.getItem('rhv9-demo')" in html and "localStorage.getItem('rhv9')" not in html
assert 'data:application/pdf' not in html
for name in ['index.html', 'RangerHub_Webapp_V27_Demo.html']:
    (root/name).write_text(html)
files = ['RangerHub_Webapp_V26_Demo.html', 'RangerHub_Webapp_V27_Demo.html', 'index.html', 'rangerhub-library-v27.js', 'rangerhub-v27.js', 'rangerhub-v27.css']
records = {name: {'bytes': (root/name).stat().st_size, 'sha256': hashlib.sha256((root/name).read_bytes()).hexdigest()} for name in files}
(root/'docs/v27-build.json').write_text(json.dumps({'version': 27, 'files': records, 'bundled_pdfs': 0}, indent=2)+'\n')
(root/'docs/V27-SHA256SUMS').write_text(''.join(v['sha256']+'  '+k+'\n' for k,v in records.items()))
print(json.dumps({'version': 27, 'bytes': len(html.encode()), 'backup_preserved': True}))
