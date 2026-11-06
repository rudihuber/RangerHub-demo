"""Lossless V34 packaging, source fidelity and complete before-edit backups."""
from pathlib import Path
import base64,hashlib,json,re,sys,unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
PRIVATE=(ROOT/'RangerHub_Webapp_V34_Kompakt.html').exists()
DATA_URI=r'data:[\w.+/-]+;base64,[A-Za-z0-9+/=]+'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()

class V34Packaging(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.baseline=json.loads((ROOT/'docs/v34-baseline.json').read_text())
        if PRIVATE:
            from build_v26 import decode
            cls.html=decode((ROOT/'RangerHub_Webapp_V34_Kompakt.html').read_bytes())[0]
            cls.old=decode((ROOT/'RangerHub_Webapp_V33_Kompakt.html').read_bytes())[0]
        else:
            cls.html=(ROOT/'RangerHub_Webapp_V34_Demo.html').read_text();cls.old=(ROOT/'RangerHub_Webapp_V33_Demo.html').read_text()

    def test_all_historic_files_preserved_and_build_hashes_match(self):
        for name,record in self.baseline['files'].items():
            if name in ['index.html','README.md']:continue
            self.assertEqual(digest(ROOT/name),record['sha256'],name)
        for line in (ROOT/'docs/V34-SHA256SUMS').read_text().splitlines():
            sha,name=line.split('  ',1);self.assertEqual(digest(ROOT/name),sha,name)

    def test_complete_before_edit_backup(self):
        kind='private' if PRIVATE else 'demo';backup=Path('/workspace/rangerhub-delivery/V34/backup');manifest=backup/(kind+'-manifest.json')
        if not manifest.exists():self.skipTest('Full backup is supplied separately; baseline remains in repository.')
        records=json.loads(manifest.read_text())['files'];self.assertEqual(len(records),640 if PRIVATE else 683)
        for name,record in records.items():self.assertEqual(digest(backup/kind/name),record['sha256'],name)

    def test_live_entry_storage_and_original_sources(self):
        self.assertIn('rangerhub-version" content="34"',self.html)
        if PRIVATE:
            self.assertLess((ROOT/'RangerHub_Webapp_V34_Kompakt.html').stat().st_size,25_000_000)
            self.assertEqual(re.findall(DATA_URI,self.html),re.findall(DATA_URI,self.old));self.assertEqual(len(re.findall(DATA_URI,self.html)),17)
            self.assertIn("localStorage.getItem('rhv9')",self.html);self.assertIn('RangerHub_Webapp_V34_Kompakt.html',(ROOT/'index.html').read_text())
        else:
            self.assertEqual(self.html,(ROOT/'index.html').read_text());self.assertIn("localStorage.getItem('rhv9-demo')",self.html);self.assertNotIn('data:application/pdf',self.html);self.assertFalse((ROOT/'docs/reference/logbuch4').exists())
        self.assertEqual(len(list((ROOT/'assets/ranger-library').glob('*.webp'))),43)
        for name in ['rangerhub-wisdom-catalog-v33.js','data/library-source-map-v33.json','data/ranger-wissen-content-v33.json']:
            self.assertEqual(digest(ROOT/name),self.baseline['files'][name]['sha256'])

    def test_only_intended_inline_scripts_replaced_and_standalone_images_identical(self):
        from_names=['rangerhub-dashboard-v33.js','rangerhub-navigation-v33.js','rangerhub-wisdom-views-v33.js','rangerhub-recipes.js']
        to_names=[n.replace('v33','v34') if 'v33' in n else 'rangerhub-recipes-v34.js' for n in from_names]
        if PRIVATE:
            from build_v26 import decode
            for name in to_names+['rangerhub-library-v34.js']:self.assertEqual(self.html.count('<script>\n'+(ROOT/name).read_text()+'\n</script>'),1)
            for body in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',self.old,re.S):
                if any(body=='\n'+(ROOT/n).read_text()+'\n' for n in from_names):continue
                self.assertIn(body,self.html)
            standalone=decode((ROOT/'RangerHub_Webapp_V34_Standalone.html').read_bytes())[0]
            uris=re.findall(DATA_URI,standalone);self.assertEqual(uris[:17],re.findall(DATA_URI,self.old))
            self.assertEqual(sorted(hashlib.sha256(base64.b64decode(uri.split(',',1)[1])).hexdigest() for uri in uris[17:]),sorted(digest(p) for p in (ROOT/'assets/ranger-library').glob('*.webp')))
        else:
            for name in to_names+['rangerhub-library-v34.js']:self.assertEqual(self.html.count(f'<script src="{name}?v=34-1"></script>'),1)
            for name in from_names:self.assertNotRegex(self.html,r'<script src="'+re.escape(name)+r'\?')
