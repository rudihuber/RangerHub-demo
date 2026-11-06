"""V34 user requests, verified in the running application with temporary storage."""
from pathlib import Path
import json
from playwright.sync_api import expect
from browser_case import BrowserCase
from v33_cases import V33Cases,VIEWPORTS

class V34Tests(V33Cases,BrowserCase):
    def test_crest_always_left_of_brand_and_sticky(self):
        self.choose()
        for width,height in VIEWPORTS:
            self.page.set_viewport_size({'width':width,'height':height})
            self.dashboard()
            crest=self.page.locator('[data-ranger-crest]');expect(crest).to_be_visible()
            self.assertTrue(crest.evaluate('e=>e.complete&&e.naturalWidth>0'))
            self.assertEqual(crest.evaluate('e=>e.getAttribute("src")'),self.page.evaluate('RHWisdomOriginalAssets[RHWisdomModuleAssets.emblem.hero].src'))
            self.assertLess(crest.bounding_box()['x'],self.page.locator('.rh34-brand-copy').bounding_box()['x'])
            self.page.evaluate('scrollTo({top:1600,behavior:"instant"});document.querySelector(".side").scrollTop=450')
            self.page.wait_for_timeout(80)
            self.assertGreaterEqual(crest.bounding_box()['y'],-1)
            self.assertLess(crest.bounding_box()['y'],height)
            self.page.evaluate('scrollTo({top:0,behavior:"instant"});document.querySelector(".side").scrollTop=0')
        self.wisdom('wisdom-module','emblem');expect(self.page.locator('[data-ranger-crest]')).to_be_visible()

    def test_diagram_markers_toggle_persists_without_changing_content(self):
        self.choose();self.wisdom('wisdom-module','emblem')
        before=self.store();keys=self.page.evaluate('Object.keys(localStorage).sort()')
        toggle=self.page.locator('[data-wisdom-markers]');expect(toggle).to_have_attribute('aria-pressed','true')
        toggle.click();expect(self.page.locator('.rw-diagram-pins')).to_be_hidden()
        expect(self.page.locator('.rw-hotspots button').first).to_be_visible()
        self.assertEqual(keys,self.page.evaluate('Object.keys(localStorage).sort()'))
        after=self.store();before['shared'].setdefault('interfacePreferences',{})['libraryMarkersHidden']=True
        self.assertEqual(before,after)
        self.page.reload();self.ready();self.wisdom('wisdom-module','emblem')
        expect(self.page.locator('.rw-diagram-pins')).to_be_hidden();toggle.click();expect(self.page.locator('.rw-diagram-pins')).to_be_visible()
        self.assertTrue(self.page.locator('[data-ranger-crest]').is_visible())

    def test_birthdays_stack_for_both_roles(self):
        for kind,role in [('leaders','Leiter'),('rangers',None)]:
            self.choose(kind,role)
            self.page.evaluate("()=>{db.rangers.slice(0,4).forEach((r,i)=>r.birthday='2012-12-'+String(i+10));v24Persist();render()}")
            for width in [1440,390]:
                self.page.set_viewport_size({'width':width,'height':900});self.dashboard()
                rows=self.page.locator('.v33-birthdays p').all();self.assertGreaterEqual(len(rows),2)
                a,b=rows[0].bounding_box(),rows[1].bounding_box();self.assertAlmostEqual(a['x'],b['x'],delta=1);self.assertGreaterEqual(b['y'],a['y']+a['height'])

    def test_nature_has_no_bible_or_question_and_is_alphabetical(self):
        self.choose('leaders','Admin');before=self.page.evaluate('JSON.stringify(db.natureLibrary)')
        self.page.evaluate("goV17('nature')")
        titles=self.page.locator('[data-nature-id] summary>span:first-child').all_text_contents()
        expected=self.page.evaluate("db.natureLibrary.map(n=>n.title).sort(new Intl.Collator('de',{numeric:true,sensitivity:'base'}).compare)")
        self.assertEqual(titles,expected);expect(self.page.locator('.v28-nature-list .v28-verse,.v28-nature-list .v28-question')).to_have_count(0)
        self.page.evaluate("RangerHub.editNature('v28-nature-regenbogen')")
        f=self.page.locator('#v28-nature-form');expect(f.locator('[name=verse],[name=question]')).to_have_count(0)
        f.get_by_role('button',name='Speichern',exact=True).click()
        self.assertEqual(before,self.page.evaluate('JSON.stringify(db.natureLibrary)'))
        self.page.evaluate("meetingFormV15();RangerHub.chooseNature('v28-nature-regenbogen',true)")
        description=self.page.locator('[name=natureDescription]').input_value()
        self.assertIn('gebrochen',description);self.assertNotIn('Bibelstelle:',description);self.assertNotIn('Gesprächsfrage:',description)

    def test_two_year_reuse_from_actual_meetings_including_boundaries(self):
        self.choose('leaders','Admin')
        result=self.page.evaluate("""()=>{const saved=db.meetings,now=new Date('2026-11-06T18:00:00Z'),item={id:'fixture',title:'Fixture'};
          const part=kind=>kind==='impulse'?{suggestionId:item.id,title:item.title}:{libraryId:item.id,title:item.title};
          const usage=(kind,date,extra={})=>{db.meetings=[{date,start:'18:00',[kind]:part(kind),...extra}];return RangerHub.libraryUsageV34(kind,item,now)};
          const result={};for(const kind of ['nature','action','impulse']){result[kind]={older:usage(kind,'2024-11-05'),anniversary:usage(kind,'2024-11-06'),recent:usage(kind,'2024-11-07'),future:usage(kind,'2026-11-07'),cancelled:usage(kind,'2026-11-05',{cancelled:true}),disabled:usage(kind,'2026-11-05',{[kind]:{...part(kind),enabled:false}}),laterToday:usage(kind,'2026-11-06',{start:'22:00'}),startedToday:usage(kind,'2026-11-06',{start:'18:00'})};
          db.meetings=[{date:'2022-11-07',[kind]:part(kind)},{date:'2026-01-15',[kind]:part(kind)}];result[kind].latest=RangerHub.libraryUsageV34(kind,item,now);}
          db.meetings=[{date:'2024-02-29',nature:part('nature')}];result.leap=RangerHub.libraryUsageV34('nature',item,new Date('2026-02-28T12:00Z'));db.meetings=saved;return result;}""")
        for kind in ['nature','action','impulse']:
            row=result[kind]
            for key in ['older','anniversary','future','cancelled','disabled','laterToday']:self.assertFalse(row[key]['used'],(kind,key))
            for key in ['recent','startedToday','latest']:self.assertTrue(row[key]['used'],(kind,key))
            self.assertEqual(row['latest']['reusableOn'],'2028-01-15')
        self.assertEqual(result['leap']['reusableOn'],'2026-02-28');self.assertFalse(result['leap']['used'])

    def test_three_template_buckets_show_actual_use_and_keep_history(self):
        self.choose('leaders','Admin')
        ids=self.page.evaluate("""()=>{const n=db.natureLibrary[0],a=db.actionLibrary.find(a=>a.impulseSuggestions?.length),p=a.impulseSuggestions[0];db.meetings=[{id:98731,date:RangerHub.localDate(),start:'00:01',theme:'History retained',actionLibraryId:a.id,action:{title:a.title},nature:{enabled:true,libraryId:n.id,title:n.title},impulse:{enabled:true,suggestionId:p.id,title:p.title}}];v24Persist();return {nature:n.id,action:a.id,impulse:p.id};}""")
        for kind,route,selector in [('nature','nature','[data-nature-id]'),('action','activities','[data-action-id]'),('impulse','impulses','.v28-impulse-list article')]:
            self.page.evaluate('r=>goV17(r)',route)
            used=self.page.locator('button[data-library-bucket=used]');expect(used).to_contain_text('(1)');expect(self.page.locator(selector+'[data-library-bucket=used]')).to_be_hidden()
            used.click();expect(self.page.locator(selector+':visible')).to_have_count(1);expect(self.page.locator(selector+':visible')).to_contain_text('Zuletzt verwendet:')
            self.page.locator('button[data-library-bucket=templates]').click();expect(self.page.locator(selector+'[data-library-bucket=used]')).to_be_hidden()
        self.assertEqual(self.page.evaluate('db.meetings.length'),1);self.assertEqual(self.page.evaluate('db.meetings[0].theme'),'History retained')

    def test_recipe_categories_search_edit_and_import(self):
        self.choose('leaders','Admin')
        self.page.evaluate("()=>{db.recipes=[{id:'soup',title:'Gemüsesuppe',ingredients:['1 l Wasser'],instructions:'Kochen'},{id:'bread',title:'Stockbrot',ingredients:['Mehl'],instructions:'Backen'},{id:'custom',title:'Rangergericht',category:'Lagerklassiker',ingredients:['Reis'],instructions:'Kochen'}];v24Persist();goV17('recipes')}")
        self.assertEqual(self.page.locator('.v34-recipe-category').count(),3)
        self.page.locator('.v34-recipe-filters select').select_option(label='Frühstück & Brot');expect(self.page.locator('.recipe-entry:visible')).to_have_count(1);expect(self.page.locator('.recipe-entry:visible')).to_contain_text('Stockbrot')
        self.page.locator('.v34-recipe-filters select').select_option('');self.page.locator('.v34-recipe-filters input').fill('Rangergericht');expect(self.page.locator('.recipe-entry:visible')).to_have_count(1)
        self.page.evaluate("RangerHub.openRecipeForm('custom')");f=self.page.locator('#recipe-form');expect(f.locator('[name=category]')).to_have_value('Lagerklassiker');f.locator('[name=category]').fill('Unterwegs');f.get_by_role('button',name='Rezept speichern',exact=True).click()
        self.assertEqual(self.page.evaluate("db.recipes.find(r=>r.id==='custom').category"),'Unterwegs')
        self.page.evaluate('RangerHub.openRecipeForm()');f=self.page.locator('#recipe-form');f.locator('[name=sourceText]').fill('Apfelkuchen\nZutaten\n2 Äpfel\nZubereitung\nBacken.');f.get_by_role('button',name='Text übernehmen').click();expect(f.locator('[name=category]')).to_have_value('Süßes & Backen');f.get_by_role('button',name='Rezept speichern',exact=True).click()
        self.assertEqual(self.page.evaluate('db.recipes.at(-1).category'),'Süßes & Backen');self.page.reload();self.ready();self.assertEqual(self.page.evaluate("db.recipes.find(r=>r.id==='custom').category"),'Unterwegs')

    def test_compact_maps_all_buttons_inside_image_no_overlap_and_small_books(self):
        self.choose();out=Path(__file__).resolve().parents[1]/'docs/screenshots/v34';out.mkdir(parents=True,exist_ok=True)
        for width,height in VIEWPORTS:
            self.page.set_viewport_size({'width':width,'height':height});self.dashboard();self.page.wait_for_timeout(120)
            self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
            map=self.page.locator('.v34-expedition-preview').bounding_box();stations=self.page.locator('.v34-stage-station').all();self.assertEqual(len(stations),5)
            boxes=[s.bounding_box() for s in stations]
            for b in boxes:
                self.assertGreaterEqual(b['width'],44);self.assertGreaterEqual(b['height'],44);self.assertGreaterEqual(b['x'],map['x']-1);self.assertLessEqual(b['x']+b['width'],map['x']+map['width']+1);self.assertGreaterEqual(b['y'],map['y']);self.assertLessEqual(b['y']+b['height'],map['y']+map['height'])
            self.assertLess(boxes[-1]['y'],boxes[0]['y']);self.assertGreater(boxes[-1]['x'],boxes[0]['x'])
            for i,a in enumerate(boxes):
                for b in boxes[i+1:]:self.assertFalse(a['x']<b['x']+b['width'] and b['x']<a['x']+a['width'] and a['y']<b['y']+b['height'] and b['y']<a['y']+a['height'],(width,a,b))
            for pin in self.page.locator('.v33-knowledge-preview .kw-map-pin').all():
                b=pin.bounding_box();text=pin.locator('b').bounding_box();self.assertLessEqual(b['width'],text['width']+20);self.assertLessEqual(b['height'],max(44,text['height']+17)+1)
            self.assertEqual(self.page.locator('[data-dashboard-book]').count(),66);self.assertEqual(self.page.locator('[data-book-shelf-row]').count(),2 if width<768 else 3)
            self.assertLessEqual(self.page.locator('.v33-book-body').first.bounding_box()['height'],77)
            self.page.evaluate('scrollTo({top:0,behavior:"instant"})');self.page.screenshot(path=str(out/f'ranger-dashboard-{width}x{height}.png'),full_page=True)
        self.page.set_viewport_size({'width':390,'height':844})
        first=self.page.locator('[data-dashboard-book]').first.get_attribute('data-dashboard-book');self.page.locator('[data-bible-preview-next]').click();self.assertNotEqual(first,self.page.locator('[data-dashboard-book]').first.get_attribute('data-dashboard-book'))
        first=self.page.locator('[data-dashboard-book]').first.get_attribute('data-dashboard-book');self.page.evaluate("goV17('calendar')");self.dashboard();self.assertNotEqual(first,self.page.locator('[data-dashboard-book]').first.get_attribute('data-dashboard-book'))

def load_tests(loader,tests,pattern):
    # The V33 inherited acceptance is run once by the regression runner.
    return loader.suiteClass(V34Tests(name) for name in V34Tests.__dict__ if name.startswith('test_'))
