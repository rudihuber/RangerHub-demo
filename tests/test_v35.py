"""V35 browser acceptance in disposable profiles; original sources stay unchanged."""
from pathlib import Path
import re,io,json,secrets,hashlib,tempfile,subprocess
from urllib.parse import urlsplit
from PIL import Image
from playwright.sync_api import expect
from browser_case import BrowserCase
from v33_cases import V33Cases

class V35Tests(V33Cases,BrowserCase):
    def editor(self,module='emblem'):
        self.page.evaluate('id=>RangerHub.openVisualEditorV35(id)',module)
        self.page.locator('.ve35-editor').wait_for()
        return self.page.locator('.ve35-editor')

    def save_draft(self):
        self.assertTrue(self.page.evaluate('RangerHub.visualEditorV35.save()'))
        self.page.locator('[data-save-state]').filter(has_text='Gespeichert').wait_for()

    def test_visual_text_draft_publish_and_undo(self):
        self.choose('leaders','Admin');e=self.editor()
        text=e.locator('.vp35-text[contenteditable=true]').first;text.fill('Meine bearbeitete Emblemerklärung')
        self.save_draft();doc=self.page.evaluate('RangerHub.visualEditorV35.document');self.assertIn('Meine bearbeitete',doc['pages'][0]['elements'][0]['html'])
        self.assertEqual(self.snapshot()['visual']['published'],{})
        e.locator('[data-ve=undo]').click();self.assertNotIn('Meine bearbeitete',self.page.evaluate('RangerHub.visualEditorV35.document.pages[0].elements[0].html'))
        e.locator('[data-ve=redo]').click();self.save_draft()
        self.page.once('dialog',lambda d:d.accept());e.locator('[data-ve=publish]').click()
        expect(e.locator('[data-save-state]')).to_contain_text('Veröffentlicht')
        self.assertIn('emblem',self.snapshot()['visual']['published'])
        e.locator('[data-ve=close]').click();self.choose();self.wisdom('wisdom-module','emblem')
        expect(self.page.locator('.vp35-publication')).to_contain_text('Meine bearbeitete Emblemerklärung')
        expect(self.page.locator('[data-open-visual]')).to_have_count(0)

    def test_member_filters_pause_history_reactivate_and_own_stamm(self):
        self.choose('leaders','Admin');person=self.page.evaluate('db.rangers.find(p=>!p.archived)')
        self.page.evaluate("goV17('rangers')");expect(self.page.locator('[data-member-filter=active]')).to_be_visible()
        self.page.evaluate('id=>RangerHub.changeMembershipV35("rangers",id)',person['id'])
        form=self.page.locator('[data-membership-form]');form.locator('[name=status]').select_option('paused');form.locator('[name=confirmed]').check();form.get_by_role('button',name='Status speichern').click();expect(form).to_be_hidden()
        self.assertEqual(self.page.evaluate('id=>RHMembershipModel.status(db.rangers.find(p=>p.id===id))',person['id']),'paused')
        self.page.locator('[data-member-filter=paused]').click();expect(self.page.locator('[data-member-list]')).to_contain_text(person['name'])
        self.assertNotIn(str(person['id']),[str(p['id']) for p in self.snapshot()['ranking']])
        self.page.evaluate('id=>RangerHub.changeMembershipV35("rangers",id,"active")',person['id']);form=self.page.locator('[data-membership-form]');form.locator('[name=confirmed]').check();form.get_by_role('button',name='Status speichern').click();expect(form).to_be_hidden()
        self.assertEqual(self.page.evaluate('id=>db.rangers.find(p=>p.id===id).membership.events.length',person['id']),2)

    def test_every_original_module_converts_to_valid_editable_document(self):
        self.choose('leaders','Admin')
        result=self.page.evaluate("async()=>{const d=await RangerHub.loadV35();return d.wisdom.modules.filter(m=>!m.archived).map(m=>{const doc=RangerHub.originalVisualDocumentV35(d,m.id,'local');RHVisualModel.validate(doc);return {id:m.id,pages:doc.pages.length}})}")
        self.assertEqual(len(result),16)

    def publish(self,e):
        self.page.once('dialog',lambda d:d.accept());e.locator('[data-ve=publish]').click();expect(e.locator('[data-save-state]')).to_contain_text('Veröffentlicht')

    def test_image_move_resize_upload_publish_and_reload(self):
        self.choose('leaders','Admin');e=self.editor();image=e.locator('.ve35-stage .vp35-image').first
        before=self.page.evaluate('RangerHub.visualEditorV35.document.pages[0].elements.find(e=>e.type==="image")')
        image.click();e.locator('[data-prop=x]').fill('100');e.locator('[data-prop=x]').press('Tab');expect(e.locator('[data-prop=x]')).to_have_value('100')
        e.locator('[data-prop=width]').fill('300');e.locator('[data-prop=width]').press('Tab')
        e.locator('[data-ve=delete]').click();expect(e.locator('.ve35-stage .vp35-image')).to_have_count(0);e.locator('[data-ve=undo]').click();expect(e.locator('.ve35-stage .vp35-image')).to_have_count(1)
        e.locator('.ve35-stage .vp35-image').first.click();e.locator('[data-ve=replace-image]').click()
        png=io.BytesIO();Image.new('RGB',(120,80),'#376442').save(png,'PNG')
        self.page.locator('[data-media-upload]').set_input_files({'name':'Eigener Test.png','mimeType':'image/png','buffer':png.getvalue()})
        expect(self.page.locator('.ve35-dialog')).to_have_count(0);self.save_draft()
        stored=self.page.evaluate('RangerHub.visualEditorV35.document.pages[0].elements.find(e=>e.type==="image")');self.assertTrue(stored['assetId'].startswith('upload-'));self.assertEqual(stored['width'],300)
        self.assertNotIn(png.getvalue().hex(),str(self.store()));self.publish(e);e.locator('[data-ve=close]').click()
        self.page.reload();self.ready();self.choose();self.wisdom('wisdom-module','emblem');img=self.page.locator('.vp35-publication img').first
        self.page.wait_for_function('()=>{const img=document.querySelector(".vp35-publication img");return img?.complete&&img.naturalWidth===120}')
        self.assertTrue(img.get_attribute('src').startswith('blob:'))

    def test_page_management_keyboard_and_previous_version_restore(self):
        self.choose('leaders','Admin');e=self.editor();text=e.locator('.ve35-stage .vp35-text').first;text.fill('Version eins');self.save_draft();self.publish(e)
        text.fill('Version zwei');self.save_draft();self.publish(e);e.locator('[data-ve=history]').click();self.page.locator('[data-version="1"]').click();expect(self.page.locator('.ve35-dialog')).to_have_count(0)
        expect(e.locator('.ve35-stage .vp35-text').first).to_have_text('Version eins');self.assertEqual(self.snapshot()['visual']['published']['emblem']['document']['pages'][0]['elements'][0]['html'],'Version zwei')
        count=self.page.evaluate('RangerHub.visualEditorV35.document.pages.length');e.locator('[data-ve=page-add]').click();self.assertEqual(self.page.evaluate('RangerHub.visualEditorV35.document.pages.length'),count+1)
        e.locator('[data-page-prop=title]').fill('Eigene neue Seite');e.locator('[data-page-prop=title]').press('Tab');e.locator('[data-add=text]').click();expect(e.locator('[data-prop=x]')).to_be_visible()
        e.locator('[data-stage]').focus();self.page.keyboard.press('Control+c');self.page.keyboard.press('Control+v');self.assertEqual(self.page.evaluate('RangerHub.visualEditorV35.document.pages.at(-1).elements.length'),2)
        self.page.keyboard.press('Delete');self.assertEqual(self.page.evaluate('RangerHub.visualEditorV35.document.pages.at(-1).elements.length'),1);self.page.keyboard.press('Control+z');self.assertEqual(self.page.evaluate('RangerHub.visualEditorV35.document.pages.at(-1).elements.length'),2)

    def test_unconfigured_ai_is_explicit_and_has_no_fake_suggestion(self):
        self.choose('leaders','Admin');e=self.editor();before=self.page.evaluate('RangerHub.visualEditorV35.document');e.locator('.ve35-stage .vp35-text').first.click();e.locator('[data-ve=ai]').click();dialog=self.page.locator('.ve35-dialog');expect(dialog).to_contain_text('KI noch nicht konfiguriert');expect(dialog.locator('[data-ai-generate]')).to_be_disabled();expect(dialog.locator('[data-ai-apply]')).to_have_count(0);self.assertEqual(before,self.page.evaluate('RangerHub.visualEditorV35.document'))

    def test_concurrent_local_editors_keep_conflict_and_never_overwrite(self):
        self.choose('leaders','Admin');e=self.editor();second=self.context.new_page();second.goto(self.url);second.wait_for_function('window.RangerHub?.revisionV35Ready===true');second.evaluate("v24Choose('leaders',db.leaders.find(p=>p.role==='Admin').id)");second.evaluate("RangerHub.openVisualEditorV35('emblem')");second.locator('.ve35-editor').wait_for()
        e.locator('.ve35-stage .vp35-text').first.fill('Erstes Gerät gewinnt');self.save_draft();second.locator('.ve35-stage .vp35-text').first.fill('Zweites Gerät bleibt lokal');self.assertFalse(second.evaluate('RangerHub.visualEditorV35.save()'));expect(second.locator('[data-save-state]')).to_contain_text('Versionskonflikt');self.assertEqual(self.snapshot()['visual']['layers']['local']['records']['emblem']['draft']['pages'][0]['elements'][0]['html'],'Erstes Gerät gewinnt')

    def test_status_periods_drive_personal_statistics_and_current_mean(self):
        self.choose('leaders','Admin');rid=self.page.evaluate('db.rangers[0].id')
        self.page.evaluate("id=>{db.meetings=['2026-01-10','2026-02-10','2026-03-10','2026-04-10','2026-06-10'].map((date,i)=>({id:98500+i,date,start:'18:00',attendance:{rangers:{[id]:i===0?'ANWESEND':'ABWESEND'},leaders:{}},nature:{enabled:false},impulse:{enabled:false},food:{enabled:false},action:{title:'Quelle'}}));v24Persist();}",rid)
        for status,date,revision in [('paused','2026-02-01',0),('active','2026-04-01',1),('left','2026-06-01',2)]:
            self.assertTrue(self.command('membership-change',{'kind':'rangers','personId':rid,'status':status,'effectiveFrom':date,'revision':revision,'confirmed':True})['ok'])
        self.refresh();stats=self.page.evaluate("id=>RangerHub.dashboardAttendanceStats('rangers',id)",rid);self.assertEqual(stats['total'],2);self.assertEqual(stats['attended'],1);self.assertEqual(stats['percent'],50)
        self.assertEqual(self.page.evaluate('db.meetings.length'),5);self.assertNotIn(str(rid),[str(p['id']) for p in self.snapshot()['ranking']])

    def test_paused_leader_tasks_are_flagged_and_existing_assignment_stays(self):
        self.choose('leaders','Admin');ids=self.page.evaluate("()=>{const p=db.leaders.find(p=>p.role==='Leiter'),date=new Date(Date.now()+5*86400000).toISOString().slice(0,10);db.meetings=[{id:98601,date,start:'18:00',action:{title:'Nicht löschen',leaderId:p.id},nature:{enabled:false},impulse:{enabled:false},food:{enabled:false},attendance:{rangers:{},leaders:{}}}];v24Persist();return {id:p.id,date}}")
        self.assertTrue(self.command('membership-change',{'kind':'leaders','personId':ids['id'],'status':'paused','effectiveFrom':self.page.evaluate('RangerHub.localDate()'),'revision':0,'confirmed':True})['ok']);self.refresh();self.dashboard();expect(self.page.locator('[data-member-followups]')).to_contain_text('Nicht löschen')
        self.page.evaluate('meetingFormV15(98601)');f=self.page.locator('#meeting-planning-form');expect(f.locator('[name=actionLeader]')).to_have_value(str(ids['id']));expect(f.locator('[name=actionLeader] option:checked')).to_contain_text('Neuverteilung')
        self.assertEqual(self.page.evaluate('db.meetings[0].action.leaderId'),ids['id'])

    def test_ranger_reading_on_phone_and_tablet_never_clips_text(self):
        self.choose('leaders','Admin');e=self.editor();e.locator('.ve35-stage .vp35-text').first.fill('Eine veröffentlichte und lesbare Wissensseite');self.save_draft();self.publish(e);e.locator('[data-ve=close]').click();self.choose();self.wisdom('wisdom-module','emblem')
        out=Path(__file__).resolve().parents[1]/'docs/screenshots/v35';out.mkdir(parents=True,exist_ok=True)
        for width,height in [(390,844),(375,812),(320,568),(768,1024),(1440,900)]:
            self.page.set_viewport_size({'width':width,'height':height});self.page.wait_for_timeout(80);self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
            for text in self.page.locator('.vp35-publication .vp35-text').all():self.assertLessEqual(text.evaluate('e=>e.scrollHeight-e.clientHeight'),1)
            self.page.screenshot(path=str(out/f'published-{width}x{height}.png'),full_page=True)

    def test_ai_preview_accept_discard_and_undo_never_publishes(self):
        self.choose('leaders','Admin')
        self.page.evaluate("()=>{const load=RangerHub.loadV35;RangerHub.loadV35=async()=>{const d=await load();d.visual.ai.configured=true;return d};RangerHub.editorRequestV35=async()=>({kind:'text',text:'Kontrollierter Testvorschlag für die Emblemerklärung.'});}")
        e=self.editor();original=self.page.evaluate('RangerHub.visualEditorV35.document.pages[0].elements[0].html');e.locator('.ve35-stage [contenteditable=true]').first.click();e.locator('[data-ve=ai]').click();d=self.page.locator('.ve35-dialog');d.locator('[data-ai-generate]').click();expect(d.locator('[data-ai-preview]')).to_contain_text('Kontrollierter Testvorschlag');self.assertEqual(self.page.evaluate('RangerHub.visualEditorV35.document.pages[0].elements[0].html'),original)
        d.locator('[data-ai-discard]').click();self.assertEqual(self.page.evaluate('RangerHub.visualEditorV35.document.pages[0].elements[0].html'),original)
        e.locator('[data-ve=ai]').click();d=self.page.locator('.ve35-dialog');d.locator('[data-ai-generate]').click();d.locator('[data-ai-apply]').click();expect(e.locator('.ve35-stage [contenteditable=true]').first).to_contain_text('Kontrollierter Testvorschlag');e.locator('[data-ve=undo]').click();self.assertEqual(self.page.evaluate('RangerHub.visualEditorV35.document.pages[0].elements[0].html'),original);self.assertEqual(self.snapshot()['visual']['published'],{})

    def test_server_publication_media_and_membership_sync_independent_devices(self):
        admin=self.choose('leaders','Admin');exported=self.store();rid=next(p['id'] for p in exported['stamms']['clp-west']['rangers'] if not p.get('archived'));tokens=[secrets.token_urlsafe(36) for _ in range(2)]
        principals=[{'id':pid,'kind':kind,'homeStammId':'clp-west','tokenHash':hashlib.sha256(token.encode()).hexdigest(),'expiresAt':'2099-01-01T00:00:00Z'} for pid,kind,token in zip([admin['id'],rid],['leaders','rangers'],tokens)]
        root=Path(__file__).resolve().parents[1];url=urlsplit(self.url)
        with tempfile.TemporaryDirectory(prefix='rh-v35-two-devices-') as temp:
            cfg=Path(temp)/'config.json';cfg.write_text(json.dumps({'exported':exported,'includeVerifiedKnowledge':True,'dbPath':str(Path(temp)/'db.sqlite'),'assetDirectory':str(Path(temp)/'media'),'origin':url.scheme+'://'+url.netloc,'principals':principals}));cfg.chmod(0o600)
            proc=subprocess.Popen(['node',str(root/'tests/run_editor_service_v35.mjs'),str(cfg)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True);ctx=None
            try:
                line=proc.stdout.readline();self.assertTrue(line,proc.stderr.read() if proc.poll() is not None else 'Service did not start');service='http://127.0.0.1:'+str(json.loads(line)['port'])
                self.page.evaluate('a=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:a.url,getAccessToken:async()=>a.token}))',{'url':service,'token':tokens[0]});expect(self.page.locator('.v33-dashboard')).to_have_attribute('data-knowledge-mode','online')
                ctx=self.browser.new_context(locale='de-DE',timezone_id='Europe/Berlin');ctx.route('https://**/*',lambda r:r.abort());second=ctx.new_page();second.goto(self.url);second.wait_for_function('window.RangerHub?.revisionV35Ready===true');second.evaluate('id=>v24Choose("rangers",id)',rid);second.evaluate('a=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:a.url,getAccessToken:async()=>a.token}))',{'url':service,'token':tokens[1]});expect(second.locator('.v33-dashboard')).to_have_attribute('data-knowledge-mode','online')
                e=self.editor();e.locator('.ve35-stage [contenteditable=true]').first.fill('Geräteübergreifend veröffentlicht');self.save_draft();second.evaluate('async()=>{await RangerHub.refreshKnowledge();RangerHub.openKnowledge("wisdom-module","emblem")}');expect(second.locator('.vp35-publication')).to_have_count(0)
                e.locator('.ve35-stage .vp35-image').first.click();e.locator('[data-ve=replace-image]').click();png=io.BytesIO();Image.new('RGB',(90,60),'#315641').save(png,'PNG');self.page.locator('[data-media-upload]').set_input_files({'name':'Serverbild.png','mimeType':'image/png','buffer':png.getvalue()});expect(self.page.locator('.ve35-dialog')).to_have_count(0);self.save_draft();self.publish(e)
                second.evaluate('async()=>{await RangerHub.refreshKnowledge();RangerHub.openKnowledge("wisdom-module","emblem")}');expect(second.locator('.vp35-publication')).to_contain_text('Geräteübergreifend veröffentlicht');second.wait_for_function('()=>{const i=document.querySelector(".vp35-publication img");return i?.complete&&i.naturalWidth===90}')
                self.assertEqual(second.evaluate('localStorage.getItem("rhv9-media-v35")'),None)
                e.locator('[data-ve=close]').click();result=self.page.evaluate('async id=>{await RangerHub.commandV35("membership-change",{kind:"rangers",personId:id,status:"paused",effectiveFrom:RangerHub.localDate(),revision:0,confirmed:true});await RangerHub.refreshKnowledge();}',rid)
                second.evaluate('async()=>{await RangerHub.refreshKnowledge();goV17("dash")}');expect(second.locator('.ms35-readonly')).to_contain_text('pausiert')
                self.page.evaluate('async id=>RangerHub.commandV35("membership-change",{kind:"rangers",personId:id,status:"left",effectiveFrom:RangerHub.localDate(),revision:1,confirmed:true})',rid);second.evaluate('async()=>{await RangerHub.refreshKnowledge()}');expect(second.locator('.v24-loginChoice')).to_be_visible()
            finally:
                if ctx:ctx.close()
                proc.terminate();proc.wait(timeout=10)
                proc.stdout.close();proc.stderr.close()

    def test_full_browser_backup_restores_status_drafts_and_image_blobs(self):
        self.choose('leaders','Admin');e=self.editor();e.locator('.ve35-stage .vp35-image').first.click();e.locator('[data-ve=replace-image]').click();png=io.BytesIO();Image.new('RGB',(70,50),'#527454').save(png,'PNG');self.page.locator('[data-media-upload]').set_input_files({'name':'Backupbild.png','mimeType':'image/png','buffer':png.getvalue()});expect(self.page.locator('.ve35-dialog')).to_have_count(0);self.save_draft();e.locator('[data-ve=close]').click()
        self.page.evaluate("()=>{db.backupSentinel='Aufbewahren';v24Persist();}")
        with tempfile.TemporaryDirectory(prefix='rh-v35-backup-test-') as temp:
            with self.page.expect_download() as event:self.page.evaluate('v24ExportBackup()')
            download=event.value;path=Path(temp)/download.suggested_filename;download.save_as(path);self.assertEqual(path.suffix,'.zip')
            self.page.evaluate("async()=>{db.backupSentinel='Verändert';v24Persist();await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase(document.querySelector('meta[name=rangerhub-storage]').content+'-media-v35');request.onsuccess=resolve;request.onerror=reject;})}")
            self.assertEqual(self.page.evaluate('(async()=> (await RangerHub.mediaBackupV35()).length)()'),0)
            self.page.once('dialog',lambda d:d.accept());self.page.evaluate("async a=>{const response=await fetch(a.url);const file=new File([await response.blob()],a.name,{type:'application/zip'});await v24ImportBackup({target:{files:[file]}})}",{'url':'data:application/zip;base64,'+__import__('base64').b64encode(path.read_bytes()).decode(),'name':path.name})
            expect(self.page.locator('.v24-loginChoice')).to_be_visible();self.assertEqual(self.page.evaluate('db.backupSentinel'),'Aufbewahren');self.assertEqual(self.page.evaluate('(async()=> (await RangerHub.mediaBackupV35()).length)()'),1)
            self.choose('leaders','Admin');e=self.editor();self.page.wait_for_function('()=>{const i=document.querySelector(".ve35-stage .vp35-image img");return i?.complete&&i.naturalWidth===70}')

def load_tests(loader,tests,pattern):
    return loader.suiteClass(V35Tests(n) for n in V35Tests.__dict__ if n.startswith('test_'))
