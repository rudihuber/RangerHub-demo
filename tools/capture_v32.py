"""Actual V32 screenshots, disposable browser identity/storage and deterministic test weather."""
from pathlib import Path
import functools,threading,sys
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tests'));from v27_cases import V27Cases
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
out=ROOT/'docs/screenshots/v32';out.mkdir(parents=True,exist_ok=True)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);ctx=browser.new_context(viewport={'width':1440,'height':900},locale='de-DE',timezone_id='Europe/Berlin');ctx.route('https://**/*',lambda route:V27Cases.external(None,route));page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  entry='RangerHub_Webapp_V32_Kompakt.html' if (ROOT/'RangerHub_Webapp_V32_Kompakt.html').exists() else 'RangerHub_Webapp_V32_Demo.html';page.goto(f'http://127.0.0.1:{server.server_port}/{entry}');page.wait_for_function('window.RangerHub?.wisdomReady');page.emulate_media(reduced_motion='reduce');rid=page.evaluate('db.rangers.find(p=>!p.archived).id');page.evaluate('id=>v24Choose("rangers",id)',rid)
  for width,height in [(1440,900),(390,844),(320,568),(768,1024)]:
   page.set_viewport_size({'width':width,'height':height});page.evaluate('RangerHub.openWisdom()');page.locator('.rw-world').wait_for();page.evaluate('scrollTo({top:0,behavior:"instant"})');page.screenshot(path=str(out/f'wisdom-world-{width}.png'),full_page=True)
   page.evaluate('RangerHub.openKnowledge("wisdom-module","eigenschaften")');page.locator('.rw-hotspots [data-kw-value=eigenschaften-8]').click();page.evaluate('scrollTo({top:0,behavior:"instant"})');page.screenshot(path=str(out/f'properties-{width}.png'),full_page=True)
  page.set_viewport_size({'width':1440,'height':900});page.evaluate('v24Choose("leaders",db.leaders.find(p=>p.role==="Stammleiter").id)');page.evaluate('RangerHub.openWisdom()');page.screenshot(path=str(out/'wisdom-prepared-all-five-groups.png'),full_page=True);page.locator('[data-kw-action=wisdom-manage]').click();expect(page.locator('[role=switch]')).to_have_count(16);page.screenshot(path=str(out/'wisdom-manager-desktop.png'),full_page=True)
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(out/'wisdom-manager-phone.png'),full_page=True)
  assert not errors,errors;browser.close()
finally:server.shutdown();server.server_close()
