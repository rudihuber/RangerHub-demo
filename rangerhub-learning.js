/* Growth library and leader-confirmed progress. No account security is implied by this demo. */
(() => {
  'use strict';
  const RH = window.RangerHub;
  const packages = [['A', 'Aufgabenpaket A'], ['B', 'Aufgabenpaket B'], ['C', 'Aufgabenpaket C'], ['R', 'Reflexionsbogen']];
  const canManage = () => v24CanManagePeople();
  const canConfirm = pid => isLeader() && v24CanEditRanger(pid) && db.rangers.some(p => p.id === pid);
  const canRead = pid => v24CanEditRanger(pid) && db.rangers.some(p => p.id === pid);
  const nextId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);
  const groupTasks = tasks => tasks.reduce((groups, task) => { (groups[task.category || 'Allgemein'] ||= []).push(task); return groups; }, Object.create(null));
  const normalize = text => String(text).trim().toLocaleLowerCase('de').replace(/[.?!]+$/, '');
  // Add missing source tasks once; never regenerate existing IDs or completion maps.
  if (!v24Store.shared.learningCatalog202611) {
    for (const stage of ['Erkunder', 'Entdecker', 'Forscher']) {
      const tasks = db.growthTasks[stage] ||= [];
      for (const [category, title] of [...(canonicalGrowthTasks[stage] || []), ...(V23_STAGE_TASKS[stage] || [])]) {
        if (!tasks.some(task => normalize(task.title) === normalize(title))) tasks.push({ id: nextId(), category, title, description: '' });
      }
    }
    v24Store.shared.learningCatalog202611 = true;
    v24Persist();
  }
  RH.canConfirmProgress = canConfirm;
  RH.packageUnlocked = (pid, key) => {
    const index = packages.findIndex(p => p[0] === key);
    return index >= 0 && packages.slice(0, index).every(p => !!db.observerBonus?.[pid]?.[p[0]]);
  };
  const oldCounts = observerCounts;
  observerCounts = function (pid) {
    const count = oldCounts(pid);
    count.bcount = packages.filter(([key]) => RH.packageUnlocked(pid, key) && db.observerBonus?.[pid]?.[key]).length;
    count.allDone = count.regular === count.total && count.bcount === packages.length;
    return count;
  };
  bonusCards = function (pid) {
    return packages.map(([key, title], index) => {
      const unlocked = RH.packageUnlocked(pid, key), done = unlocked && !!db.observerBonus?.[pid]?.[key];
      return `<div class="bonusCard ${unlocked ? '' : 'package-locked'}" data-package="${key}"><h3>${title}</h3><p class="muted">${unlocked ? 'Freigegeben' : `Zuerst ${packages[index - 1][1]} abschließen.`}</p><label><input type="checkbox" ${done ? 'checked' : ''} ${canConfirm(pid) && unlocked ? '' : 'disabled'} onchange="toggleBonus(${pid},'${key}',this.checked)"> Erledigt</label><small>Die Demo enthält keine PDF-Arbeitsblätter.</small></div>`;
    }).join('');
  };
  toggleBonus = function (pid, key, value) {
    if (!canConfirm(pid) || !RH.packageUnlocked(pid, key)) return;
    const done = db.observerBonus[pid] ||= {};
    done[key] = !!value;
    if (!value) packages.slice(packages.findIndex(p => p[0] === key) + 1).forEach(([later]) => { done[later] = false; });
    v24SyncStageFor(pid); v24Persist(); observerTasks(pid);
  };
  // All progress entry points enforce the role, including calls outside the rendered controls.
  toggleObsTask = function (pid, id, value) {
    if (!canConfirm(pid) || !Object.values(db.observerTasks).flat().some(t => String(t.id) === String(id))) return;
    obsDoneMap(pid)[id] = !!value; v24SyncStageFor(pid); v24Persist(); observerTasks(pid);
  };
  toggleStageTaskV19 = function (stage, pid, id, value) {
    if (!canConfirm(pid) || !stages.includes(stage) || !stageUnlockedForRanger(stages.indexOf(stage), pid) || !db.growthTasks[stage]?.some(t => String(t.id) === String(id))) return;
    const progress = db.stageProgress[pid] ||= {};
    (progress[stage] ||= {})[id] = !!value; v24SyncStageFor(pid); v24Persist(); openRangerStageV19(stage, pid);
  };
  const taskRow = (task, checked, disabled, handler, edit = '') => `<label class="item obsTask"><input type="checkbox" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="${handler}"><span><b>${esc(task.title)}</b>${task.description ? `<br><span class="muted">${esc(task.description)}</span>` : ''}${edit}</span></label>`;
  observerTasks = function (pid = null) {
    if (pid == null && isLeader()) return observerLeaderOverview();
    pid ??= session?.id;
    if (!canRead(pid)) return;
    const ranger = db.rangers.find(p => p.id === pid), count = observerCounts(pid);
    const total = count.total + packages.length, completed = count.regular + count.bcount;
    RH.content().innerHTML = `<div class="top"><div><h1>Meine Aufgaben</h1><p class="muted">Beobachter · ${esc(ranger.name)} · ${canConfirm(pid) ? 'Bestätigung durch das Leiterteam' : 'Leseansicht · Dein Leiterteam bestätigt erledigte Aufgaben'}</p></div><button class="btn alt" onclick="openObserverIntro()">Beobachterstufe</button></div><div class="obsShell"><div class="row between"><b>Fortschritt ${completed}/${total}</b><b>${Math.round(completed / total * 100)}%</b></div><div class="obsProgress"><i style="width:${completed / total * 100}%"></i></div>${Object.entries(db.observerTasks).map(([category, items], ci) => `<details class="obsCategory"><summary>${esc(category)} · ${items.filter(t => obsDoneMap(pid)[t.id]).length}/${items.length}</summary><div class="obsTasks">${items.map((t, ti) => taskRow(t, obsDoneMap(pid)[t.id], !canConfirm(pid), `toggleObsTask(${pid},'${esc(t.id)}',this.checked)`, canManage() ? `<br><button type="button" class="btn alt sm" onclick="event.preventDefault();RangerHub.editObserverTask(${ci},${ti})">Aufgabe bearbeiten</button>` : '')).join('')}</div></details>`).join('')}<h3>Aufgabenpakete</h3><div class="bonusGrid">${bonusCards(pid)}</div>${canManage() ? '<button class="btn alt" onclick="RangerHub.editObserverTask()">+ Beobachter-Aufgabe</button>' : ''}${count.allDone ? '<p class="badgeYellow">Beobachterstufe vollständig abgeschlossen</p>' : ''}</div>`;
  };
  openRangerStageV19 = function (stage, pid) {
    if (!canRead(pid) || !stages.includes(stage) || !stageUnlockedForRanger(stages.indexOf(stage), pid)) return;
    if (stage === 'Beobachter') return observerTasks(pid);
    const tasks = db.growthTasks[stage] || [], done = db.stageProgress?.[pid]?.[stage] || {};
    const groups = groupTasks(tasks);
    const count = tasks.filter(t => done[t.id]).length;
    RH.content().innerHTML = `<div class="top"><div><h1>${esc(stage)}</h1><p class="muted">${count}/${tasks.length} Aufgaben erledigt · ${canConfirm(pid) ? 'Bestätigung durch das Leiterteam' : 'Leseansicht'}</p></div><button class="btn alt" onclick="goV17('path')">Wachstumspfad</button></div><div class="stageProgressBar"><i style="width:${tasks.length ? count / tasks.length * 100 : 0}%"></i></div>${Object.entries(groups).map(([category, items]) => `<section class="learning-category"><h2>${esc(category)}</h2>${items.map(t => taskRow(t, done[t.id], !canConfirm(pid), `toggleStageTaskV19('${stage}',${pid},'${esc(t.id)}',this.checked)`)).join('')}</section>`).join('')}`;
  };
  RH.openGrowthLibrary = stage => {
    if (!stages.includes(stage)) return;
    const groups = groupTasks(db.growthTasks[stage] || []);
    box.innerHTML = `<div class="top"><h2>${esc(stage)}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div>${Object.entries(groups).map(([category, tasks]) => `<section class="learning-category"><h3>${esc(category)}</h3>${tasks.map(t => `<div class="item"><b>${esc(t.title)}</b>${t.description ? `<p>${esc(t.description)}</p>` : ''}${canManage() ? `<button class="btn alt sm" onclick="growthTaskFormV16('${stage}','${esc(t.id)}')">Bearbeiten</button>` : ''}</div>`).join('')}</section>`).join('')}${canManage() ? `<button class="btn" onclick="growthTaskFormV16('${stage}')">+ Aufgabe</button>` : ''}`;
    openM();
  };
  const previousStage = openStageV15;
  openStageV15 = function (stage) { if (stage === 'Beobachter') previousStage(stage); else RH.openGrowthLibrary(stage); };
  RH.openObserverLibrary = () => RH.openGrowthLibrary('Beobachter');
  const categoryOptions = (categories, selected) => `<option value="">Kategorie wählen</option>${categories.map(c => `<option ${c === selected ? 'selected' : ''}>${esc(c)}</option>`).join('')}<option value="__new__">Neue Kategorie …</option>`;
  const categoryField = (categories, selected) => `<label>Kategorie<select name="category" required onchange="this.form.elements.newCategory.hidden=this.value!=='__new__';this.form.elements.newCategory.required=this.value==='__new__'">${categoryOptions(categories, selected)}</select><input name="newCategory" aria-label="Neue Kategorie" placeholder="Name der neuen Kategorie" hidden></label>`;
  growthTaskFormV16 = function (stage, id = 0) {
    if (!canManage() || !stages.includes(stage)) return;
    const task = db.growthTasks[stage].find(t => String(t.id) === String(id));
    const categories = [...new Set(db.growthTasks[stage].map(t => t.category || 'Allgemein'))];
    box.innerHTML = `<div class="top"><h2>${task ? 'Aufgabe bearbeiten' : 'Aufgabe hinzufügen'} · ${esc(stage)}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><form class="form" id="growth-task-form">${categoryField(categories, task?.category)}<label>Aufgabenname<input name="title" required value="${esc(task?.title || '')}"></label><label class="full">Inhalt<textarea name="description">${esc(task?.description || '')}</textarea></label><button class="btn full">Speichern</button></form>`;
    document.getElementById('growth-task-form').onsubmit = event => saveGrowthTaskV16(event, stage, id);
    openM();
  };
  saveGrowthTaskV16 = function (event, stage, id = 0) {
    event.preventDefault();
    if (!canManage() || !stages.includes(stage) || !event.target.reportValidity()) return;
    const f = new FormData(event.target), category = String(f.get(f.get('category') === '__new__' ? 'newCategory' : 'category') || '').trim(), title = String(f.get('title') || '').trim();
    if (!category || !title) return;
    let task = db.growthTasks[stage].find(t => String(t.id) === String(id));
    if (id && !task) return;
    if (!task) { task = { id: nextId() }; db.growthTasks[stage].push(task); }
    Object.assign(task, { category, title, description: String(f.get('description') || '').trim() });
    v24Persist(); RH.openGrowthLibrary(stage);
  };
  RH.editObserverTask = (ci = -1, ti = -1) => {
    if (!canManage()) return;
    const entries = Object.entries(db.observerTasks), entry = entries[ci], task = entry?.[1]?.[ti];
    box.innerHTML = `<h2>${task ? 'Aufgabe bearbeiten' : 'Beobachter-Aufgabe hinzufügen'}</h2><form id="observer-task-form" class="form">${categoryField(entries.map(([c]) => c), entry?.[0])}<label>Aufgabenname<input name="title" required value="${esc(task?.title || '')}"></label><label class="full">Inhalt<textarea name="description">${esc(task?.description || '')}</textarea></label><button class="btn full">Speichern</button></form>`;
    document.getElementById('observer-task-form').onsubmit = event => {
      event.preventDefault(); if (!canManage() || !event.target.reportValidity()) return;
      const f = new FormData(event.target), category = String(f.get(f.get('category') === '__new__' ? 'newCategory' : 'category') || '').trim(), title = String(f.get('title') || '').trim();
      if (!category || !title) return;
      const saved = task || { id: String(nextId()) };
      if (task && category !== entry[0]) entry[1].splice(ti, 1);
      if (!Object.hasOwn(db.observerTasks, category)) Object.defineProperty(db.observerTasks, category, { value: [], enumerable: true, writable: true, configurable: true });
      if (!task || category !== entry[0]) db.observerTasks[category].push(saved);
      Object.assign(saved, { title, description: String(f.get('description') || '').trim() });
      v24Persist(); closeM(); observerTasks();
    };
    openM();
  };
})();
