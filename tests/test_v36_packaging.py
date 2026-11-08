"""Complete V36 source, artifact, backup and original-resource integrity."""
from pathlib import Path
import base64,hashlib,json,re,sys,unittest
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'));PRIVATE=(ROOT/'RangerHub_Webapp_V36_Kompakt.html').exists()
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
URI=r'data:[\w.+/-]+;base64,[A-Za-z0-9+/=]+'
class Integrity(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.base=json.loads((ROOT/'docs/v36-baseline.json').read_text())
  if PRIVATE:
   from build_v26 import decode
   cls.html=decode((ROOT/'RangerHub_Webapp_V36_Kompakt.html').read_bytes())[0];cls.old=decode((ROOT/'RangerHub_Webapp_V35_Kompakt.html').read_bytes())[0]
  else:cls.html=(ROOT/'RangerHub_Webapp_V36_Demo.html').read_text();cls.old=(ROOT/'RangerHub_Webapp_V35_Demo.html').read_text()
 def test_all_historic_files_and_original_archives(self):
  allowed={'index.html','README.md','backend/knowledge-server.mjs'}
  original=json.loads((ROOT/'docs/v35-build.json').read_text())['files']
  for name,row in self.base['files'].items():
   if name in allowed:continue
   expected=original[name]['sha256'] if PRIVATE and name in {'rangerhub-v35.css','rangerhub-dashboard-v35.js'} else row['sha256']
   self.assertEqual(sha(ROOT/name),expected,name)
 def test_full_before_edit_backup_readback(self):
  kind='private' if PRIVATE else 'demo';base=Path('/workspace/rangerhub-delivery/V36/backup');path=base/(kind+'-manifest.json')
  if not path.exists():self.skipTest('Full separate backup not present; baseline retained.')
  records=json.loads(path.read_text())['files'];self.assertEqual(len(records),861 if PRIVATE else 898)
  for name,row in records.items():self.assertEqual(sha(base/kind/name),row['sha256'],name)
 def test_build_hashes_modules_storage_and_no_browser_secret(self):
  for line in (ROOT/'docs/V36-SHA256SUMS').read_text().splitlines():digest,name=line.split('  ',1);self.assertEqual(sha(ROOT/name),digest,name)
  from v36_build_shared import PAIRS
  for a,b in PAIRS:
   token='<script>\n'+(ROOT/b).read_text()+'\n</script>' if PRIVATE else f'<script src="{b}?v=36-1"></script>'
   self.assertEqual(self.html.count(token),1,b)
  for token in ['RANGERHUB_AI_API_KEY','api.openai.com','synthetic-test-secret']:self.assertNotIn(token,self.html)
  for p in ROOT.glob('*v36.js'):self.assertFalse(re.search(r'sk-[A-Za-z0-9_-]{24,}',p.read_text()),p.name)
  self.assertIn('name="rangerhub-version" content="36"',self.html);self.assertIn("localStorage.getItem('rhv9'" if PRIVATE else "localStorage.getItem('rhv9-demo'",self.html)
 def test_embedded_attachments_and_source_graphics_exact(self):
  self.assertEqual(re.findall(URI,self.html),re.findall(URI,self.old))
  self.assertEqual(len(list((ROOT/'assets/ranger-library').glob('*.webp'))),43)
  if PRIVATE:
   from build_v26 import decode
   self.assertLess((ROOT/'RangerHub_Webapp_V36_Kompakt.html').stat().st_size,25_000_000)
   standalone=decode((ROOT/'RangerHub_Webapp_V36_Standalone.html').read_bytes())[0];uris=re.findall(URI,standalone);self.assertEqual(uris[:17],re.findall(URI,self.old));self.assertEqual(sorted(hashlib.sha256(base64.b64decode(a.split(',',1)[1])).hexdigest() for a in uris[17:]),sorted(sha(p) for p in (ROOT/'assets/ranger-library').glob('*.webp')))
  else:self.assertNotIn('data:application/pdf',self.html);self.assertFalse((ROOT/'docs/reference/logbuch4').exists())
