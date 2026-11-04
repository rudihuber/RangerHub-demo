from playwright.sync_api import expect
from browser_case import BrowserCase


class RangerViewTests(BrowserCase):
    def test_public_forecast_uses_meeting_location_and_renders_in_its_own_modal(self):
        from urllib.parse import urlparse, parse_qs
        requested=[]
        def geocode(route):
            requested.append(parse_qs(urlparse(route.request.url).query).get('name'))
            route.fulfill(json={'results':[{'name':'Hamburg','country_code':'DE','latitude':53.55,'longitude':9.99}]})
        self.page.route('https://geocoding-api.open-meteo.com/**',geocode)
        self.page.route('https://api.brightsky.dev/**',lambda route:route.fulfill(status=503,body='Unavailable'))
        self.page.route('https://api.open-meteo.com/**',lambda route:route.fulfill(json={'current':{'temperature_2m':12,'weather_code':3,'wind_speed_10m':8},'daily':{'weather_code':[3],'temperature_2m_min':[8],'temperature_2m_max':[14],'precipitation_probability_max':[40],'wind_speed_10m_max':[9]}}))
        self.fixture_meetings();self.login('JB','Ranger')
        expect(self.page.locator('#nextWeather')).to_contain_text('Hamburg')
        expect(self.page.locator('#nextWeather')).to_contain_text('8–14 °C')
        self.page.evaluate('openRangerMeeting(504)')
        expect(self.page.locator('#box [data-meeting-forecast]')).to_contain_text('Hamburg')
        expect(self.page.locator('#box [data-meeting-forecast]')).to_contain_text('8–14 °C')
        self.assertTrue(requested);self.assertTrue(all(name==['Hamburg'] for name in requested))

    def fixture_meetings(self):
        self.page.evaluate("""() => {
          const day=n=>new Date(Date.parse(RangerHub.localDate()+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
          const me=db.rangers.find(p=>p.name==='JB').id;
          const make=(id,n,status)=>({id,date:day(n),start:'18:00',end:'20:00',place:'Hamburg',theme:'Rangertreffen',nature:{enabled:true,title:'Geheimes Naturthema'},action:{title:'Interne Aktion'},impulse:{enabled:true,title:'Interner Impuls'},food:{enabled:true,title:'Internes Essen',ingredients:[]},attendance:{rangers:status?{[me]:status}:{},leaders:{}}});
          db.meetings=[make(500,-4,'ANWESEND'),make(501,-3,'ABWESEND'),make(502,-2,'ENTSCHULDIGT'),make(503,-1,null),make(504,2,'ANWESEND'),make(505,5,null)];
          db.cancellations=[];v24Persist();render();
        }""")

    def test_meeting_archive_is_closed_and_loaded_only_on_request_for_leaders(self):
        for profile, role in [('RH','Admin'),('PM','Stammleiter'),('DL','Leiter')]:
            with self.subTest(role=role):
                self.login(profile, role)
                self.fixture_meetings()
                self.nav('Ranger-Treffen')
                expect(self.page.locator('.meeting-list').first.locator('article')).to_have_count(2)
                expect(self.page.locator('[data-past-meetings] article')).to_have_count(0)
                expect(self.page.locator('.meeting-archive')).not_to_have_attribute('open', '')
                self.page.locator('.meeting-archive>summary').click()
                expect(self.page.locator('[data-past-meetings] article')).to_have_count(4)
                expect(self.page.locator('[data-meeting-id="500"]')).to_be_visible()
                self.page.locator('.meeting-archive>summary').click()
                expect(self.page.locator('[data-meeting-id="500"]')).to_be_hidden()
                self.nav('Benutzer wechseln')

    def test_ranger_has_no_navigation_or_direct_access_to_planning_libraries(self):
        self.login('JB','Ranger')
        for label in ['Ranger-Treffen','Rezepte','Naturphänomene','Leitermeetings','Aktionen','Meine Aufgaben']:
            expect(self.page.locator('.nav').get_by_role('button',name=label,exact=True)).to_have_count(0)
        before=self.state()
        self.page.evaluate("""() => {
          for(const target of ['meetings','recipes','activities','nature','leadermeetings','tasks','lastmeeting'])goV17(target);
          meetings();nature();activities();leadermeetings();lastmeeting();RangerHub.renderRecipes();
          actionFormV15();absenceForm();attendance(100);mAtt(100,'rangers',session.id,'ABWESEND');
          view='meetings';render();
        }""")
        expect(self.page.locator('.dash-editorial')).to_be_visible()
        self.assertFalse(self.page.evaluate("modal.classList.contains('show')"))
        self.assertEqual(before,self.state())

    def test_ranger_dashboard_and_calendar_show_only_public_meeting_details(self):
        self.login('JB','Ranger');self.fixture_meetings()
        for secret in ['Geheimes Naturthema','Interne Aktion','Interner Impuls','Internes Essen']:
            expect(self.page.locator('#main')).not_to_contain_text(secret)
        expect(self.page.locator('.ranger-meeting')).to_contain_text('Hamburg')
        expect(self.page.locator('.ranger-meeting button')).to_have_count(1)
        expect(self.page.locator('.ranger-meeting button')).to_have_text('Für dieses Treffen abmelden')
        self.page.evaluate('openRangerMeeting(504)')
        expect(self.page.locator('#box')).to_contain_text('Hamburg')
        expect(self.page.locator('#box .bigCancel')).to_have_count(0)
        for secret in ['Geheimes Naturthema','Interne Aktion','Interner Impuls','Internes Essen']:
            expect(self.page.locator('#box')).not_to_contain_text(secret)
        self.page.evaluate('closeM();openRangerMeeting(500)')
        self.assertFalse(self.page.evaluate("modal.classList.contains('show')"))
        self.nav('Kalender')
        self.assertFalse(self.page.locator('.calendar .event[title*="Planung"]').count())

    def test_own_attendance_uses_only_recorded_past_meetings_and_has_empty_state(self):
        self.login('JB','Ranger');self.fixture_meetings();self.nav('Teilnahme')
        self.assertEqual(self.page.evaluate('RangerHub.attendanceStats()'),{'attended':1,'excused':1,'absent':1,'total':3,'percent':33})
        expect(self.page.locator('.attendance-ring')).to_have_attribute('aria-label','Anwesenheitsquote 33 Prozent bei 3 erfassten Treffen')
        expect(self.page.locator('.attendance-ring strong')).to_have_text('33%')
        expect(self.page.locator('[data-participation-id]')).to_have_count(2)
        self.page.evaluate("db.meetings.forEach(m=>{delete m.attendance.rangers[session.id]});v24Persist();abs()")
        expect(self.page.locator('.attendance-ring strong')).to_have_text('—')
        expect(self.page.locator('.attendance-description')).to_contain_text('erste Teilnahme')

    def test_cancellation_is_own_future_only_and_only_in_participation_then_survives_reload(self):
        self.login('JB','Ranger');self.fixture_meetings()
        self.page.evaluate('cancel(504);RangerHub.showCancellation(504);RangerHub.withdrawCancellation(504)')
        self.assertEqual(self.page.evaluate('db.cancellations'),[])
        self.nav('Teilnahme')
        self.page.evaluate('RangerHub.showCancellation(500)')
        expect(self.page.locator('.cancellation-form')).to_have_count(0)
        self.page.locator('[data-participation-id="504"] button').click()
        self.page.locator('.cancellation-form textarea').fill('Ich bin auf einer Familienfeier.')
        self.page.get_by_role('button',name='Absage speichern',exact=True).click()
        record=self.page.evaluate('db.cancellations[0]')
        self.assertEqual(record['personId'],11);self.assertEqual(record['meetingId'],504)
        self.assertEqual(record['reason'],'Ich bin auf einer Familienfeier.')
        self.reload(role='Ranger');self.nav('Teilnahme')
        expect(self.page.locator('[data-participation-id="504"]')).to_contain_text('Du bist abgemeldet')
        self.nav('Benutzer wechseln');self.login('DL','Leiter');self.page.evaluate('openRangerMeeting(504)')
        expect(self.page.locator('#box')).to_contain_text('JB · Ich bin auf einer Familienfeier.')
        self.page.evaluate('closeM()');self.nav('Benutzer wechseln');self.login('JB','Ranger');self.nav('Teilnahme')
        self.page.locator('[data-participation-id="504"]').get_by_role('button',name='Absage zurücknehmen').click()
        self.assertEqual(self.page.evaluate('db.cancellations'),[])
        self.reload(role='Ranger');self.nav('Teilnahme')
        expect(self.page.locator('[data-participation-id="504"]')).to_contain_text('Du bist eingeplant')

    def test_existing_period_absence_is_respected_and_not_deleted_by_withdrawal(self):
        self.login('JB','Ranger');self.fixture_meetings()
        self.page.evaluate("db.absences.push({id:999,kind:'rangers',personId:session.id,from:db.meetings[4].date,to:db.meetings[4].date,reason:'Urlaub'});v24Persist()")
        self.nav('Teilnahme')
        expect(self.page.locator('[data-participation-id="504"] button')).to_be_disabled()
        self.page.evaluate('RangerHub.showCancellation(504);RangerHub.withdrawCancellation(504)')
        expect(self.page.locator('.cancellation-form')).to_have_count(0)
        self.assertEqual(self.page.evaluate('db.absences.length'),1)

    def test_growth_locks_are_visible_before_click_and_alignment_matches_color_bands(self):
        self.login('JB','Ranger')
        for width in [1440,1024,768,640,390]:
            self.page.set_viewport_size({'width':width,'height':1000});self.nav('Wachstumspfad')
            for stage in ['Erkunder','Entdecker','Forscher','Meister']:
                button=self.page.locator(f'.growth-stage[data-stage="{stage}"]')
                expect(button).to_be_disabled();expect(button.locator('.stage-lock')).to_be_visible()
                self.assertNotIn('80',button.inner_text())
            self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
            if width>760:
                bounds=self.page.evaluate("""() => {
                  const a=document.querySelector('.growth-art img').getBoundingClientRect(),s=document.querySelector('.growth-stages').getBoundingClientRect();
                  return {difference:Math.abs(a.bottom-s.bottom)+Math.abs(a.top-s.top),stages:[...document.querySelectorAll('.growth-stage')].map(el=>({name:el.dataset.stage,top:(el.getBoundingClientRect().top-a.top)/a.height,bottom:(el.getBoundingClientRect().bottom-a.top)/a.height}))};
                }""")
                self.assertLess(bounds['difference'],2)
                self.assertAlmostEqual(bounds['stages'][0]['top'],.174,delta=.01)
                self.assertAlmostEqual(bounds['stages'][-1]['bottom'],1,delta=.01)
            self.assertEqual(self.page.locator('.growth-art-label h2').first.evaluate('el=>getComputedStyle(el).fontFamily'),self.page.locator('.growth-stage h2').first.evaluate('el=>getComputedStyle(el).fontFamily'))
        expect(self.page.locator('.growth-art img')).to_have_attribute('src','assets/growth-journey-clean.png')

    def test_personal_growth_overall_categories_ranking_and_eighty_percent_unlock(self):
        self.login('JB','Ranger')
        self.page.evaluate("""() => {
          const tasks=Object.values(db.observerTasks).flat();
          db.observerProgress[11]=Object.fromEntries(tasks.slice(0,19).map(t=>[t.id,true]));
          db.observerProgress[12]=Object.fromEntries(tasks.slice(0,2).map(t=>[t.id,true]));
          v24Persist();render();
        }""")
        stats=self.page.evaluate('RangerHub.growthStats(session.id)')
        self.assertEqual(stats['done'],19);self.assertEqual(stats['total'],83);self.assertEqual(stats['percent'],23)
        expect(self.page.locator('.personal-growth-total strong')).to_have_text('23%')
        expect(self.page.locator('[data-own-ranking] .rank-number')).to_have_text('01')
        self.assertEqual(self.page.locator('.growth-ranking li').count(),8)
        self.page.locator('.growth-area-breakdown>summary').click()
        expect(self.page.locator('.personal-area').first).to_be_visible()
        self.nav('Wachstumspfad');expect(self.page.locator('[data-stage="Erkunder"]')).to_be_disabled()
        self.page.evaluate("const task=Object.values(db.observerTasks).flat()[19];db.observerProgress[session.id][task.id]=true;v24Persist();render()")
        expect(self.page.locator('[data-stage="Erkunder"]')).to_be_enabled()
        expect(self.page.locator('[data-stage="Entdecker"]')).to_be_disabled()
        self.page.locator('[data-stage="Erkunder"]').click()
        expect(self.page.locator('.obsTask input').first).to_be_disabled()

    def test_sidebar_only_admin_has_switcher_and_ranking_is_scoped_to_tribe(self):
        for profile,role in [('RH','Admin'),('PM','Stammleiter'),('DL','Leiter'),('JB','Ranger')]:
            self.login(profile,role)
            expect(self.page.locator('.side .v24-tribeLabel')).to_have_count(0)
            expect(self.page.locator('.side .v22-sidefoot')).to_have_count(0)
            expect(self.page.locator('#v24-stamm-switch')).to_have_count(1 if role=='Admin' else 0)
            expect(self.page.locator('.nav').get_by_role('button',name='Teilnahme',exact=True)).to_have_count(1)
            if role=='Admin':
                self.page.locator('#v24-stamm-switch').select_option('meppen')
                self.assertEqual(self.page.locator('.growth-ranking li').count(),10)
                expect(self.page.locator('.growth-ranking')).not_to_contain_text('JB')
                self.page.locator('#v24-stamm-switch').select_option('clp-west')
            self.nav('Benutzer wechseln')

    def test_login_slogans_removed_and_dashboard_countdown_empty_and_today_states(self):
        expect(self.page.locator('.entry-story')).not_to_contain_text('Draußen unterwegs')
        expect(self.page.locator('.entry-bottom')).to_have_count(0)
        self.login('JB','Ranger');self.fixture_meetings()
        expect(self.page.locator('.countdown-note .big')).to_have_text('02')
        self.page.evaluate("db.meetings[4].date=RangerHub.localDate();render()")
        expect(self.page.locator('.countdown-note')).to_contain_text('Heute geht’s los!')
        self.page.evaluate('db.meetings=[];render()')
        expect(self.page.locator('.countdown-note .big')).to_have_text('—')
        expect(self.page.locator('.countdown-note')).to_contain_text('Ein neuer Termin folgt.')
        expect(self.page.locator('#main')).not_to_contain_text('11 Menschen')
