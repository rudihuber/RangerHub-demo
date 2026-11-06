"""Shipping artifacts, retained data and verifiable Ausgabe(4) provenance."""
from pathlib import Path
import base64, hashlib, json, re, sys, unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
PRIVATE=(ROOT/'RangerHub_Webapp_V33_Kompakt.html').exists()
DATA_URI=r'data:[\w.+/-]+;base64,[A-Za-z0-9+/=]+'
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def js_object(name,variable):
    text=(ROOT/name).read_text()
    return json.loads(re.search(r'window\.'+variable+r'=(.*?);\s*(?:\n|$)',text).group(1))

class V33Packaging(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.proof=json.loads((ROOT/'data/library-source-map-v33.json').read_text())
        cls.catalog=json.loads((ROOT/'data/ranger-wissen-content-v33.json').read_text())
        if PRIVATE:
            from build_v33 import decode_private
            cls.html=decode_private((ROOT/'RangerHub_Webapp_V33_Kompakt.html').read_bytes())
            cls.old=decode_private((ROOT/'RangerHub_Webapp_V32_Kompakt.html').read_bytes())
        else:
            cls.html=(ROOT/'RangerHub_Webapp_V33_Demo.html').read_text()
            cls.old=(ROOT/'RangerHub_Webapp_V32_Demo.html').read_text()

    def test_shipping_checksums_and_unchanged_historical_files(self):
        baseline=json.loads((ROOT/'docs/v33-baseline.json').read_text())
        for name,record in baseline['files'].items():
            if re.search(r'(^RangerHub_Webapp_V\d+_|^rangerhub-|^data/|^tests/)',name):
                self.assertEqual(digest(ROOT/name),record['sha256'],name)
        for line in (ROOT/'docs/V33-SHA256SUMS').read_text().splitlines():
            sha,name=line.split('  ',1)
            self.assertEqual(digest(ROOT/name),sha,name)

    def test_full_pre_edit_backup_is_complete_and_lossless(self):
        kind='private' if PRIVATE else 'demo'
        backup=Path('/workspace/rangerhub-delivery/V33/backup')
        if not (backup/(kind+'-manifest.json')).exists():
            self.skipTest('Full backup supplied separately; baseline and Git tag remain in repository.')
        manifest=json.loads((backup/(kind+'-manifest.json')).read_text())
        self.assertEqual(len(manifest['files']),466 if PRIVATE else 517)
        for name,record in manifest['files'].items():
            self.assertEqual(digest(backup/kind/name),record['sha256'],name)

    def test_live_entry_and_original_embedded_assets(self):
        self.assertIn('rangerhub-version" content="33"',self.html)
        if PRIVATE:
            self.assertLess((ROOT/'RangerHub_Webapp_V33_Kompakt.html').stat().st_size,25_000_000)
            self.assertEqual(re.findall(DATA_URI,self.html),re.findall(DATA_URI,self.old))
            self.assertEqual(len(re.findall(DATA_URI,self.html)),17)
            self.assertEqual(sum(uri.startswith('data:application/pdf') for uri in re.findall(DATA_URI,self.html)),12)
            self.assertIn("localStorage.getItem('rhv9')",self.html)
            self.assertNotIn('rhv9-demo',self.html)
            self.assertIn('RangerHub_Webapp_V33_Kompakt.html',(ROOT/'index.html').read_text())
        else:
            self.assertEqual(self.html,(ROOT/'index.html').read_text())
            self.assertNotIn('data:application/pdf',self.html)
            self.assertIn("localStorage.getItem('rhv9-demo')",self.html)
            self.assertFalse((ROOT/'docs/reference/logbuch4').exists())

    def test_new_layers_replace_only_the_intended_v32_layers(self):
        changed=['rangerhub-wisdom-catalog.js','rangerhub-bible-views-v32.js','rangerhub-wisdom-views.js','rangerhub-dashboard-v32.js','rangerhub-knowledge-v32.js']
        new=['rangerhub-bible-chapters-v33.js','rangerhub-wisdom-catalog-v33.js','rangerhub-bible-views-v33.js','rangerhub-wisdom-views-v33.js','rangerhub-dashboard-v33.js','rangerhub-navigation-v33.js','rangerhub-knowledge-v33.js']
        if PRIVATE:
            for body in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',self.old,re.S):
                if any(body=='\n'+(ROOT/name).read_text()+'\n' for name in changed):continue
                self.assertTrue(body in self.html,'An unchanged legacy script is missing from the shipping HTML.')
            for name in changed:self.assertFalse('\n'+(ROOT/name).read_text()+'\n' in self.html,name)
            for name in new:self.assertTrue((ROOT/name).read_text() in self.html,name)
        else:
            for name in changed:self.assertNotIn('src="'+name+'?',self.html)
            for name in new:self.assertIn('src="'+name+'?v=33-2"',self.html)

    def test_catalog_keeps_stable_ids_and_no_internal_page_fields(self):
        old=json.loads((ROOT/'data/ranger-wissen-content.json').read_text())
        for key,count in [('groups',5),('modules',16),('hotspots',76)]:
            self.assertEqual(len(self.catalog[key]),count)
            self.assertEqual([x['id'] for x in self.catalog[key]],[x['id'] for x in old[key]])
        self.assertEqual([x['id'] for x in self.catalog['modules'] if x['published']],[x['id'] for x in old['modules'] if x['published']])
        self.assertNotRegex(json.dumps(self.catalog),'sourcePage|pageNumber|pdfPage|sourceMeta|printed_pages|pdf_page')
        assets=js_object('rangerhub-wisdom-catalog-v33.js','RHWisdomOriginalAssets')
        self.assertEqual(len(assets),43)
        reached={key for module in self.proof['module_assets'].values() for key in [module['hero'],*module['hotspots'].values(),*module['gallery']] if key is not None}
        self.assertEqual(reached,set(assets))
        for key,asset in assets.items():
            self.assertEqual(asset['src'],'assets/ranger-library/'+key+'.webp')
            self.assertNotRegex(asset['alt'],r'(?i)seite\s*\d|pdf|ausgabe\s*\(')

    def test_all_43_referenced_originals_are_present_and_verified(self):
        assets=self.proof['assets']
        self.assertEqual(len(assets),43)
        self.assertEqual({a['file'] for a in assets},{p.relative_to(ROOT).as_posix() for p in (ROOT/'assets/ranger-library').glob('*.webp')})
        for asset in assets:
            file=ROOT/asset['file']
            self.assertEqual(file.stat().st_size,asset['bytes'])
            self.assertEqual(digest(file),asset['sha256'])
            self.assertIn(asset['kind'],['embedded-original','original-crop-vector-or-image'])
        self.assertEqual(self.proof['manifest_declared_full_pdf_sha256'],'8bf79683d14998ffc0ea35451c48598c89198e0789e66dd128595c247d5b0b1c')
        self.assertNotEqual(self.proof['uploaded_subset_sha256'],self.proof['manifest_declared_full_pdf_sha256'])

    @unittest.skipUnless(PRIVATE,'Source PDF is retained only in private delivery.')
    def test_original_pixels_and_precise_source_crops_are_lossless(self):
        import fitz
        from PIL import Image
        source=ROOT/'docs/reference/logbuch4'
        hashes=json.loads((ROOT/'docs/v33-sources.json').read_text())
        for name,record in hashes.items():self.assertEqual(digest(source/name),record['sha256'],name)
        pdf=source/'Logbuch_Ausgabe4_Seiten6-27_Originalreferenz.pdf'
        self.assertEqual(digest(pdf),self.proof['uploaded_subset_sha256'])
        manifest=json.loads((source/'QUELLEN_MANIFEST.json').read_text())
        self.assertEqual({a['file'] for a in manifest['assets']},{a['original_manifest_file'] for a in self.proof['assets']})
        with fitz.open(pdf) as doc:
            for asset in self.proof['assets']:
                if asset['kind']=='embedded-original':
                    image_info=next(i for i in doc[asset['pdf_page']-4].get_images(full=True) if i[0]==asset['subset_xref'])
                    pix=fitz.Pixmap(doc,image_info[0])
                    if image_info[1]:pix=fitz.Pixmap(pix,fitz.Pixmap(doc,image_info[1]))
                    if pix.colorspace and pix.colorspace.n>3:pix=fitz.Pixmap(fitz.csRGB,pix)
                    original=Image.frombytes('RGBA' if pix.alpha else 'RGB',[pix.width,pix.height],pix.samples)
                    self.assertEqual(hashlib.sha256(original.tobytes()).hexdigest(),asset['raw_pixel_sha256'])
                    if asset['rotation_ccw']:original=original.transpose(Image.Transpose.ROTATE_90 if asset['rotation_ccw']==90 else Image.Transpose.ROTATE_270)
                else:
                    pix=doc[asset['pdf_page']-4].get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(asset['crop_bbox']),alpha=False)
                    original=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
                    self.assertEqual(hashlib.sha256(original.tobytes()).hexdigest(),asset['raw_pixel_sha256'])
                with Image.open(ROOT/asset['file']) as shipped:
                    self.assertEqual(shipped.size,original.size)
                    self.assertEqual(hashlib.sha256(shipped.convert(original.mode).tobytes()).hexdigest(),hashlib.sha256(original.tobytes()).hexdigest(),asset['file'])

    @unittest.skipUnless(PRIVATE,'Public demo uses referenced assets without a portable private file.')
    def test_standalone_has_identical_new_and_legacy_asset_bytes(self):
        from build_v33 import decode_private
        html=decode_private((ROOT/'RangerHub_Webapp_V33_Standalone.html').read_bytes())
        uris=re.findall(DATA_URI,html)
        old=re.findall(DATA_URI,self.old)
        self.assertEqual(uris[:len(old)],old)
        self.assertEqual(len(uris),len(old)+43)
        new={hashlib.sha256(base64.b64decode(uri.split(',',1)[1])).hexdigest() for uri in uris[len(old):]}
        self.assertEqual(new,{a['sha256'] for a in self.proof['assets']})
        self.assertNotIn('assets/ranger-library/',html)

if __name__=='__main__':unittest.main()
