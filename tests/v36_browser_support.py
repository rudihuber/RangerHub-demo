"""Select the requested artifact without changing historical test helpers."""
import os,re
from browser_case import BrowserCase

def install():
 if getattr(BrowserCase,'v36_entry_installed',False):return
 original=BrowserCase.setUpClass.__func__
 def setup(cls):
  original(cls)
  entry=os.environ.get('RANGERHUB_TEST_FILE')
  if entry:
   if not re.fullmatch(r'RangerHub_Webapp_V\d+_(?:Kompakt|Demo)\.html',entry):raise ValueError('Unexpected test entry')
   cls.url=f'http://127.0.0.1:{cls.server.server_port}/'+entry
 BrowserCase.setUpClass=classmethod(setup);BrowserCase.v36_entry_installed=True
 # Verify actual initial document. Historical upgrade navigation within a test stays unchanged.
 from v27_cases import V27Cases
 previous=V27Cases.setUp
 def checked(self):
  previous(self);entry=os.environ.get('RANGERHUB_TEST_FILE','');m=re.search(r'_V(\d+)_',entry)
  if m:self.assertEqual(self.page.locator('meta[name=rangerhub-version]').get_attribute('content'),m.group(1),'Wrong artifact loaded: '+self.page.url)
 V27Cases.setUp=checked
