"""Browser regressions for the original compact HTML (requires Playwright + Chromium).

Run: python3 tests/test_session_reload.py
The HTTP server and all browser storage are temporary; no user data is changed.
"""

import functools
import os
from pathlib import Path
import re
import shutil
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import expect, sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class SessionReloadTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(root))
        )
        cls.addClassCleanup(cls.server.server_close)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.addClassCleanup(cls.thread.join, 5)
        cls.addClassCleanup(cls.server.shutdown)
        cls.url = (
            f"http://127.0.0.1:{cls.server.server_port}/"
            "index.html"
        )
        cls.playwright = sync_playwright().start()
        cls.addClassCleanup(cls.playwright.stop)
        launch = {"headless": True, "args": ["--no-sandbox", "--disable-dev-shm-usage"]}
        chromium = shutil.which("chromium")
        if chromium:
            launch["executable_path"] = chromium
        if os.environ.get("HTTPS_PROXY"):
            launch["proxy"] = {
                "server": os.environ["HTTPS_PROXY"],
                "bypass": "127.0.0.1,localhost",
            }
        cls.browser = cls.playwright.chromium.launch(**launch)
        cls.addClassCleanup(cls.browser.close)

    def setUp(self):
        self.context = self.browser.new_context(
            locale="de-DE", timezone_id="Europe/Berlin"
        )
        self.addCleanup(self.context.close)
        self.page = self.context.new_page()
        self.page.set_default_timeout(10000)
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        response = self.page.goto(self.url, wait_until="load")
        self.assertEqual(response.status, 200)
        # Decompression/document.write finishes after the outer document's load.
        self.page.locator(".v24-loginChoice").wait_for()

    def tearDown(self):
        self.assertEqual(self.errors, [], "Uncaught application JavaScript errors")

    def login(self, profile="Demo-Admin", role="Admin"):
        self.page.get_by_role(
            "button", name=re.compile("^" + re.escape(profile) + " ·")
        ).click()
        expect(self.page.locator(".brand small")).to_have_text(
            f"STAMM DEMO-WEST · {role}"
        )

    def nav(self, label):
        self.page.locator(".nav").get_by_role("button", name=label, exact=True).click()

    def state(self):
        return self.page.evaluate("JSON.parse(localStorage.getItem('rhv9-demo'))")

    def session(self):
        return self.page.evaluate("JSON.parse(sessionStorage.getItem('rhv9-demo-session'))")

    def assert_existing_data_preserved(self, before, after, path="rhv9-demo"):
        # Existing Demo-Nord migrations add default profile fields on first reload.
        # Permit additions, but require every previously stored value to survive.
        if isinstance(before, dict):
            self.assertIsInstance(after, dict, path)
            self.assertTrue(before.keys() <= after.keys(), f"Missing keys at {path}")
            for key, value in before.items():
                self.assert_existing_data_preserved(value, after[key], f"{path}.{key}")
        elif isinstance(before, list):
            self.assertIsInstance(after, list, path)
            self.assertEqual(len(before), len(after), path)
            for index, value in enumerate(before):
                self.assert_existing_data_preserved(value, after[index], f"{path}[{index}]")
        else:
            self.assertEqual(before, after, path)

    def reload(self, tribe="DEMO-WEST", role="Admin"):
        session_before = self.session()
        data_before = self.state()
        self.page.reload(wait_until="load")
        try:
            self.page.locator(".nav").wait_for()
        except PlaywrightTimeoutError:
            self.fail(f"Session reload did not render navigation: {self.errors}")
        expect(self.page.locator(".brand small")).to_have_text(
            f"STAMM {tribe} · {role}"
        )
        self.assertEqual(self.session(), session_before)
        self.assert_existing_data_preserved(data_before, self.state())
        self.assertEqual(self.errors, [])

    def add_absence(self, reason):
        self.nav("Abwesenheiten")
        self.page.get_by_role("button", name="+ Abwesenheit", exact=True).click()
        self.page.locator('#box input[name="from"]').fill("2026-11-03")
        self.page.locator('#box input[name="to"]').fill("2026-11-04")
        self.page.locator('#box input[name="reason"]').fill(reason)
        self.page.locator("#box").get_by_role(
            "button", name="Speichern", exact=True
        ).click()
        expect(self.page.locator("main")).to_contain_text(reason)

    def test_admin_session_survives_reload(self):
        self.login()
        self.reload()
        expect(self.page.locator("main")).to_contain_text("Nächstes Treffen")
        expect(self.page.locator("#v24-stamm-switch")).to_be_visible()
        self.reload()

    def test_demo_does_not_touch_original_storage(self):
        original_data = {"testSentinel": "original-storage-must-stay-untouched"}
        self.page.evaluate("data => localStorage.setItem('rhv9', JSON.stringify(data))", original_data)
        self.login()
        self.add_absence("Demo storage isolation test")
        self.reload()
        self.assertEqual(
            self.page.evaluate("JSON.parse(localStorage.getItem('rhv9'))"),
            original_data,
        )
        self.assertNotIn("testSentinel", self.state())

    def test_other_roles_survive_reload(self):
        for profile, role in [
            ("Demo-Stammleitung", "Stammleiter"),
            ("Demo-Leitung", "Leiter"),
            ("Demo-Ranger 01", "Ranger"),
        ]:
            with self.subTest(role=role):
                self.login(profile, role)
                self.reload(role=role)
                expect(self.page.locator("#v24-stamm-switch")).to_have_count(0)
                expect(
                    self.page.locator(".nav").get_by_role(
                        "button", name="Meine Aufgaben", exact=True
                    )
                ).to_have_count(0 if role == "Ranger" else 1)
                self.nav("Wachstumspfad")
                expect(self.page.locator("main")).to_contain_text("Beobachter")
                self.nav("Benutzer wechseln")
                expect(self.page.locator(".v24-loginChoice")).to_be_visible()

    def test_navigation_after_reload(self):
        self.login()
        self.reload()
        for label, content in [
            ("Kalender", "Kalender"),
            ("Ranger-Treffen", "Rangertreffen"),
            ("Wachstumspfad", "Beobachter"),
            ("Meine Aufgaben", "Meine Aufgaben"),
            ("Abwesenheiten", "Abwesenheiten"),
        ]:
            with self.subTest(view=label):
                self.nav(label)
                expect(self.page.locator("main")).to_contain_text(content)
                if label == "Kalender":
                    self.assertGreaterEqual(self.page.locator(".calendar .day").count(), 28)
                self.assertEqual(self.errors, [])

    def test_saved_data_survives_reload_and_relogin(self):
        self.login()
        marker = "Regression: persisted absence"
        self.add_absence(marker)
        self.reload()
        self.nav("Abwesenheiten")
        expect(self.page.locator("main")).to_contain_text(marker)
        saved_data = self.state()
        self.nav("Benutzer wechseln")
        self.assertIsNone(self.session())
        self.page.reload(wait_until="load")
        self.page.locator(".v24-loginChoice").wait_for()
        self.login()
        self.nav("Abwesenheiten")
        expect(self.page.locator("main")).to_contain_text(marker)
        self.assertEqual(self.state(), saved_data)

    def test_tribe_switch_survives_reload_without_mixing_data(self):
        self.login()
        self.add_absence("Regression: Demo-West only")
        self.page.locator("#v24-stamm-switch").select_option("meppen")
        self.reload(tribe="DEMO-NORD")
        self.assertEqual(self.session()["homeStammId"], "clp-west")
        self.assertEqual(self.session()["activeStammId"], "meppen")
        self.add_absence("Regression: Demo-Nord only")
        expect(self.page.locator("main")).not_to_contain_text("Regression: Demo-West only")
        self.reload(tribe="DEMO-NORD")
        self.nav("Abwesenheiten")
        expect(self.page.locator("main")).to_contain_text("Regression: Demo-Nord only")
        self.page.locator("#v24-stamm-switch").select_option("clp-west")
        self.reload()
        self.nav("Abwesenheiten")
        expect(self.page.locator("main")).to_contain_text("Regression: Demo-West only")
        expect(self.page.locator("main")).not_to_contain_text("Regression: Demo-Nord only")


if __name__ == "__main__":
    unittest.main(verbosity=2)
