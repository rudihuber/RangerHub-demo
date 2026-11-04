"""Reproducible navigation audit and screenshots, using temporary browser data only."""
import functools,json,shutil,threading,sys
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
def main():
 entry=sys.argv[1] if len(sys.argv)>1 else ('RangerHub_Webapp_V29_Kompakt.html' if (ROOT/'RangerHub_Webapp_V29_Kompakt.html').exists() else 'RangerHub_Webapp_V29_Demo.html')
 out=ROOT/'docs/screenshots/v29';out.mkdir(parents=True,exist_ok=True)
 server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   context=browser.new_context(viewport={'width':1440,'height':900},locale='de-DE',timezone_id='Europe/Berlin')
   context.route('https://**/*',lambda r:r.abort());page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/{entry}');page.wait_for_function('window.RangerHub?.knowledgeReady')
   ids=page.evaluate("db.rangers.filter(p=>!p.archived&&p.active!==false).slice(0,4).map(p=>p.id)")
   lead=page.evaluate("db.leaders.find(p=>p.role==='Leiter'&&!p.archived).id")
   def choose(rid,kind='rangers'):
    page.evaluate('v=>v24Choose(v.kind,v.id)',{'kind':kind,'id':rid});page.locator('[data-knowledge-dashboard] .kw-score-strip').wait_for()
   def cmd(kind,payload):page.evaluate('v=>RangerHub.createLocalKnowledgeTransport().command(v.type,v.payload)',{'type':kind,'payload':payload})
   choose(ids[0]);page.evaluate("goV17('knowledge')");page.locator('.kw-map').wait_for()
   catalog=page.evaluate('RangerHubKnowledgeCatalog');visited=[]
   for region in catalog['regions']:
    page.locator(f'.kw-map [data-kw-value={region["id"]}]').click()
    for topic in [t for t in catalog['topics'] if t['mapRegionId']==region['id']]:
     page.locator(f'[data-kw-action=topic][data-kw-value={topic["id"]}]').click()
     tasks=[t for t in catalog['tasks'] if t['topicId']==topic['id']];expect(page.locator('.kw-task-row')).to_have_count(len(tasks))
     page.locator('.kw-task-row').first.click();expect(page.locator('.kw-original')).to_contain_text(tasks[0]['originalText'].strip())
     visited.append(topic['id']);page.locator('[data-kw-action=back]').click();page.locator('[data-kw-action=back]').click()
    page.locator('[data-kw-action=close]').click()
   assert len(visited)==len(set(visited))==36
   for width,height in [(1440,900),(390,844),(320,568),(768,1024)]:
    page.set_viewport_size({'width':width,'height':height});page.evaluate('scrollTo({top:0,behavior:"instant"})');page.screenshot(path=str(out/f'adventure-map-{width}.png'),full_page=True)
    if width==1440:
     page.locator('.kw-map').scroll_into_view_if_needed();page.screenshot(path=str(out/'adventure-map-desktop-viewport.png'))
   # Demonstrate real source-based approvals in this isolated test context.
   T='fw-B-01-p132';one='fw-B-01-p133';two='fw-B-01-p134'
   for rid,ts in zip(ids,[[T,one],[T],[two],[one]]):
    choose(rid)
    for tid in ts:cmd('submit',{'taskId':tid,'text':'Vorführung im isolierten Browser-Test.','evidenceType':'oral','consent':True})
    choose(lead,'leaders')
    for tid in ts:cmd('review',{'taskId':tid,'rangerId':rid,'approved':True,'comment':'Vorführung im Test geprüft.'})
   choose(lead,'leaders');page.set_viewport_size({'width':1440,'height':900});page.evaluate("goV17('dash')");page.locator('[data-knowledge-dashboard] .kw-podium').wait_for();page.locator('[data-knowledge-dashboard]').scroll_into_view_if_needed();page.screenshot(path=str(out/'leader-points-dashboard.png'))
   choose(ids[3]);page.set_viewport_size({'width':390,'height':844});page.locator('[data-knowledge-dashboard] .kw-own-rank').wait_for();expect(page.locator('.kw-own-rank')).to_contain_text('#4');page.locator('[data-knowledge-dashboard]').scroll_into_view_if_needed();page.screenshot(path=str(out/'ranger-points-mobile.png'),full_page=True)
   for width,height in [(1440,900),(390,844)]:
    page.set_viewport_size({'width':width,'height':height});page.evaluate("RangerHub.openKnowledge('task','fw-B-01-p132')");page.screenshot(path=str(out/f'logbook-task-{width}.png'));page.locator('[data-kw-action=close]').click()
   duel='fw-B-01-p135';choose(lead,'leaders')
   for rid in [ids[0],ids[3]]:cmd('policy',{'taskId':duel,'rangerId':rid,'eligible':True,'reason':'Eignung und Aufsicht im Test geprüft.'})
   choose(ids[0]);page.evaluate('v=>RangerHub.createLocalKnowledgeTransport().command("invite",{taskId:v.task,targetId:v.target,deadline:new Date(Date.now()+7*86400000).toISOString()})',{'task':duel,'target':ids[3]})
   cid=page.evaluate('db.knowledge.challenges[0].id');choose(ids[3]);cmd('respond',{'challengeId':cid,'accept':True});cmd('start',{'taskId':duel});page.evaluate("RangerHub.openKnowledge('arena')");page.locator('.kw-duel').wait_for();page.screenshot(path=str(out/'challenge-mobile.png'))
   assert not errors,errors
   report={'entry':entry,'regions':len(catalog['regions']),'topics':len(visited),'firstTaskOfEveryTopicOpened':True,'visitedTopics':visited,'javascriptErrors':errors,'screenshots':'docs/screenshots/v29','data':'Temporary browser profiles; source-based test approvals only, no shipped seed scores.'}
   (ROOT/'docs/v29-navigation-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'regions':6,'topics':36,'errors':errors}))
   context.close();browser.close()
 finally:server.shutdown();server.server_close()
if __name__=='__main__':main()
