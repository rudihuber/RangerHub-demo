from pathlib import Path
import hashlib,json,unittest
ROOT=Path(__file__).resolve().parents[1]
class V31PackagingTests(unittest.TestCase):
    def test_actual_demo_references_new_feature_and_keeps_demo_storage_isolated(self):
        s=(ROOT/'index.html').read_text();self.assertEqual(s,(ROOT/'RangerHub_Webapp_V31_Demo.html').read_text())
        for f in ['rangerhub-bible-catalog.js','rangerhub-bible-model.js','rangerhub-bible-views.js','rangerhub-knowledge-v31.js','rangerhub-bible.css']:self.assertIn(f+'?v=31-1',s)
        self.assertNotIn('src="rangerhub-knowledge-v30.js?',s);self.assertNotIn('data:application/pdf',s);self.assertIn("localStorage.getItem('rhv9-demo')",s);self.assertFalse(list(ROOT.glob('*Kompakt.html')))
    def test_checksums_original_v30_and_canonical_upload(self):
        b=json.loads((ROOT/'docs/v31-baseline.json').read_text())
        for name in ['RangerHub_Webapp_V30_Demo.html','rangerhub-knowledge-v30.js','rangerhub-knowledge-model-v30.js','rangerhub-knowledge-transport-v30.js','data/RangerHub_Fachwissen_Quellkatalog.json']:self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),b['files'][name]['sha256'])
        for line in (ROOT/'docs/V31-SHA256SUMS').read_text().splitlines():
            h,name=line.split('  ',1);self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),h,name)
        self.assertEqual(hashlib.sha256((ROOT/'data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json').read_bytes()).hexdigest(),'ea4f106082ca515d57efc74c93f0020d0f5ad6bed43942df0452fed11d88685f')
