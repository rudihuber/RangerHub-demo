"""Create the named V26 demo entry and SHA-256 release manifest without touching data."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
entry = root / 'index.html'
snapshot = root / 'RangerHub_Webapp_V26_Demo.html'
before = root / 'RangerHub_Webapp_V25_Demo_Backup.html'
baseline = json.loads((root / 'docs/v26-baseline.json').read_text())
assert hashlib.sha256(before.read_bytes()).hexdigest() == baseline['files']['index.html']['sha256']
html = entry.read_text()
assert '<meta name="rangerhub-version" content="26">' in html
assert "localStorage.getItem('rhv9-demo')" in html
assert "localStorage.getItem('rhv9')" not in html
assert 'data:application/pdf' not in html
snapshot.write_bytes(entry.read_bytes())
files = ['RangerHub_Webapp_V25_Demo_Backup.html', 'RangerHub_Webapp_V26_Demo.html', 'index.html', 'rangerhub-expedition.js', 'rangerhub-expedition.css']
manifest = {name: {'bytes': (root / name).stat().st_size, 'sha256': hashlib.sha256((root / name).read_bytes()).hexdigest()} for name in files}
(root / 'docs/v26-build.json').write_text(json.dumps({'version': 26, 'files': manifest, 'private_data': False, 'bundled_pdfs': 0}, indent=2) + '\n')
(root / 'docs/V26-SHA256SUMS').write_text(''.join(value['sha256'] + '  ' + name + '\n' for name, value in manifest.items()))
print(json.dumps({'version': 26, 'entry_bytes': snapshot.stat().st_size, 'new_ui_bytes': sum((root / name).stat().st_size for name in files[-2:]), 'backup_verified': True}))
