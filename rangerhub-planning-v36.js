/* Meeting planning and the open dashboard, shared by the demo and private app. */
window.RangerHub = window.RangerHub || {};
(() => {
  'use strict';
  const RH = window.RangerHub;
  const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const localDate = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const epochDay = date => /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? Date.parse(`${date}T12:00:00Z`) / 86400000 : NaN;
  const host = () => document.getElementById('main');
  const byId = id => db.meetings.find(m => String(m.id) === String(id));
  const validLeader = id => !!id && db.leaders.some(p => String(p.id) === String(id) && window.RHMembershipModel.active(p));
  function decorateArrows(scope) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.includes('↗') && !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(walker.currentNode.parentElement?.tagName)) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split('↗').forEach((text, i) => {
        if (i) { const span = document.createElement('span'); span.className = 'rh-arrow'; span.setAttribute('aria-hidden', 'true'); span.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 13 13 3M4 3h9v9"/></svg>'; fragment.append(span); }
        fragment.append(document.createTextNode(text));
      });
      node.replaceWith(fragment);
    }
  }
  const leaderOptions = id => `<option value="">Noch nicht zugewiesen</option>${db.leaders.filter(p=>window.RHMembershipModel.active(p)||String(p.id)===String(id)).map(p => `<option value="${p.id}" ${String(p.id) === String(id) ? 'selected' : ''}>${esc(p.name)}${window.RHMembershipModel.active(p)?'':' · Neuverteilung erforderlich'}</option>`).join('')}`;
  const ingredientLines = (text, previous = []) => {
    const used = new Set();
    return String(text || '').split(/\r?\n/).map(s => s.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean).map(text => {
      const old = previous.find(p => p.text === text && !used.has(p.id));
      const item = old ? { ...old } : { id: uid(), text, done: false };
      used.add(item.id); return item;
    });
  };
  function normalizeMeeting(m) {
    for (const key of ['nature', 'action', 'impulse', 'food']) m[key] = m[key] && typeof m[key] === 'object' ? m[key] : { title: '' };
    for (const key of ['nature', 'impulse']) if (typeof m[key].enabled !== 'boolean') m[key].enabled = true;
    if (typeof m.food.enabled !== 'boolean') m.food.enabled = !!(m.food.title || m.food.leaderId || m.food.recipeId);
    if (!Array.isArray(m.food.ingredients)) m.food.ingredients = [];
    m.food.ingredients = m.food.ingredients.map(p => typeof p === 'string' ? { id: uid(), text: p, done: false } : { ...p, id: p.id || uid(), text: String(p.text || ''), done: !!p.done });
    delete m.status; // Planning status is derived; old draft flags are no longer authoritative.
    return m;
  }
  function normalizeStores() {
    if (!v24Store?.stamms) return;
    for (const data of Object.values(v24Store.stamms)) {
      if (!Array.isArray(data.recipes)) data.recipes = [];
      (data.meetings || []).forEach(normalizeMeeting);
    }
  }
  function planningState(m, today = localDate()) {
    const missing = [];
    if (!m.action?.title?.trim()) missing.push('Aktion');
    if (!validLeader(m.action?.leaderId)) missing.push('Leitung für Aktion');
    if (m.nature?.enabled !== false && !validLeader(m.nature?.leaderId)) missing.push('Leitung für Naturphänomen');
    if (m.impulse?.enabled !== false && !validLeader(m.impulse?.leaderId)) missing.push('Leitung für Impuls');
    const foodEnabled = typeof m.food?.enabled === 'boolean' ? m.food.enabled : !!(m.food?.title || m.food?.leaderId || m.food?.recipeId);
    if (foodEnabled && !validLeader(m.food?.leaderId)) missing.push('Leitung für Essen');
    const days = Math.round(epochDay(m.date) - epochDay(today));
    const complete = missing.length === 0;
    return { complete, missing, days, kind: complete ? 'ready' : days >= 0 && days <= 7 ? 'urgent' : 'pending', label: complete ? 'Planung abgeschlossen' : 'Planung noch nicht abgeschlossen' };
  }
  const badge = m => { const p = planningState(m); return `<span class="plan-badge">${p.complete ? '✓' : '○'} ${p.label}</span>`; };
  function programParts(m) {
    return [['Naturphänomen', m.nature], ['Aktion', m.action], ['Impuls', m.impulse], ['Essen', m.food]].map(([label, part]) => {
      const off = label !== 'Aktion' && part?.enabled === false;
      return `<div class="meetingpart"><b>${label}:</b> ${off ? 'Nicht vorgesehen' : `${esc(part?.title || (label === 'Essen' ? 'Essen vorgesehen' : 'Thema noch offen'))} · ${esc(validLeader(part?.leaderId) ? name(part.leaderId) : 'Leitung noch offen')}`}</div>`;
    }).join('');
  }
  function meetingBlock(m, compact = false) {
    const p = planningState(m);
    return `<article class="meeting-block is-${p.kind}" data-meeting-id="${m.id}" data-planning="${p.kind}"><div class="meeting-heading"><div><div class="meeting-date">${fmt(m.date)} · ${esc(m.start || '18:00')} Uhr</div><h3>${esc(m.theme || 'Rangertreffen')}</h3><div class="muted">${esc(m.place || 'Ort noch offen')}</div></div>${badge(m)}</div>${programParts(m)}${p.missing.length ? `<p class="planning-missing">Noch offen: ${p.missing.map(esc).join(' · ')}</p>` : ''}<div class="meeting-open"><span class="muted" style="font-size:11px">${p.days === 0 ? 'Heute' : p.days === 1 ? 'Morgen' : p.days > 1 ? `In ${p.days} Tagen` : 'Vergangenes Treffen'}</span><button class="btn" onclick="openRangerMeeting(${m.id})">${isLeader() ? 'Planung öffnen' : 'Treffen öffnen'} ↗</button></div>${compact ? '<div id="nextWeather" class="muted">Wetter wird geladen …</div>' : ''}</article>`;
  }
  function assignedTasks(personId = session?.id) {
    const tasks = [];
    for (const m of db.meetings) {
      for (const [key, title] of [['nature', 'Naturphänomen'], ['action', 'Aktion'], ['impulse', 'Impuls'], ['food', 'Essen']]) {
        const part = m[key];
        if (part?.enabled === false || String(part?.leaderId) !== String(personId)) continue;
        tasks.push({ date: m.date, title: `${title} vorbereiten`, detail: part.title || m.theme, meetingId: m.id, type: 'program' });
        if (key === 'food') for (const item of part.ingredients || []) if (!item.done) tasks.push({ date: m.date, title: item.text, detail: `Lebensmittel · ${m.theme}`, meetingId: m.id, ingredientId: item.id, type: 'ingredient' });
      }
    }
    for (const m of db.leaderMeetings) for (const a of m.actions || []) if (String(a.leaderId) === String(personId) && !a.done) tasks.push({ date: a.due || m.date, title: a.text, detail: 'Aufgabe aus Leitermeeting', leaderMeetingId: m.id, type: 'leader' });
    return tasks.sort((a, b) => a.date.localeCompare(b.date));
  }
  function taskClick(task) { return task.type === 'leader' ? `openLeaderMeeting(${task.leaderMeetingId})` : `openRangerMeeting(${task.meetingId})`; }
  function foodChecklist(m) {
    const mayEdit = isLeader() && (String(m.food.leaderId) === String(session.id) || v24CanManagePeople());
    return `<ul class="checklist">${m.food.ingredients.map(item => `<li><label><input type="checkbox" ${item.done ? 'checked' : ''} ${mayEdit ? '' : 'disabled'} onchange="RangerHub.toggleIngredient(${m.id},'${item.id}',this.checked)"><span>${esc(item.text)}</span></label></li>`).join('')}</ul>`;
  }
  RH.toggleIngredient = (meetingId, ingredientId, done) => {
    const m = byId(meetingId);
    if (!m || !isLeader() || !(String(m.food.leaderId) === String(session.id) || v24CanManagePeople())) return;
    const item = m.food.ingredients.find(p => p.id === ingredientId);
    if (!item) return;
    item.done = !!done;
    v24Persist();
    if (view === 'tasks') render();
  };
  meetings = function () {
    host().innerHTML = `<div class="top page-heading"><div><h1>Rangertreffen</h1><p class="muted">Die Planung wächst mit euren Ideen. Der Status ergibt sich aus den Zuweisungen.</p></div>${isLeader() ? '<button class="btn" onclick="meetingFormV15()">+ Neues Rangertreffen</button>' : ''}</div><div class="meeting-list">${db.meetings.slice().sort((a, b) => b.date.localeCompare(a.date)).map(m => meetingBlock(m)).join('') || '<p>Noch keine Treffen geplant.</p>'}</div>`;
  };
  parts = programParts;
  const previousSummary = lastSummary;
  lastSummary = function (m) {
    return previousSummary({ ...m, nature: m.nature?.enabled === false ? { title: 'Nicht vorgesehen' } : m.nature, impulse: m.impulse?.enabled === false ? { title: 'Nicht vorgesehen' } : m.impulse });
  };
  nature = function () {
    const rows = db.meetings.filter(m => m.nature?.enabled !== false && m.nature?.leaderId).sort((a, b) => b.date.localeCompare(a.date));
    host().innerHTML = `<div class="top page-heading"><h1>Naturphänomene</h1></div><div>${rows.map(m => `<div class="task-row"><div><b>${esc(m.nature.title || 'Thema noch offen')}</b><small>${esc(name(m.nature.leaderId))}</small></div><span class="task-date">${fmt(m.date)}</span></div>`).join('') || '<p class="muted">Noch keine Naturphänomene geplant.</p>'}</div>`;
  };
  openRangerMeeting = function (id) {
    const m = byId(id); if (!m || !session) return;
    const past = m.date < localDate();
    const cancelled = db.cancellations.some(c => c.meetingId === id && c.kind === session.kind && c.personId === session.id);
    const cancellations = db.cancellations.filter(c => c.meetingId === id);
    const p = planningState(m);
    box.innerHTML = `<div class="top"><h2>${esc(m.theme)} · ${fmt(m.date)}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><section class="meeting-block is-${p.kind}" data-planning="${p.kind}"><div class="meeting-heading"><div class="muted">${esc(m.start || '')}–${esc(m.end || '')} · ${esc(m.place || '')}</div>${badge(m)}</div>${programParts(m)}${p.missing.length ? `<p class="planning-missing">Noch offen: ${p.missing.map(esc).join(' · ')}</p>` : ''}</section>${m.details ? `<section style="margin-top:24px"><h3>Weitere Inhalte</h3><p style="white-space:pre-wrap">${esc(m.details)}</p></section>` : ''}${m.food.enabled ? `<section class="meeting-food"><h3>${esc(m.food.title || 'Gemeinsam essen')}</h3><p class="muted">Verantwortlich: ${esc(name(m.food.leaderId))}</p>${m.food.ingredients.length ? `<h4>Lebensmittel</h4>${foodChecklist(m)}` : '<p class="muted">Noch keine Lebensmittel eingetragen.</p>'}${m.food.instructions ? `<h4>Zubereitung</h4><div class="recipe-instructions">${esc(m.food.instructions)}</div>` : ''}</section>` : ''}${!past ? `<button class="bigCancel" onclick="cancel(${id})">${cancelled ? 'Abmeldung zurücknehmen' : 'Abmeldung für dieses Treffen'}</button>` : ''}${isLeader() ? `<section style="margin-top:20px"><b>Abgemeldet:</b> ${cancellations.map(c => esc((c.kind === 'leaders' ? db.leaders : db.rangers).find(person => person.id === c.personId)?.name || 'Archiviertes Profil')).join(', ') || 'Niemand'}</section><div class="row" style="margin-top:20px"><button class="btn" onclick="meetingFormV15(${id})">Treffen bearbeiten</button><button class="btn alt" onclick="attendance(${id})">Anwesenheit pflegen</button><button class="btn red" onclick="deleteMeetingV15(${id})">Treffen löschen</button></div>` : ''}${past ? `<section style="margin-top:24px">${lastSummary(m)}</section>` : ''}`;
    openM();
  };
  function draftFromForm(form) {
    const value = key => form.elements.namedItem(key)?.value || '';
    const old = form._meeting;
    form._ingredients = ingredientLines(value('ingredients'), form._ingredients || []);
    return { ...old, theme: value('theme'), date: value('date'), start: value('start'), end: value('end'), place: value('place'), details: value('details'), actionLibraryId: value('libraryAction') || null,
      action: { ...old.action, title: value('actionTitle'), description: value('actionDescription'), leaderId: Number(value('actionLeader')) || null },
      nature: { ...old.nature, enabled: value('natureMode') !== 'none', title: value('natureTitle'), description: value('natureDescription'), leaderId: Number(value('natureLeader')) || null },
      impulse: { ...old.impulse, enabled: value('impulseMode') !== 'none', title: value('impulseTitle'), description: value('impulseDescription'), leaderId: Number(value('impulseLeader')) || null },
      food: { ...old.food, enabled: value('foodMode') !== 'none', title: value('foodTitle'), leaderId: Number(value('foodLeader')) || null, recipeId: value('recipeId') || null, instructions: value('foodInstructions'), ingredients: form._ingredients.map(p => ({ ...p })) }
    };
  }
  function updatePlanningPreview(form) {
    const m = draftFromForm(form), p = planningState(m);
    const el = form.querySelector('[data-planning-preview]');
    el.className = `planning-preview full is-${p.kind}`;
    el.innerHTML = `<b>${p.complete ? '✓ ' : ''}${p.label}</b><small>${p.missing.length ? `Noch offen: ${p.missing.map(esc).join(' · ')}` : 'Alle benötigten Verantwortlichen sind zugewiesen.'}</small>`;
    for (const key of ['nature', 'impulse', 'food']) {
      const fieldset = form.querySelector(`[data-fields="${key}"]`);
      fieldset.hidden = !m[key].enabled;
      fieldset.disabled = !m[key].enabled;
    }
  }
  function ingredientPreview(form) {
    form._ingredients = ingredientLines(form.elements.ingredients.value, form._ingredients || []);
    form.querySelector('[data-ingredient-preview]').innerHTML = form._ingredients.length ? `<ul class="checklist">${form._ingredients.map(p => `<li><label><input type="checkbox" ${p.done ? 'checked' : ''} onchange="RangerHub.toggleDraftIngredient('${p.id}',this.checked)"><span>${esc(p.text)}</span></label></li>`).join('')}</ul>` : '<p class="form-note">Zutaten aus einem Rezept erscheinen hier automatisch als Checkliste.</p>';
  }
  RH.toggleDraftIngredient = (id, checked) => { const form = document.getElementById('meeting-planning-form'); const p = form?._ingredients?.find(x => x.id === id); if (p) p.done = checked; };
  RH.refreshPlanning = () => { const form = document.getElementById('meeting-planning-form'); if (form) updatePlanningPreview(form); };
  RH.chooseRecipe = (id, force = false) => {
    const form = document.getElementById('meeting-planning-form'); if (!form) return;
    const recipe = db.recipes.find(r => String(r.id) === String(id));
    if (!recipe) { form.dataset.recipeId = ''; return; }
    if (!force && form.elements.ingredients.value.trim() && form.dataset.recipeId !== String(id) && !confirm('Zutaten und Zubereitung durch dieses Rezept ersetzen?')) { form.elements.recipeId.value = form.dataset.recipeId || ''; return; }
    form.elements.foodTitle.value = recipe.title;
    form.elements.foodInstructions.value = recipe.instructions;
    form.elements.ingredients.value = recipe.ingredients.join('\n');
    form.dataset.recipeId = String(id);
    form.elements.recipeId.value = String(id);
    ingredientPreview(form); updatePlanningPreview(form);
  };
  const optionalProgram = (key, label, m) => `<fieldset class="plan-fieldset"><legend>${label}</legend><label class="mode-label">Planung<select name="${key}Mode"><option value="planned" ${m[key].enabled ? 'selected' : ''}>${label} vorgesehen</option><option value="none" ${!m[key].enabled ? 'selected' : ''}>${key === 'impulse' ? 'Kein Impuls' : 'Kein Naturphänomen'} vorgesehen für dieses Treffen</option></select></label><fieldset class="plan-fields" data-fields="${key}" style="border:0;padding:0"><label>Thema (optional)<input name="${key}Title" value="${esc(m[key].title || '')}"></label><label>Verantwortliche Leitung<select name="${key}Leader">${leaderOptions(m[key].leaderId)}</select></label><label class="full">Inhalt<textarea name="${key}Description" rows="3">${esc(m[key].description || '')}</textarea></label></fieldset></fieldset>`;
  meetingFormV15 = function (id = 0, date = '', suppliedDraft = null) {
    if (!isLeader()) return;
    const found = id ? byId(id) : null;
    const m = normalizeMeeting(structuredClone(suppliedDraft || found || { id: 0, theme: 'Rangertreffen', date, start: '18:00', end: '20:30', place: 'Gemeindehaus', nature: {}, impulse: {}, action: {}, food: {}, attendance: { rangers: {}, leaders: {} } }));
    box.innerHTML = `<div class="top"><h2>${id ? 'Rangertreffen bearbeiten' : 'Rangertreffen planen'}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><p class="form-note">Du kannst jederzeit zwischenspeichern. Der Planungsstatus wird automatisch berechnet.</p><form id="meeting-planning-form" class="form"><div data-planning-preview class="planning-preview full" role="status" aria-live="polite"></div><label>Name<input name="theme" required value="${esc(m.theme)}"></label><label>Datum<input type="date" name="date" required value="${esc(m.date || date)}"></label><label>Start<input type="time" name="start" value="${esc(m.start || '')}"></label><label>Ende<input type="time" name="end" value="${esc(m.end || '')}"></label><label class="full">Ort<input name="place" value="${esc(m.place || '')}"></label><fieldset class="plan-fieldset"><legend>Aktion</legend><div class="plan-fields"><label class="full">Aus der Aktionsbibliothek<select name="libraryAction" onchange="fillLibraryAction(this.value);RangerHub.refreshPlanning()">${actionOptions(m.actionLibraryId)}</select></label><label>Aktion · Pflicht für eine fertige Planung<input id="meetingActionTitle" name="actionTitle" value="${esc(m.action.title || '')}"></label><label>Verantwortliche Leitung<select name="actionLeader">${leaderOptions(m.action.leaderId)}</select></label><label class="full">Aktionsinhalt<textarea id="meetingActionDescription" name="actionDescription" rows="3">${esc(m.action.description || '')}</textarea></label><label class="full"><span class="row"><input type="checkbox" name="saveActionToLibrary">Aktion zusätzlich in der Bibliothek speichern</span></label></div></fieldset>${optionalProgram('nature', 'Naturphänomen', m)}${optionalProgram('impulse', 'Impuls', m)}<fieldset class="plan-fieldset"><legend>Gemeinsam essen</legend><label class="mode-label">Essen<select name="foodMode"><option value="none" ${!m.food.enabled ? 'selected' : ''}>Kein Essen vorgesehen</option><option value="planned" ${m.food.enabled ? 'selected' : ''}>Essen ist vorgesehen</option></select></label><fieldset class="plan-fields" data-fields="food" style="border:0;padding:0"><label>Was gibt es? (optional)<input name="foodTitle" value="${esc(m.food.title || '')}"></label><label>Verantwortliche Leitung<select name="foodLeader">${leaderOptions(m.food.leaderId)}</select></label><label class="full">Rezept auswählen<select name="recipeId" onchange="RangerHub.chooseRecipe(this.value)"><option value="">Ohne gespeichertes Rezept</option>${db.recipes.map(r => `<option value="${esc(r.id)}" ${String(m.food.recipeId) === String(r.id) ? 'selected' : ''}>${esc(r.title)}</option>`).join('')}</select></label><div class="full"><button class="btn alt sm" type="button" onclick="RangerHub.newRecipeForMeeting()">+ Rezept anlegen oder importieren</button></div><label class="full">Benötigte Lebensmittel · eine Zutat pro Zeile<textarea name="ingredients" rows="5">${esc(m.food.ingredients.map(p => p.text).join('\n'))}</textarea></label><div class="full" data-ingredient-preview></div><label class="full">Zubereitung<textarea name="foodInstructions" rows="5">${esc(m.food.instructions || '')}</textarea></label><p class="form-note full">Lebensmittel erscheinen automatisch in der Aufgabenliste der verantwortlichen Leitung. Bereits besorgte Zutaten kannst du abhaken.</p></fieldset></fieldset><label class="full">Weitere Programmpunkte<textarea name="details" rows="3">${esc(m.details || '')}</textarea></label><div class="full row"><button class="btn" type="submit">Planung speichern</button>${id ? `<button type="button" class="btn red" onclick="deleteMeetingV15(${id})">Treffen löschen</button>` : ''}</div></form>`;
    const form = document.getElementById('meeting-planning-form');
    form._meeting = m; form._ingredients = m.food.ingredients; form.dataset.recipeId = m.food.recipeId || '';
    form.addEventListener('input', event => { if (event.target.name === 'ingredients') ingredientPreview(form); updatePlanningPreview(form); });
    form.addEventListener('change', () => updatePlanningPreview(form));
    form.addEventListener('submit', event => saveMeetingV16(event, id));
    ingredientPreview(form); updatePlanningPreview(form); openM();
  };
  saveMeetingV16 = function (event, id) {
    event.preventDefault(); if (!isLeader()) return;
    const form = event.target;
    if (!form.reportValidity()) return;
    const draft = normalizeMeeting(draftFromForm(form));
    let m = id ? byId(id) : null;
    if (id && !m) return;
    if (!m) { m = { id: Date.now(), attendance: { rangers: {}, leaders: {} } }; db.meetings.push(m); }
    Object.assign(m, { ...draft, id: m.id });
    if (form.elements.saveActionToLibrary.checked && m.action.title.trim() && !db.actionLibrary.some(a => a.title === m.action.title)) { const a = { id: Date.now() + 1, title: m.action.title, description: m.action.description || '' }; db.actionLibrary.push(a); m.actionLibraryId = a.id; }
    v24Persist(); closeM(); view = 'meetings'; render();
  };
  saveMeetingV15 = saveMeetingV16;
  tasks = function () {
    if (!isLeader()) return;
    const rows = assignedTasks();
    host().innerHTML = `<div class="top page-heading"><div><h1>Meine Aufgaben</h1><p class="muted">Vorbereitungen, Absprachen und alles für den Einkauf.</p></div><span class="pill">${rows.length} offen</span></div><div>${rows.map(task => `<div class="task-row">${task.type === 'ingredient' ? `<label><input aria-label="${esc(task.title)} besorgt" type="checkbox" onchange="RangerHub.toggleIngredient(${task.meetingId},'${task.ingredientId}',this.checked)"><span><b>${esc(task.title)}</b><small>${esc(task.detail)}</small></span></label>` : `<button class="btn text" style="text-align:left;border:0" onclick="${taskClick(task)}"><b>${esc(task.title)}</b><small>${esc(task.detail)}</small></button>`}<span class="task-date">${fmt(task.date)}</span></div>`).join('') || '<p class="muted">Keine offenen Aufgaben. Zeit für draußen.</p>'}</div>`;
  };
  dash = function () {
    const today = localDate();
    const next = db.meetings.filter(m => m.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    const birthdays = v23BirthdayList(4);
    const people = db.rangers.slice(0, 4);
    const todo = isLeader() ? assignedTasks().filter(t => t.date >= today).slice(0, 4) : [];
    const missing = next ? nextMissing(next) : [];
    host().innerHTML = `<div class="dash-editorial"><header class="dash-masthead"><span>Stamm ${esc(v24StammName())}</span><span>${new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' })}</span></header><section class="dash-intro"><div><span class="dash-welcome">Schön, dass du da bist, ${esc(currentUser()?.name || 'Ranger')}.</span><h1>Zusammen.<br><em>Weiter.</em></h1><p>Neue Wege gehen. Verantwortung teilen. Und zwischen all den Plänen das Abenteuer nicht vergessen.</p><div class="dash-links"><button onclick="goV17('calendar')">Kalender ansehen ↗</button><button onclick="goV17('path')">Wachstumspfad öffnen ↗</button></div></div><aside class="dash-note"><span class="big">${db.leaders.length + db.rangers.length}</span><p>Menschen.<br>Ein gemeinsamer Weg.</p><div class="dash-meta"><span>${db.rangers.length} Ranger<br>${db.leaders.length} im Leiterteam</span><span>Ein Stamm.<br>Viele Möglichkeiten.</span></div></aside></section><div class="dash-body"><section class="dash-section"><div class="section-kicker"><span class="number">01</span>Was vor uns liegt</div><div class="heading-row"><h2>Nächstes Treffen</h2>${isLeader() ? '<button class="btn text" onclick="meetingFormV15()">Neu planen +</button>' : ''}</div>${next ? meetingBlock(next, true) : '<p class="muted">Das nächste Abenteuer wartet noch auf einen Termin.</p>'}<div class="dash-links"><button onclick="goV17('meetings')">Alle Rangertreffen ↗</button></div></section><section class="dash-section"><div class="section-kicker"><span class="number">02</span>Ein Grund zu feiern</div><h2>Nächste Geburtstage</h2>${birthdays.map(p => `<div class="dash-birthday"><span class="date">${p.nextDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span><span><b>${esc(p.name)}</b><small>wird ${p.nextAge} · ${esc(p.church || v24StammName())}</small></span></div>`).join('') || '<p class="muted">Noch keine Geburtstage hinterlegt.</p>'}</section><section class="dash-section"><div class="section-kicker"><span class="number">03</span>Schritt für Schritt</div><div class="heading-row"><h2>Unser Wachstum</h2><button class="btn text" onclick="goV17('rangers')">Alle Ranger ↗</button></div>${people.map(p => `<button class="dash-person" onclick="RangerHub.openPerson(${p.id})"><span><b>${esc(p.name)}</b><small>${esc(p.stage || 'Beobachter')} · ${v23StagePercent(p.stage || 'Beobachter', p.id)} % erreicht</small></span><span aria-hidden="true">↗</span></button>`).join('') || '<p class="muted">Eure ersten Ranger machen den Anfang.</p>'}<div class="dash-links"><button onclick="goV17('leaders')">Leiterteam ↗</button><button onclick="goV17('path')">Den Weg entdecken ↗</button></div></section><section class="dash-section"><div class="section-kicker"><span class="number">04</span>${isLeader() ? 'Gemeinsam möglich machen' : 'Gut zu wissen'}</div><h2>${isLeader() ? 'Noch auf meiner Liste' : 'Wer ist dabei?'}</h2>${isLeader() ? todo.map(t => `<button class="dash-person" onclick="${taskClick(t)}"><span><b>${esc(t.title)}</b><small>${fmt(t.date)} · ${esc(t.detail)}</small></span><span>↗</span></button>`).join('') || '<p class="muted">Gerade nichts offen. Genieße den Freiraum.</p>' : `<p class="muted">${missing.length ? missing.map(p => esc(p.name)).join(', ') + ' können beim nächsten Treffen nicht dabei sein.' : 'Für das nächste Treffen sind keine Abmeldungen eingetragen.'}</p>`}<div class="dash-links">${isLeader() ? '<button onclick="goV17(\'tasks\')">Meine Aufgaben ↗</button>' : ''}<button onclick="goV17('abs')">Abwesenheiten ↗</button></div></section></div><footer class="dash-footer">Draußen beginnt das Abenteuer. Zusammen wird mehr daraus.</footer></div>`;
    if (next) loadMeetingWeather(next);
  };
  RH.openPerson = id => { if (typeof v24RangerProfile === 'function') v24RangerProfile(id); else goV17('rangers'); };
  path = function () {
    const leader = isLeader(), personId = leader ? null : session.id;
    const official = leader ? 'Leiteransicht' : currentUser()?.stage || 'Beobachter';
    const rows = stages.map((stage, i) => {
      const available = leader || stageUnlockedForRanger(i, personId), done = !leader && stageDoneForRanger(stage, personId), percent = leader ? 0 : v23StagePercent(stage, personId);
      return `<button type="button" class="growth-stage ${available ? '' : 'locked'}" onclick="stageClickV19('${stage}',${i})"><span class="num">0${i + 1}</span><span><h2>${esc(stage)}</h2><small>${esc(v21StageSubtitles[i])}</small><small>${leader ? 'Aufgaben und Fortschritte ansehen' : !available ? 'Ab 80 % der vorherigen Stufe frei' : done ? 'Abgeschlossen' : `${percent} % erreicht`}</small>${!leader ? `<span class="growth-meter"><i style="width:${percent}%"></i></span>` : ''}</span><span class="arrow" aria-hidden="true">${!available ? '⌑' : done ? '✓' : '↗'}</span></button>`;
    }).reverse().join('');
    host().innerHTML = `<section class="growth-page" aria-label="Wachstumspfad"><header class="growth-intro"><div><span class="section-kicker">Dein Weg als Ranger</span><h1>Ein Schritt.<br>Neue Möglichkeiten.</h1><p>Fünf Etappen voller Entdeckungen. Jede Erfahrung bringt dich weiter – in deinem Tempo und mit deinem Team.</p></div><span class="pill">${esc(official)}</span></header><div class="growth-layout"><figure class="growth-art"><img src="assets/growth-journey.png" alt="Zwei Ranger begleiten dich auf dem Weg durch die fünf Wachstumsstufen" loading="lazy"></figure><div class="growth-stages">${rows}<p class="growth-footnote">Ab 80 % öffnet sich die nächste Etappe. Bei 100 % erreichst du die nächste offizielle Stufe.</p></div></div></section>`;
  };
  const originalCalendar = calendar;
  calendar = function () {
    originalCalendar();
    host().querySelectorAll('.event[onclick*="openRangerMeeting"]').forEach(el => {
      const id = el.getAttribute('onclick').match(/openRangerMeeting\((\d+)\)/)?.[1];
      const m = byId(id); if (!m) return;
      const p = planningState(m); el.classList.add(`is-${p.kind}`); el.title = p.label;
      el.textContent = `${m.theme} · ${m.start} · ${p.complete ? '✓' : '○'}`;
    });
  };
  const previousGo = goV17;
  goV17 = function (next) { if (next === 'recipes') { view = 'recipes'; stammOpen = false; render(); } else previousGo(next); };
  const previousRender = render;
  render = function () {
    normalizeStores(); previousRender();
    if (!session) return;
    const settingsButton = root.querySelector('.settingsBtn');
    if (settingsButton) {
      settingsButton.setAttribute('aria-label', 'Profil und Einstellungen'); settingsButton.setAttribute('title', 'Profil und Einstellungen');
      settingsButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m9.2 3-.7 2.2-2 .9-2.1-.5-2 3.4L4 10.6v2.8l-1.6 1.6 2 3.4 2.1-.5 2 .9.7 2.2h4l.7-2.2 2-.9 2.1.5 2-3.4-1.6-1.6v-2.8L20 9l-2-3.4-2.1.5-2-.9-.7-2.2z"/><circle cx="11.2" cy="12" r="3.2"/></svg>';
    }
    const footer = root.querySelector('.v22-sidefoot'); if (footer) footer.innerHTML = `<b>${esc(v24StammName())}</b>${esc(v24RoleTitle())}<br>Gemeinsam wachsen.`;
    const nav = root.querySelector('.nav');
    const start = nav?.querySelector('button'); if (start) { start.textContent = 'Dashboard'; start.setAttribute('aria-label', 'Dashboard'); }
    if (nav && !nav.querySelector('[data-recipe-nav]')) nav.insertAdjacentHTML('beforeend', `<button data-recipe-nav class="${view === 'recipes' ? 'active' : ''}" onclick="goV17('recipes')">Rezepte</button>`);
    if (view === 'recipes' && RH.renderRecipes) RH.renderRecipes();
    decorateArrows(root);
  };
  const priorOpenModal = openM;
  openM = function () { decorateArrows(modal); priorOpenModal(); };
  RH.uid = uid; RH.localDate = localDate; RH.planningState = planningState; RH.normalizeMeeting = normalizeMeeting; RH.normalizeStores = normalizeStores; RH.ingredientLines = ingredientLines; RH.draftFromForm = draftFromForm; RH.assignedTasks = assignedTasks; RH.byMeetingId = byId; RH.content = host;
  normalizeStores(); v24Persist();
  const stylesheet = document.querySelector('[data-rangerhub-design]'); if (stylesheet) document.head.appendChild(stylesheet);
  render();
  let lastDay = localDate();
  setInterval(() => { const nextDay = localDate(); if (nextDay !== lastDay) { lastDay = nextDay; if (session) render(); } }, 60000);
})();
