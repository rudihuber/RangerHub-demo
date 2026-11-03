import unittest

from playwright.sync_api import expect
from browser_case import BrowserCase


class SessionReloadTests(BrowserCase):
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
            ("PM", "Stammleiter"),
            ("DL", "Leiter"),
            ("JB", "Ranger"),
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
            ("Teilnahme", "Teilnahme & Abmeldungen"),
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
        self.nav("Teilnahme")
        expect(self.page.locator("main")).to_contain_text(marker)
        saved_data = self.state()
        self.nav("Benutzer wechseln")
        self.assertIsNone(self.session())
        self.page.reload(wait_until="load")
        self.page.locator(".v24-loginChoice").wait_for()
        self.login()
        self.nav("Teilnahme")
        expect(self.page.locator("main")).to_contain_text(marker)
        self.assertEqual(self.state(), saved_data)

    def test_tribe_switch_survives_reload_without_mixing_data(self):
        self.login()
        self.add_absence("Regression: Demo-West only")
        self.page.locator("#v24-stamm-switch").select_option("meppen")
        self.reload(tribe="RANGERSTAMM 02")
        self.assertEqual(self.session()["homeStammId"], "clp-west")
        self.assertEqual(self.session()["activeStammId"], "meppen")
        self.add_absence("Regression: Demo-Nord only")
        expect(self.page.locator("main")).not_to_contain_text("Regression: Demo-West only")
        self.reload(tribe="RANGERSTAMM 02")
        self.nav("Teilnahme")
        expect(self.page.locator("main")).to_contain_text("Regression: Demo-Nord only")
        self.page.locator("#v24-stamm-switch").select_option("clp-west")
        self.reload()
        self.nav("Teilnahme")
        expect(self.page.locator("main")).to_contain_text("Regression: Demo-West only")
        expect(self.page.locator("main")).not_to_contain_text("Regression: Demo-Nord only")


if __name__ == "__main__":
    unittest.main(verbosity=2)
