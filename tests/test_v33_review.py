"""Independent checks for missed requirements in the V33 delivery."""
from playwright.sync_api import expect
from browser_case import BrowserCase
from v33_cases import V33Cases

class V33Review(V33Cases, BrowserCase):
    def test_dashboard_book_checkbox_keeps_partial_progress_and_updates_points(self):
        self.choose()
        for chapter in [1,2,3]:self.assertTrue(self.set_chapter(chapter)['ok'])
        self.refresh();self.dashboard()
        check=self.page.locator('[data-dashboard-book=bible-01] input[data-bible-complete]')
        self.ui_bible_toggle(check,True)
        self.assertEqual(self.own()['biblePoints'],10)
        expect(self.page.locator('#rh-knowledge-sheet')).to_have_count(0)
        self.ui_bible_toggle(check,False)
        self.assertEqual(self.own()['biblePoints'],0)
        self.assertEqual(self.own()['bibleChapters'],3)
        self.page.reload();self.ready();expect(check).not_to_be_checked()

    def test_mobile_statistics_sorting_is_visible_and_operable(self):
        self.page.set_viewport_size({'width':390,'height':844})
        self.choose('leaders','Leiter')
        sort=self.page.locator('[data-stat-sort-select]')
        expect(sort).to_be_visible()
        sort.select_option('name:1')
        names=self.page.locator('[data-stat-person] td:first-child').all_text_contents()
        self.assertEqual(names,sorted(names,key=str.casefold))
        sort.select_option('name:-1')
        self.assertEqual(self.page.locator('[data-stat-person] td:first-child').all_text_contents(),list(reversed(names)))

    def test_explicit_grocery_owner_is_independent_of_food_owner(self):
        self.choose('leaders','Leiter');self.seed_calendar()
        self.page.evaluate("""()=>{const m=db.meetings[0],other=db.leaders.find(p=>p.id!==session.id).id;
          m.food.leaderId=other;m.food.ingredients=[{id:'individual',text:'Individuell zugeteilter Einkauf',leaderId:session.id,done:false}];v24Persist();render();}""")
        row=self.page.locator('[data-todo-key]').filter(has_text='Individuell zugeteilter Einkauf')
        expect(row).to_be_visible();row.locator('[data-todo-toggle]').check()
        self.assertTrue(self.page.evaluate('db.meetings[0].food.ingredients[0].done'))

    def test_disabled_action_is_distinguished_from_planned_action(self):
        self.choose('leaders','Leiter');self.seed_calendar()
        self.page.evaluate("()=>{db.leaderMeetings=[];db.meetings[0].actions=[];db.meetings[0].action.enabled=false;v24Persist();render();}")
        expect(self.page.locator('[data-planning-kind=action]')).to_contain_text('Bewusst nicht vorgesehen')

    def test_original_text_doings_are_not_replaced_with_placeholder(self):
        self.choose('leaders','Leiter');self.seed_calendar()
        self.page.evaluate("()=>{db.leaderMeetings=[];db.meetings[0].actions=[];db.meetings[0].action.doings=['Seile auf Beschädigungen prüfen'];v24Persist();render();}")
        expect(self.page.locator('[data-planning-kind=action]')).to_contain_text('Seile auf Beschädigungen prüfen')

    def test_clock_refresh_does_not_replace_unchanged_dashboard(self):
        self.page.clock.install();self.page.reload();self.ready();self.choose('leaders','Leiter');self.refresh()
        self.page.evaluate('window.reviewDashboard=document.querySelector(".v33-dashboard")')
        self.page.clock.fast_forward(61000)
        self.assertTrue(self.page.evaluate('window.reviewDashboard===document.querySelector(".v33-dashboard")'))

    def test_task_badge_updates_immediately_after_completion(self):
        self.choose('leaders','Leiter');self.seed_calendar()
        count=self.page.locator('[data-nav-count=tasks]')
        before=int(count.text_content())
        row=self.page.locator('[data-todo-key]').filter(has_text='Einladungen vorbereiten')
        row.locator('[data-todo-toggle]').check()
        expect(count).to_have_text(str(before-1))

    def test_editing_leader_agenda_preserves_completed_action_and_identity(self):
        self.choose('leaders','Leiter');self.seed_calendar()
        self.page.evaluate("()=>{db.leaderMeetings[0].actions[0].done=true;v24Persist();render();}")
        before=self.page.evaluate('structuredClone(db.leaderMeetings[0].actions[0])')
        self.page.locator('[data-edit-meeting="994001"]').click()
        info=self.page.locator('#modal textarea[name=info]')
        expect(info).to_be_visible();info.fill('Ergänzte Tagesordnung')
        self.page.locator('#modal button[type=submit],#modal form button.full').last.click()
        after=self.page.evaluate('db.leaderMeetings[0].actions[0]')
        self.assertEqual(after,before)

    def test_next_birthday_is_shown_even_when_more_than_thirty_days_away(self):
        self.choose('leaders','Leiter')
        name=self.page.evaluate("""()=>{for(const p of [...db.rangers,...db.leaders])p.birthday='';
          const p=db.rangers.find(p=>!p.archived),d=new Date(RangerHub.localDate()+'T12:00Z');d.setUTCDate(d.getUTCDate()+50);
          p.birthday='2000'+d.toISOString().slice(4,10);v24Persist();render();return p.name;}""")
        expect(self.page.locator('.v33-birthdays')).to_contain_text(name)

def load_tests(loader,tests,pattern):
    import unittest
    return unittest.TestSuite(V33Review(name) for name in V33Review.__dict__ if name.startswith('test_'))
