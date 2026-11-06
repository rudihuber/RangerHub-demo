"""Source-based V33 acceptance in the actual application, disposable browser data only.

Assertions compare observable UI with deliberately distinct underlying source records.
Fixtures never modify a user's browser or a production service.
"""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,re,secrets,subprocess,tempfile
from urllib.parse import urlsplit
from playwright.sync_api import expect
from v27_cases import V27Cases

VIEWPORTS=[(1440,900),(1366,768),(1920,1080),(768,1024),(390,844),(375,812),(320,568),(844,390)]
STAGES=['Beobachter','Erkunder','Entdecker','Forscher','Meister']

class V33Cases:
    external=V27Cases.external

    def setUp(self):
        V27Cases.setUp(self)
        self.ready()

    def ready(self):
        self.page.wait_for_function('window.RangerHub?.revisionV33Ready === true')

    def choose(self,kind='rangers',role=None,index=0):
        person=self.page.evaluate("a=>db[a.kind].filter(p=>!p.archived&&p.active!==false&&(!a.role||p.role===a.role))[a.index]",{'kind':kind,'role':role,'index':index})
        self.assertIsNotNone(person)
        self.page.evaluate('a=>v24Choose(a.kind,a.id)',{'kind':kind,'id':person['id']})
        self.page.locator('.v33-dashboard').wait_for()
        return person

    def store(self):
        return self.page.evaluate("JSON.parse(localStorage.getItem(document.querySelector('meta[name=rangerhub-storage]').content))")

    def current_session(self):
        return self.page.evaluate("JSON.parse(sessionStorage.getItem(document.querySelector('meta[name=rangerhub-storage]').content+'-session'))")

    def snapshot(self):
        return self.page.evaluate('RangerHub.createLocalKnowledgeTransport().load()')

    def command(self,type,payload):
        return self.page.evaluate("async a=>{try{return {ok:true,result:await RangerHub.createLocalKnowledgeTransport().command(a.type,a.payload)}}catch(e){return {ok:false,error:e.message}}}",{'type':type,'payload':payload})

    def refresh(self):
        self.page.evaluate('async()=>{await RangerHub.refreshKnowledge();}')

    def dashboard(self):
        self.page.evaluate("goV17('dash')")
        self.page.locator('.v33-dashboard').wait_for()

    def nav_item(self,key):
        item=self.page.locator('[data-nav-id="'+key+'"]')
        item.evaluate("el=>{for(let d=el.closest('details');d;d=d.parentElement?.closest('details'))d.open=true;}")
        if self.page.viewport_size['width']<1024:
            toggle=self.page.locator('[data-menu-toggle]')
            if toggle.count() and toggle.get_attribute('aria-expanded')!='true':toggle.click()
        item.click()

    def library(self):
        self.page.evaluate('RangerHub.openBible()')
        self.page.locator('.bible-testaments').wait_for()

    def shelf(self,testament='AT'):
        self.library()
        self.page.locator('[data-kw-action=bible-shelf][data-kw-value='+testament+']').click()
        self.page.locator('.bible-bookcase').wait_for()

    def detail(self,bid='bible-01'):
        self.page.evaluate('id=>RangerHub.openKnowledge("bible-book",id)',bid)
        self.page.locator('[data-bible-book="'+bid+'"]').wait_for()

    def own(self):
        rid=self.current_session()['id']
        return next(r for r in self.snapshot()['ranking'] if str(r['id'])==str(rid))

    def record(self,bid='bible-01'):
        return self.snapshot()['bible']['records'].get(str(self.current_session()['id']),{}).get(bid,{'isRead':False,'version':0})

    def set_chapter(self,n,read=True,bid='bible-01'):
        return self.command('set-bible-chapter',{'bookId':bid,'chapter':n,'isRead':read,'version':self.record(bid)['version']})

    def ui_bible_toggle(self,control,checked):
        control.set_checked(checked)
        expect(control).to_be_enabled()
        expect(control).to_be_checked() if checked else expect(control).not_to_be_checked()

    def set_book(self,read=True,bid='bible-01'):
        return self.command('set-bible-read',{'bookId':bid,'isRead':read,'version':self.record(bid)['version']})

    def wisdom(self,kind='wisdom',id=None):
        self.page.evaluate('a=>RangerHub.openKnowledge(a.kind,a.id)',{'kind':kind,'id':id})
        self.page.locator('.rw-page').wait_for()

    def active_ids(self):
        return self.page.evaluate("db.rangers.filter(p=>!p.archived&&p.active!==false&&p.knowledgeEligible!==false).map(p=>String(p.id))")

    def seed_calendar(self):
        return self.page.evaluate("""()=>{
          const add=n=>{const d=new Date(RangerHub.localDate()+'T12:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)},lid=session.id,other=db.leaders.find(p=>p.id!==lid&&!p.archived).id;
          const base=(id,n,theme)=>({id,date:add(n),theme,start:'18:00',end:'20:00',place:'Jugendwiese Cloppenburg',nature:{enabled:false},impulse:{enabled:false},food:{enabled:false,ingredients:[]},action:{title:'Brücke bauen',leaderId:other},attendance:{rangers:{},leaders:{}}});
          db.meetings=[base(993001,3,'Ranger-Ausflug'),{...base(993002,1,'Abgesagtes Treffen'),cancelled:true},{...base(993003,0,'Archiviertes Treffen'),archived:true}];
          db.leaderMeetings=[{id:994001,date:add(1),start:'19:30',end:'21:00',place:'Gemeindehaus Cloppenburg',info:'Jahresplanung und Dienstverteilung',actions:[{id:'own-decision',text:'Einladungen vorbereiten',leaderId:lid,due:add(1),done:false},{id:'other-decision',text:'Fremde Aufgabe',leaderId:other,due:add(1),done:false}]}];
          db.meetings[0].food={enabled:true,title:'Gemüsesuppe',leaderId:lid,ingredients:[{id:'apples',text:'Test-Äpfel einkaufen',done:false}]};db.meetings[0].impulse={enabled:true,title:'Gott führt uns',leaderId:lid};db.meetings[0].nature={enabled:true,title:'Wanderfalke',leaderId:other};
          db.meetings[0].actions=[{id:'bridge',title:'Brücke bauen',leaderId:other,doings:[{id:'rope',text:'Seile einpacken',leaderId:lid,done:false}]},{id:'fire',title:'Lagerfeuer',leaderId:lid,doings:[]}];
          db.meetings[0].action={...db.meetings[0].actions[0]};v24Persist();render();return {lid,other,rangerId:993001,leaderMeetingId:994001,dates:[add(1),add(3)]};
        }""")

    def test_exact_role_navigation_groups_and_direct_route_guards(self):
        self.choose()
        nav=self.page.locator('.rh33-navigation')
        expect(nav).to_have_attribute('data-navigation-role','ranger')
        self.assertEqual(nav.locator('[data-nav-id]').evaluate_all('els=>els.map(e=>e.dataset.navId)'),['dashboard','messages','knowledge','bible','growth','calendar','participation','wisdom','logout'])
        self.assertEqual(nav.locator('[data-nav-group]').evaluate_all('els=>els.map(e=>e.dataset.navGroup)'),['adventure','stamm','foundations'])
        expect(nav.locator('[data-nav-id=knowledge]')).to_contain_text('Fachwissen-Challenges')
        expect(nav.locator('[data-nav-id=wisdom]')).to_contain_text('Ranger-Bibliothek')
        for key in ['rangers','leaders','leadermeetings','tasks','exams','knowledge-manage','wisdom-manage']:
            expect(nav.locator('[data-nav-id='+key+']')).to_have_count(0)
        for forbidden in ['meetings','leadermeetings','rangers','leaders','tasks','activities','nature','recipes']:
            self.page.evaluate('v=>goV17(v)',forbidden)
            self.assertNotEqual(self.page.evaluate('view'),forbidden)
        self.page.evaluate('RangerHub.openKnowledge("exams")')
        self.assertFalse(self.page.evaluate('RangerHub.navigationRouteAllowedV33("knowledge",{kind:"exams"},RangerHub.knowledgeActor(),{})'));expect(self.page.locator('[data-kw-form=grade-exam],[data-kw-action=grade]')).to_have_count(0)
        self.choose('leaders','Leiter')
        expect(nav).to_have_attribute('data-navigation-role','leader')
        rights=self.snapshot();management=[]
        if rights['rights']['local']:management.append('knowledge-manage')
        if rights['wisdom']['rights']['local']:management.append('wisdom-manage')
        self.assertEqual(nav.locator('[data-nav-group]').evaluate_all('els=>els.map(e=>e.dataset.navGroup)'),['cockpit','teams','development','ideas']+(['management'] if management else []))
        self.assertEqual(nav.locator('[data-nav-group=cockpit] [data-nav-id]').evaluate_all('els=>els.map(e=>e.dataset.navId)'),['meetings','exams','tasks','calendar','participation'])
        self.assertEqual(nav.locator('[data-nav-group=management] [data-nav-id]').evaluate_all('els=>els.map(e=>e.dataset.navId)'),management)
        model_groups=self.page.evaluate('RangerHub.navigationConfigurationV33(RangerHub.knowledgeActor(),{rights:{local:false},wisdom:{rights:{local:false}}}).groups.map(g=>g.id)')
        self.assertEqual(model_groups,['cockpit','teams','development','ideas'])
        self.choose('leaders','Stammleiter')
        expect(nav.locator('[data-nav-group=management]')).to_have_count(1)
        expect(nav.locator('[data-nav-id=knowledge-manage]')).to_have_count(1)
        expect(nav.locator('[data-nav-id=wisdom-manage]')).to_have_count(1)

    def test_navigation_accordion_and_active_parent_persist_without_second_key(self):
        self.choose('leaders','Admin')
        before=self.page.evaluate('Object.keys(localStorage).sort()')
        groups=self.page.locator('.rh33-navigation details[data-nav-group]')
        self.assertGreaterEqual(groups.count(),4)
        for group in groups.all():self.assertFalse(group.evaluate('e=>e.open'))
        group=self.page.locator('details[data-nav-group=development]')
        group.locator('summary').click()
        self.assertTrue(group.evaluate('e=>e.open'))
        self.page.reload();self.ready();self.assertTrue(self.page.locator('details[data-nav-group=development]').evaluate('e=>e.open'))
        self.nav_item('bible')
        expect(self.page.locator('[data-nav-id=bible]')).to_have_attribute('aria-current','page')
        self.page.reload();self.ready()
        expect(self.page.locator('[data-nav-id=bible]')).to_have_attribute('aria-current','page')
        self.assertTrue(self.page.locator('details[data-nav-group=development]').evaluate('e=>e.open'))
        self.assertEqual(self.page.evaluate('Object.keys(localStorage).sort()'),before)

    def test_leader_dashboard_exact_workflow_order_nearest_event_and_real_agenda(self):
        self.choose('leaders','Leiter');fixture=self.seed_calendar()
        self.assertEqual(self.page.locator('[data-dashboard-section]').evaluate_all('els=>els.map(e=>e.dataset.dashboardSection)'),['meeting','tasks','attendance','growth','statistics','birthdays'])
        hero=self.page.locator('[data-dashboard-section=meeting]')
        expect(hero).to_have_attribute('data-next-kind','leader');expect(hero).to_have_attribute('data-next-id',str(fixture['leaderMeetingId']))
        expect(hero).to_contain_text('Leitertreffen');expect(hero).to_contain_text('Jahresplanung und Dienstverteilung');expect(hero).to_contain_text('Morgen')
        expect(hero.locator('[data-planning-kind=food]')).to_have_count(0)
        expect(self.page.locator('.v33-dashboard img,.v33-dashboard .kw-map,.v33-dashboard .expedition,.v33-dashboard .bible-bookcase,.v33-dashboard .v33-attendance-ring')).to_have_count(0)
        self.page.evaluate('() => {db.leaderMeetings[0].cancelled=true;v24Persist();render();}')
        expect(hero).to_have_attribute('data-next-kind','ranger');expect(hero).to_have_attribute('data-next-id',str(fixture['rangerId']))
        expect(hero).to_contain_text('Noch 3 Tage')
        for title in ['Gemüsesuppe','Brücke bauen','Lagerfeuer','Gott führt uns','Wanderfalke']:expect(hero).to_contain_text(title)
        expected=self.page.evaluate('a=>[a.lid,a.other].map(id=>db.leaders.find(p=>p.id===id).name)',fixture)
        for person in expected:expect(hero).to_contain_text(person)
        expect(hero.locator('[data-planning-kind=action]')).to_have_count(2)
        self.page.evaluate('() => {db.meetings=[];db.leaderMeetings=[];render();}')
        expect(self.page.locator('[data-dashboard-section=meeting]')).to_contain_text('kein Ranger- oder Leitertreffen')
        # Compare actual instants across local midnight and the summer offset.
        self.page.clock.set_fixed_time(datetime(2026,12,31,22,15,tzinfo=timezone.utc))
        self.page.evaluate('''()=>{db.meetings=[{id:996001,date:'2026-12-31',start:'23:00',end:'23:10',theme:'Vorbei'},{id:996002,date:'2027-01-01',start:'00:05',end:'01:00',theme:'Neujahr'}];db.leaderMeetings=[{id:996003,date:'2026-12-31',start:'23:30',end:'23:55',info:'Heute Abend'}];render();}''')
        expect(hero).to_have_attribute('data-next-id','996003');expect(hero).to_contain_text('Heute')
        self.assertEqual(self.page.evaluate('RangerHub.dashboardNextEvent("2026-12-31T22:31:00Z").meeting.id'),996002)
        self.page.evaluate('''()=>{db.meetings=[{id:996004,date:'2026-07-11',start:'22:00',end:'22:30'},{id:996005,date:'2026-07-12',start:'00:05',end:'01:00'}];db.leaderMeetings=[{id:996006,date:'2026-07-11',start:'23:00',end:'23:30'}];}''')
        self.assertEqual(self.page.evaluate('RangerHub.dashboardNextEvent("2026-07-11T20:45:00Z").meeting.id'),996006)


    def test_leader_own_tasks_deduplicate_and_save_same_grocery_and_leader_action(self):
        self.choose('leaders','Leiter');fixture=self.seed_calendar()
        section=self.page.locator('[data-dashboard-section=tasks]')
        expect(section).to_contain_text('Test-Äpfel einkaufen');expect(section).to_contain_text('Einladungen vorbereiten')
        expect(section).not_to_contain_text('Fremde Aufgabe')
        expect(section).to_contain_text('Seile einpacken')
        keys=section.locator('[data-todo-key]').evaluate_all('els=>els.map(e=>e.dataset.todoKey)')
        self.assertEqual(len(keys),len(set(keys)))
        grocery=section.locator('[data-todo-key]').filter(has_text='Test-Äpfel einkaufen')
        grocery.locator('input[data-todo-toggle]').check()
        self.assertTrue(self.page.evaluate('db.meetings.find(m=>m.id===993001).food.ingredients.find(i=>i.id==="apples").done'))
        task=section.locator('[data-todo-key]').filter(has_text='Einladungen vorbereiten')
        task.locator('input[data-todo-toggle]').check()
        self.assertTrue(self.page.evaluate('db.leaderMeetings.find(m=>m.id===994001).actions.find(a=>a.id==="own-decision").done'))
        self.page.reload();self.ready()
        self.assertTrue(self.page.evaluate('db.meetings.find(m=>m.id===993001).food.ingredients.find(i=>i.id==="apples").done'))
        self.assertTrue(self.page.evaluate('db.leaderMeetings.find(m=>m.id===994001).actions.find(a=>a.id==="own-decision").done'))
        self.nav_item('tasks')
        completed=self.page.locator('details.v33-done-tasks')
        row=completed.locator('[data-todo-key]').filter(has_text='Test-Äpfel einkaufen')
        expect(row).to_have_count(1);expect(row).not_to_be_visible()
        completed.locator('summary').click();expect(row).to_be_visible();expect(row.locator('input[data-todo-toggle]')).to_be_checked()

    def test_leader_attendance_real_relevance_personal_mean_and_dynamic_roster(self):
        self.choose('leaders','Leiter')
        fixture=self.page.evaluate("""()=>{
          const add=n=>{const d=new Date(RangerHub.localDate()+'T12:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)},[one,two,third]=db.rangers.filter(p=>!p.archived&&p.active!==false),lid=session.id,other=db.leaders.find(p=>p.id!==lid&&!p.archived).id;
          const mk=(id,n,ids,r,l,extra={})=>({id,date:add(n),start:'17:00',end:'19:00',place:'Cloppenburg',theme:'Anwesenheitsprüfung',rangerIds:ids,leaderIds:[lid],action:{title:'Spiel',leaderId:lid},nature:{enabled:false},impulse:{enabled:false},food:{enabled:false,ingredients:[]},attendance:{rangers:r,leaders:l},...extra});
          db.meetings=[mk(995001,-10,[one.id,two.id],{[one.id]:'ANWESEND',[two.id]:'ENTSCHULDIGT'},{[lid]:'ANWESEND'}),mk(995002,-5,[one.id],{[one.id]:'ABWESEND',[two.id]:'ANWESEND'},{[lid]:'ABWESEND'}),mk(995003,-3,[third.id],{[one.id]:'ANWESEND',[two.id]:'ANWESEND'},{[lid]:'ANWESEND'},{leaderIds:[other]}),mk(995004,-2,[one.id,two.id],{[one.id]:'ANWESEND',[two.id]:'ANWESEND'},{[lid]:'ANWESEND'},{cancelled:true}),mk(995005,5,[one.id,two.id],{[one.id]:'ANWESEND',[two.id]:'ANWESEND'},{[lid]:'ANWESEND'})];db.leaderMeetings=[];v24Persist();render();return {one:one.id,two:two.id,third:third.id,lid};
        }""")
        rows=self.page.locator('[data-attendance-person]');self.assertEqual(rows.count(),len(self.active_ids()))
        one=self.page.locator('[data-attendance-person="'+str(fixture['one'])+'"]');two=self.page.locator('[data-attendance-person="'+str(fixture['two'])+'"]')
        expect(one).to_contain_text('50');expect(one).to_contain_text('1 / 2');expect(two).to_contain_text('0');expect(two).to_contain_text('0 / 1')
        section=self.page.locator('[data-dashboard-section=attendance]');expect(section).to_contain_text('25');expect(section).to_contain_text('50')
        stats=self.page.evaluate('a=>({own:RangerHub.dashboardAttendanceStats("leaders",a.lid),one:RangerHub.dashboardAttendanceStats("rangers",a.one),two:RangerHub.dashboardAttendanceStats("rangers",a.two)})',fixture)
        self.assertEqual((stats['own']['attended'],stats['own']['total']),(1,2));self.assertEqual((stats['one']['attended'],stats['one']['total']),(1,2));self.assertEqual((stats['two']['attended'],stats['two']['total']),(0,1))
        self.page.evaluate("() => {db.rangers.push({...structuredClone(db.rangers[0]),id:'new-active-ranger',name:'Neu aufgenommen',birthday:'',archived:false});v24Persist();render();}")
        expect(self.page.locator('[data-attendance-person="new-active-ranger"]')).to_have_count(1)
        self.page.evaluate("db.rangers.find(p=>p.id==='new-active-ranger').archived=true;v24Persist();render()")
        expect(self.page.locator('[data-attendance-person="new-active-ranger"]')).to_have_count(0)

    def test_leader_growth_and_statistics_all_rangers_use_separate_real_sources(self):
        ranger=self.choose();rid=ranger['id']
        for n in [1,2,3]:self.assertTrue(self.set_chapter(n)['ok'])
        self.page.evaluate("id=>{const tasks=Object.values(db.observerTasks).flat();db.observerProgress[id]||={};db.observerProgress[id][tasks[0].id]=true;v24Persist();}",rid)
        self.choose('leaders','Leiter')
        self.assertEqual(self.page.locator('[data-growth-person]').count(),len(self.active_ids()))
        self.assertEqual(self.page.locator('[data-stat-person]').count(),len(self.active_ids()))
        grow=self.page.locator('[data-growth-person="'+str(rid)+'"]');expect(grow).to_contain_text('Beobachter');expect(grow).to_contain_text('1 /')
        stats=self.page.locator('[data-stat-person="'+str(rid)+'"]');expect(stats).to_contain_text('3');expect(stats).to_contain_text('0')
        snap=self.snapshot();row=next(r for r in snap['ranking'] if str(r['id'])==str(rid));self.assertEqual(row['biblePoints'],0);self.assertEqual(row['bibleChapters'],3)
        grow.get_by_role('button').first.click();expect(self.page.locator('main')).to_contain_text(ranger['name'])

    def test_ranger_five_stations_all_66_dashboard_books_and_no_section_numbers(self):
        self.choose()
        self.assertEqual(self.page.locator('[data-dashboard-section]').evaluate_all('els=>els.map(e=>e.dataset.dashboardSection)'),['meeting','attendance','maps','bible','rankings','birthdays'])
        pins=self.page.locator('[data-kw-action=expedition-stage]');self.assertEqual(pins.count(),5)
        self.assertEqual(pins.evaluate_all('els=>els.map(e=>e.dataset.kwValue)'),['0','1','2','3','4'])
        for stage in STAGES:self.assertIn(stage,' '.join(pins.all_text_contents()))
        self.assertEqual(self.page.locator('[data-dashboard-book]').count(),66)
        self.assertEqual(self.page.locator('[data-dashboard-book]').evaluate_all('els=>new Set(els.map(e=>e.dataset.dashboardBook)).size'),66)
        self.assertNotRegex('\n'.join(self.page.locator('.v33-dashboard .section-kicker,.v33-dashboard h1,.v33-dashboard h2').all_text_contents()),r'(?m)^\s*0[1-9]\s*[·.]')
        self.assertNotIn('Dein Weg',self.page.locator('.v33-dashboard').inner_text())
        for i in [0,1,2,3,4]:
            self.page.locator('[data-kw-action=expedition-stage][data-kw-value="'+str(i)+'"]').click()
            expect(self.page.locator('#expedition-detail-title')).to_have_text(STAGES[i]);self.page.keyboard.press('Escape')

    def test_bible_direct_checkbox_is_separate_from_details_and_partial_undo_is_exact(self):
        self.choose();self.shelf()
        direct=self.page.locator('input[data-bible-complete][data-book-id=bible-01]')
        expect(direct).not_to_be_checked();self.page.locator('.bible-book[data-kw-value=bible-01]').click()
        self.assertEqual(self.own()['points'],0)
        for chapter in [1,2,3]:
            self.ui_bible_toggle(self.page.locator('input[data-bible-chapter="'+str(chapter)+'"][data-book-id=bible-01]'),True)
        expect(self.page.locator('[data-bible-chapter-progress]')).to_contain_text(re.compile(r'3\s*/\s*50'))
        expect(self.page.locator('[data-bible-chapter-progress]')).to_contain_text('6')
        expect(self.page.locator('.bible-detail-status')).to_have_text('In Arbeit');self.assertEqual(self.own()['biblePoints'],0)
        self.page.keyboard.press('Escape');self.ui_bible_toggle(direct,True)
        expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0);self.assertEqual(self.own()['biblePoints'],10);self.assertEqual(self.own()['bibleChapters'],50)
        self.ui_bible_toggle(direct,False);self.assertEqual(self.own()['biblePoints'],0);self.assertEqual(self.own()['bibleChapters'],3)
        self.page.locator('.bible-book[data-kw-value=bible-01]').click()
        for chapter in [1,2,3]:expect(self.page.locator('input[data-bible-chapter="'+str(chapter)+'"]')).to_be_checked()
        expect(self.page.locator('input[data-bible-chapter="4"]')).not_to_be_checked()
        self.page.reload();self.ready();expect(self.page.locator('[data-bible-chapter-progress]')).to_contain_text(re.compile(r'3\s*/\s*50'));self.assertEqual(self.own()['biblePoints'],0)

    def test_last_chapter_awards_only_book_value_and_removing_one_reverses_once(self):
        self.choose()
        for n in range(1,50):self.assertTrue(self.set_chapter(n)['ok'])
        self.assertEqual(self.own()['biblePoints'],0);self.assertEqual(self.own()['bibleChapters'],49)
        self.detail();self.ui_bible_toggle(self.page.locator('input[data-bible-chapter="50"]'),True)
        expect(self.page.locator('.bible-detail-status')).to_have_text('Vollständig gelesen');self.assertEqual(self.own()['biblePoints'],10)
        self.ui_bible_toggle(self.page.locator('input[data-bible-chapter="50"]'),False)
        expect(self.page.locator('.bible-detail-status')).to_have_text('In Arbeit');self.assertEqual(self.own()['biblePoints'],0);self.assertEqual(self.own()['bibleChapters'],49)
        self.assertTrue(self.set_chapter(50,False)['ok']);self.assertEqual(self.own()['biblePoints'],0)
        self.assertTrue(self.set_chapter(50,True)['ok']);self.assertEqual(self.own()['biblePoints'],10)
        self.assertEqual(self.page.evaluate('RHBibleCatalog.books.reduce((n,b)=>n+b.chapters,0)'),1189)
        self.assertEqual(self.page.evaluate('RHBibleCatalog.books.filter(b=>b.testament==="AT").reduce((n,b)=>n+b.chapters,0)'),929)
        self.assertEqual(self.page.evaluate('RHBibleCatalog.books.filter(b=>b.testament==="NT").reduce((n,b)=>n+b.chapters,0)'),260)

    def test_legacy_v32_book_marks_migrate_without_awards_or_profile_changes(self):
        self.page.goto(self.url.rsplit('/',1)[0]+'/'+('RangerHub_Webapp_V32_Kompakt.html' if 'Kompakt' in self.url else 'RangerHub_Webapp_V32_Demo.html'))
        self.page.wait_for_function('window.RangerHub?.wisdomReady')
        self.page.evaluate("v24Choose('rangers',db.rangers.find(p=>!p.archived).id)")
        self.assertTrue(self.command('set-bible-read',{'bookId':'bible-01','isRead':True,'version':0})['ok'])
        before=self.store();session=self.current_session();ledger=self.snapshot()['ledger']
        self.page.goto(self.url);self.ready();self.assertEqual(self.current_session(),session)
        self.assert_existing_data_preserved(before,self.store())
        self.assertEqual(self.own()['biblePoints'],10);self.assertEqual(self.own()['bibleChapters'],50);self.assertEqual(self.snapshot()['ledger'],ledger)
        self.detail();expect(self.page.locator('input[data-bible-chapter]:checked')).to_have_count(50)
        self.page.reload();self.ready();self.assertEqual(self.snapshot()['ledger'],ledger)

    def test_chapter_updates_reject_other_profiles_and_keep_three_exam_places(self):
        self.choose();mid=self.snapshot()['nextMeeting']['id']
        tasks=[t['id'] for t in self.snapshot()['catalog']['tasks'] if t['visible'] and isinstance(t.get('points'),int)][:4]
        for tid in tasks[:3]:self.assertTrue(self.command('register-exam',{'taskId':tid,'meetingId':mid})['ok'])
        for n in [1,2,3]:self.assertTrue(self.set_chapter(n)['ok'])
        self.assertFalse(self.command('register-exam',{'taskId':tasks[3],'meetingId':mid})['ok'])
        self.assertEqual(len([e for e in self.snapshot()['exams'] if e['status']=='registered']),3)
        other=self.page.evaluate('db.rangers.find(p=>p.id!==session.id&&!p.archived).id')
        self.assertFalse(self.command('set-bible-chapter',{'bookId':'bible-01','chapter':4,'isRead':True,'version':3,'rangerId':other})['ok'])
        self.choose('leaders','Leiter');self.detail()
        expect(self.page.locator('input[data-bible-chapter]:enabled,input[data-bible-complete]:enabled')).to_have_count(0)
        self.assertFalse(self.command('set-bible-chapter',{'bookId':'bible-01','chapter':1,'isRead':True,'version':0})['ok'])

    def test_original_only_library_has_sixteen_real_modules_and_no_page_metadata(self):
        self.choose('leaders','Stammleiter');snapshot=self.snapshot();modules=snapshot['wisdom']['modules'];self.assertEqual(len(modules),16)
        assets=self.page.evaluate('Object.keys(RHWisdomOriginalAssets)');self.assertEqual(len(assets),43)
        used=set()
        for module in modules:
            self.wisdom('wisdom-module',module['id'])
            expect(self.page.locator('.rw-lesson')).to_have_count(1)
            originals=self.page.locator('img[data-original-asset]')
            if module['id']=='motto':expect(self.page.locator('.rw-source-motto strong')).to_have_text('SEI BEREIT')
            else:self.assertGreater(originals.count(),0)
            gallery=self.page.locator('details.rw-original-gallery')
            if gallery.count():gallery.locator('summary').click()
            for original in originals.all():
                original.scroll_into_view_if_needed()
                expect(original).to_be_visible()
                expect(original).to_have_js_property('complete',True)
                self.assertGreater(original.evaluate('i=>i.naturalWidth'),0)
            used.update(originals.evaluate_all('els=>els.map(e=>e.dataset.originalAsset)'))
            self.assertNotRegex(self.page.locator('.rw-page').inner_text(),r'(?i)(?:Seite|PDF-Seite)\s*\d+')
            expect(self.page.locator('.rw-page embed,.rw-page iframe,.rw-page object,.rw-page .rw-illustration')).to_have_count(0)
            hotspots=self.page.locator('.rw-hotspots button')
            self.assertGreater(hotspots.count(),0)
            hotspots.first.click();self.assertGreater(len(' '.join(self.page.locator('[data-wisdom-detail] p').all_text_contents())),0)
        self.assertEqual(used,set(assets))
        self.choose();self.wisdom();self.assertEqual(len(self.snapshot()['wisdom']['modules']),3)
        self.wisdom('wisdom-module','teamhelfer');expect(self.page.locator('.rw-unavailable')).to_have_count(1)
        self.assertNotRegex(json.dumps(self.snapshot()['wisdom']),r'sourcePage|pdf_page|printed_pages|xref|crop_bbox')

    def test_library_existing_local_edits_and_release_switches_survive_source_upgrade(self):
        self.choose('leaders','Stammleiter')
        self.assertTrue(self.command('wisdom-change',{'scope':'local','kind':'modules','id':'lilie','revision':0,'fields':{'published':True,'title':'Unsere Lilie – besprochen'}})['ok'])
        before=self.store();self.page.reload();self.ready();after=self.store();self.assert_existing_data_preserved(before,after)
        self.choose();self.wisdom('wisdom-module','lilie');expect(self.page.locator('.rw-page')).to_contain_text('Unsere Lilie – besprochen')
        self.choose('leaders','Stammleiter');item=next(m for m in self.snapshot()['wisdom']['modules'] if m['id']=='lilie')
        self.assertTrue(self.command('wisdom-change',{'scope':'local','kind':'modules','id':'lilie','revision':item['localRevision'],'fields':{'published':False}})['ok'])
        self.choose();self.wisdom('wisdom-module','lilie');expect(self.page.locator('.rw-unavailable')).to_have_count(1)
        self.choose('leaders','Admin');self.page.evaluate("v24SwitchStamm('meppen')")
        other=next(m for m in self.snapshot()['wisdom']['modules'] if m['id']=='lilie');self.assertNotEqual(other['title'],'Unsere Lilie – besprochen')

    def test_desktop_phone_tablet_layout_touch_targets_round_ring_and_screenshots(self):
        out=Path(__file__).resolve().parents[1]/'docs/screenshots/v33';out.mkdir(parents=True,exist_ok=True)
        self.page.emulate_media(reduced_motion='reduce')
        for width,height in VIEWPORTS:
            self.page.set_viewport_size({'width':width,'height':height})
            for kind,role in [('leaders','Leiter'),('rangers',None)]:
                self.choose(kind,role);self.page.wait_for_timeout(100)
                self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
                if kind=='rangers':
                    ring=self.page.locator('.v33-attendance-ring svg').bounding_box();self.assertAlmostEqual(ring['width'],ring['height'],delta=.5)
                    self.assertEqual(self.page.locator('[data-kw-action=expedition-stage]').count(),5)
                    self.assertEqual(self.page.locator('[data-dashboard-book]').count(),66)
                else:expect(self.page.locator('.v33-dashboard .expedition,.v33-dashboard .kw-map,.v33-dashboard .v33-attendance-ring')).to_have_count(0)
                weather=self.page.locator('[data-v27-current-weather] .v27-weather-heading h2')
                if width>=1024 and weather.count():
                    self.assertEqual(weather.evaluate('e=>getComputedStyle(e).whiteSpace'),'nowrap')
                self.assertNotRegex('\n'.join(self.page.locator('.v33-dashboard .section-kicker,.v33-dashboard h1,.v33-dashboard h2').all_text_contents()),r'(?m)^\s*0[1-9]\s*[·.]')
                self.page.evaluate('scrollTo({top:0,behavior:"instant"})');self.page.screenshot(path=str(out/f'{kind}-dashboard-{width}x{height}.png'),full_page=True)
        self.choose();self.shelf('NT')
        for label in self.page.locator('.bible-complete-control').all():
            rect=label.bounding_box();self.assertGreaterEqual(rect['width'],44);self.assertGreaterEqual(rect['height'],44)
        self.detail('bible-66')
        for node in self.page.locator('.bible-chapter-grid label').all():
            rect=node.bounding_box();self.assertGreaterEqual(rect['width'],44);self.assertGreaterEqual(rect['height'],44)

    def test_login_network_is_weather_free_and_session_reload_preserves_ranger_points(self):
        self.page.reload();self.ready();self.assertFalse(any('open-meteo' in u for u in self.requests))
        self.choose();self.assertTrue(self.set_chapter(1)['ok']);before=self.store();session=self.current_session()
        self.page.reload();self.ready();self.assertEqual(self.current_session(),session);self.assert_existing_data_preserved(before,self.store())
        self.assertEqual(self.own()['bibleChapters'],1);self.assertEqual(self.own()['biblePoints'],0)
        self.page.set_viewport_size({'width':390,'height':844});toggle=self.page.locator('[data-menu-toggle]');expect(toggle).to_be_visible();toggle.click();expect(toggle).to_have_attribute('aria-expanded','true');self.page.locator('[data-nav-id=wisdom]').click();expect(self.page.locator('.rw-page')).to_be_visible();expect(toggle).to_have_attribute('aria-expanded','false')

    def test_online_chapters_sync_two_independent_devices_and_readonly_leader(self):
        ranger=self.choose();rid=ranger['id'];exported=self.store()
        lid=next(p['id'] for p in exported['stamms']['clp-west']['leaders'] if p.get('role')=='Leiter' and not p.get('archived'))
        tokens=[secrets.token_urlsafe(36) for _ in range(2)]
        principals=[{'id':pid,'kind':kind,'homeStammId':'clp-west','tokenHash':hashlib.sha256(token.encode()).hexdigest(),'expiresAt':'2099-01-01T00:00:00Z'} for pid,kind,token in zip([rid,lid],['rangers','leaders'],tokens)]
        root=Path(__file__).resolve().parents[1];url=urlsplit(self.url)
        with tempfile.TemporaryDirectory(prefix='rangerhub-v33-chapters-online-') as temp:
            cfg=Path(temp)/'config.json';cfg.write_text(json.dumps({'exported':exported,'includeVerifiedKnowledge':True,'dbPath':str(Path(temp)/'chapters.sqlite'),'origin':url.scheme+'://'+url.netloc,'principals':principals}));cfg.chmod(0o600)
            proc=subprocess.Popen(['node',str(root/'tests/run_knowledge_service.mjs'),str(cfg)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
            contexts=[]
            try:
                line=proc.stdout.readline();self.assertTrue(line,proc.stderr.read() if proc.poll() is not None else 'Local service did not start')
                service='http://127.0.0.1:'+str(json.loads(line)['port']);pages=[self.page]
                def server_snapshot():
                    return self.page.evaluate('a=>RangerHub.createHttpKnowledgeTransport({baseURL:a.url,getAccessToken:async()=>a.token}).load()',{'url':service,'token':tokens[0]})
                def server_own():
                    return next(row for row in server_snapshot()['ranking'] if str(row['id'])==str(rid))
                for pid,kind in [(rid,'rangers'),(lid,'leaders')]:
                    ctx=self.browser.new_context(locale='de-DE',timezone_id='Europe/Berlin');contexts.append(ctx);ctx.route('https://**/*',lambda r:r.abort())
                    page=ctx.new_page();page.goto(self.url);page.wait_for_function('window.RangerHub?.revisionV33Ready===true');page.evaluate('a=>v24Choose(a.kind,a.id)',{'kind':kind,'id':pid});pages.append(page)
                for page,token in zip(pages,[tokens[0],tokens[0],tokens[1]]):
                    page.evaluate('a=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:a.url,getAccessToken:async()=>a.token}))',{'url':service,'token':token})
                    expect(page.locator('.v33-dashboard')).to_have_attribute('data-knowledge-mode','online')
                self.detail();self.ui_bible_toggle(self.page.locator('input[data-bible-chapter="1"]'),True)
                second,leader=pages[1:]
                second.evaluate('async()=>{await RangerHub.refreshKnowledge()}');second.evaluate('RangerHub.openKnowledge("bible-book","bible-01")')
                expect(second.locator('input[data-bible-chapter="1"]')).to_be_checked()
                self.ui_bible_toggle(second.locator('input[data-bible-chapter="2"]'),True)
                self.refresh();expect(self.page.locator('[data-bible-chapter-progress]')).to_contain_text(re.compile(r'2\s*/\s*50'));self.assertEqual(server_own()['biblePoints'],0)
                self.ui_bible_toggle(self.page.locator('.bible-detail input[data-bible-complete]'),True)
                self.assertEqual(server_own()['biblePoints'],10);self.assertEqual(server_own()['bibleChapters'],50)
                self.assertEqual(server_snapshot()['bible']['records'][str(rid)]['bible-01']['chapterState']['chapters'],[1,2])
                second.evaluate('async()=>{await RangerHub.refreshKnowledge()}');expect(second.locator('input[data-bible-chapter]:checked')).to_have_count(50)
                self.ui_bible_toggle(second.locator('.bible-detail input[data-bible-complete]'),False)
                self.refresh();expect(self.page.locator('[data-bible-chapter-progress]')).to_contain_text(re.compile(r'2\s*/\s*50'));self.assertEqual(server_own()['bibleChapters'],2);self.assertEqual(server_own()['biblePoints'],0)
                restored=server_snapshot()['bible']['records'][str(rid)]['bible-01']['chapterState'];self.assertEqual(restored['chapters'],[1,2]);self.assertFalse(restored['explicit'])
                leader.evaluate('async()=>{await RangerHub.refreshKnowledge()}');leader.evaluate('RangerHub.openBible()');leader.locator('[data-bible-reader]').select_option(str(rid));leader.evaluate('RangerHub.openKnowledge("bible-book","bible-01")')
                expect(leader.locator('[data-bible-chapter-progress]')).to_contain_text(re.compile(r'2\s*/\s*50'));expect(leader.locator('input[data-bible-chapter]:checked')).to_have_count(2)
                expect(leader.locator('input[data-bible-chapter]:enabled,input[data-bible-complete]:enabled')).to_have_count(0)
                second.reload();second.wait_for_function('window.RangerHub?.revisionV33Ready===true')
                second.evaluate('a=>RangerHub.setKnowledgeTransport(RangerHub.createHttpKnowledgeTransport({baseURL:a.url,getAccessToken:async()=>a.token}))',{'url':service,'token':tokens[0]})
                expect(second.locator('[data-bible-chapter-progress]')).to_contain_text(re.compile(r'2\s*/\s*50'))
            finally:
                for ctx in contexts:ctx.close()
                proc.terminate();proc.communicate(timeout=10)
