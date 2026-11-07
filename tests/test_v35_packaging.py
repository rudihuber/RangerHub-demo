"""V35 source/backup integrity and lossless compact/standalone delivery."""
from pathlib import Path
import base64,hashlib,json,re,sys,unittest
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
PRIVATE=(ROOT/'RangerHub_Webapp_V35_Kompakt.html').exists()
URI=r'data:[\w.+/-]+;base64,[A-Za-z0-9+/=]+'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
class V35Packaging(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.baseline=json.loads((ROOT/'docs/v35-baseline.json').read_text())
        if PRIVATE:
            from build_v26 import decode
            cls.html=decode((ROOT/'RangerHub_Webapp_V35_Kompakt.html').read_bytes())[0];cls.old=decode((ROOT/'RangerHub_Webapp_V34_Kompakt.html').read_bytes())[0]
        else:cls.html=(ROOT/'RangerHub_Webapp_V35_Demo.html').read_text();cls.old=(ROOT/'RangerHub_Webapp_V34_Demo.html').read_text()

    def test_historic_files_only_intended_unversioned_files_change(self):
        allowed={'index.html','README.md','backend/knowledge-server.mjs'}
        for name,data in self.baseline['files'].items():
            if name not in allowed:self.assertEqual(sha(ROOT/name),data['sha256'],name)
        for line in (ROOT/'docs/V35-SHA256SUMS').read_text().splitlines():
            digest,name=line.split('  ',1);self.assertEqual(sha(ROOT/name),digest,name)

    def test_full_before_edit_backup_and_restore_bytes(self):
        kind='private' if PRIVATE else 'demo';base=Path('/workspace/rangerhub-delivery/V35/backup');path=base/(kind+'-manifest.json')
        if not path.exists():self.skipTest('Full backup supplied separately; baseline remains available.')
        data=json.loads(path.read_text());self.assertEqual(len(data['files']),737 if PRIVATE else 779)
        for name,item in data['files'].items():self.assertEqual(sha(base/kind/name),item['sha256'],name)

    def test_entry_storage_and_source_images_remain_lossless(self):
        self.assertIn('rangerhub-version" content="35"',self.html)
        if PRIVATE:
            self.assertLess((ROOT/'RangerHub_Webapp_V35_Kompakt.html').stat().st_size,25_000_000);self.assertEqual(re.findall(URI,self.html),re.findall(URI,self.old));self.assertEqual(len(re.findall(URI,self.html)),17);self.assertIn("localStorage.getItem('rhv9')",self.html)
            from build_v26 import decode
            standalone=decode((ROOT/'RangerHub_Webapp_V35_Standalone.html').read_bytes())[0];assets=re.findall(URI,standalone);self.assertEqual(assets[:17],re.findall(URI,self.old));self.assertEqual(sorted(hashlib.sha256(base64.b64decode(a.split(',',1)[1])).hexdigest() for a in assets[17:]),sorted(sha(p) for p in (ROOT/'assets/ranger-library').glob('*.webp')))
        else:
            self.assertEqual(self.html,(ROOT/'index.html').read_text());self.assertIn("localStorage.getItem('rhv9-demo')",self.html);self.assertNotIn('data:application/pdf',self.html);self.assertFalse((ROOT/'docs/reference/logbuch4').exists())
        for name in ['rangerhub-wisdom-catalog-v33.js','data/ranger-wissen-content-v33.json','data/library-source-map-v33.json']:
            self.assertEqual(sha(ROOT/name),self.baseline['files'][name]['sha256'])
        self.assertEqual(len(list((ROOT/'assets/ranger-library').glob('*.webp'))),43)

    def test_new_modules_exist_once_and_no_provider_secret_in_browser(self):
        from v35_build_shared import PAIRS,SUPPLEMENTS,MODELS
        for name in [*[a for _,a in PAIRS],*SUPPLEMENTS,*MODELS]:
            if PRIVATE:self.assertEqual(self.html.count('<script>\n'+(ROOT/name).read_text()+'\n</script>'),1,name)
            else:self.assertEqual(self.html.count(f'<script src="{name}?v=35-1"></script>'),1,name)
        self.assertNotIn('RANGERHUB_AI_API_KEY',self.html)
        self.assertNotIn('api.openai.com',self.html)
        self.assertNotIn('synthetic-test-secret',self.html)
