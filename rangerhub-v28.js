/* V28 reuses the existing store, roles, planning forms and task screens. */
(() => {
  'use strict';
  const RH = window.RangerHub, library = window.RangerHubLibraryV28;
  const host = RH.content, same = (a, b) => String(a) === String(b), arg = v => esc(JSON.stringify(v));
  const norm = v => String(v || '').trim().toLocaleLowerCase('de');
  const leader = () => isLeader() && !!v24Principal() && (v24IsAdmin() || session.homeStammId === v24StammId);
  const context = () => session && `${v24StammId}:${session.homeStammId}:${session.kind}:${session.id}`;
  const notify = text => { let p = document.getElementById('v28-feedback'); if (!p) { p = document.createElement('p'); p.id = 'v28-feedback'; p.setAttribute('role', 'status'); document.body.append(p); } p.textContent = text; clearTimeout(notify.timer); notify.timer = setTimeout(() => { p.textContent = ''; }, 6000); };
  RH.v28Notify = notify;
  function save(apply, rollback) { try { apply(); v24Persist(); return true; } catch { rollback(); notify('Nicht gespeichert. Der Browserspeicher ist voll oder nicht verfügbar. Deine bisherigen Daten bleiben erhalten.'); return false; } }
  const natureDescription = n => [n.fact, n.creation ? 'Gottes Schöpfung\n' + n.creation : '', n.verse ? 'Bibelstelle: ' + n.verse : '', n.question ? 'Gesprächsfrage: ' + n.question : ''].filter(Boolean).join('\n\n');
  const impulseDescription = p => [p.verse ? 'Bibelstelle: ' + p.verse : '', p.message, p.question ? 'Gesprächsfrage: ' + p.question : ''].filter(Boolean).join('\n\n');
  const findNature = id => db.natureLibrary?.find(n => same(n.id, id));
  const findAction = id => db.actionLibrary.find(a => same(a.id, id));
  const allImpulses = () => db.actionLibrary.flatMap(a => (a.impulseSuggestions || []).map(p => ({ ...p, actionId: a.id, actionTitle: a.title })));
  const findImpulse = id => allImpulses().find(p => same(p.id, id));
  RH.natureDescription = natureDescription; RH.impulseDescription = impulseDescription;
  let imported = false; const previous = [];
  for (const data of Object.values(v24Store.stamms)) {
    if (data.v28LibraryImported || !library) continue;
    previous.push({ data, nature: data.natureLibrary, actions: data.actionLibrary, imported: data.v28LibraryImported });
    data.natureLibrary = [...(data.natureLibrary || [])]; data.actionLibrary = [...(data.actionLibrary || [])];
    for (const n of library.nature) if (!data.natureLibrary.some(x => same(x.id, n.id) || norm(x.title) === norm(n.title))) data.natureLibrary.push(structuredClone(n));
    let next = Math.max(920000000000, ...data.actionLibrary.map(a => Number(a.id) || 0)) + 1;
    for (const a of library.actions) {
      if (data.v27ActionRemovals?.some(r => norm(r.title) === norm(a.title))) continue;
      const index = data.actionLibrary.findIndex(x => x.sourceV28 === a.id || norm(x.title) === norm(a.title));
      const old = index >= 0 ? data.actionLibrary[index] : null;
      const suggestions = [...(old?.impulseSuggestions || [])];
      if (!suggestions.some(p => p.id === a.impulse.id)) suggestions.push(structuredClone(a.impulse));
      const item = { ...old, id: old ? old.id : next++, sourceV28: a.id, title: old ? old.title : a.title, category: old && Object.hasOwn(old, 'category') ? old.category : a.category, impulseSuggestions: suggestions,
        description: old && Object.hasOwn(old, 'description') ? old.description : `Ablauf\n${a.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nMaterial\n${a.materials.join('\n')}`, planningMaterials: old?.planningMaterials || a.materials, planningSteps: old?.planningSteps || a.steps };
      if (index >= 0) data.actionLibrary[index] = item; else data.actionLibrary.push(item);
    }
    data.v28LibraryImported = true; imported = true;
  }
  if (imported) { try { v24Persist(); } catch { previous.forEach(p => { p.data.natureLibrary = p.nature; p.data.actionLibrary = p.actions; if (p.imported === undefined) delete p.data.v28LibraryImported; else p.data.v28LibraryImported = p.imported; }); notify('Die Vorschlagsbibliothek konnte nicht gespeichert werden. Bitte zuerst ein Backup exportieren.'); } }

  // Small inline SVG icons: the existing menu and existing role filtering stay in charge.
  const shapes = {
    dash: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1z"/>',
    stamm: '<path d="M12 21v-9M12 15C4 16 3 9 3 5c7 0 10 3 9 10ZM12 11c-1-6 3-9 9-9 0 6-3 10-9 9Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-12 4h2m4 0h2m-8 3h2"/>',
    path: '<path d="m3 21 7-17 4 8 3-4 5 13H3Zm4-10 3 2 3-2m4 5 2 1"/>',
    abs: '<path d="m8 4 1-2h6l1 2m-9 0H5v18h14V4h-2M8 4h8v4H8zM8 15l3 3 5-6"/>',
    tasks: '<path d="M9 5h12M9 12h12M9 19h12M2 4l2 2 3-4M2 11l2 2 3-4M2 18l2 2 3-4"/>',
    messages: '<path d="M21 14a3 3 0 0 1-3 3H9l-6 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3zM7 7h10M7 11h7"/>',
    rangers: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-17a3 3 0 0 1 0 6m2 11v-3a6 6 0 0 0-2-4"/>',
    leaders: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2M2 4l2 1m16 0 2-1M2 10h3m14 0h3"/>',
    leadermeetings: '<circle cx="12" cy="5" r="2"/><circle cx="4" cy="11" r="2"/><circle cx="20" cy="11" r="2"/><path d="M8 12a4 4 0 0 1 8 0M1 21v-3a3 3 0 0 1 6 0v3m10 0v-3a3 3 0 0 1 6 0v3M8 19h8"/>',
    activities: '<path d="m12 2 2.5 6 6.5 1-5 4.5 1.5 6.5-5.5-3.5L6.5 20 8 13.5 3 9l6.5-1z"/>',
    nature: '<path d="M19 3C9 1 2 8 5 15c4 7 16 1 14-12ZM4 21 15 9M8 16l-1-5m5 1 5 1"/>',
    recipes: '<path d="M6 10a4 4 0 0 1 1-8 6 6 0 0 1 10 0 4 4 0 0 1 1 8v11H6Zm0 6h12M9 10v3m6-3v3"/>',
    impulses: '<path d="M8 15c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7M8 18h8m-7 3h6M12 4v6m-3-3h6"/>',
    meetings: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 2v4m10-4v4M3 10h18m-13 5 3 3 5-5"/>',
    logout: '<path d="M9 3H3v18h6m6-14 5 5-5 5m-8-5h13"/>',
    back: '<path d="m14 5-7 7 7 7M7 12h14"/>',
    check: '<path d="m4 12 5 5L20 6"/>'
  };
  RH.icon = (name, cls = '') => `<svg class="rh-nav-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shapes[name] || shapes.stamm}</svg>`;
  function menus() {
    const nav = root.querySelector('.nav'); if (!nav || !session) return;
    if (!nav.querySelector('[data-message-nav]')) { const b = document.createElement('button'); b.type = 'button'; b.dataset.messageNav = ''; b.onclick = () => goV17('messages'); b.textContent = 'Nachrichten'; nav.querySelector('button')?.after(b); }
    const sub = nav.querySelector('.navSub');
    if (leader() && sub && !sub.querySelector('[data-impulse-nav]')) { const b = document.createElement('button'); b.type = 'button'; b.dataset.impulseNav = ''; b.onclick = () => goV17('impulses'); b.textContent = 'Impulse'; sub.append(b); }
    nav.querySelectorAll('button,.navGroupTitle').forEach(b => {
      if (b.dataset.v28Icon) return;
      const route = b.dataset.messageNav != null ? 'messages' : b.dataset.impulseNav != null ? 'impulses' : b.classList.contains('navGroupTitle') ? 'stamm' : b.getAttribute('onclick')?.match(/goV17\('([^']+)'\)/)?.[1] || (/logout/.test(b.getAttribute('onclick') || '') ? 'logout' : 'stamm');
      const label = b.textContent.trim(); b.innerHTML = RH.icon(route) + `<span class="rh-nav-label">${esc(label)}</span>`; b.dataset.v28Icon = route;
      if (route === 'messages') { b.classList.toggle('active', view === 'messages'); b.setAttribute('aria-label', 'Nachrichten'); }
      if (route === 'impulses') b.classList.toggle('active', view === 'impulses');
    });
  }

  nature = function () {
    if (!leader()) return;
    const planned = db.meetings.filter(m => m.nature?.enabled !== false && m.nature?.leaderId).sort((a, b) => b.date.localeCompare(a.date));
    host().innerHTML = `<header class="top page-heading"><div><span class="section-kicker">Staunen über Gottes Schöpfung</span><h1>Naturphänomene</h1><p class="muted">Entdecken, kurz festhalten und beim nächsten Treffen weitergeben.</p></div><button class="btn" onclick="RangerHub.editNature()">+ Naturphänomen</button></header><label class="v28-search">Vorschlag suchen<input type="search" placeholder="Tier, Besonderheit oder Bibelstelle …" oninput="RangerHub.filterNature(this.value)"></label><div class="v28-nature-list">${(db.natureLibrary || []).map(n => `<article class="v28-nature" data-nature-id="${esc(n.id)}"><details><summary><span>${esc(n.title)}</span><span aria-hidden="true">+</span></summary><h3>Das Besondere</h3><p>${esc(n.fact)}</p>${n.creation ? `<h3>Gottes Schöpfung</h3><p>${esc(n.creation)}</p>` : ''}${n.verse ? `<p class="v28-verse">${esc(n.verse)}</p>` : ''}${n.question ? `<p class="v28-question">${esc(n.question)}</p>` : ''}<div class="row"><button class="btn" onclick="RangerHub.planLibraryItem('nature',${arg(n.id)})">Für ein Treffen planen</button><button class="btn alt" onclick="RangerHub.editNature(${arg(n.id)})">Bearbeiten</button>${v24CanManagePeople() ? `<button class="btn red" onclick="RangerHub.deleteNature(${arg(n.id)})">Löschen</button>` : ''}</div></details></article>`).join('')}</div><p data-nature-empty hidden>Kein passender Vorschlag gefunden.</p><details class="meeting-archive"><summary>Bereits geplante Naturphänomene</summary>${planned.map(m => `<button class="v28-planned-nature" onclick="openRangerMeeting(${arg(m.id)})"><span><b>${esc(m.nature.title || 'Thema noch offen')}</b><small>${esc(name(m.nature.leaderId))}</small></span><span>${fmt(m.date)}</span></button>`).join('') || '<p class="muted">Noch keine Naturphänomene geplant.</p>'}</details>`;
  };
  RH.filterNature = query => { let found = 0; host().querySelectorAll('[data-nature-id]').forEach(el => { el.hidden = !norm(el.textContent).includes(norm(query)); if (!el.hidden) found++; }); const empty = host().querySelector('[data-nature-empty]'); if (empty) empty.hidden = !!found; };
  RH.editNature = (id = '') => {
    if (!leader()) return;
    const n = id ? findNature(id) : null; if (id && !n) return;
    box.innerHTML = `<div class="top"><h2>${n ? 'Naturphänomen bearbeiten' : 'Naturphänomen festhalten'}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><form id="v28-nature-form" class="form"><label class="full">Name<input name="title" required maxlength="120" value="${esc(n?.title || '')}"></label><label class="full">Besonderheit · kurz und verständlich<textarea name="fact" required maxlength="4000" rows="4">${esc(n?.fact || '')}</textarea></label><label class="full">Gedanke zu Gottes Schöpfung<textarea name="creation" maxlength="4000" rows="3">${esc(n?.creation || '')}</textarea></label><label class="full">Bibelstelle<input name="verse" maxlength="200" value="${esc(n?.verse || '')}"></label><label class="full">Gesprächsfrage<textarea name="question" maxlength="1000" rows="2">${esc(n?.question || '')}</textarea></label><button class="btn full">Speichern</button></form>`;
    box.querySelector('form').onsubmit = e => { e.preventDefault(); if (!leader() || !e.target.reportValidity()) return; const f = e.target.elements, old = db.natureLibrary; const item = { ...n, id: n?.id || 'nature-'+RH.uid(), title: f.title.value.trim(), fact: f.fact.value.trim(), creation: f.creation.value.trim(), verse: f.verse.value.trim(), question: f.question.value.trim() }; if (!item.title || !item.fact) return; if (save(() => { db.natureLibrary = n ? old.map(x => x === n ? item : x) : [...old, item]; }, () => { db.natureLibrary = old; })) { closeM(); goV17('nature'); } };
    openM();
  };
  RH.deleteNature = id => { if (!leader() || !v24CanManagePeople() || !findNature(id) || !confirm('Diesen Naturphänomen-Vorschlag löschen? Geplante Treffen behalten ihre Inhalte.')) return; const old = db.natureLibrary; if (save(() => { db.natureLibrary = old.filter(x => !same(x.id, id)); }, () => { db.natureLibrary = old; })) nature(); };
  const originalActivities = activities;
  activities = function () {
    originalActivities(); if (!leader()) return;
    host().querySelectorAll('[data-action-id]').forEach(el => {
      const a = findAction(el.dataset.actionId); if (!a || el.querySelector('[data-v28-action-tools]')) return;
      const detail = el.querySelector('details'); detail.insertAdjacentHTML('beforeend', `<div class="v28-action-tools" data-v28-action-tools><button class="btn" onclick="RangerHub.planLibraryItem('action',${arg(a.id)})">Für ein Treffen planen</button>${a.impulseSuggestions?.length ? `<section class="v28-impulses"><h3>Passende Impulsvorschläge</h3>${a.impulseSuggestions.map(p => `<details><summary>${esc(p.title)}</summary><p class="v28-verse">${esc(p.verse)}</p><p>${esc(p.message)}</p><p class="v28-question">${esc(p.question)}</p><small class="muted">${esc(p.origin || 'Eigener Vorschlag')}</small><button class="btn alt" onclick="RangerHub.planLibraryItem('impulse',${arg(p.id)})">Aktion und Impuls planen</button></details>`).join('')}</section>` : ''}</div>`);
    });
  };
  RH.impulses = function () {
    if (!leader()) return;
    host().innerHTML = `<header class="top page-heading"><div><span class="section-kicker">Glauben mitten im Abenteuer</span><h1>Impulse</h1><p class="muted">Eine Botschaft, eine Bibelstelle und eine Frage – passend zur Aktion.</p></div></header><div class="v28-impulse-list">${allImpulses().map(p => `<article class="v28-nature"><details><summary><span>${esc(p.title)}</span><span aria-hidden="true">+</span></summary><small class="muted">Zur Aktion: ${esc(p.actionTitle)}</small><p class="v28-verse">${esc(p.verse)}</p><p>${esc(p.message)}</p><p class="v28-question">${esc(p.question)}</p><button class="btn" onclick="RangerHub.planLibraryItem('impulse',${arg(p.id)})">Für ein Treffen planen</button></details></article>`).join('') || '<p class="muted">Noch keine Vorschläge hinterlegt.</p>'}</div>`;
  };
  let pendingPlan = null;
  RH.planLibraryItem = (kind, id) => {
    if (!leader() || !['nature', 'action', 'impulse'].includes(kind) || !(kind === 'nature' ? findNature(id) : kind === 'action' ? findAction(id) : findImpulse(id))) return;
    const future = db.meetings.filter(m => m.date >= RH.localDate()).sort((a, b) => a.date.localeCompare(b.date));
    box.innerHTML = `<div class="top"><h2>Für ein Rangertreffen planen</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><p>Wähle ein bestehendes Treffen oder beginne eine neue Planung.</p><form id="v28-plan-choice" class="form"><label class="full">Treffen<select name="meeting"><option value="">Neues Rangertreffen</option>${future.map(m => `<option value="${esc(m.id)}">${fmt(m.date)} · ${esc(m.theme || 'Rangertreffen')}</option>`).join('')}</select></label><button class="btn full">Planung öffnen</button></form>`;
    box.querySelector('form').onsubmit = e => { e.preventDefault(); if (!leader()) return; const m = db.meetings.find(x => same(x.id, e.target.elements.meeting.value)); pendingPlan = { kind, id, context: context(), meetingId: m?.id || 0 }; meetingFormV15(m?.id || 0); }; openM();
  };
  RH.chooseNature = (id, force = false) => {
    const form = document.getElementById('meeting-planning-form'), n = findNature(id); if (!leader() || !form) return;
    const oldId = form._meeting.nature.libraryId;
    if (!n) { form._meeting.nature.libraryId = null; return; }
    if (!force && form.elements.natureDescription.value.trim() && !same(oldId, id) && !confirm('Das bisherige Naturphänomen durch diesen Vorschlag ersetzen?')) { form.elements.natureLibrary.value = oldId || ''; return; }
    form._meeting.nature.libraryId = n.id; form.elements.natureLibrary.value = n.id; form.elements.natureMode.value = 'planned'; form.elements.natureTitle.value = n.title; form.elements.natureDescription.value = natureDescription(n); RH.refreshPlanning();
  };
  RH.chooseImpulse = (id, force = false) => {
    const form = document.getElementById('meeting-planning-form'), p = findImpulse(id); if (!leader() || !form) return;
    const oldId = form._meeting.impulse.suggestionId;
    if (!p) { form._meeting.impulse.suggestionId = null; return; }
    if (!force && form.elements.impulseDescription.value.trim() && !same(oldId, id) && !confirm('Den bisherigen Impuls durch diesen Vorschlag ersetzen?')) { form.elements.impulseSuggestion.value = oldId || ''; return; }
    form._meeting.impulse.suggestionId = p.id; form.elements.impulseMode.value = 'planned'; form.elements.impulseTitle.value = p.title; form.elements.impulseDescription.value = impulseDescription(p); updateImpulseOptions(form, p.id); RH.refreshPlanning();
  };
  function updateImpulseOptions(form, selected = form._meeting.impulse.suggestionId) {
    const select = form.elements.impulseSuggestion; if (!select) return;
    const a = findAction(form.elements.libraryAction.value), suggestions = a?.impulseSuggestions || [];
    const existing = selected && findImpulse(selected);
    const choices = [...suggestions, ...(existing && !suggestions.some(p => same(p.id, existing.id)) ? [existing] : [])];
    select.innerHTML = '<option value="">Eigenen Impuls schreiben</option>' + choices.map(p => `<option value="${esc(p.id)}" ${same(selected, p.id) ? 'selected' : ''}>${esc(p.title)} · ${esc(p.verse)}</option>`).join('');
    const note = form.querySelector('[data-v28-impulse-note]'); note.textContent = suggestions.length ? 'Zur gewählten Aktion passt dieser Impuls. Du kannst den Text anschließend anpassen.' : 'Für diese Aktion ist noch kein Vorschlag hinterlegt. Du kannst einen eigenen Impuls schreiben.';
  }
  const oldFill = fillLibraryAction;
  fillLibraryAction = function (id) { oldFill(id); const f = document.getElementById('meeting-planning-form'); if (f) updateImpulseOptions(f); };
  function enhancePlanning() {
    const f = document.getElementById('meeting-planning-form'); if (!f || f.dataset.v28Planning || !leader()) return;
    f.dataset.v28Planning = 'true';
    const n = document.createElement('label'); n.className = 'full v28-library-pick'; n.innerHTML = `Aus der Naturphänomen-Bibliothek<select name="natureLibrary"><option value="">Eigenes Thema schreiben</option>${(db.natureLibrary || []).map(x => `<option value="${esc(x.id)}" ${same(f._meeting.nature.libraryId, x.id) ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select>`;
    f.elements.natureTitle.closest('label').before(n); n.querySelector('select').onchange = e => RH.chooseNature(e.target.value);
    const p = document.createElement('label'); p.className = 'full v28-library-pick'; p.innerHTML = 'Passender Impulsvorschlag<select name="impulseSuggestion"></select><small data-v28-impulse-note></small>';
    f.elements.impulseTitle.closest('label').before(p); p.querySelector('select').onchange = e => RH.chooseImpulse(e.target.value); updateImpulseOptions(f);
    // Add controls to the existing guard's initial signature without manufacturing a dirty draft.
    // The controls themselves stay outside form.elements so the V27 signature is unchanged until selection.
    n.querySelector('select').removeAttribute('name'); n.querySelector('select').id = 'v28-nature-library';
    p.querySelector('select').removeAttribute('name'); p.querySelector('select').id = 'v28-impulse-suggestion';
    Object.defineProperty(f.elements, 'natureLibrary', { value: n.querySelector('select'), configurable: true });
    Object.defineProperty(f.elements, 'impulseSuggestion', { value: p.querySelector('select'), configurable: true });
    const queued = pendingPlan;
    if (queued && queued.context === context() && same(queued.meetingId, f._meeting.id || 0)) {
      pendingPlan = null;
      queueMicrotask(() => {
        if (!f.isConnected || queued.context !== context()) return;
        if (queued.kind === 'nature') RH.chooseNature(queued.id, true);
        else {
          const a = queued.kind === 'action' ? findAction(queued.id) : findAction(findImpulse(queued.id)?.actionId);
          if (a) { f.elements.libraryAction.value = String(a.id); fillLibraryAction(a.id); f._meeting.actionLibraryId = a.id; }
          if (queued.kind === 'impulse') RH.chooseImpulse(queued.id, true);
          RH.refreshPlanning();
        }
      });
    }
  }
  // Hook after the actual modal opens, including continuation after the existing save warning.
  const oldOpen = openM;
  openM = function () {
    oldOpen(); enhancePlanning();
    if (leader() && !box.querySelector('#meeting-planning-form,[data-v28-planned-content]')) {
      const action = [...box.querySelectorAll('button[onclick]')].map(b => b.getAttribute('onclick')).find(s => /^meetingFormV15\(\d+\)/.test(s));
      const id = action?.match(/^meetingFormV15\((\d+)\)/)?.[1], m = id && db.meetings.find(m => same(m.id, id));
      if (m) {
        const entries = [['action', 'Aktion'], ['nature', 'Naturphänomen'], ['impulse', 'Impuls']].filter(([key]) => m[key]?.enabled !== false && m[key]?.description);
        if (entries.length) box.querySelector('.meeting-block')?.insertAdjacentHTML('afterend', `<details class="v28-planned-content" data-v28-planned-content><summary>Geplante Inhalte für die Leitung</summary>${entries.map(([key, title]) => `<section><h3>${title} · ${esc(m[key].title || '')}</h3><div>${esc(m[key].description)}</div></section>`).join('')}</details>`);
      }
    }
    const top = box.querySelector(':scope > .top');
    if (top) { top.classList.add('v28-modal-top'); if (!top.querySelector('[data-v28-modal-back]')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn alt v28-modal-back'; b.dataset.v28ModalBack = ''; b.innerHTML = RH.icon('back') + '<span>Zurück</span>'; b.onclick = () => { if (document.getElementById('recipe-form')) RH.cancelRecipeEditor(); else closeM(); }; top.prepend(b); } }
  };
  document.addEventListener('click', e => { if (e.target.closest('#v27-unsaved [data-continue]')) pendingPlan = null; }, true);

  function alignGrowth() {
    const image = host().querySelector('.growth-art img'); if (!image) return;
    if (!host().querySelector('.growth-art-labels')) {
      image.src = 'assets/growth-journey-clean.png';
      image.insertAdjacentHTML('afterend', `<div class="growth-art-labels" aria-hidden="true"><span class="growth-art-title">Wachstumspfad</span>${stages.map((s, i) => `<div class="growth-art-label" data-art-stage="${s}"><h2>${s}</h2><small>${esc(v21StageSubtitles[i])}</small></div>`).join('')}</div>`);
      const column = host().querySelector('.growth-stages'); column?.insertAdjacentHTML('afterbegin', '<div class="growth-column-heading">Wachstumsstufen</div>');
      column?.querySelectorAll('.growth-stage').forEach((el, i) => { el.dataset.stage ||= [...stages].reverse()[i]; });
      const footnote = column?.querySelector('.growth-footnote'); if (footnote) host().querySelector('.growth-layout').after(footnote);
    }
    const art = image.closest('.growth-art');
    if (art && !art.querySelector('.growth-art-gutter')) {
      // Extend the existing colour bands on the left. The complete original figure stays visible.
      // This gives every label the same left edge and legible type, including the narrow brown band.
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 1 1494'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'growth-art-gutter');
      const palette = document.createElementNS('http://www.w3.org/2000/svg', 'image'); palette.setAttribute('href', image.getAttribute('src')); palette.setAttribute('width', '1053'); palette.setAttribute('height', '1494'); svg.append(palette);
      art.prepend(svg); image.classList.add('v28-growth-source');
    }
  }
  const originalPath = path;
  path = function () { originalPath(); alignGrowth(); };

  // Explicit in-app back navigation restores the preceding screen and its scroll position.
  let current = null, trail = [], rendering = false, restoring = false, oldContext = null;
  const routeFrame = route => ({ key: 'route:'+route, route, run: () => goV17(route), y: 0 });
  function backButton() {
    const main = host(); if (!main || !session) return;
    main.querySelector('[data-v28-back]')?.remove();
    if (!trail.length || current?.key === 'route:dash' || main.querySelector('[data-exp-return]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn alt v28-page-back'; b.dataset.v28Back = ''; b.innerHTML = RH.icon('back') + '<span>Zurück</span>'; b.onclick = RH.goBack; main.prepend(b);
  }
  RH.decorateBack = backButton;
  function record(frame) {
    if (restoring || rendering || current?.key === frame.key) return;
    if (current) trail.push(current); if (trail.length > 30) trail.shift(); current = frame; backButton();
  }
  RH.goBack = () => {
    if (modal.classList.contains('show')) { if (document.getElementById('recipe-form')) RH.cancelRecipeEditor(); else closeM(); return; }
    const target = trail.pop(); if (!target) return goV17('dash');
    restoring = true;
    try { current = target; target.run(); } finally { restoring = false; }
    backButton(); requestAnimationFrame(() => window.scrollTo({ top: target.y || 0, behavior: 'instant' }));
  };
  for (const name of ['observerTasks', 'openRangerStageV19', 'openObserverIntro', 'v24RangerProfile', 'observerLeaderOverview']) {
    const previous = window[name]; if (typeof previous !== 'function') continue;
    window[name] = function (...args) {
      const before = host()?.firstElementChild, old = current; if (old && !rendering) old.y = window.scrollY;
      const result = previous.apply(this, args);
      if (!rendering && current === old && host()?.firstElementChild !== before) record({ key: name+':'+JSON.stringify(args), route: view, run: () => window[name](...args), y: 0 });
      return result;
    };
  }
  const oldGo = goV17;
  goV17 = function (next) { if (next === 'impulses' && !leader()) return; if (current) current.y = window.scrollY; return oldGo(next); };
  const oldRender = render;
  render = function () {
    if (view === 'impulses' && !leader()) view = 'dash';
    const before = oldContext, key = context(); rendering = true;
    try { oldRender(); if (session && view === 'impulses') RH.impulses(); } finally { rendering = false; }
    if (!session) { trail = []; current = null; oldContext = null; pendingPlan = null; return; }
    if (before !== key) { trail = []; current = null; pendingPlan = null; oldContext = key; }
    if (!restoring && current?.key !== 'route:'+view) record(routeFrame(view));
    menus(); backButton(); RH.refreshMessagesUI?.();
  };
  const style = document.querySelector('[data-rangerhub-v28]'); if (style) document.head.append(style);
  render(); RH.v28Ready = true;
})();
