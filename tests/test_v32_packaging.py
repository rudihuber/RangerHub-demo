"""Actual shipping HTML and complete pre-edit backup, lossless and hash-verified."""
from pathlib import Path
import hashlib,json,re,sys,unittest
ROOT=Path(__file__).resolve().parents[1]
class V32Packaging(unittest.TestCase):
 def test_manifest_and_predecessor_checksums(self):
  baseline=json.loads((ROOT/'docs/v32-baseline.json').read_text())
  for name in ['RangerHub_Webapp_V31_Kompakt.html' if (ROOT/'RangerHub_Webapp_V31_Kompakt.html').exists() else 'RangerHub_Webapp_V31_Demo.html','rangerhub-knowledge-v31.js','rangerhub-knowledge-model-v30.js','rangerhub-bible-model.js','data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json']:
   self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),baseline['files'][name]['sha256'])
  for line in (ROOT/'docs/V32-SHA256SUMS').read_text().splitlines():
   digest,name=line.split('  ',1);self.assertEqual(hashlib.sha256((ROOT/name).read_bytes()).hexdigest(),digest,name)
 def test_actual_html_and_original_embedded_assets(self):
  private=(ROOT/'RangerHub_Webapp_V32_Kompakt.html').exists()
  if private:
   sys.path.insert(0,str(ROOT/'tools'));from build_v26 import decode
   html,_=decode((ROOT/'RangerHub_Webapp_V32_Kompakt.html').read_bytes());old,_=decode((ROOT/'RangerHub_Webapp_V31_Kompakt.html').read_bytes());self.assertLess((ROOT/'RangerHub_Webapp_V32_Kompakt.html').stat().st_size,25000000)
   pattern=r'data:[\w.+/-]+;base64,[A-Za-z0-9+/=]+';self.assertEqual(re.findall(pattern,old),re.findall(pattern,html));self.assertEqual(sum(x.startswith('data:application/pdf') for x in re.findall(pattern,html)),12)
   changed=['rangerhub-knowledge-v31.js','rangerhub-knowledge-transport-v30.js','rangerhub-bible-views.js','rangerhub-v27.js','rangerhub-expedition.js']
   for script in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',old,re.S):
    if any(script=='\n'+(ROOT/f).read_text()+'\n' for f in changed):continue
    self.assertIn(script,html)
   for f in ['rangerhub-wisdom-catalog.js','rangerhub-wisdom-model.js','rangerhub-wisdom-views.js','rangerhub-dashboard-v32.js','rangerhub-knowledge-v32.js','rangerhub-v32.css']:self.assertIn((ROOT/f).read_text(),html)
   self.assertIn("localStorage.getItem('rhv9')",html);self.assertNotIn('rhv9-demo',html)
  else:
   html=(ROOT/'RangerHub_Webapp_V32_Demo.html').read_text();self.assertEqual(html,(ROOT/'index.html').read_text());self.assertNotIn('data:application/pdf',html);self.assertIn("localStorage.getItem('rhv9-demo')",html)
   self.assertNotIn('rangerhub-v27.js?',html);self.assertIn('rangerhub-logbook-v32.js?',html)
  self.assertIn('rangerhub-version" content="32"',html)
 def test_source_is_complete_and_no_internal_page_metadata_enters_catalog(self):
  c=json.loads((ROOT/'data/ranger-wissen-content.json').read_text());self.assertEqual(len(c['groups']),5);self.assertEqual(len(c['modules']),16);self.assertEqual(len(c['hotspots']),76);self.assertEqual(len(set(m['id'] for m in c['modules'])),16)
  self.assertEqual(sorted(m['id'] for m in c['modules'] if m['published']),['eigenschaften','emblem','start']);self.assertNotRegex(json.dumps(c),'sourcePage|pageNumber|pdfPage|sourceMeta')
 def test_full_backup_matches_original_tree(self):
  backup=Path('/workspace/rangerhub-delivery/V32/backup');kind='private' if (ROOT/'RangerHub_Webapp_V32_Kompakt.html').exists() else 'demo';
  if not (backup/(kind+'-manifest.json')).exists():self.skipTest('Vollständige Sicherung separat geliefert; Git-Sicherungspunkt und Baseline sind im Repository.')
  manifest=json.loads((backup/(kind+'-manifest.json')).read_text())
  for name,r in manifest['files'].items():self.assertEqual(hashlib.sha256((backup/kind/name).read_bytes()).hexdigest(),r['sha256'],name)
