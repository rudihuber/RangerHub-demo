"""Actual archived/latest app; only obsolete shuffled shelves are replaced for V36."""
import sys,os,unittest
from v36_browser_support import install
install()
import test_v35,test_v34,test_v33,test_v33_review,test_v33_regressions,test_v36
loader=unittest.TestLoader();suite=unittest.TestSuite();archived='--archived' in sys.argv;new='--new-only' in sys.argv
modules=[test_v36] if new else [test_v35,test_v34,test_v33,test_v33_review,test_v33_regressions] if archived else [test_v35,test_v33,test_v33_review,test_v33_regressions,test_v36]
for mod in modules:suite.addTests(loader.loadTestsFromModule(mod))
if archived and 'Kompakt' in os.environ.get('RANGERHUB_TEST_FILE',''):
 import test_v26_roles
 suite.addTests(loader.loadTestsFromModule(test_v26_roles))
if not archived and not new:
 for name in test_v34.V34Tests.__dict__:
  if name.startswith('test_') and name!='test_compact_maps_all_buttons_inside_image_no_overlap_and_small_books':suite.addTest(test_v34.V34Tests(name))
print('Requested actual entry:',os.environ.get('RANGERHUB_TEST_FILE'),flush=True)
result=unittest.TextTestRunner(verbosity=2).run(suite)
raise SystemExit(not result.wasSuccessful())
