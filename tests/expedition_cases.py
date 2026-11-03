"""Shared V26 acceptance tests; reusable with the private and public browser harnesses."""
import re
from pathlib import Path
from playwright.sync_api import expect


class ExpeditionCases:
    def setUp(self):
        super().setUp()
        self.page.wait_for_function('window.RangerHub?.expeditionReady === true')

    def choose_profile(self, kind='rangers', role=None, tribe='clp-west'):
        picker=self.page.locator('.v24-loginChoice select[aria-label="Stamm auswählen"]')
        picker.select_option(tribe)
        person=self.page.evaluate("args=>db[args.kind].find(p=>!p.archived&&(!args.role||p.role===args.role))",{'kind':kind,'role':role})
        self.assertIsNotNone(person)
        if self.page.locator('#demo-person').count():
            self.page.locator('#demo-person').select_option(f'{kind}:{person["id"]}')
            self.page.get_by_role('button',name='Logbuch öffnen').click()
        else:
            self.page.get_by_role('button',name=re.compile('^'+re.escape(person['name'])+' ·')).click()
        expect(self.page.locator('.brand small')).to_contain_text('Ranger' if kind=='rangers' else role)
        return person

    def progress_fixture(self, completed=0, following=0, render=True):
        self.page.evaluate("""args=>{
          const id=session.id;
          const existing=Object.fromEntries(Object.entries(db.observerTasks).filter(([category])=>category!=='Prüfaufgaben'));
          const count=Object.values(existing).flat().length;
          db.observerTasks={...existing,'Prüfaufgaben':Array.from({length:96-count},(_,i)=>({id:'exp-obs-'+i,title:'Prüfaufgabe '+(i+1),description:''}))};
          stages.forEach(stage=>{db.growthTasks[stage]=Array.from({length:100},(_,i)=>({id:'exp-'+stage+'-'+i,title:'Prüfaufgabe '+(i+1),category:'Praxis',description:''}))});
          db.observerProgress[id]=Object.fromEntries(Object.values(db.observerTasks).flat().slice(0,Math.min(args.completed,96)).map(t=>[t.id,true]));
          db.observerBonus[id]=Object.fromEntries(['A','B','C','R'].map((k,i)=>[k,args.completed>=97+i]));
          db.stageProgress[id]={'Erkunder':Object.fromEntries(db.growthTasks.Erkunder.slice(0,args.following).map(t=>[t.id,true]))};
          v24SyncStageFor(id);v24Persist();if(args.render)render();
        }""",{'completed':completed,'following':following,'render':render})

    def test_expedition_is_only_on_the_own_ranger_dashboard(self):
        for kind,role in [('leaders','Admin'),('leaders','Stammleiter'),('leaders','Leiter'),('rangers',None)]:
            with self.subTest(role=role or 'Ranger'):
                self.choose_profile(kind,role)
                expect(self.page.locator('.expedition')).to_have_count(1 if kind=='rangers' else 0)
                if kind=='leaders':
                    self.page.evaluate('RangerHub.openExpeditionStation(0)')
                    self.assertFalse(self.page.evaluate("modal.classList.contains('show')"))
                self.page.evaluate("goV17('rangers')")
                expect(self.page.locator('.expedition')).to_have_count(0)
                if kind=='leaders':
                    self.page.evaluate('v24RangerProfile(db.rangers[0].id)')
                    expect(self.page.locator('.expedition')).to_have_count(0)
                self.page.evaluate("goV17('path')")
                expect(self.page.locator('.expedition')).to_have_count(0)
                self.page.evaluate("goV17('dash')")
                expect(self.page.locator('.expedition')).to_have_count(1 if kind=='rangers' else 0)
                self.page.evaluate('logout()')

    def test_exact_thresholds_bonus_tasks_and_official_promotion(self):
        self.choose_profile()
        for completed in [0,79,80,99,100]:
            with self.subTest(completed=completed):
                self.progress_fixture(completed,20)
                state=self.page.evaluate('RangerHub.expeditionSnapshot()')
                self.assertEqual(state['progress'][0]['done'],completed)
                self.assertEqual(state['progress'][0]['total'],100)
                self.assertEqual(state['progress'][1]['available'],completed>=80)
                self.assertEqual(state['progress'][0]['complete'],completed==100)
                self.assertEqual(state['official'],'Erkunder' if completed==100 else 'Beobachter')
                self.assertEqual(self.page.evaluate('currentUser().stage'),state['official'])
                self.assertEqual(state['progress'][1]['done'],20)
                self.assertAlmostEqual(state['position'],1.2 if completed==100 else completed/100)
        self.page.locator('[data-exp-station="0"]').click()
        expect(self.page.locator('#box')).to_contain_text('Gelbe Schulterschlaufe · erreicht')
        expect(self.page.locator('#box')).to_contain_text('100 erledigt')
        self.page.keyboard.press('Escape')
        self.page.locator('[data-exp-station="1"]').click()
        expect(self.page.locator('#box')).to_contain_text('20%')
        expect(self.page.locator('#box')).to_contain_text('20 erledigt')
        expect(self.page.locator('#box')).to_contain_text('80 offen')

    def test_existing_leader_checkbox_updates_the_same_ranger_progress(self):
        person=self.choose_profile()
        initial=self.page.evaluate('RangerHub.expeditionSnapshot().progress[0].done')
        self.page.evaluate('logout()');self.choose_profile('leaders','Admin')
        self.page.evaluate('id=>observerTasks(id)',person['id'])
        self.page.locator('.obsCategory summary').first.click()
        checkbox=self.page.locator('.obsCategory').first.locator('input[type=checkbox]').first
        expect(checkbox).to_be_enabled();checkbox.check()
        self.page.evaluate('logout()');self.choose_profile()
        state=self.page.evaluate('RangerHub.expeditionSnapshot()')
        self.assertEqual(state['progress'][0]['done'],initial+1)
        self.assertAlmostEqual(state['position'],(initial+1)/state['progress'][0]['total'])

    def test_early_following_progress_survives_promotion_and_reload(self):
        self.choose_profile();self.progress_fixture(85,20)
        expect(self.page.locator('[data-exp-current]')).to_have_text('Beobachter')
        expect(self.page.locator('[data-exp-station="1"]')).to_have_attribute('data-state','open')
        self.assertEqual(self.page.evaluate('RangerHub.expeditionSnapshot().progress[1].done'),20)
        saved=self.state()
        self.page.reload();self.page.wait_for_function('window.RangerHub?.expeditionReady === true')
        self.assert_existing_data_preserved(saved,self.state())
        self.assertEqual(self.page.evaluate('RangerHub.expeditionSnapshot().position'),.85)
        self.page.evaluate("Object.values(db.observerTasks).flat().forEach(t=>{db.observerProgress[session.id][t.id]=true});db.observerBonus[session.id]={A:true,B:true,C:true,R:true};v24SyncStageFor(session.id);v24Persist();render()")
        self.assertEqual(self.page.evaluate('RangerHub.expeditionSnapshot().official'),'Erkunder')
        self.assertEqual(self.page.evaluate('Object.values(db.stageProgress[session.id].Erkunder).filter(Boolean).length'),20)
        self.page.reload();self.page.wait_for_function('window.RangerHub?.expeditionReady === true')
        self.assertEqual(self.page.evaluate('RangerHub.expeditionSnapshot().position'),1.2)

    def test_stages_without_tasks_never_complete_or_unlock_the_next_stage(self):
        self.choose_profile();self.progress_fixture(100,0)
        self.page.evaluate("db.growthTasks.Erkunder=[];v24Persist()")
        state=self.page.evaluate('RangerHub.expeditionSnapshot()')
        self.assertEqual(state['progress'][1]['total'],0)
        self.assertFalse(state['progress'][1]['complete'])
        self.assertFalse(state['progress'][2]['available'])
        self.assertEqual(state['official'],'Erkunder')
        expect(self.page.locator('[data-exp-station="1"] .exp-station-percent')).to_have_text('—')
        self.page.locator('[data-exp-station="1"]').click()
        expect(self.page.locator('#box')).to_contain_text('noch keine Aufgaben hinterlegt')

    def test_locked_stations_accessible_details_keyboard_and_focus_return(self):
        self.choose_profile();self.progress_fixture(79)
        station=self.page.locator('[data-exp-station="1"]')
        expect(station).to_have_attribute('aria-label',re.compile('Erkunder.*gesperrt'))
        station.focus();self.page.keyboard.press('Enter')
        expect(self.page.locator('#box[role=dialog]')).to_be_visible()
        expect(self.page.locator('#box')).to_contain_text('Erreiche zunächst 80% bei Beobachter, um Erkunder freizuschalten.')
        expect(self.page.locator('#expedition-detail-title')).to_be_focused()
        self.page.keyboard.press('Tab');expect(self.page.get_by_role('button',name='Stationsdetails schließen')).to_be_focused()
        self.page.keyboard.press('Shift+Tab');expect(self.page.get_by_role('button',name='← Zur Expeditionskarte',exact=True)).to_be_focused()
        self.page.keyboard.press('Escape');expect(station).to_be_focused()
        self.assertFalse(self.page.evaluate("modal.classList.contains('show')"))

    def test_unlocked_stations_open_existing_tasks_and_logbook_and_return(self):
        self.choose_profile();self.progress_fixture(85,20)
        self.page.locator('[data-exp-station="1"]').click()
        self.page.get_by_role('button',name='Aufgaben öffnen',exact=True).click()
        expect(self.page.locator('#main h1')).to_have_text('Erkunder')
        self.assertGreater(self.page.locator('#main input[type=checkbox]').count(),0)
        self.page.locator('[data-exp-return]').click()
        expect(self.page.locator('.expedition')).to_have_count(1)
        self.page.locator('[data-exp-station="0"]').click()
        self.page.get_by_role('button',name='Logbuch und Inhalte',exact=True).click()
        expect(self.page.get_by_role('heading',name='Beobachter-Stufe',exact=True)).to_be_visible()
        self.page.wait_for_function("[...document.querySelectorAll('#main img')].every(img=>img.complete&&img.naturalWidth>0)")
        self.page.locator('[data-exp-return]').click()
        expect(self.page.locator('.expedition')).to_be_visible()

    def test_existing_pdf_assets_are_accessible_when_present(self):
        self.choose_profile()
        pdf_count=self.page.evaluate("Object.values(typeof v19Pdfs==='undefined'?{}:v19Pdfs).filter(Boolean).length")
        self.page.locator('[data-exp-station="0"]').click()
        if not pdf_count:
            expect(self.page.locator('.exp-detail-pdfs')).to_have_count(0)
        else:
            self.assertEqual(self.page.locator('.exp-detail-pdfs button').count(),pdf_count)
            with self.page.expect_download() as result:
                self.page.locator('.exp-detail-pdfs button').first.click()
            data=Path(result.value.path()).read_bytes()
            self.assertTrue(data.startswith(b'%PDF-'))
            self.assertGreater(len(data),1000)

    def test_read_only_map_does_not_change_people_shared_content_or_progress(self):
        self.choose_profile();before=self.state()
        for index in [0,1,2,3,4]:
            self.page.locator(f'[data-exp-station="{index}"]').click();self.page.keyboard.press('Escape')
        self.page.locator('[data-exp-station="0"]').click();self.page.get_by_role('button',name='Logbuch und Inhalte').click();self.page.locator('[data-exp-return]').click()
        self.assertEqual(self.state(),before)

    def test_curved_marker_motion_threshold_notice_and_reduced_motion(self):
        self.choose_profile();self.progress_fixture(79)
        self.page.evaluate("db.observerProgress[session.id][Object.values(db.observerTasks).flat()[79].id]=true;v24Persist()")
        expect(self.page.locator('.expedition-feedback')).to_contain_text('Erkunder ist jetzt freigeschaltet.')
        self.page.wait_for_function("document.querySelector('.expedition-marker').getAnimations().some(a=>a.playState==='running')")
        frames=self.page.evaluate("document.querySelector('.expedition-marker').getAnimations()[0].effect.getKeyframes()")
        self.assertGreater(len(frames),10);self.assertNotEqual(frames[0]['transform'],frames[-1]['transform'])
        self.page.emulate_media(reduced_motion='reduce')
        self.page.evaluate("db.observerProgress[session.id][Object.values(db.observerTasks).flat()[80].id]=true;v24Persist()")
        self.page.wait_for_function("document.querySelector('.expedition-marker').getAnimations().length===0")
        self.assertAlmostEqual(self.page.evaluate('RangerHub.expeditionSnapshot().position'),.81)

    def test_marker_positions_are_based_on_existing_stage_completion(self):
        self.choose_profile()
        positions=[]
        for value in [0,25,50,75]:
            self.progress_fixture(value,0)
            positions.append(self.page.evaluate("({position:RangerHub.expeditionSnapshot().position,transform:document.querySelector('.expedition-marker').style.transform,offset:document.querySelector('.expedition-scene-d [data-exp-path=\"0\"]').style.strokeDashoffset})"))
        self.assertEqual([p['position'] for p in positions],[0,.25,.5,.75])
        self.assertEqual([p['offset'] for p in positions],['100','75','50','25'])
        self.assertEqual(len(set(p['transform'] for p in positions)),4)

    def test_stamm_switch_and_colliding_person_ids_do_not_mix_progress(self):
        self.choose_profile();self.progress_fixture(85,20)
        home_id=self.page.evaluate('session.id');self.page.evaluate('logout()')
        self.choose_profile('leaders','Admin')
        self.page.locator('#v24-stamm-switch').select_option('meppen')
        expect(self.page.locator('.expedition')).to_have_count(0)
        self.page.evaluate("id=>{db.rangers[0].id=id;delete db.observerProgress[id];delete db.observerBonus[id];delete db.stageProgress[id];v24Persist()}",home_id)
        self.page.evaluate('logout()');self.choose_profile(tribe='meppen')
        other=self.page.evaluate('RangerHub.expeditionSnapshot()')
        self.assertEqual(other['done'],0);self.assertTrue(other['key'].startswith('meppen:'))
        self.progress_fixture(40,0);self.page.evaluate('logout()')
        self.choose_profile(tribe='clp-west')
        home=self.page.evaluate('RangerHub.expeditionSnapshot()')
        self.assertEqual(home['progress'][0]['done'],85);self.assertEqual(home['progress'][1]['done'],20)
        self.page.evaluate('logout()');self.choose_profile('leaders','Stammleiter',tribe='meppen')
        expect(self.page.locator('.expedition')).to_have_count(0)
        self.assertTrue(self.page.evaluate('v24IsStammleiter()'))
        self.page.evaluate("v24SwitchStamm('clp-west')")
        self.assertEqual(self.page.evaluate('v24StammId'),'meppen')

    def test_viewports_touch_targets_no_overlap_or_horizontal_overflow(self):
        self.choose_profile();self.progress_fixture(85,20)
        for width,height in [(1440,900),(1920,1080),(1366,768),(768,1024),(390,844),(375,812),(320,568),(844,390)]:
            with self.subTest(viewport=(width,height)):
                self.page.set_viewport_size({'width':width,'height':height})
                self.page.evaluate("document.documentElement.style.scrollBehavior='auto';scrollTo(0,0);view='dash';render()")
                self.page.wait_for_function('window.RangerHub?.expeditionReady === true')
                metrics=self.page.evaluate("""() => {
                  const terrain=document.querySelector('.expedition-landscape').getBoundingClientRect();
                  const buttons=[...document.querySelectorAll('[data-exp-station]')].map(b=>{const r=b.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}});
                  return{overflow:document.documentElement.scrollWidth-innerWidth,terrain:{left:terrain.left,right:terrain.right,top:terrain.top,bottom:terrain.bottom},buttons};
                }""")
                self.assertLessEqual(metrics['overflow'],1)
                for b in metrics['buttons']:
                    self.assertGreaterEqual(b['width'],44);self.assertGreaterEqual(b['height'],44)
                    self.assertGreaterEqual(b['x'],metrics['terrain']['left']-1);self.assertLessEqual(b['right'],metrics['terrain']['right']+1)
                    self.assertGreaterEqual(b['y'],metrics['terrain']['top']-1);self.assertLessEqual(b['bottom'],metrics['terrain']['bottom']+1)
                    if width>=1024 and height>=768:
                        self.assertGreaterEqual(b['y'],0);self.assertLessEqual(b['bottom'],height,'A desktop station is below the viewport')
                for i,a in enumerate(metrics['buttons']):
                    for b in metrics['buttons'][i+1:]:
                        self.assertFalse(min(a['right'],b['right'])-max(a['x'],b['x'])>1 and min(a['bottom'],b['bottom'])-max(a['y'],b['y'])>1,'Station labels overlap')
                if width<768 or (width<=1023 and height<=500):
                    self.page.wait_for_function("document.querySelector('.expedition-marker').getBoundingClientRect().top>150&&document.querySelector('.expedition-marker').getBoundingClientRect().bottom<innerHeight")

    def test_touch_dialog_close_and_existing_logbook_above_mobile_navigation(self):
        original_page=self.page
        for width,height in [(320,568),(390,844)]:
            context=self.browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2,locale='de-DE',timezone_id='Europe/Berlin')
            try:
                self.page=context.new_page();self.page.on('pageerror',lambda error:self.errors.append(str(error)))
                self.page.goto(self.url);self.page.wait_for_function('window.RangerHub?.expeditionReady === true')
                self.choose_profile();self.progress_fixture(85,20)
                self.page.wait_for_function("document.querySelector('.expedition-marker').getBoundingClientRect().bottom<innerHeight")
                self.page.locator('[data-exp-station="0"]').tap()
                expect(self.page.locator('#box[role=dialog]')).to_be_visible()
                self.page.get_by_role('button',name='Stationsdetails schließen').tap()
                self.assertFalse(self.page.evaluate("modal.classList.contains('show')"))
                self.page.locator('[data-exp-station="1"]').tap()
                self.page.get_by_role('button',name='Logbuch und Inhalte',exact=True).tap()
                expect(self.page.locator('#box')).to_contain_text('Erkunder')
                self.page.locator('#box').get_by_role('button',name='Schließen',exact=True).tap()
                self.assertFalse(self.page.evaluate("modal.classList.contains('show')"))
            finally:
                context.close();self.page=original_page
