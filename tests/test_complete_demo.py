from playwright.sync_api import expect
from browser_case import BrowserCase


class CompleteDemoTests(BrowserCase):
    def open_observer(self):
        self.nav("Wachstumspfad")
        self.page.locator(".growth-stage").filter(
            has=self.page.get_by_role("heading", name="Beobachter", exact=True)
        ).click()
        expect(self.page.get_by_role("heading", name="Beobachter-Stufe", exact=True)).to_be_visible()

    def test_observer_illustrations_load_without_placeholders_or_pdf_downloads(self):
        self.login("Demo-Ranger 01", "Ranger")
        self.open_observer()
        expect(self.page.locator(".observerPhoto")).to_have_attribute(
            "src", "assets/logbook/observer-shoulder.jpg"
        )
        expect(self.page.locator(".observerTopicsImg")).to_have_attribute(
            "src", "assets/logbook/observer-introduction.png"
        )
        self.page.wait_for_function(
            "[...document.querySelectorAll('main img')].every(img=>img.complete && img.naturalWidth>0)"
        )
        self.assertEqual(
            self.page.locator(".observerTopicsImg").evaluate("img=>getComputedStyle(img).objectFit"),
            "cover",
        )
        for label in ["Grundlagen", "Wandern", "Camp", "Leiter"]:
            expect(self.page.locator(".observerThemes")).to_contain_text(label)
        expect(self.page.get_by_role("button", name="PDF herunterladen", exact=True)).to_have_count(0)
        self.assertNotIn("Demo-Platzhalter", self.page.locator("main").inner_text())
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))

    def test_bonus_and_regular_tasks_remain_usable_without_pdf_files(self):
        self.login("Demo-Ranger 01", "Ranger")
        self.open_observer()
        self.page.locator(".tasksLaunch").click()
        expect(self.page.locator(".bonusCard")).to_have_count(4)
        self.assertGreater(self.page.locator(".obsTask input[type=checkbox]").count(), 10)
        bonus = self.page.locator(".bonusCard").filter(
            has=self.page.get_by_role("heading", name="Aufgabenpaket A", exact=True)
        )
        bonus.get_by_role("checkbox", name="Erledigt", exact=True).click()
        expect(bonus.get_by_role("checkbox", name="Erledigt", exact=True)).to_be_checked()
        self.page.locator(".obsCategory summary").first.click()
        self.page.locator(".obsCategory").first.locator("input[type=checkbox]").first.click()
        before = self.page.evaluate("observerCounts(session.id)")
        self.assertEqual(before["bcount"], 1)
        self.assertGreaterEqual(before["regular"], 1)
        self.reload(role="Ranger")
        self.open_observer()
        self.page.locator(".tasksLaunch").click()
        self.assertEqual(self.page.evaluate("observerCounts(session.id)"), before)
        expect(self.page.get_by_role("button", name="PDF herunterladen", exact=True)).to_have_count(0)
        expect(self.page.locator("a[href$='.pdf']")).to_have_count(0)

    def test_admin_can_open_every_growth_stage_with_its_content(self):
        self.login()
        for stage in ["Beobachter", "Erkunder", "Entdecker", "Forscher", "Meister"]:
            with self.subTest(stage=stage):
                self.nav("Wachstumspfad")
                self.page.locator(".growth-stage").filter(
                    has=self.page.get_by_role("heading", name=stage, exact=True)
                ).click()
                if stage == "Beobachter":
                    expect(self.page.get_by_role("heading", name="Beobachter-Stufe", exact=True)).to_be_visible()
                    expect(self.page.locator(".observerPhoto")).to_be_visible()
                    self.page.get_by_role("button", name="Weitere Beobachter-Inhalte", exact=True).click()
                    self.assertGreater(self.page.locator("#box .item").count(), 0)
                    self.page.locator("#box").get_by_role("button", name="Schließen", exact=True).click()
                    self.page.locator(".tasksLaunch").click()
                    expect(self.page.locator("main")).to_contain_text("Demo-Ranger")
                else:
                    expect(self.page.locator("#box").get_by_role("heading", name=stage, exact=True)).to_be_visible()
                    self.assertGreater(self.page.locator("#box .item").count(), 0)
                    self.page.locator("#box").get_by_role("button", name="Schließen", exact=True).click()
