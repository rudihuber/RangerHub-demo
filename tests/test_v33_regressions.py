"""V33 adapters retain historical business checks with the current role UI.

Only the new copies in v33_*_cases.py follow deliberately changed selectors and
labels. Historical versioned files remain byte-identical for upgrade fixtures.
"""
from playwright.sync_api import expect
from browser_case import BrowserCase
from v33_fachwissen_cases import V33FachwissenCases
from v33_bible_cases import V33BibleCases
from v33_growth_cases import V33GrowthCases
from v33_planning_cases import V33PlanningCases
from v33_community_cases import V33CommunityCases

class V33Browser(BrowserCase):
    def nav(self,label):
        aliases={'Fachwissen':'Fachwissen-Challenges','Ranger-Wissen':'Ranger-Bibliothek'}
        item=self.page.locator('.rh33-navigation').get_by_role('button',name=aliases.get(label,label),exact=True)
        item.evaluate('e=>{const d=e.closest("details");if(d)d.open=true}')
        toggle=self.page.locator('[data-menu-toggle]')
        if toggle.is_visible() and toggle.get_attribute('aria-expanded')!='true':toggle.click()
        item.click()
    def state(self):
        return self.page.evaluate("JSON.parse(localStorage.getItem(document.querySelector('meta[name=rangerhub-storage]')?.content||(location.pathname.includes('_Demo.html')?'rhv9-demo':'rhv9')))")
    def session(self):
        return self.page.evaluate("JSON.parse(sessionStorage.getItem((document.querySelector('meta[name=rangerhub-storage]')?.content||(location.pathname.includes('_Demo.html')?'rhv9-demo':'rhv9'))+'-session'))")

class Fachwissen(V33FachwissenCases,V33Browser):pass
class Bible(V33BibleCases,V33Browser):pass
class Growth(V33GrowthCases,V33Browser):pass
class Planning(V33PlanningCases,V33Browser):pass
class MessagesAndLibraries(V33CommunityCases,V33Browser):pass
