"""Create the requested reusable library; never publish source event/person records."""
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
source = json.loads(Path(sys.argv[1]).read_text())
action_fields = ['id', 'title', 'category', 'summary', 'steps', 'materials', 'safety', 'tags', 'recipe_ids']
recipe_fields = ['id', 'title', 'category', 'base_servings', 'serving_unit', 'ingredients', 'steps', 'equipment', 'notes', 'source']
action_lists = {'steps', 'materials', 'tags', 'recipe_ids'}
recipe_lists = {'ingredients', 'steps', 'equipment', 'notes'}
clean = {'actions': [{k: a.get(k, [] if k in action_lists else '') for k in action_fields} for a in source['actions']], 'recipes': [{k: r.get(k, [] if k in recipe_lists else '') for k in recipe_fields} for r in source['recipes']]}
code = '/* Requested reusable templates only. No source event records, people or PDFs. */\nwindow.RangerHubLibraryV27=' + json.dumps(clean, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c') + ';\n'
(root/'rangerhub-library-v27.js').write_text(code)
print(json.dumps({'actions': len(clean['actions']), 'recipes': len(clean['recipes'])}))
