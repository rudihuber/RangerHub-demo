"""Audit the complete standalone demo, including decoded embedded assets."""
import base64
import hashlib
from pathlib import Path
import re
import unittest


class DemoContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (Path(__file__).resolve().parents[1] / "index.html").read_text()

    def test_embedded_assets_are_generated_demo_placeholders(self):
        assets = re.findall(r'data:[^\s\"\'<>]+', self.html)
        self.assertEqual(len(assets), 17)
        expected = {
            "image/svg+xml": "a242e17752feacce895acd233f06a0932cc9039556d7ed9d4185878e3811efe7",
            "application/pdf": "f01f44d2e10b015ee75fa44394f9180b67e9ebbb83648fd47b6ea78d6e7c2810",
        }
        for asset in assets:
            with self.subTest(type=asset.split(";", 1)[0]):
                header, encoded = asset.split(",", 1)
                media_type = header.removeprefix("data:").removesuffix(";base64")
                self.assertIn(media_type, expected)
                data = base64.b64decode(encoded, validate=True)
                self.assertEqual(hashlib.sha256(data).hexdigest(), expected[media_type])

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
