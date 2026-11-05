"""Generate the shared browser/server catalog directly from the canonical uploaded JSON."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
def build():
 x=json.loads((ROOT/'data/RangerHub_Bibellesen_66_Buecher_240_Punkte.json').read_text())
 assert len(x['books'])==x['bookCount'] and len({b['id'] for b in x['books']})==x['bookCount']
 assert sum(b['points'] for b in x['books'])==x['maxPoints']
 for t,n in [('AT',x['oldTestamentPoints']),('NT',x['newTestamentPoints'])]:assert sum(b['points'] for b in x['books'] if b['testament']==t)==n
 assert [b['canonicalOrder'] for b in x['books']]==list(range(1,x['bookCount']+1))
 (ROOT/'rangerhub-bible-catalog.js').write_text('/* Generated verbatim from the canonical uploaded JSON; do not edit book values. */\nwindow.RHBibleCatalog = '+json.dumps(x,ensure_ascii=False,separators=(',',':'))+';\n(function freeze(x){Object.values(x).forEach(v=>{if(v&&typeof v===\'object\')freeze(v)});Object.freeze(x)})(window.RHBibleCatalog);\n')
if __name__=='__main__':build()
