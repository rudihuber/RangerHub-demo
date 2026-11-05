from browser_case import BrowserCase
from v32_fachwissen_cases import V32FachwissenCases
from v32_bible_cases import V32BibleCases
from v32_growth_cases import V32GrowthCases
class Fachwissen(V32FachwissenCases,BrowserCase):pass
class Bible(V32BibleCases,BrowserCase):pass
class Growth(V32GrowthCases,BrowserCase):pass
from v32_planning_cases import V32PlanningCases
from v28_cases import V28Cases
class Planning(V32PlanningCases,BrowserCase):pass
class MessagesAndLibraries(V28Cases,BrowserCase):pass
