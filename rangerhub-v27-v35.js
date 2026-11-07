/* V27: additive improvements on the existing store, roles and growth counters. */
(() => {
  'use strict';
  const RH = window.RangerHub;
  const main = () => RH.content();
  const same = (a, b) => String(a) === String(b);
  const arg = value => esc(JSON.stringify(value));
  const today = () => RH.localDate();
  const meeting = id => db.meetings.find(m => same(m.id, id));
  const activeLeader = () => isLeader() && !!v24Principal() && (v24IsAdmin() || session.homeStammId === v24StammId);
  const ownRanger = () => session?.kind === 'rangers' && session.homeStammId === v24StammId && !!v24Principal();
  const mayConfirm = pid => activeLeader() && v24CanEditRanger(pid) && db.rangers.some(p => same(p.id, pid) && window.RHMembershipModel.active(p));
  const uid = () => RH.uid();
  const future = () => db.meetings.filter(m => m.date >= today()).sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || ''));
  function message(text) {
    let el = document.getElementById('v27-feedback');
    if (!el) { el = document.createElement('p'); el.id = 'v27-feedback'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.append(el); }
    el.textContent = text;
    clearTimeout(message.timer); message.timer = setTimeout(() => { el.textContent = ''; }, 6500);
  }
  function persist(apply, rollback) {
    try { apply(); v24Persist(); return true; }
    catch { rollback(); message('Nicht gespeichert: Der Browserspeicher ist voll oder nicht verfügbar. Deine bisherigen Daten bleiben erhalten. Bitte ein Backup exportieren und gegebenenfalls weniger Fotos auswählen.'); return false; }
  }

  // Only reusable templates from the supplied file are imported, never its historical events.
  const catalog = window.RangerHubLibraryV27;
  const normalize = text => String(text || '').trim().toLocaleLowerCase('de');
  // The legacy loader recovers actions from meeting snapshots. Honour explicit library deletions.
  let recoveredDeletion = false;
  for (const data of Object.values(v24Store.stamms)) {
    const removals = data.v27ActionRemovals || [];
    if (!removals.length) continue;
    const old = data.actionLibrary || [];
    data.actionLibrary = old.filter(a => !removals.some(r => normalize(r.title) === normalize(a.title) && !r.keptIds.some(id => same(id, a.id))));
    if (data.actionLibrary.length !== old.length) recoveredDeletion = true;
  }
  if (recoveredDeletion) v24Persist();
  function importCatalog() {
    let changed = false; const previous = [];
    for (const data of Object.values(v24Store.stamms)) {
      if (data.v27LibraryImported || !catalog) continue;
      previous.push({ data, actions: data.actionLibrary ? [...data.actionLibrary] : data.actionLibrary, recipes: data.recipes ? [...data.recipes] : data.recipes, imported: data.v27LibraryImported });
      data.actionLibrary ||= []; data.recipes ||= [];
      let nextId = Math.max(910000000000, ...data.actionLibrary.map(a => Number(a.id) || 0)) + 1;
      for (const a of catalog.actions) {
        if (data.actionLibrary.some(x => x.sourceRef === a.id || normalize(x.title) === normalize(a.title))) continue;
        const description = [a.summary, a.steps.length ? 'Ablauf\n' + a.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : '', a.materials.length ? 'Material\n' + a.materials.join('\n') : '', a.safety ? 'Hinweise\n' + a.safety : ''].filter(Boolean).join('\n\n');
        data.actionLibrary.push({ ...structuredClone(a), id: nextId++, sourceRef: a.id, description, recipeIds: a.recipe_ids.map(id => 'v27-recipe-' + id) });
      }
      for (const r of catalog.recipes) {
        if (data.recipes.some(x => x.sourceRef === r.id || normalize(x.title) === normalize(r.title))) continue;
        const ingredients = r.ingredients.map(i => [i.amount == null ? '' : String(i.amount).replace('.', ','), i.unit, i.item, i.note ? `(${i.note})` : ''].filter(Boolean).join(' '));
        data.recipes.push({ ...structuredClone(r), id: 'v27-recipe-' + r.id, sourceRef: r.id, ingredients, ingredientDetails: structuredClone(r.ingredients), servings: r.serving_unit === 'Personen' || r.serving_unit === 'Portionen' ? r.base_servings || 0 : 0, instructions: [...r.steps.map((s, i) => `${i + 1}. ${s}`), ...(r.equipment.length ? ['\nAusrüstung: ' + r.equipment.join(', ')] : []), ...r.notes.map(s => '\nHinweis: ' + s)].join('\n') });
      }
      data.v27LibraryImported = true; changed = true;
    }
    if (changed) {
      try { v24Persist(); }
      catch {
        previous.forEach(p => { p.data.actionLibrary = p.actions; p.data.recipes = p.recipes; if (p.imported === undefined) delete p.data.v27LibraryImported; else p.data.v27LibraryImported = p.imported; });
        message('Die neuen Vorlagen passen gerade nicht in den Browserspeicher. Bestehende Inhalte bleiben erhalten. Bitte zuerst ein Backup exportieren.');
      }
    }
  }
  importCatalog();
  activities = function () {
    if (!activeLeader()) return;
    main().innerHTML = `<div class="top page-heading"><div><h1>Aktionen</h1><p class="muted">Ideen für euren nächsten gemeinsamen Tag.</p></div><button class="btn" onclick="actionFormV15()">+ Aktion</button></div><label class="v27-library-search">Aktion suchen<input type="search" placeholder="Zum Beispiel Knoten, Feuer, Kochen …" oninput="RangerHub.filterActions(this.value)"></label><div class="v27-actions">${db.actionLibrary.map(a => `<article class="v27-action" data-action-id="${esc(a.id)}"><details><summary><span><small>${esc(a.category || 'Eigene Aktion')}</small><b>${esc(a.title)}</b></span><span aria-hidden="true">+</span></summary><div class="v27-action-description">${esc(a.description || a.summary || '')}</div>${a.recipeIds?.length ? `<p class="muted">Passende Rezepte: ${a.recipeIds.map(id => db.recipes.find(r => same(r.id, id))?.title).filter(Boolean).map(esc).join(', ')}</p>` : ''}<div class="row"><button class="btn alt sm" onclick="actionFormV15(${arg(a.id)})">Bearbeiten</button>${v24CanManagePeople() ? `<button class="btn red sm" onclick="RangerHub.deleteAction(${arg(a.id)})">Aktion löschen</button>` : ''}</div></details></article>`).join('') || '<p class="muted">Noch keine Aktionen angelegt.</p>'}</div><p data-action-empty hidden>Keine passende Aktion gefunden.</p>`;
  };
  RH.filterActions = query => {
    let visible = 0;
    main().querySelectorAll('[data-action-id]').forEach(el => { el.hidden = !normalize(el.textContent).includes(normalize(query)); if (!el.hidden) visible++; });
    const empty = main().querySelector('[data-action-empty]'); if (empty) empty.hidden = !!visible;
  };
  actionFormV15 = function (id = 0) {
    if (!activeLeader()) return;
    const a = id ? db.actionLibrary.find(x => same(x.id, id)) : null;
    if (id && !a) return;
    box.innerHTML = `<div class="top"><h2>${a ? 'Aktion bearbeiten' : 'Aktion anlegen'}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><form id="v27-action-form" class="form"><label class="full">Name<input name="title" required maxlength="200" value="${esc(a?.title || '')}"></label><label class="full">Kategorie<input name="category" maxlength="100" value="${esc(a?.category || '')}"></label><label class="full">Ablauf, Material und Hinweise<textarea name="description" rows="10">${esc(a?.description || '')}</textarea></label><button class="btn full">Speichern</button></form>`;
    box.querySelector('form').onsubmit = e => saveActionV15(e, id); openM();
  };
  saveActionV15 = function (event, id = 0) {
    event.preventDefault(); if (!activeLeader() || !event.target.reportValidity()) return;
    const f = event.target.elements, existing = db.actionLibrary.find(a => same(a.id, id));
    if (id && !existing) return;
    const item = { ...existing, id: existing?.id || Date.now(), title: f.title.value.trim(), category: f.category.value.trim(), description: f.description.value.trim() };
    if (!item.title) return;
    const before = db.actionLibrary, removals = db.v27ActionRemovals;
    if (!persist(() => { db.actionLibrary = existing ? before.map(a => a === existing ? item : a) : [...before, item]; db.v27ActionRemovals = (removals || []).filter(r => normalize(r.title) !== normalize(item.title)); }, () => { db.actionLibrary = before; db.v27ActionRemovals = removals; })) return;
    closeM(); view = 'activities'; render();
  };
  RH.deleteAction = id => {
    if (!activeLeader() || !v24CanManagePeople() || !db.actionLibrary.some(a => same(a.id, id))) return;
    if (!confirm('Diese Aktionsvorlage löschen? Bereits geplante Treffen behalten ihre Inhalte.')) return;
    const before = db.actionLibrary, removals = db.v27ActionRemovals, target = before.find(a => same(a.id, id));
    const remaining = before.filter(a => !same(a.id, id));
    const record = { title: target.title, keptIds: remaining.filter(a => normalize(a.title) === normalize(target.title)).map(a => a.id), deletedAt: new Date().toISOString(), leaderId: session.id };
    if (persist(() => { db.actionLibrary = remaining; db.v27ActionRemovals = [...(removals || []).filter(r => normalize(r.title) !== normalize(target.title)), record]; }, () => { db.actionLibrary = before; db.v27ActionRemovals = removals; })) activities();
  };

  // Resolve the town/postcode, without sending venue names or private addresses to geocoding.
  const towns = { Cloppenburg: { latitude: 52.8475, longitude: 8.0453, postalCode: '49661' }, Meppen: { latitude: 52.6906, longitude: 7.2908, postalCode: '49716' } };
  const stammTown = () => String(db.stammCity || db.city || (v24StammId === 'meppen' ? 'Meppen' : 'Cloppenburg')).trim();
  function parsePlace(input) {
    const raw = String(input || '').trim();
    const postcode = raw.match(/\b(\d{5})\b/)?.[1] || '';
    const known = Object.keys(towns).find(t => new RegExp('\\b' + t + '\\b', 'i').test(raw));
    if (known) return { name: known, postalCode: postcode || towns[known].postalCode };
    if (postcode) {
      const after = raw.slice(raw.indexOf(postcode) + 5).replace(/^[\s,]+/, '').split(/[,;\n]/)[0].trim();
      const city = after.match(/^[\p{L}][\p{L}\s.'’()-]*/u)?.[0]?.trim() || '';
      return { name: city, postalCode: postcode };
    }
    let text = raw.split(/[,;\n]/).map(s => s.trim()).filter(Boolean).at(-1) || '';
    if (/^(?:bei\b|gemeindehaus$|jugendwiese$|treffpunkt$|demo-treffpunkt$|ort folgt|noch offen)/i.test(text)) return { name: stammTown(), postalCode: '' };
    text = text.replace(/\b(?:Jugendwiese|Gemeindehaus|Gemeindezentrum|Gemeinde|Treffpunkt|Waldlager|Wiese|Spielplatz|Sportplatz|Zeltplatz|Campingplatz|Jugendheim|Jugendzentrum|Pfarrheim|Kirche|Marktplatz|Rathaus|am|beim|in)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    if (!text || /\d/.test(text)) return { name: stammTown(), postalCode: '' };
    return { name: text, postalCode: '' };
  }
  RH.parseWeatherPlace = parsePlace;
  const weatherCache = new Map(), locationCache = new Map(), pendingWeather = new Map();
  async function jsonFetch(url) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
    try { const r = await fetch(url, { signal: controller.signal }); if (!r.ok) throw Error('Wetterdienst nicht erreichbar'); return await r.json(); }
    finally { clearTimeout(timeout); }
  }
  async function resolvePlace(input) {
    const parsed = parsePlace(input), key = parsed.name + '|' + parsed.postalCode;
    if (locationCache.has(key)) return locationCache.get(key);
    if (towns[parsed.name] && (!parsed.postalCode || parsed.postalCode === towns[parsed.name].postalCode)) return { ...towns[parsed.name], name: parsed.name };
    const queries = [...new Set([parsed.postalCode, parsed.name].filter(Boolean))];
    for (const query of queries) {
      const data = await jsonFetch('https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name: query, count: '10', language: 'de', countryCode: 'DE', format: 'json' }));
      const results = (data.results || []).filter(x => Number.isFinite(x.latitude) && Number.isFinite(x.longitude) && (!x.country_code || x.country_code === 'DE'));
      const result = results.find(x => parsed.postalCode && x.postcodes?.includes(parsed.postalCode) && (!parsed.name || normalize(x.name) === normalize(parsed.name))) || results.find(x => normalize(x.name) === normalize(parsed.name)) || (!parsed.name ? results.find(x => x.postcodes?.includes(parsed.postalCode)) : null);
      if (result) { const location = { ...result, postalCode: parsed.postalCode }; locationCache.set(key, location); return location; }
    }
    throw Error('Ort nicht gefunden');
  }
  const number = (n, unit = '') => Number.isFinite(n) ? Math.round(n) + unit : '—';
  const direction = n => Number.isFinite(n) ? ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'][Math.round(n / 45) % 8] : '—';
  const time = s => typeof s === 'string' && s.includes('T') ? s.slice(11, 16) : '—';
  const metric = (title, value) => `<div><dt>${title}</dt><dd>${value}</dd></div>`;
  function weatherHTML(location, data, m = null) {
    const c = m ? null : data.current, d = data.daily || {}, date = m?.date || today();
    if (m && !d.weather_code?.length || !m && !Number.isFinite(c?.temperature_2m)) throw Error('Keine Wetterdaten');
    const hourly = data.hourly || {}, target = `${date}T${(m?.start || '18:00').slice(0, 2)}:00`, hour = hourly.time?.indexOf(target) ?? -1;
    const [icon, condition] = weatherStyle(c?.weather_code ?? (hour >= 0 ? hourly.weather_code?.[hour] : null) ?? d.weather_code?.[0]);
    const at = field => hour >= 0 ? hourly[field]?.[hour] : null;
    const temp = c?.temperature_2m ?? at('temperature_2m');
    return `<div class="v27-weather-heading"><span aria-hidden="true">${icon}</span><div><small>${m ? 'Wetter am Treffpunkt' : 'Aktuell an unserem Stammort'}</small><h2>${esc(location.name)}${location.postalCode ? ` <small>${esc(location.postalCode)}</small>` : ''}</h2></div><strong>${Number.isFinite(temp) ? number(temp, '°') : number(d.temperature_2m_min?.[0]) + '–' + number(d.temperature_2m_max?.[0], ' °C')}</strong></div><p>${esc(condition)}${m ? ' · ' + fmt(m.date) + ' · ' + esc(m.start || '18:00') + ' Uhr' : ' · gefühlt ' + number(c.apparent_temperature, ' °C')}</p><dl class="v27-weather-metrics">${metric('Wind', number(c?.wind_speed_10m ?? at('wind_speed_10m') ?? d.wind_speed_10m_max?.[0], ' km/h') + ' · ' + direction(c?.wind_direction_10m ?? at('wind_direction_10m') ?? d.wind_direction_10m_dominant?.[0]))}${metric('Böen', number(c?.wind_gusts_10m ?? at('wind_gusts_10m') ?? d.wind_gusts_10m_max?.[0], ' km/h'))}${metric(m ? 'Regenrisiko' : 'Niederschlag', m ? number(at('precipitation_probability') ?? d.precipitation_probability_max?.[0], ' %') : (Number.isFinite(c.precipitation) ? c.precipitation.toLocaleString('de-DE') + ' mm' : '—'))}${metric('Luftfeuchte', number(c?.relative_humidity_2m ?? at('relative_humidity_2m'), ' %'))}${metric('Sonne', time(d.sunrise?.[0]) + '–' + time(d.sunset?.[0]))}${metric('UV-Index max.', number(d.uv_index_max?.[0]))}</dl><small class="v27-weather-source">Open-Meteo · ${m ? 'Vorhersage' : 'Stand ' + time(c.time) + ' Uhr'} · ${m ? 'Prognosen können sich ändern.' : 'Wind in 10 m Höhe'}</small>`;
  }
  async function weather(input, m = null) {
    const key = v24StammId + '|' + input + '|' + (m?.date || today()) + '|' + (m?.start || 'current');
    if (weatherCache.has(key) && Date.now() - weatherCache.get(key).time < 600000) return weatherCache.get(key).html;
    if (pendingWeather.has(key)) return pendingWeather.get(key);
    const request = (async () => {
      const location = await resolvePlace(input);
      const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, timezone: 'Europe/Berlin', wind_speed_unit: 'kmh', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,sunrise,sunset,uv_index_max' });
      if (m) { params.set('start_date', m.date); params.set('end_date', m.date); params.set('hourly', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability'); }
      else { params.set('forecast_days', '1'); params.set('current', 'temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m'); }
      const data = await jsonFetch('https://api.open-meteo.com/v1/forecast?' + params);
      const html = weatherHTML(location, data, m); weatherCache.set(key, { time: Date.now(), html }); return html;
    })();
    pendingWeather.set(key, request);
    try { return await request; } finally { pendingWeather.delete(key); }
  }
  function fillWeather(node, input, m) {
    const stamm = v24StammId;
    weather(input, m).then(html => { if (node.isConnected && stamm === v24StammId) node.innerHTML = html; }).catch(() => { if (node.isConnected && stamm === v24StammId) node.innerHTML = `<b>Wetter gerade nicht verfügbar</b><p>${esc(parsePlace(input).name || input)} · Bitte später erneut versuchen.</p>`; });
  }
  loadMeetingWeather = function (m, target = null) {
    const node = target || document.getElementById('nextWeather'); if (!node || !m) return;
    node.classList.add('v27-weather', 'v27-meeting-weather');
    const days = Math.round((Date.parse(m.date + 'T12:00Z') - Date.parse(today() + 'T12:00Z')) / 86400000);
    const location = parsePlace(m.place || stammTown());
    if (days < 0 || days > 15) { node.innerHTML = `<b>Noch keine Wetterprognose verfügbar</b><p>${fmt(m.date)} · ${esc(location.name || location.postalCode)}</p>`; return; }
    fillWeather(node, m.place || stammTown(), m);
  };
  function currentWeather(scope, entry = false) {
    scope.querySelectorAll('[data-current-weather]').forEach(node => node.remove());
    if (scope.querySelector('[data-v27-current-weather]')) return;
    const node = document.createElement('section'); node.className = 'v27-weather v27-current-weather'; node.dataset.v27CurrentWeather = ''; node.setAttribute('aria-label', 'Aktuelles Wetter am Stammort'); node.setAttribute('aria-live', 'polite');
    node.innerHTML = `<b>Wetter · ${esc(stammTown())}</b><p>Aktuelles Wetter wird geladen …</p>`;
    if (entry) scope.querySelector('.entry-form-wrap')?.append(node);
    else scope.querySelector('.dash-masthead')?.after(node);
    if (node.isConnected) fillWeather(node, stammTown());
  }

  // A changed planning form may only be left through Save / Discard / Continue.
  let guard = null, suspendedGuard = null;
  function signature(form) {
    return JSON.stringify({ values: [...form.elements].filter(e => e.name && e.type !== 'file').map(e => [e.name, ['checkbox', 'radio'].includes(e.type) ? e.checked : e.value]), ingredients: form._ingredients, photos: form._photos });
  }
  const dirty = () => !!guard?.form.isConnected && (guard.form._photosPending || signature(guard.form) !== guard.baseline);
  function leave(continuation) {
    if (!dirty()) { continuation(); return; }
    if (document.getElementById('v27-unsaved')) return;
    const dialog = document.createElement('dialog'); dialog.id = 'v27-unsaved'; dialog.className = 'v27-dialog'; dialog.setAttribute('aria-labelledby', 'v27-unsaved-title');
    dialog.innerHTML = '<h2 id="v27-unsaved-title">Änderungen speichern?</h2><p>Deine Planung enthält ungespeicherte Änderungen.</p><div class="row"><button class="btn" data-save>Änderungen speichern</button><button class="btn red" data-discard>Änderungen verwerfen</button><button class="btn alt" data-continue>Weiter bearbeiten</button></div>';
    const trigger = document.activeElement;
    const resume = () => { dialog.close(); dialog.remove(); if (trigger?.isConnected) trigger.focus(); const select = document.getElementById('v24-stamm-switch'); if (select) select.value = v24StammId; };
    dialog.querySelector('[data-save]').onclick = () => {
      const form = guard?.form; resume();
      if (!form?.reportValidity()) return;
      form.requestSubmit(); if (!guard) continuation();
    };
    dialog.querySelector('[data-discard]').onclick = () => { guard = null; suspendedGuard = null; resume(); continuation(); };
    dialog.querySelector('[data-continue]').onclick = resume;
    dialog.addEventListener('cancel', e => { e.preventDefault(); resume(); });
    document.body.append(dialog); dialog.showModal();
  }
  const oldDraft = RH.draftFromForm;
  RH.draftFromForm = form => ({ ...oldDraft(form), photos: structuredClone(form._photos || form._meeting.photos || []) });
  const oldClose = closeM;
  closeM = function () {
    if (suspendedGuard && document.getElementById('recipe-form')) { RH.cancelRecipeEditor(); return leave(() => closeM()); }
    leave(() => { guard = null; suspendedGuard = null; oldClose(); modal.classList.remove('v27-modal'); });
  };
  const oldOpen = openM;
  openM = function () { modal.classList.add('v27-modal'); oldOpen(); };
  for (const name of ['goV17', 'logout', 'v24SwitchStamm']) {
    const previous = window[name];
    window[name] = function (...args) { leave(() => { guard = null; suspendedGuard = null; oldClose(); previous.apply(this, args); }); };
  }
  if (RH.goDashboard) RH.goDashboard = () => goV17('dash');
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('show') && dirty() && !document.getElementById('v27-unsaved')) { event.preventDefault(); event.stopImmediatePropagation(); closeM(); }
  }, true);
  window.addEventListener('beforeunload', e => { if (dirty() || suspendedGuard) { e.preventDefault(); e.returnValue = ''; } });
  const previousMeetingForm = meetingFormV15;
  meetingFormV15 = function (id = 0, date = '', suppliedDraft = null) {
    if (!activeLeader()) return;
    leave(() => {
      guard = null; previousMeetingForm(id, date, suppliedDraft);
      const form = document.getElementById('meeting-planning-form'); if (!form) return;
      form._photos = structuredClone(form._meeting.photos || []);
      const section = document.createElement('section'); section.className = 'v27-photo-editor full';
      section.innerHTML = '<h3>Fotos vom Treffen</h3><p class="form-note">Bis zu vier Bilder für euren Rückblick. Bilder werden platzsparend auf diesem Gerät gespeichert.</p><div data-v27-photo-list></div><label>Fotos hinzufügen<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-v27-photos></label><p data-photo-feedback role="status"></p>';
      form.querySelector('.full.row')?.before(section);
      section.querySelector('[data-v27-photos]').onchange = e => importPhotos(e.target.files, form);
      renderPhotoEditor(form);
      guard = { form, baseline: suspendedGuard?.baseline || signature(form) }; suspendedGuard = null;
    });
  };
  const oldNewRecipe = RH.newRecipeForMeeting;
  RH.newRecipeForMeeting = () => { if (!activeLeader()) return; suspendedGuard = guard; guard = null; oldNewRecipe(); };
  saveMeetingV16 = function (event, id) {
    event.preventDefault(); const form = event.target;
    if (!activeLeader() || !form.reportValidity() || form._photosPending) return;
    const draft = RH.normalizeMeeting(RH.draftFromForm(form)), before = db.meetings, old = id ? meeting(id) : null;
    if (id && !old) return;
    const item = { ...draft, id: old?.id || Date.now() };
    const actionsBefore = db.actionLibrary, removalsBefore = db.v27ActionRemovals;
    if (!persist(() => {
      db.meetings = old ? before.map(m => m === old ? item : m) : [...before, item];
      if (form.elements.saveActionToLibrary.checked && item.action.title.trim() && !db.actionLibrary.some(a => a.title === item.action.title)) {
        const a = { id: Date.now() + 1, title: item.action.title, description: item.action.description || '' }; db.actionLibrary = [...actionsBefore, a]; item.actionLibraryId = a.id;
        db.v27ActionRemovals = (removalsBefore || []).filter(r => normalize(r.title) !== normalize(a.title));
      }
    }, () => { db.meetings = before; db.actionLibrary = actionsBefore; db.v27ActionRemovals = removalsBefore; })) return;
    guard = null; suspendedGuard = null; closeM(); view = 'meetings'; render();
  };
  saveMeetingV15 = saveMeetingV16;

  // Small local images, staged until the meeting is explicitly saved.
  function photoURL(photo) { const value = photo?.data || photo?.src || ''; return /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : ''; }
  function renderPhotoEditor(form) {
    const list = form.querySelector('[data-v27-photo-list]'); if (!list) return;
    list.innerHTML = `<div class="v27-photo-thumbs">${form._photos.map((p, i) => `<figure>${photoURL(p) ? `<img src="${photoURL(p)}" alt="Foto ${i + 1} vom Treffen">` : '<span>Gespeichertes Bild</span>'}<button type="button" class="btn alt sm" data-remove-photo="${i}" aria-label="Foto ${i + 1} entfernen">Entfernen</button></figure>`).join('')}</div>`;
    list.querySelectorAll('[data-remove-photo]').forEach(b => { b.onclick = () => { if (form._photosPending) return; form._photos.splice(Number(b.dataset.removePhoto), 1); renderPhotoEditor(form); }; });
  }
  async function smallPhoto(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) throw Error('Bitte JPG, PNG oder WebP mit höchstens 20 MB pro Bild auswählen.');
    const url = URL.createObjectURL(file), image = new Image();
    try {
      image.src = url; await image.decode();
      if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 60000000) throw Error('Dieses Bild ist zu groß. Bitte eine kleinere Bilddatei verwenden.');
      const canvas = document.createElement('canvas'), ratio = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext('2d'); context.fillStyle = '#f7f5ef'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let data;
      for (const quality of [.78, .62, .46, .32]) { data = canvas.toDataURL('image/jpeg', quality); if (data.length <= 100000) break; }
      if (data.length > 100000) {
        const smaller = document.createElement('canvas'); smaller.width = Math.round(canvas.width * .6); smaller.height = Math.round(canvas.height * .6); smaller.getContext('2d').drawImage(canvas, 0, 0, smaller.width, smaller.height); data = smaller.toDataURL('image/jpeg', .55);
      }
      if (data.length > 100000) throw Error('Das Foto lässt sich nicht ausreichend verkleinern. Bitte ein kleineres Bild auswählen.');
      return { id: uid(), data, createdAt: new Date().toISOString(), leaderId: session.id };
    } finally { URL.revokeObjectURL(url); }
  }
  async function importPhotos(files, form) {
    const feedback = form.querySelector('[data-photo-feedback]');
    if (!activeLeader() || !form.isConnected || form._photosPending || !files?.length) return;
    if (form._photos.length + files.length > 4) { feedback.textContent = 'Pro Treffen sind höchstens vier Fotos möglich. Bitte entsprechend weniger auswählen.'; return; }
    const stamm = v24StammId; form._photosPending = true; feedback.textContent = 'Fotos werden vorbereitet …';
    const save = form.querySelector('[type=submit]'); if (save) save.disabled = true;
    try {
      const photos = [];
      for (const file of files) photos.push(await smallPhoto(file));
      if (!form.isConnected || stamm !== v24StammId || !activeLeader()) return;
      form._photos.push(...photos); renderPhotoEditor(form); feedback.textContent = 'Fotos vorbereitet. Mit der Planung speichern.';
    } catch (error) { if (form.isConnected) feedback.textContent = error.message; }
    finally { form._photosPending = false; if (save) save.disabled = false; const input = form.querySelector('[data-v27-photos]'); if (input) input.value = ''; }
  }
  function gallery(items, title = 'Unser letzter Rückblick') {
    if (!items.length) return '';
    return `<section class="v27-gallery" aria-label="Fotos vergangener Rangertreffen"><div class="heading-row"><div><span class="section-kicker">Unterwegs gewesen</span><h2>${esc(title)}</h2></div><div class="row"><button type="button" class="btn alt sm" aria-label="Vorheriges Foto" data-slide="-1">←</button><button type="button" class="btn alt sm" aria-label="Nächstes Foto" data-slide="1">→</button></div></div><div class="v27-slides" tabindex="0" aria-label="Fotostrecke · mit Wischen oder Pfeiltasten blättern">${items.map(({ photo, m }, i) => `<figure class="v27-slide"><img src="${photoURL(photo)}" loading="lazy" alt="Foto ${i + 1} vom Rangertreffen am ${fmt(m.date)}"><figcaption><span>${fmt(m.date)} · ${esc(m.theme || 'Rangertreffen')}</span><small>${i + 1} / ${items.length}</small></figcaption></figure>`).join('')}</div></section>`;
  }
  function bindGalleries(scope) {
    scope.querySelectorAll('.v27-gallery').forEach(g => {
      const track = g.querySelector('.v27-slides');
      const move = step => { const size = track.clientWidth, last = track.scrollWidth - size, target = Math.max(0, Math.min(last, Math.round(track.scrollLeft / size) * size + step * size)); track.scrollTo({ left: target, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
      g.querySelectorAll('[data-slide]').forEach(b => { b.onclick = () => move(Number(b.dataset.slide)); });
      track.onkeydown = e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); } };
    });
  }
  const previousOpenMeeting = openRangerMeeting;
  openRangerMeeting = function (id) {
    leave(() => {
      guard = null; previousOpenMeeting(id);
      const m = meeting(id); if (!m || !modal.classList.contains('show') || !activeLeader()) return;
      const photos = (m.photos || []).filter(photoURL).map(photo => ({ photo, m }));
      box.insertAdjacentHTML('beforeend', gallery(photos, 'Bilder vom Treffen') + `<p><button class="btn alt" onclick="meetingFormV15(${arg(m.id)})">${photos.length ? 'Fotos bearbeiten' : 'Fotos vom Treffen hinzufügen'}</button></p>`); bindGalleries(box);
    });
  };

  // Attendance is deliberately saved as one checked roster; merely opening it changes nothing.
  const cancellationFor = (m, kind, pid) => db.cancellations.find(c => same(c.meetingId, m.id) && c.kind === kind && same(c.personId, pid));
  const absenceFor = (m, kind, pid) => db.absences.find(a => a.kind === kind && same(a.personId, pid) && a.from <= m.date && a.to >= m.date);
  attendance = function (id) {
    if (!activeLeader()) return;
    leave(() => {
      guard = null; const m = meeting(id); if (!m) return;
      box.innerHTML = `<div class="top"><h2>Anwesenheit · ${fmt(m.date)}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><p class="muted">Hake alle an, die dabei sind. Abmeldungen und eingetragene Zeiträume stehen direkt beim Namen.</p><form id="v27-attendance">${['rangers', 'leaders'].map(kind => `<h3>${kind === 'rangers' ? 'Ranger' : 'Leiter'}</h3>${db[kind].filter(p => window.RHMembershipModel.active(p,m.date)).map(p => { const off = cancellationFor(m, kind, p.id) || absenceFor(m, kind, p.id); return `<label class="v27-attendance-row"><input type="checkbox" name="${kind}:${p.id}" ${m.attendance?.[kind]?.[p.id] === 'ANWESEND' ? 'checked' : ''}><span><b>${esc(p.name)}</b>${off ? `<small class="v27-cancelled">Abgemeldet${off.reason ? ' · ' + esc(off.reason) : ''}</small>` : m.attendance?.[kind]?.[p.id] === 'ENTSCHULDIGT' ? '<small class="v27-cancelled">Entschuldigt erfasst</small>' : ''}</span><span>Dabei</span></label>`; }).join('')}`).join('')}<button class="btn" type="submit">Anwesenheit speichern</button></form>`;
      box.querySelector('form').onsubmit = e => {
        e.preventDefault(); if (!activeLeader() || !meeting(id)) return;
        const before = m.attendance, updated = structuredClone(before || { rangers: {}, leaders: {} });
        for (const kind of ['rangers', 'leaders']) {
          updated[kind] ||= {};
          for (const p of db[kind].filter(p => window.RHMembershipModel.active(p,m.date))) updated[kind][p.id] = e.target.elements.namedItem(`${kind}:${p.id}`).checked ? 'ANWESEND' : cancellationFor(m, kind, p.id) || absenceFor(m, kind, p.id) || before?.[kind]?.[p.id] === 'ENTSCHULDIGT' ? 'ENTSCHULDIGT' : 'ABWESEND';
        }
        if (persist(() => { m.attendance = updated; }, () => { m.attendance = before; })) { closeM(); render(); message('Anwesenheit gespeichert.'); }
      };
      openM();
    });
  };
  const oldMAtt = mAtt;
  mAtt = function (...args) { if (activeLeader()) oldMAtt(...args); };

  // Additional provenance belongs to each stamm; boolean completion maps stay authoritative.
  const allObserverTasks = () => Object.values(db.observerTasks || {}).flat();
  const taskFor = (stage, id) => (stage === 'Beobachter' ? allObserverTasks() : db.growthTasks[stage] || []).find(t => same(t.id, id));
  const isKnot = task => /\bknot(?:en|enkunde|entechnik|enverbindung|enarten)/i.test(task?.title || '');
  const proof = (pid, stage, id) => db.taskConfirmations?.[pid]?.[stage]?.[id];
  const doneMap = (pid, stage) => stage === 'Beobachter' ? db.observerProgress?.[pid] || {} : stage === 'Bonus' ? db.observerBonus?.[pid] || {} : db.stageProgress?.[pid]?.[stage] || {};
  const stamp = () => ({ confirmedAt: new Date().toISOString(), leaderId: session.id, leaderName: v24Principal().name, leaderStammId: session.homeStammId });
  function setCompletion(pid, stage, id, done, record) {
    if (!mayConfirm(pid)) return false;
    const previous = { confirmations: db.taskConfirmations, observer: db.observerProgress, bonus: db.observerBonus, stages: db.stageProgress, rank: db.rangers.find(p => same(p.id, pid)).stage };
    return persist(() => {
      db.taskConfirmations = { ...db.taskConfirmations, [pid]: { ...db.taskConfirmations?.[pid], [stage]: { ...db.taskConfirmations?.[pid]?.[stage], [id]: record } } };
      if (stage === 'Beobachter') db.observerProgress = { ...db.observerProgress, [pid]: { ...db.observerProgress?.[pid], [id]: !!done } };
      else if (stage === 'Bonus') db.observerBonus = { ...db.observerBonus, [pid]: { ...db.observerBonus?.[pid], [id]: !!done } };
      else db.stageProgress = { ...db.stageProgress, [pid]: { ...db.stageProgress?.[pid], [stage]: { ...db.stageProgress?.[pid]?.[stage], [id]: !!done } } };
      v23SyncRangerStage(db.rangers.find(p => same(p.id, pid)));
    }, () => { db.taskConfirmations = previous.confirmations; db.observerProgress = previous.observer; db.observerBonus = previous.bonus; db.stageProgress = previous.stages; db.rangers.find(p => same(p.id, pid)).stage = previous.rank; });
  }
  function completionText(record, completed) {
    if (!completed) return '';
    if (!record?.confirmedAt) return '<small class="v27-confirmation">Bereits vor dieser Version bestätigt · Datum und Leitung nicht hinterlegt.</small>';
    const date = new Date(record.confirmedAt);
    return `<small class="v27-confirmation">Bestätigt am <time datetime="${esc(record.confirmedAt)}">${date.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}</time> durch ${esc(record.leaderName || 'Leiterteam')}.</small>`;
  }
  function refreshTasks(pid, stage) {
    const expanded = [...main().querySelectorAll('.obsCategory')].map(el => el.open), scroll = window.scrollY;
    if (stage === 'Beobachter' || stage === 'Bonus') observerTasks(pid); else openRangerStageV19(stage, pid);
    main().querySelectorAll('.obsCategory').forEach((el, i) => { el.open = !!expanded[i]; });
    window.scrollTo({ top: scroll, behavior: 'instant' });
  }
  function ordinaryConfirm(pid, stage, id, value) {
    if (!mayConfirm(pid) || stage !== 'Beobachter' && !stageUnlockedForRanger(stages.indexOf(stage), pid)) return;
    const task = taskFor(stage, id); if (!task || isKnot(task)) return;
    const before = !!doneMap(pid, stage)[id];
    if (setCompletion(pid, stage, id, value, value ? before && proof(pid, stage, id)?.confirmedAt ? proof(pid, stage, id) : stamp() : null)) refreshTasks(pid, stage);
  }
  toggleObsTask = (pid, id, value) => ordinaryConfirm(pid, 'Beobachter', id, value);
  toggleStageTaskV19 = (stage, pid, id, value) => ordinaryConfirm(pid, stage, id, value);
  const previousBonus = toggleBonus;
  toggleBonus = function (pid, key, value) {
    if (!mayConfirm(pid)) return;
    // Keep the existing sequential package rules, including their reset behaviour.
    if (RH.packageUnlocked && !RH.packageUnlocked(pid, key)) return;
    const old = proof(pid, 'Bonus', key), previous = db.taskConfirmations, previousBonusState = structuredClone(db.observerBonus), previousRank = db.rangers.find(p => same(p.id, pid)).stage;
    db.taskConfirmations = { ...previous, [pid]: { ...previous?.[pid], Bonus: { ...previous?.[pid]?.Bonus, [key]: value ? old?.confirmedAt ? old : stamp() : null } } };
    try { previousBonus(pid, key, value); } catch { db.taskConfirmations = previous; db.observerBonus = previousBonusState; db.rangers.find(p => same(p.id, pid)).stage = previousRank; refreshTasks(pid, 'Bonus'); message('Die Bestätigung konnte nicht gespeichert werden.'); }
  };
  RH.confirmKnot = (pid, stage, id, slot, checked, meetingId) => {
    if (!mayConfirm(pid) || ![0, 1].includes(slot) || !isKnot(taskFor(stage, id)) || !stageUnlockedForRanger(stages.indexOf(stage), pid)) return;
    const previous = proof(pid, stage, id), proofs = structuredClone(previous?.demonstrations || [null, null]);
    if (doneMap(pid, stage)[id] && !previous?.demonstrations) return; // Do not invalidate credited legacy work.
    if (checked) {
      const m = meeting(meetingId), other = proofs[1 - slot];
      if (!m || m.date > today() || other && (same(other.meetingId, m.id) || other.meetingDate === m.date)) { message('Bitte zwei Rangertreffen an unterschiedlichen Tagen auswählen, die bereits stattgefunden haben.'); refreshTasks(pid, stage); return; }
      proofs[slot] = { ...stamp(), meetingId: m.id, meetingDate: m.date };
    } else proofs[slot] = null;
    const complete = proofs.every(Boolean), record = { demonstrations: proofs, ...(complete ? stamp() : {}) };
    if (setCompletion(pid, stage, id, complete, record)) refreshTasks(pid, stage);
  };
  RH.reopenLegacyKnot = (pid, stage, id) => {
    if (!mayConfirm(pid) || !isKnot(taskFor(stage, id)) || !doneMap(pid, stage)[id] || proof(pid, stage, id)?.demonstrations) return;
    if (!confirm('Die bisherige Bestätigung dieser Knotenaufgabe zurücknehmen? Für einen neuen Abschluss werden zwei Treffen nachgewiesen.')) return;
    if (setCompletion(pid, stage, id, false, { demonstrations: [null, null] })) refreshTasks(pid, stage);
  };
  function decorateTasks(pid, stage) {
    const host = main();
    host.querySelectorAll('.obsTask').forEach(row => {
      const input = row.querySelector('input[type=checkbox]'), handler = input?.getAttribute('onchange') || '';
      // Read IDs by matching existing task IDs against the handler, never evaluating HTML.
      const tasks = stage === 'Beobachter' ? allObserverTasks() : db.growthTasks[stage] || [];
      const task = tasks.find(t => handler.includes(',' + JSON.stringify(String(t.id)).replaceAll('"', "'") + ',') || handler.includes(',' + t.id + ',') || handler.includes(", '" + t.id + "',"));
      if (!task || !input) return;
      input.disabled = !mayConfirm(pid);
      const record = proof(pid, stage, task.id), done = !!doneMap(pid, stage)[task.id];
      if (!isKnot(task)) { row.querySelector('span')?.insertAdjacentHTML('beforeend', completionText(record, done)); return; }
      const wrapper = document.createElement('div'); wrapper.className = 'item v27-knot-task'; wrapper.dataset.knotTask = String(task.id);
      const past = db.meetings.filter(m => m.date <= today()).sort((a, b) => b.date.localeCompare(a.date));
      const legacy = done && !record?.demonstrations;
      const edit = row.querySelector('button')?.outerHTML || '';
      wrapper.innerHTML = `<div><b>${esc(task.title)}</b>${task.description ? `<p class="muted">${esc(task.description)}</p>` : ''}${edit}</div><p class="v27-knot-help">Zeige den Knoten bei zwei Rangertreffen an unterschiedlichen Tagen.</p><div class="v27-knot-proofs">${[0, 1].map(slot => {
        const item = record?.demonstrations?.[slot], controlId = 'v27-proof-' + uid();
        return `<div><label for="${controlId}">Treffen ${slot + 1}<select id="${controlId}" ${!mayConfirm(pid) || item || legacy ? 'disabled' : ''}><option value="">Treffen auswählen</option>${past.map(m => `<option value="${esc(m.id)}" ${item && same(item.meetingId, m.id) ? 'selected' : ''}>${fmt(m.date)} · ${esc(m.theme || 'Rangertreffen')}</option>`).join('')}${item && !past.some(m => same(m.id, item.meetingId)) ? `<option selected value="${esc(item.meetingId)}">${fmt(item.meetingDate)} · Archiviertes Treffen</option>` : ''}</select></label><label class="v27-proof-check"><input type="checkbox" ${item || legacy ? 'checked' : ''} ${!mayConfirm(pid) || legacy || !past.length && !item ? 'disabled' : ''} onchange="RangerHub.confirmKnot(${arg(pid)},${arg(stage)},${arg(task.id)},${slot},this.checked,document.getElementById('${controlId}').value)"> ${legacy ? 'Bereits bestätigt (Bestand)' : 'Gezeigt und bestätigt'}</label>${completionText(item, !!item)}</div>`;
      }).join('')}</div>${completionText(record, done)}`;
      if (legacy && mayConfirm(pid)) wrapper.insertAdjacentHTML('beforeend', `<button type="button" class="btn alt sm" onclick="RangerHub.reopenLegacyKnot(${arg(pid)},${arg(stage)},${arg(task.id)})">Bestätigung zurücknehmen</button>`);
      row.replaceWith(wrapper);
    });
    host.querySelectorAll('.bonusCard').forEach((row, index) => {
      const key = row.dataset.package || ['A', 'B', 'C', 'R'][index];
      row.insertAdjacentHTML('beforeend', completionText(proof(pid, 'Bonus', key), !!db.observerBonus?.[pid]?.[key]));
      if (!mayConfirm(pid)) row.querySelectorAll('input[type=checkbox]').forEach(el => { el.disabled = true; });
    });
  }
  const originalObserverTasks = observerTasks;
  observerTasks = function (pid = null) { originalObserverTasks(pid); const id = pid ?? (ownRanger() ? session.id : null); if (id != null) decorateTasks(id, 'Beobachter'); };
  const originalStageTasks = openRangerStageV19;
  openRangerStageV19 = function (stage, pid) { originalStageTasks(stage, pid); if (stageUnlockedForRanger(stages.indexOf(stage), pid)) decorateTasks(pid, stage); };
  const originalIntro = openObserverIntro;
  RH.openObserverLibrary ||= () => { if (activeLeader()) openStageV15('Beobachter'); };
  openObserverIntro = function () {
    originalIntro(); main().querySelectorAll('.observerThemes').forEach(el => el.remove());
    main().querySelectorAll('[data-observer-library]').forEach(el => el.remove());
    if (activeLeader() && RH.openObserverLibrary) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'btn alt v27-observer-library'; button.dataset.observerLibrary = ''; button.textContent = 'Weitere Beobachter-Inhalte'; button.onclick = RH.openObserverLibrary;
      main().querySelector('.observerLeft h2')?.after(button);
    }
  };

  function attendanceStats() {
    const recorded = db.meetings.filter(m => m.date <= today()).map(m => m.attendance?.rangers?.[session.id]).filter(x => ['ANWESEND', 'ABWESEND', 'ENTSCHULDIGT'].includes(x));
    const attended = recorded.filter(x => x === 'ANWESEND').length;
    return { total: recorded.length, attended, percent: recorded.length ? Math.round(attended / recorded.length * 100) : null };
  }
  function participation() {
    const s = attendanceStats(), p = s.percent;
    const text = p == null ? 'Dein erster Fußabdruck wartet schon. Schön, dass du dabei bist!' : p >= 80 ? 'Du bist gut dabei – dein Lagerplatz kennt dich schon!' : p >= 60 ? 'Dein Rucksack freut sich auf die nächste Runde. Komm mit!' : p >= 40 ? 'Das Lagerfeuer vermisst deine Geschichten. Beim nächsten Mal dabei?' : 'Jede Expedition beginnt mit einem Schritt. Dein Stamm freut sich auf dich!';
    return `<section class="v27-participation" aria-label="Deine Anwesenheit"><div class="v27-attendance-ring" style="--attendance:${p || 0}%" role="img" aria-label="${p == null ? 'Noch keine Anwesenheit erfasst' : 'Anwesenheitsquote ' + p + ' Prozent'}"><div><strong>${p ?? '—'}${p == null ? '' : '<small>%</small>'}</strong><span>Anwesenheit</span></div></div><div><span class="section-kicker">Du & dein Stamm</span><h2>${text}</h2><p>${s.total ? `${s.attended} von ${s.total} erfassten Treffen dabei · ${100 - p}% Abwesenheit` : 'Deine Quote erscheint nach dem ersten erfassten Treffen.'}</p><button class="btn text" onclick="goV17('abs')">Meine Teilnahme ansehen ↗</button></div></section>`;
  }
  RH.dashboardAttendance = attendanceStats;
  RH.dashboardAbsence = m => absenceFor(m, 'rangers', session.id);
  RH.showDashboardCancellation = id => {
    const m = meeting(id); if (!ownRanger() || view !== 'dash' || !m || m.date < today() || absenceFor(m, 'rangers', session.id)) return;
    const slot = main().querySelector('[data-v27-dash-cancellation]'); if (!slot) return;
    const existing = cancellationFor(m, 'rangers', session.id);
    if (existing) {
      const before = db.cancellations;
      if (persist(() => { db.cancellations = before.filter(c => c !== existing); }, () => { db.cancellations = before; })) { dash(); message('Deine Abmeldung wurde zurückgenommen.'); }
      return;
    }
    slot.innerHTML = '<form class="v27-dash-cancellation"><label>Nachricht an dein Leiterteam (optional)<textarea name="reason" rows="2" maxlength="1000"></textarea></label><div class="row"><button class="btn" type="submit">Absage speichern</button><button class="btn alt" type="button" data-cancel>Abbrechen</button></div></form>';
    const stamm = v24StammId;
    slot.querySelector('[data-cancel]').onclick = () => { slot.innerHTML = ''; };
    slot.querySelector('form').onsubmit = e => {
      e.preventDefault(); if (!ownRanger() || view !== 'dash' || stamm !== v24StammId || !meeting(id) || cancellationFor(m, 'rangers', session.id)) return;
      const before = db.cancellations, entry = { meetingId: m.id, kind: 'rangers', personId: session.id, reason: e.target.elements.reason.value.trim(), createdAt: new Date().toISOString() };
      if (persist(() => { db.cancellations = [...before, entry]; }, () => { db.cancellations = before; })) { dash(); message('Deine Absage ist gespeichert.'); }
    };
    slot.querySelector('textarea').focus();
  };
  const previousDash = dash;
  dash = function () {
    previousDash(); const host = main(), body = host.querySelector('.dash-body'); if (!body) return;
    currentWeather(host);
    const birthday = [...body.querySelectorAll(':scope > .dash-section')].find(el => el.querySelector('h2')?.textContent.includes('Geburtstag'));
    if (birthday) body.append(birthday);
    [...body.querySelectorAll(':scope > .dash-section')].forEach((el, i) => { const n = el.querySelector('.section-kicker .number'); if (n) n.textContent = String(i + 1).padStart(2, '0'); });
    if (ownRanger()) {
      const first = body.querySelector('.dash-section'), next = future()[0];
      if (next && first) {
        const off = cancellationFor(next, 'rangers', session.id), period = absenceFor(next, 'rangers', session.id);
        first.querySelector('.meeting-block')?.insertAdjacentHTML('beforeend', `<div class="v27-dash-rsvp"><span>${off ? 'Du bist abgemeldet.' : period ? 'Du bist durch einen Zeitraum abgemeldet.' : 'Wir freuen uns auf dich.'}</span><button type="button" class="btn ${off ? 'alt' : ''}" ${period ? 'disabled' : ''} onclick="RangerHub.showDashboardCancellation(${arg(next.id)})">${off ? 'Abmeldung zurücknehmen' : period ? 'Abmeldung eingetragen' : 'Für dieses Treffen abmelden'}</button><div data-v27-dash-cancellation></div></div>`);
      }
      body.insertAdjacentHTML('beforebegin', participation());
    }
    const photos = db.meetings.filter(m => m.date <= today()).sort((a, b) => b.date.localeCompare(a.date)).flatMap(m => (m.photos || []).filter(photoURL).map(photo => ({ photo, m }))).slice(0, 24);
    body.insertAdjacentHTML('beforebegin', gallery(photos)); bindGalleries(host);
  };
  const previousLogin = login;
  login = function () { previousLogin(); };
  const previousPath = path;
  path = function () {
    previousPath();
    main().querySelectorAll('.growth-stage').forEach((el, i) => { el.dataset.stage ||= [...stages].reverse()[i]; });
  };
  const previousRender = render;
  render = function () { previousRender(); document.querySelectorAll('.side .navGroupTitle').forEach(el => { if (!el.hasAttribute('tabindex')) el.tabIndex = 0; }); };
  const style = document.querySelector('[data-rangerhub-v27]'); if (style) document.head.append(style);
  render(); RH.v27Ready = true;
})();
