"""Bible reading inside the real RangerHub shell; temporary data, real HTTP where applicable."""
import hashlib,json,secrets,subprocess,tempfile
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import expect
from v30_cases import V30Cases,SIZES,T
from v27_cases import V27Cases

class BibleCases:
    external=V27Cases.external
    leader=V27Cases.leader
    choose=V30Cases.choose
    kw=V30Cases.kw
    snapshot=V30Cases.snapshot
    book=V30Cases.book
    past=V30Cases.past
    def setUp(self):
        V27Cases.setUp(self);self.page.wait_for_function('window.RangerHub?.bibleReady')
    def library(self):
        self.page.evaluate('RangerHub.openKnowledge("bible")');self.page.locator('.bible-testaments').wait_for()
    def shelf(self,testament='AT'):
        self.library();self.page.locator('[data-kw-action=bible-shelf][data-kw-value='+testament+']').click();self.page.locator('.bible-bookcase').wait_for()
    def detail(self,bid='bible-01'):
        self.page.evaluate('id=>RangerHub.openKnowledge("bible-book",id)',bid);self.page.locator('[data-bible-book="'+bid+'"]').wait_for()
    def mark(self,accept=True):
        self.page.once('dialog',lambda d:d.accept() if accept else d.dismiss());self.page.locator('[data-kw-action=bible-read]').click()
        if accept:expect(self.page.locator('[data-kw-action=bible-unread]')).to_be_visible()
    def set_read(self,bid='bible-01',is_read=True,version=0):return self.kw('set-bible-read',{'bookId':bid,'isRead':is_read,'version':version})
    def own(self):
        s=self.snapshot();rid=self.page.evaluate('session.id');return next(r for r in s['ranking'] if r['id']==rid)

    def test_canonical_json_and_runtime_catalog_match_exactly(self):
        x=json.loads((Path(__file__).resolve().parents[1]/'data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json').read_text())
        self.assertEqual(x,self.page.evaluate('RHBibleCatalog'));self.assertEqual(len(x['books']),66);self.assertEqual(sum(b['points'] for b in x['books']),240)
        self.assertEqual(self.page.evaluate('Object.isFrozen(RHBibleCatalog.books[0])'),True)

    def test_library_opens_deliberately_and_all_66_book_details_keep_canonical_order(self):
        self.choose();self.page.evaluate('RangerHub.openKnowledge("region","gemeinschaft")');self.page.locator('[data-kw-value=place-A-08]').click()
        expect(self.page.locator('.bible-testament')).to_have_count(2);expect(self.page.locator('.bible-book,.kw-task-row')).to_have_count(0)
        catalog=self.page.evaluate('RHBibleCatalog.books');seen=[]
        for testament,count in [('AT',39),('NT',27)]:
            self.page.locator('[data-kw-action=bible-shelf][data-kw-value='+testament+']').click();expect(self.page.locator('.bible-book')).to_have_count(count)
            expected=[b for b in catalog if b['testament']==testament];actual=self.page.locator('.bible-book').evaluate_all('nodes=>nodes.map(n=>n.dataset.kwValue)');self.assertEqual(actual,[b['id'] for b in expected])
            for b in expected:
                self.page.locator('.bible-book[data-kw-value="'+b['id']+'"]').click();expect(self.page.locator('#kw-sheet-title')).to_have_text(b['name']);expect(self.page.locator('.bible-detail')).to_contain_text(str(b['chapters']));self.page.keyboard.press('Escape');expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0);seen.append(b['id'])
            self.page.evaluate('RangerHub.openKnowledge("bible")')
        self.assertEqual(len(set(seen)),66);self.assertEqual(self.own()['points'],0)
        self.page.locator('[data-kw-action=topic][data-kw-value=A-08]').click();expect(self.page.locator('.kw-task-row')).to_have_count(7)

    def test_detail_click_and_cancel_do_not_award_then_mark_undo_and_remark_are_exact(self):
        self.choose();self.shelf();self.page.locator('[data-kw-value=bible-01]').click();self.assertEqual(self.own()['points'],0)
        self.mark(False);self.assertEqual(self.own()['points'],0);self.mark();self.assertEqual(self.own()['points'],10)
        expect(self.page.locator('.bible-detail-status')).to_have_text('Vollständig gelesen');self.page.locator('[data-kw-action=bible-unread]').click();expect(self.page.locator('[data-kw-action=bible-read]')).to_be_visible();self.assertEqual(self.own()['points'],0)
        self.mark();self.assertEqual(self.own()['points'],10);self.assertEqual(self.own()['bibleBooks'],1)

    def test_quick_undo_and_permanent_undo_both_work_without_reason_or_leader(self):
        self.choose();self.detail();self.mark();self.page.locator('[data-bible-undo]').click();expect(self.page.locator('[data-kw-action=bible-read]')).to_be_visible();self.assertEqual(self.own()['points'],0)
        self.mark();self.page.locator('.bible-undo-notice button[aria-label="Hinweis schließen"]').click();expect(self.page.locator('[data-kw-action=bible-unread]')).to_be_visible();self.page.locator('[data-kw-action=bible-unread]').click();expect(self.page.locator('[data-kw-action=bible-read]')).to_be_visible();self.assertEqual(self.own()['points'],0)
        expect(self.page.locator('.kw-sheet textarea,.kw-sheet input[type=file]')).to_have_count(0)

    def test_dashboard_profile_ranking_and_both_existing_maps_share_the_combined_total(self):
        rid=self.choose();mid=self.snapshot()['nextMeeting']['id'];self.book(T,mid);self.leader();self.past(mid);e=self.snapshot()['exams'][0];self.assertTrue(self.kw('grade-exam',{'examId':e['id'],'result':'passed'})['ok']);normal=self.snapshot()['ledger']
        self.choose();self.detail();self.mark();self.page.evaluate("goV17('dash')");expect(self.page.locator('.bible-dashboard')).to_contain_text('1 / 66');expect(self.page.locator('.bible-dashboard')).to_contain_text('10 / 240');expect(self.page.locator('[data-knowledge-dashboard] .kw-own-rank')).to_contain_text('15 Punkte')
        expect(self.page.locator('.kw-dual-maps>.expedition')).to_have_count(1);expect(self.page.locator('.kw-knowledge-preview')).to_have_count(1)
        self.page.evaluate('id=>v24RangerProfile(id)',rid);expect(self.page.locator('[data-kw-profile]')).to_contain_text('15 Punkte');expect(self.page.locator('[data-kw-profile]')).to_contain_text('1 Bibelbücher gelesen')
        self.page.evaluate('RangerHub.openKnowledge("ranking")');expect(self.page.locator('.kw-ranking .is-own')).to_contain_text('15');self.detail();self.page.locator('[data-kw-action=bible-unread]').click();expect(self.page.locator('[data-kw-action=bible-read]')).to_be_visible();self.assertEqual(self.own()['points'],5);self.assertEqual(self.snapshot()['ledger'][:len(normal)],normal)

    def test_name_search_status_filters_and_native_keyboard(self):
        self.choose();self.set_read('bible-19');self.shelf();self.page.locator('[data-bible-query]').fill('psal');expect(self.page.locator('.bible-book')).to_have_count(1);expect(self.page.locator('.bible-book')).to_contain_text('Psalmen')
        self.page.locator('[data-bible-query]').fill('');self.page.locator('[data-bible-status]').select_option('read');expect(self.page.locator('.bible-book')).to_have_count(1)
        self.page.locator('.bible-book').focus();self.page.keyboard.press('Enter');expect(self.page.locator('#kw-sheet-title')).to_have_text('Psalmen');self.page.keyboard.press('Escape');expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0)
        self.page.locator('[data-bible-status]').select_option('open');expect(self.page.locator('.bible-book')).to_have_count(38)

    def test_scroll_position_browser_back_direct_link_and_reload(self):
        self.page.set_viewport_size({'width':390,'height':844});self.choose();self.shelf('NT');last=self.page.locator('[data-kw-value=bible-66]');last.scroll_into_view_if_needed();before=self.page.evaluate('scrollY');last.click();url=self.page.url
        self.page.locator('#rh-knowledge-sheet [data-kw-action=close]').click();expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0);self.page.wait_for_function('Math.abs(scrollY-'+str(before)+')<5')
        last.click();self.page.go_back();expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0);self.page.wait_for_function('Math.abs(scrollY-'+str(before)+')<5')
        self.page.goto(url);self.page.wait_for_function('window.RangerHub?.bibleReady');expect(self.page.locator('#kw-sheet-title')).to_have_text('Offenbarung');self.assertEqual(self.own()['points'],0)

    def test_reload_session_and_switch_between_rangers_never_leak_or_erase_reading(self):
        rid=self.choose();self.set_read();self.page.reload();self.page.wait_for_function('window.RangerHub?.bibleReady');self.assertEqual(self.own()['points'],10);self.assertEqual(self.session()['id'],rid)
        other=self.choose(1);self.assertEqual(self.own()['points'],0);self.assertNotIn(str(rid),self.snapshot()['bible']['records']);self.assertTrue(self.set_read('bible-02')['ok']);self.choose();self.assertEqual(self.own()['points'],10)
        self.leader();self.page.evaluate("v24SwitchStamm('meppen')");self.library();self.assertTrue(all(r['biblePoints']==0 for r in self.snapshot()['ranking']));expect(self.page.locator('[data-kw-action=bible-read],[data-kw-action=bible-unread]')).to_have_count(0)
        self.page.reload();self.page.wait_for_function('window.RangerHub?.bibleReady');self.page.evaluate("v24SwitchStamm('clp-west')");self.choose();self.assertEqual(self.own()['points'],10)

    def test_leader_library_is_read_only_and_ordinary_three_exam_places_are_unchanged(self):
        rid=self.choose();self.book();before=self.snapshot()['exams'];self.set_read();self.assertEqual(self.snapshot()['exams'],before);self.leader('Leiter');self.library();self.page.locator('[data-bible-reader]').select_option(str(rid));self.page.locator('[data-kw-value=AT]').click();self.page.locator('[data-kw-value=bible-01]').click();expect(self.page.locator('.bible-detail-status')).to_contain_text('Vollständig gelesen');expect(self.page.locator('.kw-sheet')).to_contain_text('Nur der Ranger selbst');expect(self.page.locator('[data-kw-action=bible-unread]')).to_have_count(0);self.assertFalse(self.set_read('bible-01',False,1)['ok'])

    def test_storage_failure_keeps_existing_marks_and_reports_failure(self):
        self.choose();self.set_read();before=self.state();self.page.evaluate("() => {window.savedSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError')}}")
        try:self.assertFalse(self.set_read('bible-02')['ok'])
        finally:self.page.evaluate('() => {Storage.prototype.setItem=window.savedSet}')
        self.assertEqual(self.state(),before);self.assertEqual(self.own()['points'],10)

    def test_schema_395_migration_keeps_read_flags_and_normal_points_without_double_credit(self):
        self.choose();rid=self.page.evaluate('session.id');self.page.evaluate('''rid=>{const s=RHKnowledgeModel.initial();s.bibleReading={schema:1,catalogVersion:'bible-reading-v1-395',records:{[rid]:{'bible-19':{isRead:true}}}};s.ledger=[{id:'normal',type:'credit',rangerId:rid,taskId:'fw-B-01-p132',points:5,at:'2026-01-01T10:00:00Z',by:db.leaders[0].id},{id:'legacy-psalms',type:'credit',source:'bible_reading',rangerId:rid,taskId:'bible-19',points:50,at:'2026-01-01T10:00:00Z',by:db.leaders[0].id}];v24Store.stamms[v24StammId].knowledge=s;localStorage.setItem(document.querySelector('meta[name=rangerhub-storage]').content,JSON.stringify(v24Store));}''',rid)
        self.page.reload();self.page.wait_for_function('window.RangerHub?.bibleReady');self.assertEqual(self.own()['points'],35);self.assertTrue(self.snapshot()['bible']['records'][str(rid)]['bible-19']['isRead']);journal=self.snapshot()['ledger'];self.page.reload();self.page.wait_for_function('window.RangerHub?.bibleReady');self.assertEqual(self.snapshot()['ledger'],journal)

    def test_all_viewports_touch_targets_no_overflow_and_screenshots(self):
        self.choose();self.set_read('bible-01');self.set_read('bible-40');out=Path(__file__).resolve().parents[1]/'docs/screenshots/v31';out.mkdir(parents=True,exist_ok=True);self.page.emulate_media(reduced_motion='reduce')
        for w,h in SIZES:
            self.page.set_viewport_size({'width':w,'height':h});self.page.evaluate("goV17('dash')");expect(self.page.locator('.bible-dashboard')).to_contain_text('2 / 66');self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w);self.page.screenshot(path=str(out/f'dashboard-{w}x{h}.png'),full_page=True)
            self.library();self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w);self.page.evaluate("document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)");self.page.screenshot(path=str(out/f'library-{w}x{h}.png'),full_page=True)
            for t,n in [('AT',39),('NT',27)]:
                self.page.locator('[data-kw-value='+t+']').click();expect(self.page.locator('.bible-book')).to_have_count(n);self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w)
                for button in self.page.locator('.bible-book').all():
                    r=button.bounding_box();self.assertGreaterEqual(r['width'],44);self.assertGreaterEqual(r['height'],44)
                self.page.evaluate("document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)");self.page.screenshot(path=str(out/f'{t}-{w}x{h}.png'),full_page=True);self.page.keyboard.press('Tab');self.page.locator('.bible-book').first.focus();self.assertNotEqual(self.page.locator('.bible-book').first.evaluate('e=>getComputedStyle(e).outlineStyle'),'none');self.library()

    def test_true_touch_confirmation_cancel_mark_and_undo_on_iphone_and_ipad(self):
        out=Path(__file__).resolve().parents[1]/'docs/screenshots/v31';out.mkdir(parents=True,exist_ok=True)
        for w,h in [(320,568),(390,844),(768,1024)]:
            ctx=self.browser.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<768,locale='de-DE');ctx.route('https://**/*',lambda r:r.abort())
            try:
                p=ctx.new_page();p.goto(self.url);p.wait_for_function('window.RangerHub?.bibleReady');p.evaluate("v24Choose('rangers',db.rangers.find(p=>!p.archived).id)");p.locator('.bible-dashboard [data-kw-action=bible]').tap();p.locator('[data-kw-value=NT]').tap();p.locator('[data-kw-value=bible-57]').tap();expect(p.locator('.bible-detail-status')).to_have_text('Noch offen')
                p.once('dialog',lambda d:d.dismiss());p.locator('[data-kw-action=bible-read]').tap();expect(p.locator('.bible-detail-status')).to_have_text('Noch offen');p.once('dialog',lambda d:d.accept());p.locator('[data-kw-action=bible-read]').tap();expect(p.locator('.bible-detail-status')).to_have_text('Vollständig gelesen');p.screenshot(path=str(out/f'touch-read-{w}x{h}.png'))
                p.locator('[data-kw-action=bible-unread]').tap();expect(p.locator('.bible-detail-status')).to_have_text('Noch offen');p.locator('#rh-knowledge-sheet [data-kw-action=back]').tap();expect(p.locator('.bible-book')).to_have_count(27);self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'),w)
            finally:ctx.close()

    def test_online_two_devices_same_ranger_and_readonly_leader_share_mark_and_undo(self):
        rid=self.choose();exported=self.state();leaders=exported['stamms']['clp-west']['leaders'];lid=next(p['id'] for p in leaders if p.get('role')=='Leiter' and not p.get('archived'));tokens=[secrets.token_urlsafe(36) for _ in range(2)];principals=[{'id':pid,'kind':kind,'homeStammId':'clp-west','tokenHash':hashlib.sha256(t.encode()).hexdigest(),'expiresAt':'2099-01-01T00:00:00Z'} for pid,kind,t in zip([rid,lid],['rangers','leaders'],tokens)];url=urlsplit(self.url);root=Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory(prefix='bible-v31-http-') as temp:
            cfg=Path(temp)/'cfg.json';cfg.write_text(json.dumps({'exported':exported,'includeVerifiedKnowledge':True,'dbPath':str(Path(temp)/'state.sqlite'),'origin':url.scheme+'://'+url.netloc,'principals':principals}));cfg.chmod(0o600);proc=subprocess.Popen(['node',str(root/'tests/run_knowledge_service.mjs'),str(cfg)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);contexts=[]
            try:
                line=proc.stdout.readline();self.assertTrue(line,proc.stderr.read() if proc.poll() is not None else 'Server unavailable');service='http://127.0.0.1:'+str(json.loads(line)['port']);pages=[self.page]
                for pid,kind in [(rid,'rangers'),(lid,'leaders')]:
                    ctx=self.browser.new_context(locale='de-DE');contexts.append(ctx);ctx.route('https://**/*',lambda r:r.abort());p=ctx.new_page();p.goto(self.url);p.wait_for_function('window.RangerHub?.bibleReady');p.evaluate('v=>v24Choose(v.kind,v.id)',{'kind':kind,'id':pid});pages.append(p)
                for p,t in zip(pages,[tokens[0],tokens[0],tokens[1]]):
                    p.evaluate('v=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:v.url,getAccessToken:async()=>v.token}))',{'url':service,'token':t});expect(p.locator('[data-knowledge-dashboard]')).to_contain_text('Zentrale Prüfungen')
                self.detail();self.mark();second=pages[1];second.evaluate('RangerHub.refreshKnowledge()');expect(second.locator('.bible-dashboard')).to_contain_text('10 / 240');second.evaluate('RangerHub.openKnowledge("bible-book","bible-01")');second.locator('[data-kw-action=bible-unread]').click();expect(second.locator('[data-kw-action=bible-read]')).to_be_visible();self.page.evaluate('RangerHub.refreshKnowledge()');expect(self.page.locator('.bible-detail-status')).to_have_text('Noch offen')
                leader=pages[2];leader.evaluate('RangerHub.refreshKnowledge()');leader.evaluate('RangerHub.openKnowledge("bible")');leader.locator('[data-bible-reader]').select_option(str(rid));expect(leader.locator('.bible-stat-strip')).to_contain_text('0');self.assertIsNone(self.page.evaluate('db.knowledge||null'))
                self.page.reload();self.page.wait_for_function('window.RangerHub?.bibleReady');self.page.evaluate('v=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:v.url,getAccessToken:async()=>v.token}))',{'url':service,'token':tokens[0]});expect(self.page.locator('.bible-detail-status')).to_have_text('Noch offen');self.mark();self.page.evaluate('RangerHub.openKnowledge("ranking")');expect(self.page.locator('.kw-ranking .is-own')).to_contain_text('10')
            finally:
                for ctx in contexts:ctx.close()
                proc.terminate();proc.communicate(timeout=10)

    def test_mobile_quick_undo_is_touchable_inside_the_native_book_dialog(self):
        for w,h in [(320,568),(390,844),(768,1024)]:
            ctx=self.browser.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=w<768,locale='de-DE');ctx.route('https://**/*',lambda r:r.abort())
            try:
                p=ctx.new_page();p.goto(self.url);p.wait_for_function('window.RangerHub?.bibleReady');p.evaluate("v24Choose('rangers',db.rangers.find(p=>!p.archived).id);RangerHub.openKnowledge('bible-book','bible-01')");p.once('dialog',lambda d:d.accept());p.locator('[data-kw-action=bible-read]').tap();expect(p.locator('[data-kw-action=bible-unread]')).to_be_visible()
                quick=p.locator('[data-bible-undo]');expect(quick).to_be_visible();b=quick.bounding_box();self.assertGreaterEqual(b['height'],44);self.assertGreaterEqual(b['width'],44);self.assertGreaterEqual(b['x'],0);self.assertLessEqual(b['x']+b['width'],w);quick.tap();expect(p.locator('.bible-detail-status')).to_have_text('Noch offen')
                p.evaluate("goV17('dash')");expect(p.locator('.bible-dashboard')).to_contain_text('0 / 240')
            finally:ctx.close()
