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


class BrowserCase(unittest.TestCase):
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
        self.page.wait_for_function("window.RangerHub?.ready === true")

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
            # The existing compatibility layer adds newly encountered meeting
            # actions to the library on reload. All original entries must remain.
            if path.endswith(".actionLibrary"):
                self.assertGreaterEqual(len(after), len(before), path)
            else:
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
