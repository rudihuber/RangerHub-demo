"""Fachwissen V2: real application, real server, temporary identities and browser data."""
import hashlib,json,secrets,subprocess,tempfile
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import expect
from v27_cases import V27Cases
from v29_cases import V29Cases

T='fw-B-01-p132'
SIZES=[(1440,900),(1920,1080),(1366,768),(768,1024),(390,844),(375,812),(320,568),(844,390)]
class V30Cases:
    external=V27Cases.external
    leader=V27Cases.leader
    ranger=V27Cases.ranger
    add_meeting=V27Cases.add_meeting
    kw=V29Cases.kw
    snapshot=V29Cases.snapshot
    test_catalog_has_all_source_paragraphs_points_and_exact_examples=V29Cases.test_catalog_has_all_source_paragraphs_points_and_exact_examples

    def setUp(self):
        V27Cases.setUp(self)
        self.page.wait_for_function('window.RangerHub?.knowledgeV30Ready')

    def choose(self,index=0):
        rid=self.page.evaluate("i=>{const p=db.rangers.filter(p=>!p.archived&&p.active!==false&&p.knowledgeEligible!==false)[i];v24Choose('rangers',p.id);return p.id;}",index)
        self.page.locator('[data-knowledge-dashboard] .kw-score-strip').wait_for()
        return rid

    def knowledge(self):
        self.page.evaluate("goV17('knowledge')");self.page.locator('.kw-map').wait_for()

    def task(self,tid=T):
        self.page.evaluate('id=>RangerHub.openKnowledge("task",id)',tid)
        self.page.locator('.kw-task-meta').wait_for()

    def book(self,tid=T,mid=None):
        if mid is None:mid=self.snapshot()['nextMeeting']['id']
        return self.kw('register-exam',{'taskId':tid,'meetingId':mid})

    def past(self,mid):
        self.page.evaluate("id=>{const m=db.meetings.find(m=>m.id==id);const d=new Date();d.setDate(d.getDate()-1);m.date=d.toISOString().slice(0,10);v24Persist();}",mid)
        self.page.evaluate('RangerHub.refreshKnowledge()')

    def test_all_36_locations_open_only_the_chosen_topic_and_task(self):
        self.choose();self.knowledge();expect(self.page.locator('.kw-map-pin')).to_have_count(6)
        catalog=self.snapshot()['catalog'];seen=[]
        for r in catalog['regions']:
            if r['id']=='arena':continue
            self.page.evaluate('id=>RangerHub.openKnowledge("region",id)',r['id'])
            expect(self.page.locator('.kw-subworld')).to_have_count(1)
            expect(self.page.locator('.kw-task-row')).to_have_count(0)
            expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0)
            topics=[t for t in catalog['topics'] if t['mapRegionId']==r['id']]
            expect(self.page.locator('.kw-location')).to_have_count(len(topics))
            for t in topics:
                self.page.locator('[data-kw-action=location][data-kw-value="'+t['locationId']+'"]').click()
                expect(self.page.locator('#kw-sheet-title')).to_have_text(t['title'])
                tasks=[x for x in catalog['tasks'] if x['topicId']==t['id'] and x['visible']]
                expect(self.page.locator('.kw-task-row')).to_have_count(len(tasks));seen.append(t['id'])
                if tasks:
                    self.page.locator('.kw-task-row').first.click();expect(self.page.locator('.kw-original')).to_contain_text(tasks[0]['text'])
                    self.page.keyboard.press('Escape');expect(self.page.locator('.kw-task-row')).to_have_count(len(tasks))
                self.page.locator('[data-kw-action=close]').click()
        self.assertEqual(len(seen),36);self.assertEqual(len(set(seen)),36)

    def test_registration_preview_three_slots_withdrawal_and_reload(self):
        self.choose();mid=self.snapshot()['nextMeeting']['id'];self.task()
        self.page.locator('[data-kw-action=register-confirm]').click()
        form=self.page.locator('[data-kw-form=register-exam]');expect(form).to_contain_text('0 / 3')
        expect(form.locator('[name=meetingId]')).to_have_value(str(mid));form.locator('button[type=submit],button.btn').last.click()
        expect(self.page.locator('.kw-exam-summary')).to_contain_text('Für Treffen angemeldet')
        self.assertEqual(self.snapshot()['ledger'],[])
        for tid in ['fw-B-01-p133','fw-A-08-p087']:self.assertTrue(self.book(tid)['ok'])
        self.assertFalse(self.book('fw-B-01-p134')['ok']);self.task('fw-B-01-p134');self.page.locator('[data-kw-action=register-confirm]').click()
        expect(self.page.locator('[data-kw-form=register-exam] .btn')).to_be_disabled()
        self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeV30Ready');self.assertEqual(len(self.snapshot()['exams']),3)
        e=self.snapshot()['exams'][0];self.page.evaluate('id=>RangerHub.openKnowledge("exam-detail",id)',e['id'])
        self.page.once('dialog',lambda d:d.accept());self.page.locator('[data-kw-action=withdraw-exam]').click()
        self.page.wait_for_function('db.knowledge.exams.some(e=>e.status==="withdrawn")')
        self.assertTrue(self.book('fw-B-01-p134')['ok'])

    def test_leader_pass_fail_no_show_history_and_ranking(self):
        rid=self.choose();mid=self.snapshot()['nextMeeting']['id']
        for tid in [T,'fw-B-01-p133','fw-B-01-p134']:self.assertTrue(self.book(tid)['ok'])
        self.leader('Leiter');self.past(mid);self.page.evaluate('RangerHub.openKnowledge("exams")')
        self.page.locator('[data-exam-filter=meetingId]').select_option(str(mid))
        expect(self.page.locator('.kw-exam-row')).to_have_count(3)
        for result,remaining in [('passed',2),('failed',1),('no_show',0)]:
            self.page.locator('[data-kw-action=grade][data-kw-value$="|'+result+'"]').first.click()
            self.page.locator('[data-kw-form=grade-exam] .btn').click()
            expect(self.page.locator('.kw-exam-row')).to_have_count(remaining)
        self.page.locator('[data-exam-filter=status]').select_option('all');expect(self.page.locator('.kw-exam-row')).to_have_count(3)
        self.choose();self.assertEqual(self.snapshot()['ranking'][0]['points'],5);self.assertEqual(self.snapshot()['ranking'][0]['rank'],1)
        self.assertEqual(len(self.snapshot()['ledger']),1);expect(self.page.locator('[data-knowledge-dashboard]')).to_contain_text('5 Punkte')
        self.page.evaluate('RangerHub.openKnowledge("ranking")');expect(self.page.locator('.kw-ranking .is-own')).to_contain_text('5')

    def test_cancelled_meeting_keeps_registration_and_can_be_reassigned(self):
        self.choose();mid=self.snapshot()['nextMeeting']['id'];self.book();self.leader();self.add_meeting(35)
        self.page.evaluate('id=>{db.meetings.find(m=>m.id==id).cancelled=true;v24Persist();}',mid)
        self.choose();e=self.snapshot()['exams'][0];self.assertEqual(e['status'],'meeting_cancelled')
        self.page.evaluate('id=>RangerHub.openKnowledge("exam-detail",id)',e['id']);self.page.locator('[data-kw-action=reschedule]').click()
        f=self.page.locator('[data-kw-form=reassign-exam]');f.locator('.btn').click()
        expect(self.page.locator('.kw-exam-summary')).to_contain_text('Für Treffen angemeldet')
        self.assertNotEqual(self.snapshot()['exams'][0]['meetingId'],mid)

    def test_no_meeting_no_uploads_and_old_workflows_disabled(self):
        self.leader();self.page.evaluate('db.meetings.forEach(m=>m.cancelled=true);v24Persist()');self.choose();self.task()
        expect(self.page.locator('.kw-sheet')).to_contain_text('Noch kein passendes Rangertreffen geplant')
        expect(self.page.locator('.kw-sheet input[type=file],.kw-sheet textarea')).to_have_count(0)
        for t in ['invite','submit','review','respond','start']:
            self.assertFalse(self.kw(t,{'taskId':T,'text':'obsolete'})['ok'])
        self.page.evaluate('RangerHub.openKnowledge("arena")');expect(self.page.locator('.kw-ranking')).to_have_count(1)
        expect(self.page.locator('[data-kw-action=invite],.kw-duel,.kw-challenge-form')).to_have_count(0)

    def test_editor_text_points_subitems_original_and_local_reset(self):
        self.leader('Stammleiter');self.task();self.page.locator('#rh-knowledge-sheet [data-kw-action=edit]').first.click()
        f=self.page.locator('[data-kw-form=catalog-change]');f.locator('[name=text]').fill('Erkläre ein Sternbild persönlich.')
        f.locator('[name=points]').fill('7');f.locator('[name=reason]').fill('Punktwert von der Fachleitung geprüft.')
        f.locator('details').filter(has=self.page.locator('[data-add-subitem]')).locator('summary').click();f.locator('[data-add-subitem]').click();f.locator('[name=displaySubItem]').last.fill('Zeige die Himmelsrichtung.')
        f.locator('button.btn').last.click();self.page.wait_for_function('db.knowledge?.content.overrides.tasks["'+T+'"]?.fields.points===7');expect(self.page.locator('[data-kw-form=catalog-change]')).to_have_count(0)
        self.task();expect(self.page.locator('.kw-original')).to_contain_text('Zeige die Himmelsrichtung.')
        t=next(t for t in self.snapshot()['catalog']['tasks'] if t['id']==T);self.assertEqual(t['originalPoints'],5);self.assertIn('sieben Sternbilder',t['originalText'])
        self.page.locator('#rh-knowledge-sheet [data-kw-action=edit]').first.click();self.page.once('dialog',lambda d:d.accept());self.page.locator('[data-kw-action=reset-editor]').click()
        self.page.wait_for_function('!db.knowledge.content.overrides.tasks["'+T+'"]');self.assertEqual(next(t for t in self.snapshot()['catalog']['tasks'] if t['id']==T)['points'],5)

    def test_editor_creates_each_entity_and_moves_task_in_real_forms(self):
        self.leader('Stammleiter');self.page.evaluate('RangerHub.openKnowledge("manage")')
        ids={}
        for kind,name in [('categories','Wasserwissen'),('regions','Flussinsel'),('locations','Neue Hütte'),('topics','Flusskunde'),('tasks','Wasser finden')]:
            self.page.locator('[data-editor-filter=kind]').select_option(kind);self.page.locator('[data-kw-action=create-editor]').click()
            f=self.page.locator('[data-kw-form=catalog-change]');f.locator('[name=title]').fill(name)
            if kind=='locations':f.locator('[name=regionId]').select_option(ids['regions'])
            if kind=='topics':f.locator('[name=categoryId]').select_option(ids['categories']);f.locator('[name=locationId]').select_option(ids['locations'])
            if kind=='tasks':f.locator('[name=topicId]').select_option(ids['topics']);f.locator('[name=text]').fill('Erkläre den Wasserkreislauf.');f.locator('[name=points]').fill('3')
            f.locator('button.btn').last.click();expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0)
            ids[kind]=next(x for x in self.snapshot()['catalog'][kind] if x['title']==name)['id']
        self.page.evaluate('id=>RangerHub.openKnowledge("region",id)',ids['regions']);self.page.locator('.kw-location').click()
        expect(self.page.locator('.kw-task-row')).to_have_count(1);self.page.locator('.kw-task-row').click();expect(self.page.locator('.kw-original')).to_contain_text('Wasserkreislauf')

    def test_roles_stamm_switch_global_local_and_dirty_editor_guard(self):
        self.choose();expect(self.page.locator('[data-knowledge-exams-nav],[data-knowledge-manage-nav]')).to_have_count(0)
        self.assertFalse(self.kw('catalog-change',{'kind':'tasks','id':T,'scope':'local','revision':0,'fields':{'text':'bad'}})['ok'])
        self.leader('Stammleiter');self.task();self.page.locator('#rh-knowledge-sheet [data-kw-action=edit]').first.click();self.page.locator('[name=text]').fill('Lokale Fassung')
        self.page.once('dialog',lambda d:d.dismiss());self.page.locator('[data-kw-action=close]').click();expect(self.page.locator('[name=text]')).to_have_value('Lokale Fassung')
        self.page.once('dialog',lambda d:d.accept());self.page.locator('[data-kw-action=close]').click();expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0)
        self.leader('Admin');p={'kind':'tasks','id':T,'scope':'local','revision':0,'fields':{'text':'Nur CLP-West'}};self.assertTrue(self.kw('catalog-change',p)['ok'])
        p.update(scope='global',fields={'text':'Global aktualisiert'});self.assertTrue(self.kw('catalog-change',p)['ok'])
        self.page.evaluate("v24SwitchStamm('meppen')");self.assertEqual(next(t for t in self.snapshot()['catalog']['tasks'] if t['id']==T)['text'],'Global aktualisiert')
        self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeV30Ready');self.assertEqual(self.page.evaluate('v24StammId'),'meppen')
        self.page.evaluate("v24SwitchStamm('clp-west')");self.assertEqual(next(t for t in self.snapshot()['catalog']['tasks'] if t['id']==T)['text'],'Nur CLP-West')

    def test_browser_back_deep_link_reload_and_mobile_focus(self):
        self.choose();self.knowledge();self.page.locator('[data-kw-value=gemeinschaft]').click()
        self.page.locator('[data-kw-value=place-A-10]').focus();self.page.keyboard.press('Enter');expect(self.page.locator('#kw-sheet-title')).to_have_text('Gemeinde')
        self.page.locator('.kw-task-row').first.click();url=self.page.url;self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeV30Ready')
        expect(self.page.locator('.kw-original')).to_be_visible();self.assertEqual(self.page.url,url)
        self.page.go_back();expect(self.page.locator('.kw-task-row').first).to_be_visible()
        self.page.go_back();expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0);expect(self.page.locator('.scene-village')).to_have_count(1)
        self.page.keyboard.press('Tab');self.assertNotEqual(self.page.locator(':focus').evaluate('e=>getComputedStyle(e).outlineStyle'),'none')

    def test_migration_preserves_old_points_profiles_and_archives_legacy_data(self):
        self.choose();self.page.evaluate('''t=>{db.knowledge={schema:1,progress:{},ledger:[{id:'old-credit',type:'credit',rangerId:session.id,taskId:t,points:5,at:'2026-01-01T10:00:00Z',by:db.leaders[0].id}],challenges:[{id:'old-duel'}],policies:{},resolutions:{},audit:[]};v24Store.stamms[v24StammId].knowledge=db.knowledge;const k=document.querySelector('meta[name=rangerhub-storage]').content;localStorage.setItem(k,JSON.stringify(v24Store));}''',T)
        before=self.page.evaluate('JSON.stringify({r:db.rangers,l:db.leaders,m:db.meetings,p:db.stageProgress,b:db.observerBonus})')
        self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeV30Ready');self.page.locator('[data-knowledge-dashboard] .kw-score-strip').wait_for()
        snap=self.snapshot();self.assertEqual(snap['ranking'][0]['points'],5);self.assertNotIn('challenges',snap)
        self.assertEqual(self.page.evaluate('db.knowledge.legacy.challenges[0].id'),'old-duel')
        self.assertEqual(before,self.page.evaluate('JSON.stringify({r:db.rangers,l:db.leaders,m:db.meetings,p:db.stageProgress,b:db.observerBonus})'))
        ledger=snap['ledger'];self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeV30Ready');self.assertEqual(self.snapshot()['ledger'],ledger)

    def test_cross_tab_concurrent_limit_and_unrelated_save_preserve_latest_state(self):
        self.choose();mid=self.snapshot()['nextMeeting']['id'];other=self.context.new_page();other.goto(self.url);other.wait_for_function('window.RangerHub?.knowledgeV30Ready')
        other.evaluate("v24Choose('rangers',db.rangers.find(p=>!p.archived).id)")
        first=self.page.evaluate('''v=>Promise.all(v.ids.map(taskId=>RangerHub.createLocalKnowledgeTransport().command('register-exam',{taskId,meetingId:v.mid}).then(()=>true,()=>false)))''',{'ids':[T,'fw-B-01-p133'],'mid':mid})
        second=other.evaluate('''v=>Promise.all(v.ids.map(taskId=>RangerHub.createLocalKnowledgeTransport().command('register-exam',{taskId,meetingId:v.mid}).then(()=>true,()=>false)))''',{'ids':['fw-B-01-p134','fw-B-01-p135'],'mid':mid})
        self.assertEqual(first.count(True)+second.count(True),3)
        other.evaluate("db.weatherPlace='Cloppenburg';v24Persist()")
        self.assertEqual(len(self.snapshot()['exams']),3)

    def test_quota_failure_does_not_erase_existing_storage(self):
        self.choose();self.book();before=self.state()
        self.page.evaluate("() => {window.originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError')}}")
        try:self.assertFalse(self.book('fw-B-01-p133')['ok'])
        finally:self.page.evaluate('() => {Storage.prototype.setItem=window.originalStorageSet}')
        self.assertEqual(self.state(),before)

    def test_dashboard_two_maps_correct_preview_and_existing_growth_navigation(self):
        self.choose();expect(self.page.locator('.kw-dual-maps>.expedition')).to_have_count(1);expect(self.page.locator('.kw-knowledge-preview')).to_have_count(1)
        self.page.locator('.kw-knowledge-preview [data-kw-value=entdecker]').click();expect(self.page.locator('.scene-discovery')).to_have_count(1)
        self.page.locator('[data-kw-action=back]').first.click();expect(self.page.locator('.kw-dual-maps')).to_have_count(1)
        self.page.locator('[data-exp-station="0"]').click();self.page.locator('[data-exp-action=close]').click() if self.page.locator('[data-exp-action=close]').count() else self.page.keyboard.press('Escape')
        self.leader('Leiter');expect(self.page.locator('.expedition')).to_have_count(0);expect(self.page.locator('.kw-growth-preview')).to_have_count(1)
        expect(self.page.locator('[data-knowledge-exams-nav]')).to_have_count(1)

    def assert_bounds(self,container,buttons):
        box=container.bounding_box();rows=buttons.all()
        for i,node in enumerate(rows):
            b=node.bounding_box();self.assertGreaterEqual(b['width'],44);self.assertGreaterEqual(b['height'],44)
            self.assertGreaterEqual(b['x'],box['x']-1);self.assertLessEqual(b['x']+b['width'],box['x']+box['width']+1)
            self.assertGreaterEqual(b['y'],box['y']-1);self.assertLessEqual(b['y']+b['height'],box['y']+box['height']+1)
            for other in rows[:i]:
                a=other.bounding_box();self.assertFalse(min(a['x']+a['width'],b['x']+b['width'])-max(a['x'],b['x'])>1 and min(a['y']+a['height'],b['y']+b['height'])-max(a['y'],b['y'])>1,'Overlapping map places')

    def test_screenshots_all_sizes_all_subworlds_dashboard_and_reduced_motion(self):
        self.choose();out=Path(__file__).resolve().parents[1]/'docs/screenshots/v30';out.mkdir(parents=True,exist_ok=True)
        self.page.emulate_media(reduced_motion='reduce')
        for w,h in SIZES:
            self.page.set_viewport_size({'width':w,'height':h});self.page.evaluate("view='dash';render()")
            self.page.locator('.kw-dual-maps').wait_for();self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w)
            self.assert_bounds(self.page.locator('.expedition-landscape'),self.page.locator('[data-exp-station]'))
            self.assert_bounds(self.page.locator('.kw-knowledge-preview .kw-map'),self.page.locator('.kw-knowledge-preview .kw-map-pin'))
            if w>=1200:self.assertLess(abs(self.page.locator('.expedition').bounding_box()['y']-self.page.locator('.kw-knowledge-preview').bounding_box()['y']),5)
            self.page.screenshot(path=str(out/f'dashboard-{w}x{h}.png'),full_page=True)
            self.knowledge();self.assert_bounds(self.page.locator('.kw-map'),self.page.locator('.kw-map-pin'))
            self.page.screenshot(path=str(out/f'overworld-{w}x{h}.png'),full_page=True)
            for region in ['wildnis','entdecker','rettung','werkstatt','gemeinschaft']:
                self.page.evaluate('id=>RangerHub.openKnowledge("region",id)',region)
                self.assert_bounds(self.page.locator('.kw-subworld'),self.page.locator('.kw-location'))
                self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w)
                if w in (1440,390,320,768):self.page.screenshot(path=str(out/f'{region}-{w}x{h}.png'),full_page=True)
            self.page.locator('.kw-location').first.focus();self.assertNotEqual(self.page.locator(':focus').evaluate('e=>getComputedStyle(e).outlineStyle'),'none')

    def test_true_touch_mobile_sheet_back_close_and_registration(self):
        out=Path(__file__).resolve().parents[1]/'docs/screenshots/v30';out.mkdir(parents=True,exist_ok=True)
        for w,h in [(320,568),(390,844),(768,1024)]:
            ctx=self.browser.new_context(viewport={'width':w,'height':h},is_mobile=w<768,has_touch=True,locale='de-DE');ctx.route('https://**/*',lambda r:r.abort())
            try:
                p=ctx.new_page();p.goto(self.url);p.wait_for_function('window.RangerHub?.knowledgeV30Ready');p.evaluate("v24Choose('rangers',db.rangers.find(p=>!p.archived).id)")
                p.locator('.kw-knowledge-preview [data-kw-value=gemeinschaft]').tap();p.locator('[data-kw-value=place-A-10]').tap();p.locator('.kw-task-row').first.tap()
                p.locator('[data-kw-action=register-confirm]').tap();expect(p.locator('[data-kw-form=register-exam]')).to_be_visible()
                p.screenshot(path=str(out/f'touch-registration-{w}x{h}.png'))
                p.locator('#rh-knowledge-sheet [data-kw-action=back]').tap();expect(p.locator('.kw-original')).to_be_visible()
                p.locator('[data-kw-action=close]').tap();expect(p.locator('#rh-knowledge-sheet')).to_have_count(0)
                self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'),w)
            finally:ctx.close()

    def test_http_failure_does_not_silently_save_locally(self):
        self.choose();before=self.state();self.context.route('https://knowledge.example/**',lambda route:route.fulfill(status=403,json={'error':'forbidden'}))
        self.page.evaluate("RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:'https://knowledge.example',getAccessToken:async()=> 'personal-test-token'}))")
        expect(self.page.locator('[data-knowledge-dashboard]')).to_contain_text('Kein Zugriff');self.assertEqual(self.state(),before)

    def test_online_server_three_independent_browser_storages_complete_exam_flow(self):
        a=self.choose();self.leader();mid=self.add_meeting(3);self.choose()
        exported=self.state();people=exported['stamms']['clp-west'];b=next(p['id'] for p in people['rangers'] if p['id']!=a and not p.get('archived'));lead=next(p['id'] for p in people['leaders'] if p.get('role')=='Leiter' and not p.get('archived'))
        tokens=[secrets.token_urlsafe(36) for _ in range(3)];principals=[{'id':rid,'kind':kind,'homeStammId':'clp-west','tokenHash':hashlib.sha256(t.encode()).hexdigest(),'expiresAt':'2099-01-01T00:00:00Z'} for rid,kind,t in zip([a,b,lead],['rangers','rangers','leaders'],tokens)]
        url=urlsplit(self.url);root=Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory(prefix='rangerhub-v30-online-') as temp:
            cfg=Path(temp)/'config.json';cfg.write_text(json.dumps({'exported':exported,'includeVerifiedKnowledge':True,'dbPath':str(Path(temp)/'data.sqlite'),'origin':url.scheme+'://'+url.netloc,'principals':principals}));cfg.chmod(0o600)
            proc=subprocess.Popen(['node',str(root/'tests/run_knowledge_service.mjs'),str(cfg)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
            contexts=[]
            try:
                line=proc.stdout.readline();self.assertTrue(line,proc.stderr.read() if proc.poll() is not None else 'Service did not start');service='http://127.0.0.1:'+str(json.loads(line)['port']);pages=[self.page]
                for rid,kind in [(b,'rangers'),(lead,'leaders')]:
                    ctx=self.browser.new_context(locale='de-DE');contexts.append(ctx);ctx.route('https://**/*',lambda r:r.abort());p=ctx.new_page();p.goto(self.url);p.wait_for_function('window.RangerHub?.knowledgeV30Ready');p.evaluate('v=>v24Choose(v.kind,v.id)',{'kind':kind,'id':rid});pages.append(p)
                for p,t in zip(pages,tokens):
                    p.evaluate('v=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:v.url,getAccessToken:async()=>v.token}))',{'url':service,'token':t});expect(p.locator('[data-knowledge-dashboard]')).to_contain_text('Zentrale Prüfungen und Rangliste')
                self.task();self.page.locator('[data-kw-action=register-confirm]').click();f=self.page.locator('[data-kw-form=register-exam]');f.locator('[name=meetingId]').select_option(str(mid));f.locator('.btn').click();expect(self.page.locator('.kw-exam-summary')).to_contain_text('Für Treffen angemeldet')
                leader=pages[2];leader.evaluate('RangerHub.refreshKnowledge()');leader.evaluate('RangerHub.openKnowledge("exams")');leader.locator('[data-exam-filter=meetingId]').select_option(str(mid));expect(leader.locator('.kw-exam-row')).to_have_count(1)
                leader.evaluate("id=>{const m=db.meetings.find(m=>m.id==id);const d=new Date();d.setDate(d.getDate()-1);m.date=d.toISOString().slice(0,10);v24Persist();}",mid)
                leader.wait_for_function('''async id=>{const t=RangerHub.knowledgeActor();await RangerHub.refreshKnowledge();return document.querySelector('.kw-exam-center-head')?.textContent.includes('offene Prüfungen')}''',arg=mid)
                # Wait for the existing calendar edit to reach the central service, not a client clock override.
                leader.wait_for_function('''async v=>{const r=await fetch(v.url+'/knowledge?stammId=clp-west',{headers:{Authorization:'Bearer '+v.token}});const s=await r.json();return s.meetings.find(m=>m.id==v.mid).date<new Date().toISOString().slice(0,10)}''',arg={'url':service,'token':tokens[2],'mid':mid})
                leader.evaluate('RangerHub.refreshKnowledge()');leader.locator('[data-kw-action=grade][data-kw-value$="|passed"]').click();leader.locator('[data-kw-form=grade-exam] .btn').click();expect(leader.locator('[data-kw-form=grade-exam]')).to_have_count(0);expect(leader.locator('.kw-exam-row')).to_have_count(0)
                for p in pages[:2]:p.evaluate('RangerHub.refreshKnowledge()')
                expect(self.page.locator('.kw-exam-summary')).to_contain_text('Bestanden');pages[1].evaluate('RangerHub.openKnowledge("ranking")');expect(pages[1].locator('.kw-ranking')).to_contain_text('5')
                self.page.reload();self.page.wait_for_function('window.RangerHub?.knowledgeV30Ready');self.page.evaluate('v=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:v.url,getAccessToken:async()=>v.token}))',{'url':service,'token':tokens[0]});self.page.evaluate("goV17('dash')");expect(self.page.locator('[data-knowledge-dashboard]')).to_contain_text('5 Punkte')
                self.assertIsNone(self.page.evaluate('db.knowledge||null'))
                pages[1].evaluate('v=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:v.url,getAccessToken:async()=>v.token}))',{'url':service,'token':tokens[0]});expect(pages[1].locator('body')).to_contain_text('passt nicht zum ausgewählten RangerHub-Profil')
            finally:
                for ctx in contexts:ctx.close()
                proc.terminate();proc.communicate(timeout=10)

    def test_actual_v29_upgrade_preserves_verified_points_and_active_session(self):
        old='RangerHub_Webapp_V29_Kompakt.html' if 'Kompakt' in self.url else 'RangerHub_Webapp_V29_Demo.html'
        self.page.goto(self.url.rsplit('/',1)[0]+'/'+old);self.page.wait_for_function('window.RangerHub?.knowledgeReady');rid=self.ranger()
        self.assertTrue(self.kw('submit',{'taskId':T,'text':'Persönlich vorgeführt, alter Stand.','evidenceType':'oral','consent':True})['ok']);self.leader('Leiter');self.assertTrue(self.kw('review',{'taskId':T,'rangerId':rid,'approved':True,'comment':'Geprüft.'})['ok'])
        self.ranger();before=self.snapshot()['ledger'];people=self.page.evaluate('JSON.stringify({r:db.rangers,l:db.leaders,m:db.meetings,p:db.stageProgress,b:db.observerBonus})')
        self.page.goto(self.url);self.page.wait_for_function('window.RangerHub?.knowledgeV30Ready');self.page.locator('[data-knowledge-dashboard] .kw-score-strip').wait_for()
        self.assertEqual(self.snapshot()['ledger'],before);self.assertEqual(self.session()['id'],rid);self.assertEqual(self.snapshot()['ranking'][0]['points'],5)
        self.assertEqual(people,self.page.evaluate('JSON.stringify({r:db.rangers,l:db.leaders,m:db.meetings,p:db.stageProgress,b:db.observerBonus})'))

    def test_three_confirmed_rangers_real_podium_and_phone_exam_center_screenshots(self):
        ids=[];m=None;tasks=[]
        for index in range(3):
            rid=self.choose(index);ids.append(rid);s=self.snapshot();m=m or s['nextMeeting']['id'];t=next(t for t in s['catalog']['tasks'] if t['visible'] and t.get('points')==[5,4,2][index]);tasks.append(t['id']);self.assertTrue(self.book(t['id'],m)['ok'])
        self.leader('Leiter');self.past(m);self.page.evaluate('RangerHub.openKnowledge("exams")');self.page.locator('[data-exam-filter=meetingId]').select_option(str(m))
        out=Path(__file__).resolve().parents[1]/'docs/screenshots/v30';out.mkdir(parents=True,exist_ok=True)
        for w,h in [(1440,900),(390,844),(320,568),(768,1024)]:
            self.page.set_viewport_size({'width':w,'height':h});self.page.screenshot(path=str(out/f'exam-center-{w}x{h}.png'),full_page=True);self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w)
            for b in self.page.locator('.kw-grade-actions button').all():self.assertGreaterEqual(b.bounding_box()['height'],44)
        for e in self.snapshot()['exams']:self.assertTrue(self.kw('grade-exam',{'examId':e['id'],'result':'passed'})['ok'])
        self.page.evaluate('RangerHub.refreshKnowledge()');self.page.evaluate('id=>v24RangerProfile(id)',ids[0]);expect(self.page.locator('[data-kw-profile]')).to_contain_text('5 Punkte')
        self.choose();self.page.set_viewport_size({'width':1440,'height':900});expect(self.page.locator('.kw-podium li')).to_have_count(3)
        self.page.screenshot(path=str(out/'dashboard-confirmed-podium-desktop.png'),full_page=True)
        self.page.set_viewport_size({'width':390,'height':844});self.page.screenshot(path=str(out/'dashboard-confirmed-podium-phone.png'),full_page=True)
        self.page.evaluate('RangerHub.openKnowledge("ranking")');expect(self.page.locator('.kw-ranking .is-own')).to_contain_text('5');self.page.screenshot(path=str(out/'ranking-phone.png'),full_page=True)
