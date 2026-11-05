import base64
from datetime import date, timedelta
import io
import re
import zipfile

from playwright.sync_api import expect
from browser_case import BrowserCase


RECIPE = """Kartoffelsuppe
Für 4 Personen
Zutaten
500 g Kartoffeln
1.5 l Wasser
Zubereitung
1. Kartoffeln schneiden.
2. Alles 20 Minuten kochen.
"""


def pdf_fixture(text=None, image=None):
    """A real one-page PDF; optional JPEG exercises scanned-PDF OCR."""
    if image:
        stream = b"q 595 0 0 842 0 0 cm /Im0 Do Q"
        resources = b"/XObject << /Im0 6 0 R >>"
    else:
        parts = [b"BT /F1 14 Tf 50 780 Td"]
        for i, line in enumerate(text.splitlines()):
            line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            if i:
                parts.append(b"0 -24 Td")
            parts.append(b"(" + line.encode("latin-1") + b") Tj")
        stream = b"\n".join(parts) + b"\nET"
        resources = b"/Font << /F1 4 0 R >>"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << " + resources + b" >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    if image:
        objects.append(b"<< /Type /XObject /Subtype /Image /Width 1000 /Height 1415 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + str(len(image)).encode() + b" >>\nstream\n" + image + b"\nendstream")
    result = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(result))
        result.extend(f"{i} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = len(result)
    result.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        result.extend(f"{offset:010d} 00000 n \n".encode())
    result.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    return bytes(result)


def docx_fixture():
    result = io.BytesIO()
    with zipfile.ZipFile(result, "w") as archive:
        archive.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        archive.writestr("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        paragraphs = "".join(f"<w:p><w:r><w:t>{line}</w:t></w:r></w:p>" for line in RECIPE.splitlines())
        archive.writestr("word/document.xml", '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + paragraphs + "</w:body></w:document>")
    return result.getvalue()


class PlanningAndRecipeTests(BrowserCase):
    def meeting_form(self, days=5):
        self.nav("Ranger-Treffen")
        self.page.get_by_role("button", name="+ Neues Rangertreffen", exact=True).click()
        today = date.fromisoformat(self.page.evaluate("RangerHub.localDate()"))
        self.page.locator('[name="date"]').fill((today + timedelta(days=days)).isoformat())
        return self.page.locator("#meeting-planning-form")

    def complete_program(self, form):
        person = str(self.session()["id"])
        form.locator('[name="actionTitle"]').fill("Orientierung im Wald")
        form.locator('[name="actionLeader"]').select_option(person)
        form.locator('[name="natureMode"]').select_option("none")
        form.locator('[name="impulseMode"]').select_option("none")

    def open_recipe_editor(self):
        self.nav("Rezepte")
        self.page.get_by_role("button", name="+ Rezept hinzufügen", exact=True).click()
        return self.page.locator("#recipe-form")

    def test_planning_boundaries_and_required_assignments(self):
        self.login()
        result = self.page.evaluate("""() => {
          const id = db.leaders[0].id;
          const m = {date:'2026-11-10',action:{title:'Spiel',leaderId:id},nature:{enabled:true,leaderId:id},impulse:{enabled:true,leaderId:id},food:{enabled:false}};
          const state = () => RangerHub.planningState(m,'2026-11-03');
          const out = [state()];
          m.action.title=' '; out.push(state());
          m.date='2026-11-11'; out.push(state());
          m.date='2026-11-03'; out.push(state());
          m.date='2026-11-02'; out.push(state());
          m.action.title='Spiel';m.nature.leaderId=null;out.push(state());
          m.nature.enabled=false;m.impulse.enabled=false;m.impulse.leaderId=null;out.push(state());
          m.food.enabled=true;out.push(state());m.food.leaderId=id;out.push(state());
          m.action.leaderId=999999;out.push(state());
          return out;
        }""")
        self.assertEqual([r["kind"] for r in result], ["ready", "urgent", "pending", "urgent", "pending", "pending", "ready", "pending", "ready", "pending"])
        self.assertIn("Aktion", result[1]["missing"])
        self.assertIn("Leitung für Essen", result[7]["missing"])
        summary = self.page.evaluate("lastSummary({id:-1,nature:{enabled:false,title:'Entfallenes Thema'},impulse:{enabled:false,title:'Entfallener Impuls'},action:{title:'Spiel'}})")
        self.assertNotIn("Entfallenes Thema", summary)
        self.assertNotIn("Entfallener Impuls", summary)
        self.assertIn("Nicht vorgesehen", summary)

    def test_live_planning_status_saves_incomplete_and_updates_automatically(self):
        self.login()
        form = self.meeting_form(days=7)
        self.assertEqual(form.locator('[name="status"]').count(), 0)
        expect(form.locator("[data-planning-preview]")).to_have_class("planning-preview full is-urgent")
        self.complete_program(form)
        expect(form.locator("[data-planning-preview]")).to_contain_text("Planung abgeschlossen")
        form.locator('[name="actionTitle"]').fill("")
        form.get_by_role("button", name="Planung speichern", exact=True).click()
        meeting_id = self.page.evaluate("db.meetings.at(-1).id")
        block = self.page.locator(f'article[data-meeting-id="{meeting_id}"]')
        expect(block).to_have_attribute("data-planning", "urgent")
        expect(block).to_contain_text("Planung noch nicht abgeschlossen")
        block.get_by_role("button", name="Planung öffnen", exact=False).click()
        self.page.get_by_role("button", name="Treffen bearbeiten", exact=True).click()
        self.page.locator('[name="actionTitle"]').fill("Waldspiel")
        self.page.get_by_role("button", name="Planung speichern", exact=True).click()
        expect(self.page.locator(f'article[data-meeting-id="{meeting_id}"]')).to_have_attribute("data-planning", "ready")
        self.assertFalse(self.page.evaluate(f"Object.hasOwn(RangerHub.byMeetingId({meeting_id}),'status')"))
        self.reload()
        self.nav("Ranger-Treffen")
        expect(self.page.locator(f'article[data-meeting-id="{meeting_id}"]')).to_have_attribute("data-planning", "ready")

    def test_grocery_tasks_follow_food_leader_and_preserve_checked_items(self):
        self.login()
        form = self.meeting_form()
        self.complete_program(form)
        form.locator('[name="foodMode"]').select_option("planned")
        expect(form.locator("[data-planning-preview]")).to_contain_text("Leitung für Essen")
        form.locator('[name="foodLeader"]').select_option(str(self.session()["id"]))
        form.locator('[name="foodTitle"]').fill("Gemeinsames Essen")
        form.locator('[name="ingredients"]').fill("500 g Mehl\n1.5 l Wasser")
        expect(form.locator("[data-planning-preview]")).to_contain_text("Planung abgeschlossen")
        expect(form.locator("[data-ingredient-preview] input")).to_have_count(2)
        form.get_by_role("button", name="Planung speichern", exact=True).click()
        meeting_id = self.page.evaluate("db.meetings.at(-1).id")
        self.nav("Meine Aufgaben")
        self.page.get_by_role("checkbox", name="500 g Mehl besorgt", exact=True).click()
        expect(self.page.get_by_role("checkbox", name="500 g Mehl besorgt", exact=True)).to_have_count(0)
        self.reload()
        self.nav("Ranger-Treffen")
        self.page.locator(f'article[data-meeting-id="{meeting_id}"]').get_by_role("button", name="Planung öffnen", exact=False).click()
        expect(self.page.locator("#box").get_by_role("checkbox", name="500 g Mehl", exact=True)).to_be_checked()
        self.page.get_by_role("button", name="Treffen bearbeiten", exact=True).click()
        other = self.page.evaluate("db.leaders.find(p=>p.name==='DL').id")
        self.page.locator('[name="foodLeader"]').select_option(str(other))
        self.page.get_by_role("button", name="Planung speichern", exact=True).click()
        self.nav("Meine Aufgaben")
        expect(self.page.get_by_role("checkbox", name="1.5 l Wasser besorgt", exact=True)).to_have_count(0)
        self.nav("Benutzer wechseln")
        self.login("DL", "Leiter")
        self.nav("Meine Aufgaben")
        expect(self.page.get_by_role("checkbox", name="1.5 l Wasser besorgt", exact=True)).to_be_visible()
        expect(self.page.get_by_role("checkbox", name="500 g Mehl besorgt", exact=True)).to_have_count(0)

    def test_pasted_recipe_and_immediate_meeting_checklist_preserve_draft(self):
        self.login()
        form = self.meeting_form()
        self.complete_program(form)
        form.locator('[name="theme"]').fill("Unverlorener Entwurf")
        form.locator('[name="foodMode"]').select_option("planned")
        form.locator('[name="foodLeader"]').select_option(str(self.session()["id"]))
        form.get_by_role("button", name="+ Rezept anlegen oder importieren", exact=True).click()
        recipe = self.page.locator("#recipe-form")
        recipe.locator('[name="sourceText"]').fill(RECIPE)
        recipe.get_by_role("button", name="Text übernehmen", exact=True).click()
        expect(recipe.locator('[name="title"]')).to_have_value("Kartoffelsuppe")
        expect(recipe.locator('[name="ingredients"]')).to_have_value("500 g Kartoffeln\n1.5 l Wasser")
        expect(recipe.locator('[name="instructions"]')).to_have_value("Kartoffeln schneiden.\nAlles 20 Minuten kochen.")
        recipe.get_by_role("button", name="Rezept speichern und übernehmen", exact=True).click()
        form = self.page.locator("#meeting-planning-form")
        expect(form.locator('[name="theme"]')).to_have_value("Unverlorener Entwurf")
        expect(form.locator('[name="foodTitle"]')).to_have_value("Kartoffelsuppe")
        expect(form.locator("[data-ingredient-preview] input")).to_have_count(2)
        form.get_by_role("button", name="Planung speichern", exact=True).click()
        self.reload()
        self.nav("Rezepte")
        expect(self.page.locator(".recipe-entry").filter(has_text="Kartoffelsuppe")).to_have_count(1)
        self.nav("Meine Aufgaben")
        expect(self.page.get_by_role("checkbox", name="500 g Kartoffeln besorgt", exact=True)).to_be_visible()

    def test_pdf_and_word_file_import(self):
        self.login()
        for name, mime, data in [("suppe.pdf", "application/pdf", pdf_fixture(RECIPE)), ("suppe.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx_fixture())]:
            with self.subTest(file=name):
                form = self.open_recipe_editor()
                form.locator('[name="recipeFile"]').set_input_files({"name": name, "mimeType": mime, "buffer": data})
                expect(form.locator("#recipe-import-progress")).to_contain_text("Rezept erkannt", timeout=60000)
                expect(form.locator('[name="title"]')).to_have_value("Kartoffelsuppe")
                expect(form.locator('[name="ingredients"]')).to_have_value("500 g Kartoffeln\n1.5 l Wasser")
                expect(form.locator('[name="instructions"]')).to_have_value(re.compile("20 Minuten kochen"))
                self.page.get_by_role("button", name="Schließen", exact=True).click()

    def test_scanned_pdf_uses_local_ocr(self):
        self.login()
        encoded = self.page.evaluate("""() => {
          const c=document.createElement('canvas');c.width=1000;c.height=1415;
          const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.fillStyle='black';x.font='36px Arial';
          ['Kartoffelsuppe','Zutaten','500 g Kartoffeln','1 l Wasser','Zubereitung','Kartoffeln schneiden.','Alles 20 Minuten kochen.'].forEach((line,i)=>x.fillText(line,65,100+i*78));
          return c.toDataURL('image/jpeg',.98).split(',')[1];
        }""")
        form = self.open_recipe_editor()
        form.locator('[name="recipeFile"]').set_input_files({"name": "scan.pdf", "mimeType": "application/pdf", "buffer": pdf_fixture(image=base64.b64decode(encoded))})
        expect(form.locator("#recipe-import-progress")).to_contain_text("Rezept erkannt", timeout=120000)
        expect(form.locator('[name="ingredients"]')).to_have_value(re.compile("Kartoffeln"))
        expect(form.locator('[name="instructions"]')).to_have_value(re.compile("kochen"))
        expect(form.locator('[data-save-recipe]')).to_be_enabled()

    def test_import_errors_leave_recipe_editable(self):
        self.login()
        form = self.open_recipe_editor()
        form.locator('[name="recipeFile"]').set_input_files({"name": "unsupported.xls", "mimeType": "application/octet-stream", "buffer": b"not a recipe"})
        expect(form.locator("#recipe-import-progress")).to_contain_text("Unterstützt werden")
        expect(form.locator('[data-save-recipe]')).to_be_enabled()
        form.locator('[name="title"]').fill("Weiter bearbeitbar")
        expect(form.locator('[name="title"]')).to_have_value("Weiter bearbeitbar")

    def test_recipes_are_separate_per_tribe_and_rangers_cannot_edit(self):
        self.login()
        form = self.open_recipe_editor()
        form.locator('[name="sourceText"]').fill(RECIPE)
        form.get_by_role("button", name="Text übernehmen", exact=True).click()
        form.get_by_role("button", name="Rezept speichern", exact=True).click()
        self.page.locator("#v24-stamm-switch").select_option("meppen")
        self.nav("Rezepte")
        expect(self.page.locator(".recipe-entry").filter(has_text="Kartoffelsuppe")).to_have_count(0)
        self.assertGreaterEqual(self.page.locator(".recipe-entry").count(), 17)
        self.page.locator("#v24-stamm-switch").select_option("clp-west")
        self.nav("Benutzer wechseln")
        self.login("JB", "Ranger")
        expect(self.page.locator(".nav").get_by_role("button", name="Rezepte", exact=True)).to_have_count(0)
        self.page.evaluate("goV17('recipes');RangerHub.renderRecipes();RangerHub.openRecipe(db.recipes[0].id)")
        expect(self.page.locator(".v32-dashboard")).to_be_visible()
        expect(self.page.locator("#main .recipe-entry")).to_have_count(0)
        self.page.evaluate("RangerHub.openRecipeForm()")
        expect(self.page.locator("#recipe-form")).not_to_be_visible()
        self.assertFalse(self.page.evaluate("modal.classList.contains('show')"))

    def test_editorial_layout_icon_and_growth_art_on_mobile_and_desktop(self):
        self.login()
        for width in [1440, 390]:
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 900})
                self.nav("Dashboard")
                # V30 adds a functional growth-path preview beside Fachwissen, not the removed decorative hero.
                expect(self.page.locator("main img:not(.v32-leader-growth img)")).to_have_count(0)
                expect(self.page.get_by_role("button", name="Profil und Einstellungen", exact=True)).to_be_visible()
                self.assertEqual(self.page.locator(".settingsBtn").inner_text(), "")
                self.assertNotRegex(self.page.locator("body").inner_text(), r"\bV\d+\b")
                self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
                self.nav("Wachstumspfad")
                image = self.page.locator(".growth-art img")
                expect(image).to_be_visible()
                self.page.wait_for_function("document.querySelector('.growth-art img').naturalWidth > 0")
                self.assertNotIn("Original", self.page.locator("main").inner_text())
                expect(self.page.locator(".growth-stage")).to_have_count(5)
                self.assertTrue(self.page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
