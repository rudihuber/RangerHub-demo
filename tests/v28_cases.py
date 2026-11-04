"""V28 browser behaviour. Every profile and message lives in temporary test storage."""
from pathlib import Path
import re
from playwright.sync_api import expect
from v27_cases import V27Cases


class V28Cases:
    external = V27Cases.external
    leader = V27Cases.leader
    ranger = V27Cases.ranger
    add_meeting = V27Cases.add_meeting
    form = V27Cases.form

    def setUp(self):
        V27Cases.setUp(self)
        self.page.wait_for_function('window.RangerHub?.messagesReady === true')

    def question(self, subject='Knoten üben', text='Wie kann ich den Knoten weiter üben?'):
        self.page.evaluate("goV17('messages')")
        self.page.get_by_role('button',name='+ Frage stellen',exact=True).click()
        form=self.page.locator('[data-new-question]')
        form.locator('[name=topic]').select_option('Wachstumspfad')
        form.locator('[name=subject]').fill(subject)
        form.locator('[name=text]').fill(text)
        form.get_by_role('button',name='Frage in der Demo speichern',exact=True).click()
        expect(self.page.locator('[data-message-reply]')).to_be_visible()
        return self.page.locator('[data-message-surface]').get_attribute('data-chat-thread')

    def test_nature_and_action_catalogs_are_additive_complete_and_private(self):
        self.leader()
        result=self.page.evaluate("() => Object.values(v24Store.stamms).map(s=>({nature:s.natureLibrary.length,spiders:s.natureLibrary.filter(n=>n.title==='Spinne').length,actions:s.actionLibrary.filter(a=>a.sourceV28).length,impulses:s.actionLibrary.flatMap(a=>a.impulseSuggestions||[]).length,complete:s.natureLibrary.every(n=>n.fact&&n.creation&&n.verse&&n.question)}))")
        for r in result:
            self.assertEqual(r['nature'],28);self.assertEqual(r['spiders'],1);self.assertEqual(r['actions'],22);self.assertGreaterEqual(r['impulses'],22);self.assertTrue(r['complete'])
        before=self.page.evaluate('JSON.stringify(db.natureLibrary)')
        self.page.reload();self.page.wait_for_function('window.RangerHub?.messagesReady')
        self.assertEqual(self.page.evaluate('JSON.stringify(db.natureLibrary)'),before)
        self.page.evaluate("goV17('nature')")
        self.page.locator('.v28-search input').fill('Regenbogen')
        expect(self.page.locator('[data-nature-id]:visible')).to_have_count(1)
        self.page.locator('[data-nature-id]:visible summary').click()
        expect(self.page.locator('[data-nature-id]:visible')).to_contain_text('Gottes Bund')

    def test_nature_picker_saves_snapshot_and_required_leader_is_not_invented(self):
        self.leader();form,mid=self.form()
        form.locator('[name=natureMode]').select_option('planned')
        form.locator('#v28-nature-library').select_option('v28-nature-regenbogen')
        expect(form.locator('[name=natureTitle]')).to_have_value('Regenbogen')
        expect(form.locator('[name=natureDescription]')).to_have_value(re.compile('gebrochen'))
        expect(form.locator('[data-planning-preview]')).to_contain_text('Leitung für Naturphänomen')
        form.locator('[name=natureLeader]').select_option(str(self.session()['id']))
        form.get_by_role('button',name='Planung speichern',exact=True).click()
        stored=self.page.evaluate('id=>db.meetings.find(m=>m.id===id).nature',mid)
        self.assertEqual(stored['libraryId'],'v28-nature-regenbogen')
        self.page.evaluate("() => {db.natureLibrary.find(n=>n.id==='v28-nature-regenbogen').fact='Neue Bibliotheksnotiz';v24Persist()}")
        self.assertEqual(self.page.evaluate('id=>db.meetings.find(m=>m.id===id).nature.description',mid),stored['description'])

    def test_nature_library_plan_into_existing_meeting_and_dirty_guard(self):
        self.leader();mid=self.add_meeting(5,title='Bestehender Termin')
        self.page.evaluate("goV17('nature');RangerHub.planLibraryItem('nature','v28-nature-eule')")
        self.page.locator('#v28-plan-choice [name=meeting]').select_option(str(mid))
        self.page.get_by_role('button',name='Planung öffnen',exact=True).click()
        form=self.page.locator('#meeting-planning-form')
        expect(form.locator('[name=theme]')).to_have_value('Bestehender Termin')
        expect(form.locator('[name=natureTitle]')).to_have_value('Eule')
        self.page.locator('[data-v28-modal-back]').click()
        expect(self.page.locator('#v27-unsaved')).to_be_visible()
        self.page.get_by_role('button',name='Änderungen verwerfen',exact=True).click()
        self.assertNotEqual(self.page.evaluate('id=>db.meetings.find(m=>m.id===id).nature.title',mid),'Eule')

    def test_nature_edit_permissions_and_stamm_separation(self):
        self.leader('Leiter');self.page.evaluate("goV17('nature');RangerHub.editNature('v28-nature-schaf')")
        f=self.page.locator('#v28-nature-form');f.locator('[name=fact]').fill('Eigene beobachtete Besonderheit des Schafes')
        f.get_by_role('button',name='Speichern',exact=True).click()
        self.assertIn('Eigene beobachtete',self.page.evaluate("db.natureLibrary.find(n=>n.id==='v28-nature-schaf').fact"))
        self.leader();self.page.evaluate("v24SwitchStamm('meppen')")
        self.assertNotIn('Eigene beobachtete',self.page.evaluate("db.natureLibrary.find(n=>n.id==='v28-nature-schaf').fact"))
        self.page.evaluate("v24SwitchStamm('clp-west')");self.ranger();before=self.state()
        self.page.evaluate("nature();RangerHub.editNature('v28-nature-schaf');RangerHub.planLibraryItem('nature','v28-nature-schaf');goV17('impulses')")
        self.assertEqual(before,self.state());expect(self.page.locator('#v28-nature-form')).not_to_be_visible()
        self.assertFalse(self.page.evaluate("modal.classList.contains('show')"))

    def test_action_linked_impulse_can_be_selected_and_customized(self):
        self.leader();form,mid=self.form()
        aid=self.page.evaluate("db.actionLibrary.find(a=>a.sourceV28==='v28-action-schwedenstuhl').id")
        form.locator('[name=libraryAction]').select_option(str(aid))
        expect(form.locator('#v28-impulse-suggestion')).to_contain_text('Durchhalten bis zum Ziel')
        form.locator('[name=impulseMode]').select_option('planned')
        form.locator('#v28-impulse-suggestion').select_option('v28-impulse-schwedenstuhl')
        expect(form.locator('[name=impulseDescription]')).to_have_value(re.compile('Hebräer'))
        form.locator('[name=impulseLeader]').select_option(str(self.session()['id']))
        form.locator('[name=impulseDescription]').fill('Eigener angepasster Impuls zum Durchhalten')
        form.get_by_role('button',name='Planung speichern',exact=True).click()
        self.page.reload();self.page.wait_for_function('window.RangerHub?.messagesReady')
        self.assertEqual(self.page.evaluate('id=>db.meetings.find(m=>m.id===id).impulse.description',mid),'Eigener angepasster Impuls zum Durchhalten')

    def test_action_and_impulse_planning_does_not_create_fictitious_dates(self):
        self.leader();before=self.page.evaluate('db.meetings.length')
        self.page.evaluate("goV17('activities');RangerHub.planLibraryItem('impulse','v28-impulse-epheser-pizza')")
        self.page.get_by_role('button',name='Planung öffnen',exact=True).click()
        f=self.page.locator('#meeting-planning-form')
        expect(f.locator('[name=actionTitle]')).to_have_value('Pizzaabend mit Epheserbrief')
        expect(f.locator('[name=impulseTitle]')).to_have_value('Nicht nur für uns selbst beten')
        self.assertEqual(self.page.evaluate('db.meetings.length'),before)
        self.assertEqual(f.locator('[name=date]').input_value(),'')

    def test_untouched_form_is_not_marked_dirty_by_new_picker_controls(self):
        self.leader();form,_=self.form()
        self.page.locator('[data-v28-modal-back]').click()
        expect(self.page.locator('#v27-unsaved')).to_have_count(0)
        expect(form).not_to_be_visible()

    def test_previous_ranger_profile_and_team_screen_can_be_restored(self):
        self.leader();pid=self.page.evaluate('db.rangers[0].id')
        self.page.evaluate("goV17('rangers')");self.page.evaluate('id=>v24RangerProfile(id)',pid)
        profile_name=self.page.evaluate('id=>db.rangers.find(p=>p.id===id).name',pid)
        self.page.evaluate('id=>observerTasks(id)',pid)
        self.page.locator('[data-v28-back]').click()
        expect(self.page.locator('#main')).to_contain_text(profile_name)
        expect(self.page.locator('.v24-rangerHero')).to_have_count(1)
        self.page.locator('[data-v28-back]').click()
        expect(self.page.locator('.v24-rangerGrid')).to_have_count(1)

    def test_same_browser_tabs_receive_replies_without_losing_a_draft(self):
        self.ranger();tid=self.question('Frage aus einem zweiten Tab')
        self.page.locator('[data-message-reply] textarea').fill('Entwurf einer Rückfrage')
        second=self.context.new_page();second.on('pageerror',lambda e:self.errors.append(str(e)))
        second.goto(self.url);second.wait_for_function('window.RangerHub?.messagesReady')
        second.evaluate("v24Choose('leaders',db.leaders.find(p=>p.role==='Leiter')?.id||db.leaders[0].id);goV17('messages')")
        second.locator(f'[data-thread-id="{tid}"]').click()
        second.locator('[data-message-reply] textarea').fill('Antwort aus dem Leiter-Tab')
        second.locator('[data-message-reply] button').click()
        expect(self.page.locator('.rh-chat-conversation')).to_contain_text('Antwort aus dem Leiter-Tab')
        expect(self.page.locator('[data-message-reply] textarea')).to_have_value('Entwurf einer Rückfrage')
        second.close()

    def test_v27_upgrade_keeps_existing_people_progress_and_library_edits(self):
        file='RangerHub_Webapp_V27_Kompakt.html' if 'Kompakt' in self.url else 'RangerHub_Webapp_V27_Demo.html'
        self.page.goto(self.url.rsplit('/',1)[0]+'/'+file);self.page.wait_for_function('window.RangerHub?.v27Ready')
        self.page.evaluate('() => {localStorage.clear();sessionStorage.clear()}')
        self.page.reload();self.page.wait_for_function('window.RangerHub?.v27Ready');self.leader()
        self.page.evaluate("""() => {const a=db.actionLibrary.find(a=>a.title.toLowerCase()==='schwedenstuhl bauen');a.description='';a.category='';db.natureLibrary=[{id:'own-schaf',title:'Schaf',fact:'Eigene Notiz bleibt erhalten',creation:'Eigener Gedanke'}];db.upgradeSentinel={keep:['original',28]};v24Persist()}""")
        before=self.state();saved=self.session()
        self.page.goto(self.url);self.page.wait_for_function('window.RangerHub?.messagesReady')
        after=self.state()
        def compare(old,new,path='store'):
            if isinstance(old,dict):
                self.assertTrue(old.keys()<=new.keys(),path)
                for k,v in old.items():compare(v,new[k],path+'.'+k)
            elif isinstance(old,list):
                if path.endswith(('.actionLibrary','.natureLibrary','.impulseSuggestions')):self.assertGreaterEqual(len(new),len(old),path)
                else:self.assertEqual(len(new),len(old),path)
                for i,v in enumerate(old):compare(v,new[i],path+f'[{i}]')
            else:self.assertEqual(old,new,path)
        compare(before,after);self.assertEqual(saved,self.session())
        self.assertEqual(self.page.evaluate("db.natureLibrary.filter(n=>n.title==='Schaf').length"),1)


    def test_chat_question_reply_bold_status_checkmark_and_read_receipts(self):
        self.ranger();tid=self.question()
        expect(self.page.locator('.rh-chat-mode')).to_contain_text('nur in diesem Browserprofil')
        self.leader('Leiter');self.page.evaluate("goV17('messages')")
        row=self.page.locator(f'[data-thread-id="{tid}"]');expect(row).to_have_class(re.compile('is-unread'))
        row.click();self.page.locator('[data-message-surface] [data-chat-back]').click()
        expect(row).to_have_class(re.compile('is-unread'))
        row.click();f=self.page.locator('[data-message-reply]');f.locator('textarea').fill('Wir üben beim nächsten Treffen gemeinsam.')
        f.get_by_role('button',name='Antwort in der Demo speichern',exact=True).click()
        self.page.locator('[data-message-surface] [data-chat-back]').click()
        expect(row).to_have_class(re.compile('is-answered'));expect(row).not_to_have_class(re.compile('is-unread'))
        expect(row).to_contain_text('Beantwortet');expect(row.locator('.rh-thread-symbol svg')).to_have_count(1)
        self.ranger();self.page.evaluate("goV17('messages')")
        expect(row).to_have_class(re.compile('is-unread'));row.click()
        expect(self.page.locator('.rh-chat-conversation')).to_contain_text('Wir üben beim nächsten Treffen gemeinsam.')
        self.page.locator('[data-chat-back]').click();expect(row).not_to_have_class(re.compile('is-unread'))

    def test_chat_own_ranger_only_and_cross_stamm_protection(self):
        first=self.ranger();tid=self.question('Meine persönliche Frage')
        self.page.evaluate("id=>v24Choose('rangers',db.rangers.find(p=>p.id!==id&&!p.archived).id)",first)
        self.page.evaluate("goV17('messages')");expect(self.page.locator('[data-thread-id]')).to_have_count(0)
        result=self.page.evaluate("async id=>{const t=RangerHub.createLocalMessagesTransport();try{await t.reply(id,{text:'Unberechtigte Antwort'});return false}catch{return true}}",tid)
        self.assertTrue(result)
        self.leader();self.page.evaluate("v24SwitchStamm('meppen');goV17('messages')")
        expect(self.page.locator('[data-thread-id]')).to_have_count(0)
        self.page.evaluate("v24SwitchStamm('clp-west');goV17('messages')");expect(self.page.locator('[data-thread-id]')).to_have_count(1)

    def test_chat_followup_reopens_question_and_survives_reload(self):
        self.ranger();tid=self.question('Rückfrage')
        self.leader('Leiter');self.page.evaluate("goV17('messages')");self.page.locator(f'[data-thread-id="{tid}"]').click()
        self.page.locator('[data-message-reply] textarea').fill('Erste Antwort');self.page.locator('[data-message-reply] button').click()
        self.ranger();self.page.evaluate("goV17('messages')");self.page.locator(f'[data-thread-id="{tid}"]').click()
        self.page.locator('[data-message-reply] textarea').fill('Danke, noch eine Frage dazu.');self.page.locator('[data-message-reply] button').click()
        self.page.reload();self.page.wait_for_function('window.RangerHub?.messagesReady');self.leader('Leiter');self.page.evaluate("goV17('messages')")
        row=self.page.locator(f'[data-thread-id="{tid}"]');expect(row).to_have_class(re.compile('is-unread'));expect(row).to_contain_text('Antwort offen')

    def test_chat_quota_errors_do_not_claim_delivery_or_erase_data(self):
        self.ranger();self.page.evaluate("goV17('messages')")
        self.page.get_by_role('button',name='+ Frage stellen',exact=True).click();f=self.page.locator('[data-new-question]')
        f.locator('[name=topic]').select_option('Sonstiges');f.locator('[name=text]').fill('Darf nicht verschwinden')
        before=self.state()
        self.page.evaluate("() => {window.v28SetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('full','QuotaExceededError')}}")
        f.locator('button').click();expect(self.page.locator('[data-chat-feedback]')).to_contain_text('nicht gespeichert')
        self.assertEqual(self.state(),before);expect(f.locator('textarea')).to_have_value('Darf nicht verschwinden')
        self.page.evaluate('() => {Storage.prototype.setItem=window.v28SetItem}')

    def test_chat_text_is_escaped_and_push_is_only_prepared(self):
        self.ranger();payload='<img src=x onerror="window.v28Xss=true">'
        self.question('Keine HTML-Ausführung',payload)
        expect(self.page.locator('.rh-message p')).to_have_text(payload)
        expect(self.page.locator('.rh-message img')).to_have_count(0)
        self.assertFalse(self.page.evaluate('!!window.v28Xss'))
        self.assertEqual(self.page.evaluate('RangerHub.messagesTransportMode()'),'demo')
        push=self.page.evaluate("RangerHub.messagePushPayload({type:'leader-replied',threadId:'test',stammId:'clp-west'})")
        self.assertNotIn(payload,str(push));self.assertIn('geantwortet',push['title'])
        self.assertFalse(any('/messages' in u and '127.0.0.1' not in u for u in self.requests))

    def test_prepared_http_adapter_uses_personal_token_and_rejects_forbidden(self):
        self.ranger();seen=[]
        def api(route):
            req=route.request;seen.append({'url':req.url,'headers':req.headers,'body':req.post_data_json if req.post_data else None})
            if '/blocked/' in req.url:route.fulfill(status=403,json={'error':'forbidden'})
            else:route.fulfill(json={'threads':[]})
        self.page.route('https://messages.example.test/**',api)
        out=self.page.evaluate("""async()=>{const t=RangerHub.createHttpMessagesTransport({baseURL:'https://messages.example.test/api',getAccessToken:async()=>'test-only-token'});await t.list();await t.create({topic:'Sonstiges',subject:'Test',text:'Frage',kind:'leaders',role:'Admin'});try{await t.reply('blocked',{text:'Antwort'});return ''}catch(e){return e.message}}""")
        self.assertIn('keinen Zugriff',out);self.assertEqual(seen[0]['headers']['authorization'],'Bearer test-only-token')
        self.assertEqual(set(seen[1]['body']),{'topic','subject','text'})
        self.assertTrue(all('stammId=clp-west' in r['url'] for r in seen))

    def test_icons_growth_alignment_back_controls_and_screenshots(self):
        version=self.page.locator('meta[name=rangerhub-version]').get_attribute('content') or '28'
        out=Path(__file__).resolve().parents[1]/f'docs/screenshots/v{version}';out.mkdir(parents=True,exist_ok=True)
        self.leader('Leiter')
        for width,height in [(1440,900),(1920,1080),(1366,768),(768,1024),(390,844),(375,812),(320,568),(844,390)]:
            with self.subTest(width=width,height=height):
                self.page.set_viewport_size({'width':width,'height':height});self.page.evaluate("goV17('path')")
                labels=self.page.evaluate("[...document.querySelectorAll('.growth-art-label')].map(e=>({left:e.getBoundingClientRect().left,font:parseFloat(getComputedStyle(e.querySelector('h2')).fontSize)}))")
                self.assertLess(max(l['left'] for l in labels)-min(l['left'] for l in labels),1)
                self.assertTrue(all(l['font']>=18 for l in labels))
                self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
                self.page.evaluate("document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)")
                if width in [1440,390,320]:self.page.screenshot(path=str(out/f'growth-{width}x{height}.png'),full_page=True)
        self.page.set_viewport_size({'width':1440,'height':900});self.page.evaluate("goV17('dash')")
        for name in ['Dashboard','Kalender','Wachstumspfad','Nachrichten']:
            expect(self.page.locator('.nav').get_by_role('button',name=name,exact=True).locator('.rh-nav-icon')).to_have_count(1)
        self.page.screenshot(path=str(out/'leader-dashboard-icons.png'),full_page=True)

    def test_touch_back_and_chat_at_small_phone_sizes(self):
        old=self.page
        for width,height in [(320,568),(390,844)]:
            ctx=self.browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,locale='de-DE',timezone_id='Europe/Berlin');ctx.route('https://**/*',self.external)
            try:
                self.page=ctx.new_page();self.page.set_default_timeout(10000);self.page.on('pageerror',lambda e:self.errors.append(str(e)))
                self.page.goto(self.url);self.page.wait_for_function('window.RangerHub?.messagesReady')
                self.leader();f,_=self.form();f.locator('[name=theme]').fill('Mobile Planung')
                self.page.locator('[data-v28-modal-back]').tap();expect(self.page.locator('#v27-unsaved')).to_be_visible()
                self.page.get_by_role('button',name='Änderungen verwerfen',exact=True).tap()
                self.ranger();self.page.wait_for_timeout(100);self.page.locator('[data-chat-toggle]').tap()
                self.page.locator('#rangerhub-chat').get_by_role('button',name='+ Frage stellen',exact=True).tap()
                f=self.page.locator('#rangerhub-chat [data-new-question]');f.locator('select').select_option('Rangertreffen');f.locator('textarea').fill('Was muss ich mitbringen?')
                f.locator('button').tap();expect(self.page.locator('#rangerhub-chat [data-message-reply]')).to_be_visible()
                self.page.get_by_role('button',name='Chat schließen',exact=True).tap()
                self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
            finally:ctx.close();self.page=old

