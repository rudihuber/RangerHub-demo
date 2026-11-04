"""Public V30 references and checksum verification; no private HTML or PDF export."""
import hashlib,json,re,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class V30PackagingTests(unittest.TestCase):
    def test_index_named_html_and_active_modules(self):
        new=(ROOT/'index.html').read_text();self.assertEqual(new,(ROOT/'RangerHub_Webapp_V30_Demo.html').read_text())
        self.assertIn('rangerhub-version" content="30"',new);self.assertIn("localStorage.getItem('rhv9-demo')",new)
        for f in ROOT.glob('rangerhub-*-v30.js'):self.assertIn(f.name+'?v=30-1',new)
        for name in ['rangerhub-knowledge.js','rangerhub-knowledge-model.js','rangerhub-knowledge-transport.js']:self.assertNotIn('src="'+name+'?',new)
        self.assertNotIn('data:application/pdf',new);self.assertFalse(list(ROOT.glob('*Kompakt.html')))
    def test_unchanged_backup_source_assets_and_checksums(self):
        baseline=json.loads((ROOT/'docs/v30-baseline.json').read_text())
        for name in ['RangerHub_Webapp_V29_Demo.html','rangerhub-knowledge-catalog.js','rangerhub-knowledge-map.js','data/RangerHub_Fachwissen_Quellkatalog.json']:
            self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),baseline['files'][name]['sha256'])
        for line in (ROOT/'docs/V30-SHA256SUMS').read_text().splitlines():
            digest,name=line.split('  ',1);self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),digest,name)
