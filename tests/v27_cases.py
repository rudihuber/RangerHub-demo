"""V27 behaviour in real Chromium, temporary browser data only."""
import base64
from datetime import date, timedelta
import io
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, urlparse

from PIL import Image
from playwright.sync_api import expect


def photo_fixture():
    image = Image.new('RGB', (1600, 1000), '#667c4f')
    out = io.BytesIO()
    image.save(out, 'JPEG')
    return out.getvalue()


class V27Cases:
    def setUp(self):
        self.context = self.browser.new_context(locale='de-DE', timezone_id='Europe/Berlin')
        self.addCleanup(self.context.close)
        self.context.route('https://**/*', self.external)
        self.page = self.context.new_page()
        self.page.set_default_timeout(10000)
        self.errors = []
        self.requests = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.on('request', lambda r: self.requests.append(r.url))
        self.page.goto(self.url, wait_until='load')
        self.page.wait_for_function('window.RangerHub?.v27Ready === true')

    def external(self, route):
        url = urlparse(route.request.url)
        query = parse_qs(url.query)
        if url.hostname == 'geocoding-api.open-meteo.com':
            return route.fulfill(json={'results': [{'name': 'Bremen', 'latitude': 53.0793, 'longitude': 8.8017, 'country_code': 'DE', 'postcodes': ['28195']}]})
        if url.hostname == 'api.open-meteo.com':
            day = query.get('start_date', [date.today().isoformat()])[0]
            return route.fulfill(json={'current': {'temperature_2m': 12.4, 'apparent_temperature': 9.6, 'weather_code': 3, 'relative_humidity_2m': 76, 'precipitation': .3, 'wind_speed_10m': 18, 'wind_direction_10m': 225, 'wind_gusts_10m': 34, 'time': day+'T12:00'}, 'daily': {'time': [day], 'weather_code': [3], 'temperature_2m_min': [7], 'temperature_2m_max': [15], 'precipitation_probability_max': [45], 'wind_speed_10m_max': [22], 'wind_gusts_10m_max': [35], 'wind_direction_10m_dominant': [225], 'sunrise': [day+'T07:20'], 'sunset': [day+'T17:10'], 'uv_index_max': [2]}, 'hourly': {'time': [day+'T18:00'], 'temperature_2m': [11], 'relative_humidity_2m': [78], 'weather_code': [2], 'wind_speed_10m': [21], 'wind_direction_10m': [270], 'wind_gusts_10m': [37], 'precipitation_probability': [55]}})
        route.abort()

    def leader(self, role='Admin'):
        self.page.evaluate("role => { const p=db.leaders.find(p => p.role===role && !p.archived) || db.leaders.find(p=>!p.archived); v24Choose('leaders',p.id); }", role)
        self.page.locator('.nav').wait_for(state='attached')

    def ranger(self):
        return self.page.evaluate("() => {const p=db.rangers.find(p=>!p.archived); v24Choose('rangers',p.id); return p.id;}")

    def add_meeting(self, offset=1, place='Jugendwiese Cloppenburg', title='V27 Testtreffen'):
        return self.page.evaluate("""a => {const d=new Date(RangerHub.localDate()+'T12:00Z');d.setUTCDate(d.getUTCDate()+a.offset);const m={id:Date.now()+Math.floor(Math.random()*10000),date:d.toISOString().slice(0,10),theme:a.title,start:'18:00',end:'20:00',place:a.place,nature:{enabled:false},impulse:{enabled:false},action:{title:'Orientierung',leaderId:db.leaders[0].id},food:{enabled:false,ingredients:[]},attendance:{rangers:{},leaders:{}}};db.meetings.push(m);v24Persist();return m.id;}""", {'offset': offset, 'place': place, 'title': title})

    def form(self, mid=None):
        if mid is None: mid = self.add_meeting()
        self.page.evaluate('id=>meetingFormV15(id)', mid)
        return self.page.locator('#meeting-planning-form'), mid

    def test_weather_town_postcode_and_detailed_current(self):
        self.leader()
        expected = self.page.evaluate("() => ['Jugendwiese Cloppenburg','Jugendwiese, 49661 Cloppenburg','Sportplatz, 28195 Bremen','Gemeindehaus'].map(RangerHub.parseWeatherPlace)")
        self.assertEqual([x['name'] for x in expected], ['Cloppenburg', 'Cloppenburg', 'Bremen', 'Cloppenburg'])
        weather = self.page.locator('[data-v27-current-weather]')
        expect(weather).to_contain_text('Cloppenburg')
        expect(weather).to_contain_text('34 km/h')
        expect(weather).to_contain_text('76 %')
        self.assertLess(self.page.locator('[data-v27-current-weather]').bounding_box()['y'], self.page.locator('.dash-intro').bounding_box()['y'])
        m = self.add_meeting(1, 'Jugendwiese, 28195 Bremen')
        self.page.evaluate('id => {const m=db.meetings.find(m=>m.id===id);loadMeetingWeather(m);}', m)
        expect(self.page.locator('#nextWeather')).to_contain_text('Bremen')
        expect(self.page.locator('#nextWeather')).to_contain_text('37 km/h')
        geo = [parse_qs(urlparse(u).query)['name'][0] for u in self.requests if 'geocoding-api' in u]
        self.assertIn('28195', geo)
        self.assertFalse(any('Jugendwiese' in u for u in self.requests))
        self.page.evaluate("v24SwitchStamm('meppen')")
        expect(self.page.locator('[data-v27-current-weather]')).to_contain_text('Meppen')

    def test_forecast_limits_and_network_failure_are_honest(self):
        self.leader()
        mid = self.add_meeting(20, 'Jugendwiese Cloppenburg')
        self.page.evaluate('id=>loadMeetingWeather(db.meetings.find(m=>m.id===id))', mid)
        expect(self.page.locator('#nextWeather')).to_contain_text('Noch keine Wetterprognose')
        self.page.route('https://api.open-meteo.com/**', lambda route: route.abort())
        mid = self.add_meeting(3, 'Jugendwiese Meppen')
        self.page.evaluate('id=>loadMeetingWeather(db.meetings.find(m=>m.id===id))', mid)
        expect(self.page.locator('#nextWeather')).to_contain_text('Wetter gerade nicht verfügbar')

    def test_birthdays_are_last_number_four(self):
        for role in ['Admin', 'Ranger']:
            self.ranger() if role == 'Ranger' else self.leader()
            sections = self.page.locator('.dash-body > .dash-section')
            self.assertEqual(sections.count(), 4)
            expect(sections.last).to_contain_text('Geburtstag')
            expect(sections.last.locator('.number')).to_have_text('04')
            self.assertEqual(sections.locator('.number').all_text_contents(), ['01','02','03','04'])

    def test_planning_close_warns_continue_discard_and_save(self):
        self.leader()
        form, mid = self.form()
        old = form.locator('[name=theme]').input_value()
        form.locator('[name=theme]').fill('Geänderte Planung')
        self.page.locator('#box').get_by_role('button',name='Schließen',exact=True).click()
        expect(self.page.locator('#v27-unsaved')).to_be_visible()
        self.page.get_by_role('button',name='Weiter bearbeiten',exact=True).click()
        expect(form).to_be_visible()
        self.page.locator('#box').get_by_role('button',name='Schließen',exact=True).click()
        self.page.get_by_role('button',name='Änderungen verwerfen',exact=True).click()
        self.assertEqual(self.page.evaluate('id=>db.meetings.find(m=>m.id===id).theme', mid), old)
        form, _ = self.form(mid)
        form.locator('[name=theme]').fill('Gespeicherte Planung')
        self.page.locator('#box').get_by_role('button',name='Schließen',exact=True).click()
        self.page.get_by_role('button',name='Änderungen speichern',exact=True).click()
        expect(self.page.locator('#modal')).not_to_have_class(re.compile('show'))
        self.assertEqual(self.page.evaluate('id=>db.meetings.find(m=>m.id===id).theme', mid),'Gespeicherte Planung')
        self.page.reload(); self.page.wait_for_function('window.RangerHub?.v27Ready')
        self.assertEqual(self.page.evaluate('id=>db.meetings.find(m=>m.id===id).theme', mid),'Gespeicherte Planung')

    def test_planning_guard_escape_backdrop_navigation_and_stamm_switch(self):
        self.leader(); form, mid = self.form()
        form.locator('[name=details]').fill('Nicht verlieren')
        self.page.keyboard.press('Escape')
        expect(self.page.locator('#v27-unsaved')).to_be_visible()
        self.page.keyboard.press('Escape')
        expect(form).to_be_visible()
        self.page.evaluate("goV17('calendar')")
        expect(self.page.locator('#v27-unsaved')).to_be_visible()
        self.page.get_by_role('button',name='Weiter bearbeiten',exact=True).click()
        self.page.evaluate("v24SwitchStamm('meppen')")
        expect(self.page.locator('#v27-unsaved')).to_be_visible()
        self.page.get_by_role('button',name='Weiter bearbeiten',exact=True).click()
        self.assertEqual(self.page.evaluate('v24StammId'),'clp-west')
        self.page.locator('#modal').click(position={'x':2,'y':2})
        expect(self.page.locator('#v27-unsaved')).to_be_visible()
        self.page.get_by_role('button',name='Änderungen verwerfen',exact=True).click()

    def test_invalid_plan_stays_open_when_save_requested(self):
        self.leader(); form, _ = self.form()
        form.locator('[name=date]').fill('')
        self.page.evaluate('closeM()')
        self.page.get_by_role('button',name='Änderungen speichern',exact=True).click()
        expect(form).to_be_visible()
        self.assertFalse(form.evaluate('(f)=>f.checkValidity()'))

    def test_attendance_checkboxes_cancellations_and_explicit_save(self):
        self.leader(); mid = self.add_meeting(-1)
        pid = self.page.evaluate('db.rangers[0].id')
        self.page.evaluate("a=>{db.cancellations.push({meetingId:a.mid,kind:'rangers',personId:a.pid,reason:'Familientermin'});v24Persist();attendance(a.mid)}",{'mid':mid,'pid':pid})
        expect(self.page.locator('#v27-attendance select')).to_have_count(0)
        expect(self.page.locator('#v27-attendance')).to_contain_text('Familientermin')
        self.assertEqual(self.page.evaluate('id=>Object.keys(db.meetings.find(m=>m.id===id).attendance.rangers).length',mid),0)
        check = self.page.locator(f'input[name="rangers:{pid}"]')
        check.check()
        self.page.get_by_role('button',name='Anwesenheit speichern',exact=True).click()
        self.assertEqual(self.page.evaluate('a=>db.meetings.find(m=>m.id===a.mid).attendance.rangers[a.pid]',{'mid':mid,'pid':pid}),'ANWESEND')
        self.page.evaluate('id=>attendance(id)',mid)
        self.page.locator(f'input[name="rangers:{pid}"]').uncheck()
        self.page.get_by_role('button',name='Anwesenheit speichern',exact=True).click()
        self.assertEqual(self.page.evaluate('a=>db.meetings.find(m=>m.id===a.mid).attendance.rangers[a.pid]',{'mid':mid,'pid':pid}),'ENTSCHULDIGT')

    def test_confirmation_has_date_leader_reload_and_role_protection(self):
        self.leader('Leiter')
        info = self.page.evaluate("""() => {const p=db.rangers[0],t=Object.values(db.observerTasks).flat().find(t=>!t.title.toLowerCase().includes('knot'));db.observerProgress[p.id]||={};db.observerProgress[p.id][t.id]=false;observerTasks(p.id);return {pid:p.id,id:t.id,leader:currentUser().name};}""")
        self.page.evaluate('a=>toggleObsTask(a.pid,a.id,true)',info)
        expect(self.page.locator('.v27-confirmation').first).to_contain_text('Bestätigt am')
        expect(self.page.locator('.v27-confirmation').first).to_contain_text(info['leader'])
        before = self.page.evaluate('db.taskConfirmations')
        self.page.reload();self.page.wait_for_function('window.RangerHub?.v27Ready')
        self.assertEqual(self.page.evaluate('db.taskConfirmations'),before)
        self.ranger()
        self.page.evaluate('a=>toggleObsTask(a.pid,a.id,false)',info)
        self.assertTrue(self.page.evaluate('a=>db.observerProgress[a.pid][a.id]',info))
        self.page.evaluate('id=>observerTasks(id)',info['pid'])
        self.assertTrue(all(self.page.locator('.obsTask input').nth(i).is_disabled() for i in range(self.page.locator('.obsTask input').count())))

    def test_knots_require_two_distinct_meeting_days_and_keep_legacy(self):
        self.leader('Leiter')
        first=self.add_meeting(-3);second=self.add_meeting(-1)
        info=self.page.evaluate("""() => {const p=db.rangers[0],t=Object.values(db.observerTasks).flat().find(t=>/knot/i.test(t.title));db.observerProgress[p.id]||={};db.observerProgress[p.id][t.id]=false;observerTasks(p.id);return {pid:p.id,id:t.id};}""")
        card=self.page.locator(f'[data-knot-task="{info["id"]}"]')
        card.evaluate('(el)=>{el.closest("details").open=true}')
        expect(card.locator('input[type=checkbox]')).to_have_count(2)
        card.locator('select').nth(0).select_option(str(first));card.locator('input').nth(0).check()
        self.assertFalse(self.page.evaluate('a=>db.observerProgress[a.pid][a.id]',info))
        card.locator('select').nth(1).select_option(str(first));card.locator('input').nth(1).click()
        expect(self.page.locator('#v27-feedback')).to_contain_text('unterschiedlichen Tagen')
        self.assertFalse(self.page.evaluate('a=>db.observerProgress[a.pid][a.id]',info))
        card.locator('select').nth(1).select_option(str(second));card.locator('input').nth(1).check()
        self.assertTrue(self.page.evaluate('a=>db.observerProgress[a.pid][a.id]',info))
        self.assertEqual(len(self.page.evaluate('a=>db.taskConfirmations[a.pid].Beobachter[a.id].demonstrations',info)),2)
        self.page.reload();self.page.wait_for_function('window.RangerHub?.v27Ready')
        self.page.evaluate('id=>observerTasks(id)',info['pid']);expect(card.locator('input:checked')).to_have_count(2)
        self.page.evaluate("a=>{delete db.taskConfirmations[a.pid].Beobachter[a.id];v24Persist();observerTasks(a.pid)}",info)
        card.evaluate('(el)=>{el.closest("details").open=true}')
        expect(card).to_contain_text('Bereits bestätigt (Bestand)')
        self.assertTrue(self.page.evaluate('a=>db.observerProgress[a.pid][a.id]',info))
        self.page.once('dialog',lambda dialog:dialog.accept())
        card.get_by_role('button',name='Bestätigung zurücknehmen',exact=True).click()
        self.assertFalse(self.page.evaluate('a=>db.observerProgress[a.pid][a.id]',info))
        expect(card.locator('input:checked')).to_have_count(0)

    def test_catalog_import_deduplicates_preserves_and_enforces_delete_roles(self):
        self.leader('Leiter')
        counts=self.page.evaluate("() => Object.values(v24Store.stamms).map(d=>({actions:d.actionLibrary.filter(a=>a.sourceRef).length,recipes:d.recipes.filter(r=>r.sourceRef).length}))")
        self.assertTrue(all(x['actions']==55 and x['recipes']==17 for x in counts))
        self.page.evaluate('activities()')
        expect(self.page.get_by_role('button',name='Aktion löschen',exact=True)).to_have_count(0)
        aid=self.page.evaluate('db.actionLibrary.find(a=>a.sourceRef).id')
        self.page.evaluate('id=>RangerHub.deleteAction(id)',aid)
        self.assertTrue(self.page.evaluate('id=>db.actionLibrary.some(a=>a.id===id)',aid))
        self.page.get_by_role('button',name='+ Aktion',exact=True).click()
        self.page.locator('#v27-action-form [name=title]').fill('Eigene V27 Aktion')
        self.page.locator('#v27-action-form [name=description]').fill('Gemeinsam entdecken')
        self.page.locator('#v27-action-form').get_by_role('button',name='Speichern',exact=True).click()
        self.page.reload();self.page.wait_for_function('window.RangerHub?.v27Ready')
        self.assertTrue(self.page.evaluate("db.actionLibrary.some(a=>a.title==='Eigene V27 Aktion')"))
        self.leader('Stammleiter');self.page.evaluate('activities()')
        self.page.evaluate("id=>{const a=db.actionLibrary.find(a=>a.id===id);db.meetings.push({id:992701,date:'2026-10-01',theme:'Archivtreffen',action:{title:a.title,description:a.description},attendance:{rangers:{},leaders:{}}});v24Persist()}",aid)
        self.page.once('dialog',lambda dialog:dialog.accept())
        self.page.evaluate('id=>RangerHub.deleteAction(id)',aid)
        self.assertFalse(self.page.evaluate('id=>db.actionLibrary.some(a=>a.id===id)',aid))
        self.page.reload();self.page.wait_for_function('window.RangerHub?.v27Ready')
        self.assertFalse(self.page.evaluate('id=>db.actionLibrary.some(a=>a.id===id)',aid))
        self.assertFalse(self.page.evaluate("db.actionLibrary.some(a=>a.title===db.meetings.find(m=>m.id===992701).action.title)"))
        self.assertTrue(self.page.evaluate("!!db.meetings.find(m=>m.id===992701).action.description"))
        self.ranger();before=self.page.evaluate('db.actionLibrary.length');self.page.evaluate('activities();actionFormV15();RangerHub.deleteAction(1)');self.assertEqual(self.page.evaluate('db.actionLibrary.length'),before)

    def test_recipe_selection_still_fills_checklist(self):
        self.leader();form,_=self.form()
        rid=self.page.evaluate("db.recipes.find(r=>r.sourceRef==='huehnersuppe').id")
        form.locator('[name=foodMode]').select_option('planned');form.locator('[name=recipeId]').select_option(rid)
        expect(form.locator('[name=ingredients]')).to_have_value(re.compile('Hähnchenbrustfilet'))
        expect(form.locator('[data-ingredient-preview]')).to_contain_text('Hühnerbrühe')

    def test_photos_save_reload_slides_and_quota_rollback(self):
        self.leader();mid=self.add_meeting(-2);form,_=self.form(mid)
        fixture={'name':'lager.jpg','mimeType':'image/jpeg','buffer':photo_fixture()}
        form.locator('[data-v27-photos]').set_input_files([fixture,fixture,fixture,fixture])
        expect(form.locator('[data-photo-feedback]')).to_contain_text('Fotos vorbereitet')
        expect(form.locator('.v27-photo-thumbs img')).to_have_count(4)
        form.locator('[data-v27-photos]').set_input_files(fixture)
        expect(form.locator('[data-photo-feedback]')).to_contain_text('höchstens vier')
        self.assertEqual(self.page.evaluate('id=>db.meetings.find(m=>m.id===id).photos?.length||0',mid),0)
        form.get_by_role('button',name='Planung speichern',exact=True).click()
        lengths=self.page.evaluate('id=>db.meetings.find(m=>m.id===id).photos.map(p=>p.data.length)',mid)
        self.assertEqual(len(lengths),4);self.assertTrue(all(n<=100000 for n in lengths))
        self.page.reload();self.page.wait_for_function('window.RangerHub?.v27Ready');self.ranger()
        expect(self.page.locator('.v27-slide')).to_have_count(4)
        self.page.locator('.v27-gallery').get_by_role('button',name='Nächstes Foto',exact=True).click()
        self.page.wait_for_function("document.querySelector('.v27-slides').scrollLeft>20")
        self.leader();form,_=self.form(mid)
        form.locator('[name=theme]').fill('Darf nicht gespeichert werden')
        before=self.page.evaluate('JSON.stringify(db.meetings)')
        self.page.evaluate("() => {window.v27RealPersist=v24Persist;v24Persist=()=>{throw new DOMException('quota','QuotaExceededError')}}")
        form.get_by_role('button',name='Planung speichern',exact=True).click()
        expect(self.page.locator('#v27-feedback')).to_contain_text('Nicht gespeichert')
        self.assertEqual(self.page.evaluate('JSON.stringify(db.meetings)'),before)
        expect(form).to_be_visible()
        self.page.evaluate('() => {v24Persist=window.v27RealPersist}')

    def test_ranger_dashboard_cancellation_and_attendance_encouragement(self):
        self.leader();mid=self.add_meeting(0)
        pid=self.page.evaluate('db.rangers[0].id')
        self.page.evaluate("a=>{db.meetings.forEach(m=>{m.attendance||={};m.attendance.rangers||={};m.attendance.rangers[a.pid]='ANWESEND'});v24Persist()}",{'pid':pid})
        self.ranger()
        expect(self.page.locator('.v27-participation')).to_contain_text('Du bist gut dabei')
        self.page.get_by_role('button',name='Für dieses Treffen abmelden',exact=True).click()
        self.page.locator('.v27-dash-cancellation textarea').fill('Nicht dabei')
        self.page.get_by_role('button',name='Absage speichern',exact=True).click()
        expect(self.page.locator('.v27-dash-rsvp')).to_contain_text('Du bist abgemeldet')
        self.page.reload();self.page.wait_for_function('window.RangerHub?.v27Ready')
        expect(self.page.locator('.v27-dash-rsvp')).to_contain_text('Du bist abgemeldet')
        self.page.get_by_role('button',name='Abmeldung zurücknehmen',exact=True).click()
        expect(self.page.locator('.v27-dash-rsvp')).to_contain_text('Wir freuen uns')
        self.page.evaluate("() => {db.meetings.forEach(m=>m.attendance.rangers[session.id]='ABWESEND');dash()}")
        expect(self.page.locator('.v27-participation')).to_contain_text('Dein Stamm freut sich auf dich')
        self.assertTrue(all(same['personId']==pid for same in self.page.evaluate('db.cancellations') if same.get('reason')=='Nicht dabei'))

    def test_observer_extra_content_leader_only_and_no_duplicate_labels(self):
        self.leader();self.page.evaluate('openObserverIntro()')
        expect(self.page.locator('.observerThemes')).to_have_count(0)
        if self.page.evaluate('!!RangerHub.openObserverLibrary'):
            expect(self.page.locator('.observerLeft [data-observer-library]')).to_have_count(1)
        self.ranger();self.page.evaluate('openObserverIntro()')
        expect(self.page.locator('[data-observer-library]')).to_have_count(0)

    def test_layout_sizes_and_screenshots(self):
        root=Path(__file__).resolve().parents[1]/'docs/screenshots/v27';root.mkdir(parents=True,exist_ok=True)
        for role in ['Leiter','Ranger']:
            self.leader('Leiter') if role=='Leiter' else self.ranger()
            for width,height in [(1440,900),(1920,1080),(1366,768),(768,1024),(390,844),(375,812),(320,568),(844,390)]:
                with self.subTest(role=role,width=width,height=height):
                    self.page.set_viewport_size({'width':width,'height':height});self.page.evaluate("goV17('dash')")
                    self.page.wait_for_timeout(100)
                    self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
                    if width>=1024:
                        sidebar=self.page.locator('.side').bounding_box();header=self.page.locator('.dash-masthead').bounding_box()
                        self.assertLessEqual(header['x']-(sidebar['x']+sidebar['width']),40)
                    expect(self.page.locator('[data-v27-current-weather]')).to_contain_text('Böen')
                    if role=='Ranger':expect(self.page.locator('.expedition-landscape')).to_have_count(1)
                    else:expect(self.page.locator('.expedition-landscape')).to_have_count(0)
                    if role=='Ranger' and width in [1440,390,320] or role=='Leiter' and width in [1440,320]:
                        self.page.evaluate("document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)")
                        self.page.screenshot(path=str(root/f'{role.lower()}-dashboard-{width}x{height}.png'),full_page=True)
            self.page.set_viewport_size({'width':1440,'height':900});self.page.evaluate("goV17('path')")
            if self.page.locator('[data-art-stage=Meister]').count():
                label=self.page.locator('[data-art-stage=Meister]');h=label.locator('h2')
                self.assertLessEqual(h.evaluate('(e)=>e.scrollWidth'),label.evaluate('(e)=>e.clientWidth'))
                self.page.evaluate("document.documentElement.style.scrollBehavior='auto';scrollTo(0,0)")
                self.page.screenshot(path=str(root/f'{role.lower()}-growth-desktop.png'),full_page=True)

    def test_stamm_confirmation_and_photo_isolation(self):
        self.leader();mid=self.add_meeting(-1)
        self.page.evaluate("id=>{db.meetings.find(m=>m.id===id).photos=[{id:'test',data:'data:image/jpeg;base64,/9j/'}];v24Persist()}",mid)
        self.page.evaluate("v24SwitchStamm('meppen')")
        self.assertIsNone(self.page.evaluate('id=>db.meetings.find(m=>m.id===id)||null',mid))
        expect(self.page.locator('.v27-slide')).to_have_count(0)
        self.page.evaluate("v24SwitchStamm('clp-west')")
        self.assertIsNotNone(self.page.evaluate('id=>db.meetings.find(m=>m.id===id)||null',mid))

    def test_upgrade_from_v26_preserves_all_existing_values_and_active_session(self):
        backup = 'RangerHub_Webapp_V26_Demo.html' if 'V27_Kompakt' not in self.url else 'RangerHub_Webapp_V26_Kompakt.html'
        self.page.goto(self.url.rsplit('/',1)[0]+'/'+backup)
        self.page.wait_for_function('window.RangerHub?.expeditionReady === true')
        self.page.evaluate("() => {localStorage.clear();sessionStorage.clear()}")
        self.page.reload();self.page.wait_for_function('window.RangerHub?.expeditionReady === true')
        self.ranger()
        self.page.evaluate("() => {db.v27PreservationSentinel={nested:['unverändert',17]};db.taskConfirmations={oldRecord:{preserve:true}};v24Persist()}")
        before=self.state();session=self.session()
        self.page.goto(self.url);self.page.wait_for_function('window.RangerHub?.v27Ready === true')
        after=self.state()
        def compare(old,new,path='store'):
            if isinstance(old,dict):
                self.assertTrue(old.keys()<=new.keys(),path)
                for k,v in old.items():compare(v,new[k],path+'.'+k)
            elif isinstance(old,list):
                self.assertGreaterEqual(len(new),len(old),path)
                if not path.endswith(('.recipes','.actionLibrary')):self.assertEqual(len(new),len(old),path)
                for i,v in enumerate(old):compare(v,new[i],path+f'[{i}]')
            else:self.assertEqual(new,old,path)
        compare(before,after)
        self.assertEqual(self.session(),session)
        expect(self.page.locator('.expedition')).to_be_visible()

    def test_recipe_roundtrip_keeps_planning_guard_and_photo_draft(self):
        self.leader();form,mid=self.form()
        form.locator('[name=theme]').fill('Planung mit neuem Rezept')
        form.locator('[name=foodMode]').select_option('planned')
        form.get_by_role('button',name='+ Rezept anlegen oder importieren',exact=True).click()
        expect(self.page.locator('#recipe-form')).to_be_visible()
        self.page.get_by_role('button',name='Zurück zur Planung',exact=True).click()
        expect(self.page.locator('#meeting-planning-form [name=theme]')).to_have_value('Planung mit neuem Rezept')
        self.page.evaluate('closeM()')
        expect(self.page.locator('#v27-unsaved')).to_be_visible()
        self.page.get_by_role('button',name='Änderungen verwerfen',exact=True).click()
        self.assertNotEqual(self.page.evaluate('id=>db.meetings.find(m=>m.id===id).theme',mid),'Planung mit neuem Rezept')

    def test_mobile_touch_planning_attendance_and_dashboard_cancellation(self):
        original=self.page
        for width,height in [(320,568),(390,844)]:
            context=self.browser.new_context(viewport={'width':width,'height':height},has_touch=True,is_mobile=True,device_scale_factor=2,locale='de-DE',timezone_id='Europe/Berlin')
            context.route('https://**/*',self.external)
            try:
                self.page=context.new_page();self.page.on('pageerror',lambda e:self.errors.append(str(e)))
                self.page.goto(self.url);self.page.wait_for_function('window.RangerHub?.v27Ready === true')
                self.leader();mid=self.add_meeting(0);form,_=self.form(mid)
                form.locator('[name=theme]').fill('Mobil geplant')
                self.page.locator('#box').get_by_role('button',name='Schließen',exact=True).tap()
                expect(self.page.locator('#v27-unsaved')).to_be_visible()
                self.page.get_by_role('button',name='Weiter bearbeiten',exact=True).tap()
                form.get_by_role('button',name='Planung speichern',exact=True).tap()
                self.page.evaluate('id=>attendance(id)',mid)
                self.page.locator('.v27-attendance-row input').first.tap()
                self.page.get_by_role('button',name='Anwesenheit speichern',exact=True).tap()
                self.ranger();self.page.wait_for_timeout(150)
                self.page.get_by_role('button',name='Für dieses Treffen abmelden',exact=True).tap()
                self.page.get_by_role('button',name='Absage speichern',exact=True).tap()
                expect(self.page.locator('.v27-dash-rsvp')).to_contain_text('Du bist abgemeldet')
                self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),width)
            finally:
                context.close();self.page=original

