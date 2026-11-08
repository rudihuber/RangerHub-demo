from pathlib import Path
import re
from v36_build_shared import PAIRS,ROOT,manifest,extras

def build():
 html=(ROOT/'RangerHub_Webapp_V35_Demo.html').read_text()
 for before,after in PAIRS:
  html,n=re.subn(r'<script src="'+re.escape(before)+r'\?v=[^"]+"></script>',f'<script src="{after}?v=36-1"></script>',html);assert n==1,before
 html=html.replace('rangerhub-v35.css?v=35-1','rangerhub-v36.css?v=36-1').replace('data-rangerhub-v35','data-rangerhub-v36').replace('</body>','<script src="rangerhub-app-v36.js?v=36-1"></script>\n</body>',1).replace('name="rangerhub-version" content="35"','name="rangerhub-version" content="36"').replace('name="rangerhub-revision" content="35.0"','name="rangerhub-revision" content="36.0"')
 for name in ['index.html','RangerHub_Webapp_V36_Demo.html']:(ROOT/name).write_text(html)
 manifest(['index.html','RangerHub_Webapp_V36_Demo.html',*extras()]);print('V36 demo bytes',len(html.encode()))
if __name__=='__main__':build()
