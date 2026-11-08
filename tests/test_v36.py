"""V36 behaviour and role checks in real Chromium, isolated profiles only."""
from pathlib import Path
import json,hashlib,secrets,tempfile,subprocess
from urllib.parse import urlsplit
from playwright.sync_api import expect
from browser_case import BrowserCase
from v36_browser_support import install
install()
from v33_cases import V33Cases

WIDTHS=[320,375,390,768,1024,1440]
class V36Tests(V33Cases,BrowserCase):
    def ready(self):
        self.page.wait_for_function('window.RangerHub?.revisionV36Ready === true')
    def shot(self,name):
        path=Path(__file__).resolve().parents[1]/'docs/screenshots/v36'/name;path.parent.mkdir(parents=True,exist_ok=True);self.page.screenshot(path=str(path),full_page=True)
    def no_overflow(self):
        self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),self.page.evaluate('innerWidth')+1)
    def seed_members(self,n=8):
        self.page.evaluate("""n=>{db.rangers=Array.from({length:n},(_,i)=>({id:88000+i,name:'Ranger '+(i+1),stage:'Beobachter',team:'Waldgruppe',mobile:i?'':'+49 555 123456',email:i?'':'kontakt@test.invalid',birthday:'2013-01-01',address:'Waldweg 3',address2:'12345 Testort'}));rangers()}""",n)
    def test_cards_counts_layout_missing_fields_and_all_breakpoints(self):
        self.choose('leaders','Admin');self.page.evaluate("goV17('rangers')")
        for n in [0,1,8,50]:
            self.seed_members(n);self.assertEqual(self.page.locator('.mc36-card').count(),n)
            for width in WIDTHS:
                self.page.set_viewport_size({'width':width,'height':900});self.no_overflow()
                if n:
                    card=self.page.locator('.mc36-card').first;self.assertLess(card.bounding_box()['width'],600)
                    self.assertEqual(card.locator('img').count(),0);expect(card.locator('.mc36-avatar')).to_contain_text('R')
                    self.assertGreaterEqual(card.locator('[data-card-profile]').bounding_box()['height'],44)
            if n==8:self.shot('ranger-cards-1440.png')
        self.assertEqual(self.errors,[])
    def test_card_status_search_photo_links_and_xss(self):
        self.choose('leaders','Admin');self.page.evaluate("goV17('rangers')");self.seed_members(8)
        self.page.evaluate("""()=>{db.rangers[0].name='<img src=x onerror=window.XSS=1>';db.rangers[0].photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6qXcAAAAASUVORK5CYII=';db.rangers[1].active=false;db.rangers[2].archived=true;rangers()}""")
        self.assertEqual(self.page.locator('.mc36-card').count(),6);self.assertEqual(self.page.locator('.mc36-card img').count(),1)
        self.assertIsNone(self.page.evaluate('window.XSS'));expect(self.page.locator('.mc36-card').first.locator('h3')).to_contain_text('<img')
        expect(self.page.locator('.mc36-card').first.locator('img')).to_have_attribute('alt','Profilfoto von <img src=x onerror=window.XSS=1>')
        self.page.locator('[data-member-filter=paused]').click();self.assertEqual(self.page.locator('.mc36-card').count(),1)
        self.page.locator('[data-member-filter=left]').click();self.assertEqual(self.page.locator('.mc36-card').count(),1)
        self.page.locator('[data-member-filter=all]').click();self.assertEqual(self.page.locator('.mc36-card').count(),8)
        self.page.locator('.ms35-search input').fill('Ranger 8');self.assertEqual(self.page.locator('.mc36-card').count(),1)
        self.page.locator('.ms35-search input').fill('');card=self.page.locator('.mc36-card').first
        expect(card.locator('a[href^="tel:"]')).to_have_attribute('href','tel:+49555123456');expect(card.locator('a[href^="mailto:"]')).to_have_attribute('href','mailto:kontakt@test.invalid');self.assertEqual(card.locator('a.mc36-route').count(),1)
        self.page.evaluate("()=>{db.rangers[0].email='invalid';db.rangers[0].mobile='tel:javascript:bad';db.rangers[0].address2='';rangers()}")
        self.assertEqual(self.page.locator('.mc36-card').first.locator('a').count(),0)
    def test_leader_cards_profile_keyboard_and_no_primary_remove(self):
        self.choose('leaders','Admin');self.page.evaluate("goV17('leaders')");self.shot('leader-cards-1440.png')
        card=self.page.locator('.mc36-card').last;self.assertEqual(card.get_by_role('button',name='Entfernen',exact=True).count(),0)
        self.assertEqual(card.locator('.btn.red').count(),0);card.locator('[data-card-profile]').focus();self.page.keyboard.press('Enter');expect(self.page.locator('.modal')).to_have_class(__import__('re').compile('show'));self.page.evaluate('closeM()')
        self.page.set_viewport_size({'width':390,'height':844});self.no_overflow();self.shot('leader-cards-390.png')
        self.assertEqual(self.errors,[])
    def test_role_privacy_no_edit_for_ranger(self):
        self.choose();out=self.page.evaluate("""()=>RangerHub.memberCardV36('leaders',{id:999,name:'Leitung',role:'Admin',mobile:'+49 123456',email:'privat@domain.de',address:'Geheimweg 1',address2:'99999 Privatort'})""")
        for secret in ['privat@domain.de','Geheimweg','data-card-edit','data-card-end','data-card-status']:self.assertNotIn(secret,out)
        self.page.evaluate("goV17('leaders')");self.assertEqual(self.page.locator('[data-member-list]').count(),0)
    def seed_calendar(self):
        self.page.evaluate("""()=>{const d=RangerHub.localDate(),base={date:d,start:'18:00',end:'20:00',place:'Testwiese',nature:{enabled:false},impulse:{enabled:false},action:{title:'Test',leaderId:db.leaders[0].id},food:{enabled:false,ingredients:[]},attendance:{rangers:{},leaders:{}}};db.meetings=[{...base,id:99101,theme:'Kalender A'},{...base,id:99102,theme:'Kalender B'}];db.leaderMeetings=[{...base,id:99103,info:'Planung',actions:[]}];db.custom=[{id:99104,date:d,title:'Eigener Termin'}];v24Persist();goV17('calendar')}""")
    def test_calendar_delete_all_types_keeps_context_and_other_events(self):
        self.choose('leaders','Admin');self.seed_calendar()
        for fn,collection,pid in [('deleteMeetingV15','meetings',99101),('deleteLeaderMeetingV16','leaderMeetings',99103),('deleteCustomEvent','custom',99104)]:
            self.page.set_viewport_size({'width':390,'height':568});self.page.evaluate('scrollTo(0,200)');scroll=self.page.evaluate('scrollY');before=self.page.evaluate('({view,calY,calM})');self.page.once('dialog',lambda d:d.accept());self.page.evaluate('async a=>await window[a.fn](a.id)',{'fn':fn,'id':pid})
            self.page.wait_for_function('a=>Math.abs(scrollY-a)<2',arg=scroll);self.assertEqual(self.page.evaluate('({view,calY,calM})'),before);self.assertEqual(self.page.evaluate('a=>db[a.c].some(x=>x.id===a.id)',{'c':collection,'id':pid}),False)
            self.assertTrue(self.page.evaluate('db.meetings.some(x=>x.id===99102)'));expect(self.page.locator('.main h1')).to_have_text('Kalender')
        self.assertEqual(self.errors,[])
    def test_calendar_cancel_and_storage_failure_preserve_event_and_month(self):
        self.choose('leaders','Admin');self.seed_calendar();self.page.evaluate('calY=2027;calM=3;calendar();scrollTo(0,250)');before=self.page.evaluate('JSON.stringify({meetings:db.meetings,calY,calM,view})')
        self.page.once('dialog',lambda d:d.dismiss());self.page.evaluate('deleteMeetingV15(99101)');self.assertEqual(before,self.page.evaluate('JSON.stringify({meetings:db.meetings,calY,calM,view})'))
        self.page.evaluate("()=>{window.restoreSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Speicherfehler-Test')}}")
        self.page.once('dialog',lambda d:d.accept());self.page.evaluate('deleteMeetingV15(99101)');self.page.evaluate('()=>{Storage.prototype.setItem=window.restoreSet}');self.assertEqual(before,self.page.evaluate('JSON.stringify({meetings:db.meetings,calY,calM,view})'))
        expect(self.page.locator('body')).to_contain_text('Termin nicht gelöscht')
    def test_calendar_origin_from_meetings_or_leadermeetings_and_duplicate_click(self):
        self.choose('leaders','Admin');self.seed_calendar();self.page.evaluate("goV17('meetings')")
        self.page.once('dialog',lambda d:d.accept());self.page.evaluate('Promise.all([deleteMeetingV15(99101),deleteMeetingV15(99101)])');self.assertEqual(self.page.evaluate('view'),'meetings')
        self.page.evaluate("goV17('leadermeetings')");self.page.once('dialog',lambda d:d.accept());self.page.evaluate('deleteLeaderMeetingV16(99103)');self.assertEqual(self.page.evaluate('view'),'leadermeetings')
    def test_weather_centered_no_word_split_all_sizes_zoom_and_missing(self):
        self.choose()
        for width in WIDTHS:
            self.page.set_viewport_size({'width':width,'height':900});self.dashboard()
            self.page.evaluate("""()=>{const slot=document.querySelector('[data-v33-weather-slot]');slot.innerHTML='<section class="v27-weather v27-current-weather" data-v27-current-weather><div class="v27-weather-heading"><span>☀</span><div><small>Am Treffpunkt</small><h2>Cloppenburg</h2></div><strong>18°</strong></div><p>Heiter</p></section>'}""")
            self.no_overflow();slot=self.page.locator('[data-v33-weather-slot]');weather=slot.locator('[data-v27-current-weather]')
            if width<768:
                a=slot.bounding_box();b=weather.bounding_box();self.assertLess(abs(a['x']+a['width']/2-b['x']-b['width']/2),2)
                self.assertLess(slot.locator('h2').bounding_box()['height'],40)
            if width==390:self.shot('weather-390.png')
        self.page.set_viewport_size({'width':320,'height':844});self.dashboard();self.page.evaluate("document.querySelector('[data-v33-weather-slot]').innerHTML='<section data-v27-current-weather class=\"v27-current-weather\"><div class=\"v27-weather-heading\"><h2>Bad Homburg vor der Höhe</h2></div><p>Keine Wetterdaten verfügbar</p></section>'");self.no_overflow()
        self.page.evaluate("document.body.style.zoom='2'");self.no_overflow();self.page.evaluate("document.body.style.zoom=''")
    def test_bible_canonical_shelves_reload_scroll_and_accessibility(self):
        self.page.set_viewport_size({'width':390,'height':844});self.choose();expected=self.page.evaluate('RHBibleCatalog.books.map(b=>b.id)')
        def check():
            rows=self.page.locator('[data-book-shelf-row]');self.assertEqual(rows.count(),2);self.assertEqual(rows.nth(0).locator('[data-dashboard-book]').count(),39);self.assertEqual(rows.nth(1).locator('[data-dashboard-book]').count(),27)
            self.assertEqual(self.page.locator('[data-dashboard-book]').evaluate_all('(e)=>e.map(x=>x.dataset.dashboardBook)'),expected);self.assertEqual(self.page.locator('[data-bible-preview-next]').count(),0)
        check();self.shot('bible-390.png')
        for i,name in [(0,'Altes Testament'),(1,'Neues Testament')]:
            shelf=self.page.locator('.v33-shelf-scroll').nth(i);expect(shelf).to_have_attribute('aria-label',__import__('re').compile(name));shelf.focus();self.page.keyboard.press('End');shelf.evaluate('e=>e.scrollLeft=e.scrollWidth');self.assertGreater(shelf.evaluate('e=>e.scrollLeft'),0);self.assertTrue(shelf.locator('.v33-book-body').last.is_visible());self.assertGreaterEqual(shelf.locator('label').last.bounding_box()['height'],44)
        self.page.evaluate("goV17('abs');goV17('dash')");check();self.page.reload();self.page.wait_for_function('window.RangerHub?.revisionV36Ready===true');self.page.locator('.v33-dashboard').wait_for();check()
        self.page.set_viewport_size({'width':320,'height':844});self.dashboard();self.page.evaluate("document.body.style.zoom='2'");self.no_overflow()
    def test_bible_check_undo_chapters_and_exact_maximum(self):
        self.choose();rid=self.page.evaluate('session.id');self.page.set_viewport_size({'width':390,'height':844});self.dashboard()
        book=self.page.locator('[data-dashboard-book="bible-01"]');before=self.page.evaluate('RHKnowledgeModel.totals(db.knowledge||RHKnowledgeModel.initial(),session.id)')
        book.locator('input').check();self.page.wait_for_function('db.knowledge&&RHBibleModel.record(db.knowledge,session.id,"bible-01").isRead');after=self.page.evaluate('RHKnowledgeModel.totals(db.knowledge||RHKnowledgeModel.initial(),session.id)');self.assertGreater(after,before)
        self.page.locator('[data-dashboard-book="bible-01"] input').uncheck();self.page.wait_for_function('!RHBibleModel.record(db.knowledge,session.id,"bible-01").isRead');self.assertEqual(self.page.evaluate('RHKnowledgeModel.totals(db.knowledge||RHKnowledgeModel.initial(),session.id)'),before)
        self.page.evaluate('async()=>{await RangerHub.commandV35("set-bible-chapter",{bookId:"bible-01",chapter:1,isRead:true,version:RHBibleModel.record(db.knowledge,session.id,"bible-01").version});await RangerHub.refreshKnowledge()}');self.assertEqual(self.page.evaluate('RHKnowledgeModel.totals(db.knowledge||RHKnowledgeModel.initial(),session.id)'),before);expect(self.page.locator('[data-dashboard-book="bible-01"]')).to_have_class(__import__('re').compile('is-partial'))
        self.assertEqual(self.page.evaluate('RHBibleCatalog.books.length'),66);self.assertEqual(self.page.evaluate('RHBibleCatalog.books.reduce((n,b)=>n+b.chapters,0)'),1189);self.assertEqual(self.page.evaluate('RHBibleCatalog.books.reduce((n,b)=>n+b.points,0)'),240)
    def test_offline_delegation_honest_and_no_local_grant(self):
        self.choose('leaders','Admin');self.page.evaluate("goV17('leaders')");self.page.locator('[data-delegation-open]').click();expect(self.page.locator('.box')).to_contain_text('Servereinrichtung erforderlich');self.assertEqual(self.page.locator('[data-delegation-form]').count(),0);self.shot('delegation-setup-required.png');self.assertNotIn('delegation_granted',self.page.evaluate("localStorage.getItem(document.querySelector('meta[name=rangerhub-storage]').content)"))
    def test_two_devices_grant_use_and_revoke_without_login(self):
        admin=self.choose('leaders','Admin');exported=self.store();lead=next(p for p in exported['stamms']['clp-west']['leaders'] if p.get('role')=='Leiter');tokens=[secrets.token_urlsafe(36) for _ in range(2)];principals=[{'id':pid,'kind':'leaders','homeStammId':'clp-west','tokenHash':hashlib.sha256(token.encode()).hexdigest(),'expiresAt':'2099-01-01T00:00:00Z'} for pid,token in zip([admin['id'],lead['id']],tokens)]
        root=Path(__file__).resolve().parents[1];url=urlsplit(self.url)
        with tempfile.TemporaryDirectory(prefix='rh-v36-devices-') as temp:
            cfg=Path(temp)/'config.json';cfg.write_text(json.dumps({'exported':exported,'includeVerifiedKnowledge':True,'dbPath':str(Path(temp)/'db.sqlite'),'assetDirectory':str(Path(temp)/'media'),'origin':url.scheme+'://'+url.netloc,'principals':principals}));cfg.chmod(0o600)
            proc=subprocess.Popen(['node',str(root/'tests/run_editor_service_v35.mjs'),str(cfg)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);ctx=None
            try:
                line=proc.stdout.readline();self.assertTrue(line);base='http://127.0.0.1:'+str(json.loads(line)['port']);self.page.evaluate('a=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:a.url,getAccessToken:async()=>a.token}))',{'url':base,'token':tokens[0]});expect(self.page.locator('.v33-dashboard')).to_have_attribute('data-knowledge-mode','online')
                ctx=self.browser.new_context(locale='de-DE',timezone_id='Europe/Berlin');ctx.route('https://**/*',lambda r:r.abort());second=ctx.new_page();second.goto(self.url);second.wait_for_function('window.RangerHub?.revisionV36Ready===true');second.evaluate('id=>v24Choose("leaders",id)',lead['id']);second.evaluate('a=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:a.url,getAccessToken:async()=>a.token}))',{'url':base,'token':tokens[1]});expect(second.locator('.v33-dashboard')).to_have_attribute('data-knowledge-mode','online')
                self.page.evaluate('RangerHub.openDelegationV36()');form=self.page.locator('[data-delegation-form]');form.locator('[name=personId]').select_option(str(lead['id']));form.locator('[name=confirmed]').check();form.get_by_role('button',name='Vertretung einrichten').click();expect(self.page.locator('[data-active-delegations]')).to_contain_text(lead['name']);self.shot('delegation-online-desktop.png')
                second.wait_for_function('RangerHub.knowledgeActor().role==="Stammleiter"',timeout=15000);self.assertEqual(second.evaluate('v24Principal().role'),'Leiter');self.assertEqual(second.locator('[data-nav-id=delegation]').count(),0)
                second.evaluate('RangerHub.openVisualEditorV35("emblem")');expect(second.locator('.ve35-editor')).to_be_visible()
                self.page.once('dialog',lambda d:d.accept());self.page.get_by_role('button',name='Widerrufen',exact=True).click();second.wait_for_function('RangerHub.knowledgeActor().role==="Leiter"',timeout=15000);expect(second.locator('.ve35-editor')).to_have_count(0)
                self.assertEqual(second.evaluate('v24Principal().role'),'Leiter')
                second.evaluate('()=>{v24Principal().role="Admin"}')
                self.assertEqual(second.evaluate('RangerHub.knowledgeActor().role'),'Leiter');self.assertFalse(second.evaluate('v24IsAdmin()'))
                second.evaluate('()=>{v24Principal().role="Leiter"}')
                form=self.page.locator('[data-delegation-form]');form.locator('[name=personId]').select_option(str(lead['id']));form.locator('[name=scope]').select_option('global');form.locator('[name=confirmed]').check();form.get_by_role('button',name='Vertretung einrichten').click()
                expect(self.page.locator('[data-active-delegations]')).to_contain_text('Alle Stämme');second.wait_for_function('RangerHub.knowledgeActor().role==="Admin"',timeout=15000)
                self.assertTrue(second.evaluate('v24IsAdmin()'));second.evaluate('v24SwitchStamm("meppen")');second.wait_for_function('RangerHub.knowledgeActor().stammId==="meppen" && RangerHub.knowledgeActor().role==="Admin"',timeout=15000)
                self.page.once('dialog',lambda d:d.accept());self.page.get_by_role('button',name='Widerrufen',exact=True).click();second.wait_for_function('v24StammId==="clp-west" && RangerHub.knowledgeActor().role==="Leiter"',timeout=15000)
                self.assertFalse(second.evaluate('v24IsAdmin()'));self.assertEqual(second.evaluate('v24Principal().role'),'Leiter');self.assertEqual(self.errors,[])
            finally:
                if ctx:ctx.close()
                proc.terminate();proc.wait(timeout=10);proc.stdout.close();proc.stderr.close()

    def test_calendar_network_failure_keeps_event_and_route(self):
        self.choose('leaders','Admin');self.seed_calendar()
        self.page.evaluate("""async()=>{const d=await RangerHub.loadV35();RangerHub.setKnowledgeTransport({mode:'online',load:async()=>d,command:async()=>{throw Error('Netzwerkfehler-Test')},subscribe:()=>()=>{}});await RangerHub.refreshKnowledge()}""")
        before=self.page.evaluate('JSON.stringify({meetings:db.meetings,view,calY,calM})')
        self.page.once('dialog',lambda d:d.accept());self.page.evaluate('deleteMeetingV15(99101)')
        self.assertEqual(before,self.page.evaluate('JSON.stringify({meetings:db.meetings,view,calY,calM})'));expect(self.page.locator('body')).to_contain_text('Termin nicht gelöscht')
    def test_long_contacts_ordinary_leader_permissions_and_card_body(self):
        self.choose('leaders','Leiter');self.page.evaluate("goV17('leaders')")
        own=self.page.evaluate('session.id')
        for card in self.page.locator('.mc36-card').all():
            is_own=card.get_attribute('data-member-id')==str(own)
            self.assertEqual(card.locator('[data-card-edit]').count(),int(is_own));self.assertEqual(card.locator('[data-card-end]').count(),0)
        self.choose('leaders','Admin');self.page.evaluate("goV17('leaders');db.leaders[0].name='Sehr langer Name '.repeat(12);db.leaders[0].email='sehrlangeadresse'.repeat(12)+'@test.invalid';leaders()")
        for width in WIDTHS:
            self.page.set_viewport_size({'width':width,'height':900});self.no_overflow()
        self.page.locator('.mc36-card').first.locator('h3').click();expect(self.page.locator('.modal')).to_have_class(__import__('re').compile('show'));self.page.evaluate('closeM()')


    def test_calendar_birthdays_hide_inactive_without_mutating_profiles(self):
        self.choose('leaders','Admin')
        self.page.evaluate("""()=>{const p=db.rangers[0];p.name='Pause Geburtstag Test';p.birthday='2010-'+RangerHub.localDate().slice(5);p.active=false;v24Persist();goV17('calendar')}""")
        self.assertEqual(self.page.locator('.event.bday').filter(has_text='Pause Geburtstag Test').count(),0)
        self.assertTrue(self.page.evaluate("db.rangers.some(p=>p.name==='Pause Geburtstag Test')"))
        self.assertFalse(self.page.evaluate("db.rangers.find(p=>p.name==='Pause Geburtstag Test').active"))


def load_tests(loader,tests,pattern):
    return loader.suiteClass(V36Tests(n) for n in V36Tests.__dict__ if n.startswith('test_'))
