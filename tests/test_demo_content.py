"""Audit the complete standalone demo, including decoded embedded assets."""
import hashlib
from pathlib import Path
import re
import unittest


class DemoContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (Path(__file__).resolve().parents[1] / "index.html").read_text()

    def test_original_nonpersonal_illustrations_are_restored(self):
        expected = {           'growth-illustration.jpg': '2837dc622a126bafd157839ddda84b0a2611d5768d626fea6b9a2548c8443a6a',
            'growth-logbook.png': '3dc3e9467ca177643cd20ead73898564e8a5cfca929acc1656563da52d3ef1cc',
            'growth-overview.jpg': 'a4614e5a50eb96902bbec56a10a6d3eb0ed0794e3b93e5424e443d9db2829bf5',
            'observer-introduction.png': '76ffbe72ebaf012b02c193d9d8c51f1354711d9fa98a8b11b968f1deb5355c2a',
            'observer-shoulder.jpg': 'ec665e35153cfdd17ea7bfa93fb1d01bf07df401e095981b8670d3737a7a0032'}
        root = Path(__file__).resolve().parents[1]
        self.assertFalse(re.findall(r'data:[^\s\"\'<>]+', self.html))
        for name, digest in expected.items():
            with self.subTest(image=name):
                self.assertIn('assets/logbook/' + name, self.html)
                data = (root / 'assets/logbook' / name).read_bytes()
                self.assertEqual(hashlib.sha256(data).hexdigest(), digest)
                self.assertNotIn(b'Exif\x00\x00', data)
        self.assertNotIn('__TOPICS__', self.html)

    def test_demo_bundles_no_pdf_documents(self):
        root = Path(__file__).resolve().parents[1]
        self.assertNotIn('data:application/pdf', self.html)
        self.assertNotIn('PDF herunterladen', self.html)
        self.assertEqual(list(root.rglob('*.pdf')), [])
        for variable in ['obsPdfs', 'v18Pdfs', 'v19Pdfs']:
            self.assertIn('const ' + variable + '={};', self.html)

    def test_literal_contacts_are_fictional(self):
        emails = re.findall(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', self.html)
        self.assertTrue(emails)
        self.assertTrue(all(email.endswith("@example.invalid") for email in emails))
        names = re.findall(r"name:'([^']*)'", self.html)
        self.assertTrue(names)
        self.assertTrue(all(name.startswith("Demo-") for name in names))
        for array in ["leaderNames", "rangerNames"]:
            values = re.search(rf"const {array}=\[(.*?)\];", self.html)[1]
            self.assertTrue(all(name.startswith("Demo-Nord-") for name in re.findall(r"'([^']+)'", values)))
        mobiles = re.findall(r"mobile:'([^']*)'", self.html)
        self.assertTrue(mobiles)
        self.assertTrue(set(mobiles) <= {"", "+1 202 555 0101", "+1 202 555 0102", "+1 202 555 0103"})

    def test_demo_does_not_read_or_write_original_storage_keys(self):
        local = re.findall(r"localStorage\.(?:getItem|setItem|removeItem)\('([^']+)'", self.html)
        session = re.findall(r"sessionStorage\.(?:getItem|setItem|removeItem)\('([^']+)'", self.html)
        self.assertEqual(set(local), {"rhv9-demo", "rhv11-demo-weather-place"})
        self.assertEqual(set(session), {"rhv9-demo-session"})

    def test_public_source_has_no_packed_original_payload(self):
        self.assertNotIn("ranger-payload", self.html)
        self.assertNotIn("DecompressionStream", self.html)
        self.assertIn("nur fiktive Beispieldaten", self.html)
        self.assertEqual(self.html.count("\nrender();\n"), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
