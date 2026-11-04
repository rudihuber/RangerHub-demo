"""Fachwissen workflows in a real browser; all identities/storage are temporary."""
import json
from pathlib import Path
from playwright.sync_api import expect
from v27_cases import V27Cases

T='fw-B-01-p132'

class V29Cases:
    external=V27Cases.external
    leader=V27Cases.leader
    ranger=V27Cases.ranger

    def setUp(self):
        V27Cases.setUp(self)
        self.page.wait_for_function('window.RangerHub?.knowledgeReady === true')

    def kw(self,type,payload):
        return self.page.evaluate('async v=>{try{await RangerHub.createLocalKnowledgeTransport().command(v.type,v.payload);return {ok:true};}catch(e){return {ok:false,error:e.message};}}',{'type':type,'payload':payload})

    def snapshot(self):
        return self.page.evaluate('RangerHub.createLocalKnowledgeTransport().load()')

    def choose(self,index=0):
        rid=self.page.evaluate("i=>{const p=db.rangers.filter(p=>!p.archived&&p.active!==false&&p.knowledgeEligible!==false)[i];v24Choose('rangers',p.id);return p.id;}",index)
        self.page.locator('[data-knowledge-dashboard] .kw-score-strip').wait_for()
        return rid

    def knowledge(self):
        self.page.evaluate("goV17('knowledge')")
        self.page.locator('.kw-map').wait_for()

    def task(self,tid=T):
        self.page.evaluate('id=>RangerHub.openKnowledge("task",id)',tid)
        self.page.locator('#rh-knowledge-sheet').wait_for()

    def submit(self,text='Sternbilder mit der Leitung gezeigt.',tid=T):
        return self.kw('submit',{'taskId':tid,'text':text,'evidenceType':'oral','consent':True})

    def approve(self,rid,tid=T):
        return self.kw('review',{'taskId':tid,'rangerId':rid,'approved':True,'comment':'Persönlich geprüft.'})

    def test_catalog_has_all_source_paragraphs_points_and_exact_examples(self):
        x=self.page.evaluate('RangerHubKnowledgeCatalog')
        self.assertEqual(x['stats'],{'categories':3,'topics':36,'tasks':253,'sourceParagraphs':302,'pointMentions':250})
        self.assertEqual(len(x['pointAudit']),250);self.assertEqual(len(x['issues']),4)
        for topic,text,value in [('Astronomie','sieben Sternbilder',5),('Die Bibel','66 Bücher',4),('Erste Hilfe','Erste-Hilfe-Kurs',20),('Angeln','Angelschein',30),('Kochen','Wähle ein Kochrezept aus, beispielsweise',2)]:
            t=next(t for t in x['tasks'] if t['sourceTopic']==topic and text in t['originalText']);self.assertEqual(t['points'],value)
        guests=next(t for t in x['tasks'] if t['id']=='fw-A-05-p046')
        self.assertEqual(len(guests['subItems']),8);self.assertEqual(guests['points'],5)
        fitness=next(t for t in x['tasks'] if t['id']=='fw-C-01-p275')
        self.assertIsNone(fitness['points']);self.assertEqual(fitness['pointOptions'][0]['points'],8)
        source=json.loads((Path(__file__).resolve().parents[1]/'data/RangerHub_Fachwissen_Quellkatalog.json').read_text())
        for c in source['categories']:
            for topic in c['topics']:
                related=[t for t in x['tasks'] if t['topicId']==topic['id']]
                actual='\n'.join(t['originalText']+'\n'+'\n'.join(t['subItems']) for t in related)
                notes=next(t['notes'] for t in x['topics'] if t['id']==topic['id'])
                for p in topic['sourceParagraphs']:
                    self.assertTrue(p['text'] in actual or any(n['text']==p['text'] for n in notes),p['sourceParagraphIndex'])

    def test_progressive_disclosure_and_back_keyboard(self):
        self.choose();self.knowledge();expect(self.page.locator('.kw-map-pin')).to_have_count(6)
        expect(self.page.locator('.kw-task-row')).to_have_count(0);expect(self.page.locator('.kw-topic-row')).to_have_count(0)
        self.page.get_by_role('button',name='Entdeckerland öffnen',exact=False).click()
        expect(self.page.locator('.kw-topic-row')).to_have_count(6);expect(self.page.locator('.kw-task-row')).to_have_count(0)
        self.page.locator('[data-kw-action=topic][data-kw-value=B-01]').focus();self.page.keyboard.press('Enter')
        expect(self.page.locator('.kw-task-row')).to_have_count(8)
        self.page.locator('.kw-task-row').first.click();expect(self.page.locator('.kw-original')).to_contain_text('Zeige sieben Sternbilder')
        self.page.keyboard.press('Escape');expect(self.page.locator('.kw-task-row')).to_have_count(8)
        self.page.keyboard.press('Escape');expect(self.page.locator('.kw-topic-row')).to_have_count(6)
        self.page.keyboard.press('Escape');expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0)
        expect(self.page.get_by_role('button',name='Entdeckerland öffnen',exact=False)).to_be_focused()

    def test_submit_review_updates_own_dashboard_and_ranking_from_single_credit(self):
        rid=self.choose();self.knowledge();self.task()
        self.page.locator('[data-kw-action=start]').click();expect(self.page.locator('.kw-task-meta')).to_contain_text('In Arbeit')
        form=self.page.locator('[data-kw-form=submit]');form.locator('[name=text]').fill('Die sieben Sternbilder persönlich gezeigt.')
        form.locator('[name=consent]').check();form.get_by_role('button',name='Ergebnis einreichen',exact=True).click()
        expect(self.page.locator('.kw-task-meta')).to_contain_text('Zur Prüfung eingereicht')
        self.assertEqual(self.snapshot()['ranking'][0]['points'],0)
        self.leader('Leiter');self.page.locator('[data-kw-action=reviews]').click()
        self.page.locator('[data-kw-action=review-task]').first.click()
        self.page.locator('[data-kw-form=review] [name=comment]').fill('Unter freiem Himmel vorgeführt.')
        self.page.get_by_role('button',name='Bestätigen · 5 Punkte',exact=True).click()
        expect(self.page.locator('.kw-task-meta')).to_contain_text('Bestätigt')
        self.choose();own=next(r for r in self.snapshot()['ranking'] if r['id']==rid);self.assertEqual((own['points'],own['rank']),(5,1))
        expect(self.page.locator('[data-knowledge-dashboard] .kw-own-rank')).to_contain_text('#1')
        self.task();expect(self.page.locator('.kw-history').first).to_contain_text('Dein eingereichter Nachweis')
        self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeReady');expect(self.page.locator('[data-knowledge-dashboard] .kw-own-rank')).to_contain_text('5 Punkte')

    def test_ranger_cannot_approve_change_points_or_submit_for_other_ranger(self):
        rid=self.choose();others=[p['id'] for p in self.snapshot()['people'] if p['id']!=rid]
        for type,payload in [('review',{'taskId':T,'rangerId':rid,'approved':True}),('resolve',{'taskId':'fw-A-06-p078','points':99,'source':'x','reason':'x'}),('submit',{'taskId':T,'rangerId':others[0],'text':'x','consent':True,'evidenceType':'text'})]:
            self.assertFalse(self.kw(type,payload)['ok'])
        self.assertTrue(all(r['points']==0 for r in self.snapshot()['ranking']))

    def test_duplicate_approvals_and_reversal_are_exactly_once(self):
        rid=self.choose();self.submit();self.leader();self.assertTrue(self.approve(rid)['ok']);self.assertTrue(self.approve(rid)['ok'])
        self.assertEqual(len(self.snapshot()['ledger']),1)
        self.assertFalse(self.kw('revoke',{'taskId':T,'rangerId':rid,'reason':''})['ok'])
        self.assertTrue(self.kw('revoke',{'taskId':T,'rangerId':rid,'reason':'Nachweis ergänzen.'})['ok'])
        self.assertEqual(next(r for r in self.snapshot()['ranking'] if r['id']==rid)['points'],0)
        self.assertFalse(self.kw('revoke',{'taskId':T,'rangerId':rid,'reason':'Nochmals.'})['ok'])
        self.assertEqual([e['points'] for e in self.snapshot()['ledger']],[5,-5])

    def test_unknown_points_and_source_resolution_are_auditable(self):
        tid='fw-A-06-p078';rid=self.choose();self.submit(tid=tid);self.leader();self.assertFalse(self.approve(rid,tid)['ok'])
        self.assertTrue(self.kw('resolve',{'taskId':tid,'points':2,'source':'Fachleitung, Quellenblatt 9','reason':'Geprüfte Quellenklärung im Test.'})['ok'])
        self.assertTrue(self.approve(rid,tid)['ok']);e=self.snapshot()['ledger'][0]
        self.assertIsNone(e['sourcePoints']);self.assertEqual(e['points'],2);self.assertEqual(e['resolution']['source'],'Fachleitung, Quellenblatt 9')

    def test_clearance_policy_safety_and_private_evidence(self):
        a=self.choose();b=self.page.evaluate('db.rangers.filter(p=>!p.archived)[1].id')
        t=self.page.evaluate("RangerHubKnowledgeCatalog.tasks.find(t=>t.sourceTopic==='Feuerbohren').id")
        self.assertFalse(self.kw('start',{'taskId':t})['ok']);self.leader()
        self.assertTrue(self.kw('policy',{'taskId':t,'rangerId':a,'eligible':True,'reason':'Unter Aufsicht der Leitung im gesicherten Bereich.'})['ok'])
        self.choose();self.assertTrue(self.kw('start',{'taskId':t})['ok']);self.submit('Persönlicher Nachweis, nicht für andere Ranger.')
        self.choose(1);snap=self.snapshot();self.assertFalse(snap['progress']);self.assertFalse(snap['ledger'])
        self.assertNotIn('Unter Aufsicht',json.dumps(snap['policies']))

    def test_challenge_invitation_acceptance_progress_and_confirmed_draw(self):
        a=self.choose();b=self.page.evaluate('db.rangers.filter(p=>!p.archived)[1].id');self.leader()
        for rid in [a,b]:self.assertTrue(self.kw('policy',{'taskId':T,'rangerId':rid,'eligible':True,'reason':'Eignung geprüft.'})['ok'])
        self.choose();self.knowledge();self.task();self.page.locator('[data-kw-action=invite-form]').click()
        f=self.page.locator('[data-kw-form=invite]');f.locator('[name=targetId]').select_option(str(b));f.get_by_role('button',name='Einladung speichern').click()
        self.page.wait_for_function("db.knowledge?.challenges.length===1")
        self.choose(1);self.page.locator('[data-kw-action=arena]').click();self.page.get_by_role('button',name='Annehmen',exact=True).click()
        expect(self.page.locator('.kw-duel')).to_contain_text('Gemeinsam unterwegs')
        self.submit();self.choose();self.submit();self.leader();self.approve(a);self.approve(b)
        c=self.snapshot()['challenges'][0];self.assertEqual(c['status'],'finished');self.assertIsNone(c['result']['winner'])
        self.assertEqual(c['playerStatuses'][str(a)],'approved')
        self.assertEqual([r['points'] for r in self.snapshot()['ranking'] if r['points']>0],[5,5])

    def test_challenge_decline_cancel_and_spam_guard(self):
        from datetime import datetime,timedelta,timezone
        a=self.choose();b=self.page.evaluate('db.rangers.filter(p=>!p.archived)[1].id');self.leader()
        for rid in [a,b]:self.kw('policy',{'taskId':T,'rangerId':rid,'eligible':True,'reason':'Geprüft.'})
        self.choose();payload={'taskId':T,'targetId':b,'deadline':(datetime.now(timezone.utc)+timedelta(days=7)).isoformat()}
        self.assertTrue(self.kw('invite',payload)['ok']);self.assertFalse(self.kw('invite',payload)['ok'])
        c=self.snapshot()['challenges'][0];self.choose(1);self.assertTrue(self.kw('respond',{'challengeId':c['id'],'accept':False})['ok'])
        self.assertEqual(self.snapshot()['challenges'][0]['status'],'declined');self.assertTrue(all(r['points']==0 for r in self.snapshot()['ranking']))
        self.choose();self.kw('invite',payload);c=self.snapshot()['challenges'][1];self.assertTrue(self.kw('cancel',{'challengeId':c['id']})['ok'])

    def test_active_members_ties_and_stamm_switch_preserve_scope(self):
        a=self.choose();self.submit();b=self.choose(1);self.submit();self.leader()
        self.approve(a);self.approve(b);snap=self.snapshot();self.assertEqual([r['rank'] for r in snap['ranking'] if r['points']>0],[1,1])
        self.page.evaluate("v24SwitchStamm('meppen')");snap=self.snapshot();self.assertTrue(all(r['points']==0 for r in snap['ranking']));self.assertEqual(snap['progress'],{})
        self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeReady');self.assertEqual(self.snapshot()['progress'],{})
        self.page.evaluate("v24SwitchStamm('clp-west')");self.assertEqual(len(self.snapshot()['ledger']),2)

    def test_import_idempotence_does_not_change_any_existing_people_or_growth(self):
        rid=self.choose();before=self.page.evaluate("JSON.stringify({r:db.rangers,l:db.leaders,m:db.meetings,p:db.stageProgress,b:db.observerBonus,s:v24Store.shared})")
        self.submit();self.leader();self.approve(rid)
        self.assertEqual(before,self.page.evaluate("JSON.stringify({r:db.rangers,l:db.leaders,m:db.meetings,p:db.stageProgress,b:db.observerBonus,s:v24Store.shared})"))
        self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeReady');self.assertEqual(len(self.snapshot()['ledger']),1)
        self.assertEqual(before,self.page.evaluate("JSON.stringify({r:db.rangers,l:db.leaders,m:db.meetings,p:db.stageProgress,b:db.observerBonus,s:v24Store.shared})"))

    def test_existing_action_save_cannot_overwrite_other_tab_knowledge(self):
        rid=self.choose();other=self.context.new_page();other.goto(self.url);other.wait_for_function('window.RangerHub?.knowledgeReady')
        other.evaluate("v24Choose('leaders',db.leaders.find(p=>p.role==='Admin').id)")
        self.submit();other.evaluate('async v=>RangerHub.createLocalKnowledgeTransport().command("review",v)',{'taskId':T,'rangerId':rid,'approved':True})
        self.page.wait_for_function('db.knowledge?.ledger.length===1')
        self.page.evaluate("db.weatherPlace='Cloppenburg';v24Persist()")
        self.assertEqual(next(r for r in self.snapshot()['ranking'] if r['id']==rid)['points'],5)

    def test_two_tabs_simultaneous_local_reviews_are_serialized(self):
        rid=self.choose();self.submit();self.leader();other=self.context.new_page();other.goto(self.url);other.wait_for_function('window.RangerHub?.knowledgeReady')
        other.evaluate("v24Choose('leaders',db.leaders.find(p=>p.role==='Admin').id)")
        payload={'taskId':T,'rangerId':rid,'approved':True}
        self.page.evaluate('v=>{window.kwPending=RangerHub.createLocalKnowledgeTransport().command("review",v)}',payload)
        other.evaluate('v=>RangerHub.createLocalKnowledgeTransport().command("review",v)',payload)
        self.page.evaluate('kwPending');self.assertEqual(len(self.snapshot()['ledger']),1)

    def test_quota_failure_preserves_storage_and_reports_failure(self):
        self.choose();before=self.state()
        self.page.evaluate("() => {window.kwSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError')}}")
        try:self.assertFalse(self.submit()['ok'])
        finally:self.page.evaluate('() => {Storage.prototype.setItem=window.kwSetItem}')
        self.assertEqual(self.state(),before)

    def test_text_is_escaped_and_no_sensitive_uploads_are_published(self):
        rid=self.choose();self.submit('<img src=x onerror="window.kwInjected=true">');self.leader();self.task()
        self.page.locator('[data-kw-person]').select_option(str(rid));expect(self.page.locator('.kw-evidence')).to_contain_text('<img src=x')
        self.assertEqual(self.page.locator('.kw-evidence img').count(),0);self.assertFalse(self.page.evaluate('window.kwInjected||false'))
        expect(self.page.locator('.kw-sheet input[type=file]')).to_have_count(0)

    def test_hidden_task_not_listed_for_ranger_and_can_be_restored(self):
        self.leader();self.kw('policy',{'taskId':T,'published':False});self.choose();self.knowledge();self.page.get_by_role('button',name='Entdeckerland öffnen',exact=False).click();self.page.locator('[data-kw-action=topic][data-kw-value=B-01]').click()
        expect(self.page.locator(f'[data-kw-action=task][data-kw-value={T}]')).to_have_count(0)
        self.assertFalse(self.kw('start',{'taskId':T})['ok']);self.leader();self.kw('policy',{'taskId':T,'published':True});self.choose();self.assertTrue(self.kw('start',{'taskId':T})['ok'])

    def test_http_adapter_auth_contract_and_no_silent_local_fallback(self):
        self.choose();self.context.route('https://knowledge.example/**',lambda route:route.fulfill(status=403,json={'error':'forbidden'}))
        self.page.evaluate("RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:'https://knowledge.example',getAccessToken:async()=> 'personal-test-token'}))")
        expect(self.page.locator('[data-knowledge-dashboard]')).to_contain_text('Kein Zugriff')
        self.assertEqual(self.page.evaluate('RangerHub.knowledgeTransportMode()'),'online')

    def test_all_desktop_mobile_sizes_keyboard_and_reduced_motion(self):
        self.choose();self.knowledge();out=Path(__file__).resolve().parents[1]/'docs/screenshots/v29';out.mkdir(parents=True,exist_ok=True)
        self.page.emulate_media(reduced_motion='reduce')
        for width,height in [(1440,900),(1920,1080),(1366,768),(768,1024),(390,844),(375,812),(320,568),(844,390)]:
            self.page.set_viewport_size({'width':width,'height':height})
            self.page.wait_for_function("() => {const m=document.querySelector('.kw-map').getBoundingClientRect();return [...document.querySelectorAll('.kw-map-pin')].every(p=>{const r=p.getBoundingClientRect();return r.x>=m.x-1&&r.right<=m.right+1})}")
            self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
            pins=self.page.locator('.kw-map-pin');bounds=self.page.locator('.kw-map').bounding_box()
            for i in range(6):
                r=pins.nth(i).bounding_box();self.assertGreaterEqual(r['width'],44);self.assertGreaterEqual(r['height'],44)
                self.assertGreaterEqual(r['x'],bounds['x']-1);self.assertLessEqual(r['x']+r['width'],bounds['x']+bounds['width']+1)
                for j in range(i):
                    other=pins.nth(j).bounding_box()
                    overlap_x=min(r['x']+r['width'],other['x']+other['width'])-max(r['x'],other['x'])
                    overlap_y=min(r['y']+r['height'],other['y']+other['height'])-max(r['y'],other['y'])
                    self.assertFalse(overlap_x>1 and overlap_y>1,f'Kartenbereiche überlappen bei {width}x{height}: {i}, {j}')
            self.page.screenshot(path=str(out/f'knowledge-ranger-{width}x{height}.png'),full_page=True)
        self.page.locator('.kw-map-pin').first.focus();self.assertNotEqual(self.page.locator('.kw-map-pin').first.evaluate('e=>getComputedStyle(e).outlineStyle'),'none')

    def test_true_touch_mobile_sheet_back_close_and_role_navigation(self):
        for width,height in [(320,568),(390,844),(768,1024)]:
            context=self.browser.new_context(viewport={'width':width,'height':height},is_mobile=width<768,has_touch=True,locale='de-DE')
            context.route('https://**/*',lambda r:r.abort());p=context.new_page();p.goto(self.url);p.wait_for_function('window.RangerHub?.knowledgeReady')
            p.evaluate("v24Choose('rangers',db.rangers.find(p=>!p.archived).id)")
            p.get_by_role('button',name='Menü öffnen',exact=False).tap() if p.get_by_role('button',name='Menü öffnen',exact=False).count() else None
            p.locator('[data-knowledge-nav]').tap();p.locator('.kw-map').wait_for();p.locator('[data-kw-value=entdecker]').tap();p.locator('[data-kw-action=topic][data-kw-value=B-01]').tap();p.locator('.kw-task-row').first.tap()
            expect(p.locator('.kw-original')).to_contain_text('sieben Sternbilder');p.locator('[data-kw-action=back]').tap();expect(p.locator('.kw-task-row')).to_have_count(8)
            p.locator('[data-kw-action=close]').tap();expect(p.locator('#rh-knowledge-sheet')).to_have_count(0)
            self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'),width);context.close()

    def test_archive_v28_upgrade_retains_session_and_all_existing_values(self):
        old='RangerHub_Webapp_V28_Kompakt.html' if 'Kompakt' in self.url else 'RangerHub_Webapp_V28_Demo.html'
        self.page.goto(self.url.rsplit('/',1)[0]+'/'+old);self.page.wait_for_function('window.RangerHub?.messagesReady');rid=self.ranger()
        before=self.state();self.page.goto(self.url);self.page.wait_for_function('window.RangerHub?.knowledgeReady');self.assertEqual(before,self.state());self.assertEqual(self.session()['id'],rid)

    def test_mobile_dashboard_summary_stays_visible_and_growth_location_still_works(self):
        self.page.set_viewport_size({'width':390,'height':844});self.choose()
        self.page.evaluate('() => new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
        self.assertLess(self.page.evaluate('scrollY'),50)
        first=self.page.locator('[data-knowledge-dashboard] .kw-score-strip strong').first.bounding_box()
        self.assertLess(first['y']+first['height'],844)
        self.page.locator('.expedition-locate').click()
        self.page.wait_for_function("document.querySelector('.expedition-marker').getBoundingClientRect().top>150&&document.querySelector('.expedition-marker').getBoundingClientRect().bottom<innerHeight")
        self.page.evaluate("goV17('knowledge')");self.assertLess(self.page.evaluate('scrollY'),50)
        self.page.evaluate('RangerHub.returnToExpedition()')
        self.page.wait_for_function("document.querySelector('.expedition-marker').getBoundingClientRect().top>150&&document.querySelector('.expedition-marker').getBoundingClientRect().bottom<innerHeight")

    def test_online_service_connects_three_separate_browser_storages(self):
        import hashlib,secrets,subprocess,tempfile
        from urllib.parse import urlsplit
        root=Path(__file__).resolve().parents[1]
        a=self.choose();exported=self.page.evaluate("JSON.parse(localStorage.getItem(document.querySelector('meta[name=rangerhub-storage]').content))")
        people=exported['stamms']['clp-west'];b=next(p['id'] for p in people['rangers'] if p['id']!=a and not p.get('archived'))
        lead=next(p['id'] for p in people['leaders'] if p.get('role')=='Leiter' and not p.get('archived'))
        tokens=[secrets.token_urlsafe(36) for _ in range(3)]
        principals=[{'id':rid,'kind':kind,'homeStammId':'clp-west','tokenHash':hashlib.sha256(token.encode()).hexdigest(),'expiresAt':'2099-01-01T00:00:00Z'} for rid,kind,token in zip([a,b,lead],['rangers','rangers','leaders'],tokens)]
        url=urlsplit(self.url)
        with tempfile.TemporaryDirectory(prefix='rangerhub-online-test-') as temp:
            cfg=Path(temp)/'config.json';cfg.write_text(json.dumps({'exported':exported,'dbPath':str(Path(temp)/'data.sqlite'),'origin':url.scheme+'://'+url.netloc,'principals':principals}));cfg.chmod(0o600)
            process=subprocess.Popen(['node',str(root/'tests/run_knowledge_service.mjs'),str(cfg)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
            try:
                port=json.loads(process.stdout.readline())['port'];service='http://127.0.0.1:'+str(port)
                pages=[self.page];contexts=[]
                for rid,kind in [(b,'rangers'),(lead,'leaders')]:
                    context=self.browser.new_context(locale='de-DE');contexts.append(context);context.route('https://**/*',lambda r:r.abort());p=context.new_page();p.goto(self.url);p.wait_for_function('window.RangerHub?.knowledgeReady');p.evaluate('v=>v24Choose(v.kind,v.id)',{'kind':kind,'id':rid});pages.append(p)
                try:
                    for p,token in zip(pages,tokens):
                        p.evaluate('v=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:v.url,getAccessToken:async()=>v.token}))',{'url':service,'token':token})
                        expect(p.locator('[data-knowledge-dashboard]')).to_contain_text('Zentrale Fachwissen-Daten')
                        p.locator('[data-knowledge-dashboard] .kw-score-strip').wait_for()
                    self.task();f=self.page.locator('[data-kw-form=submit]');f.locator('[name=text]').fill('Online eingereichter persönlicher Nachweis.');f.locator('[name=consent]').check();f.get_by_role('button',name='Ergebnis einreichen').click();expect(self.page.locator('.kw-task-meta')).to_contain_text('Zur Prüfung eingereicht')
                    leader=pages[2];leader.evaluate('RangerHub.refreshKnowledge()');leader.locator('[data-kw-action=reviews]').click();leader.locator('[data-kw-action=review-task]').first.click();leader.get_by_role('button',name='Bestätigen · 5 Punkte',exact=True).click();expect(leader.locator('.kw-task-meta')).to_contain_text('Bestätigt')
                    self.page.evaluate('RangerHub.refreshKnowledge()');pages[1].evaluate('RangerHub.refreshKnowledge()')
                    pages[1].locator('[data-kw-action=ranking]').click();expect(pages[1].locator('.kw-ranking')).to_contain_text('5')
                    expect(pages[1].locator('.kw-sheet')).not_to_contain_text('Online eingereichter persönlicher Nachweis.')
                    self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeReady');self.page.evaluate('v=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:v.url,getAccessToken:async()=>v.token}))',{'url':service,'token':tokens[0]});expect(self.page.locator('[data-knowledge-dashboard] .kw-own-rank')).to_contain_text('5 Punkte')
                    self.assertIsNone(self.page.evaluate('db.knowledge||null'))
                    pages[1].evaluate('v=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:v.url,getAccessToken:async()=>v.token}))',{'url':service,'token':tokens[0]})
                    expect(pages[1].locator('[data-knowledge-dashboard]')).to_contain_text('passt nicht zum ausgewählten RangerHub-Profil')
                finally:
                    for context in contexts:context.close()
            finally:
                process.terminate();process.communicate(timeout=10)
