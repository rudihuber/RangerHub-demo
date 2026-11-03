/* Compact demo entry, responsive navigation and native map handoff. */
(() => {
  'use strict';
  const RH = window.RangerHub;
  const arrow = '<svg class="entry-arrow" viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12"/></svg>';
  const aliases = { 'Demo-Stammleitung': 'PM', 'Demo-Admin': 'RH', 'Demo-Leitung': 'DL', 'Demo-Ranger 01': 'JB', 'Demo-Ranger 02': 'KN', 'Demo-Ranger 03': 'LI', 'Demo-Ranger 04': 'TK', 'Demo-Ranger 05': 'JK', 'Demo-Ranger 06': 'EL', 'Demo-Ranger 07': 'LM', 'Demo-Ranger 08': 'AT' };
  const first = v24Store.stamms['clp-west'];
  if (!v24Store.shared.demoProfileNames202611) {
    [...first.leaders, ...first.rangers].forEach(p => { if (aliases[p.name]) p.name = aliases[p.name]; });
    // Retain the two retired default profiles and every progress record in the archive.
    const retired = first.rangers.filter(p => ['Demo-Ranger 09', 'Demo-Ranger 10'].includes(p.name) && ['v23ex7', 'v23ex8'].includes(p.idHint));
    first.archivedRangers ||= [];
    for (const p of retired) if (!first.archivedRangers.some(a => a.id === p.id)) first.archivedRangers.push({ ...p, archivedAt: new Date().toISOString() });
    first.rangers = first.rangers.filter(p => !retired.includes(p));
    if (v24StammId === 'clp-west') db.rangers = first.rangers;
    v24Store.shared.demoProfileNames202611 = true;
    v24Persist();
  }
  const weatherCache = new Map();
  const weatherPending = new Map();
  const weatherText = code => code === 0 ? 'Sonnig' : code <= 3 ? 'Bewölkt' : code <= 48 ? 'Neblig' : code <= 67 ? 'Regen' : code <= 77 ? 'Schnee' : code <= 82 ? 'Regenschauer' : code <= 86 ? 'Schneeschauer' : 'Gewitter';
  const weatherLocation = () => {
    const name = String(weatherPlace || db.weatherPlace || (v24StammId === 'meppen' ? 'Hamburg' : 'Berlin')).trim();
    return { name, ...({ Berlin: { latitude: 52.52, longitude: 13.405 }, Hamburg: { latitude: 53.55, longitude: 9.99 } }[name] || {}) };
  };
  const weatherMarkup = () => `<div class="current-weather" data-current-weather role="status" aria-live="polite"><span class="weather-mark" aria-hidden="true">☀</span><span><b>Wetter · ${esc(weatherLocation().name)}</b><small>Aktuelles Wetter wird geladen …</small></span><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo ${arrow}</a></div>`;
  const fetchWeather = async location => {
    const cache = weatherCache.get(location.name);
    if (cache && Date.now() - cache.time < 10 * 60 * 1000) return cache.value;
    if (weatherPending.has(location.name)) return weatherPending.get(location.name);
    const pending = (async () => {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 6000);
      try {
        let coordinates = location;
        if (!Number.isFinite(coordinates.latitude)) {
          const search = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: location.name, count: '1', language: 'de' })}`, { signal: controller.signal });
          if (!search.ok) throw new Error('Location unavailable');
          coordinates = (await search.json()).results?.[0];
          if (!coordinates || !Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) throw new Error('Location missing');
        }
        const params = new URLSearchParams({ latitude: coordinates.latitude, longitude: coordinates.longitude, current: 'temperature_2m,weather_code,wind_speed_10m', timezone: 'Europe/Berlin' });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Weather unavailable');
        const data = await response.json(), c = data.current;
        if (!c || !Number.isFinite(c.temperature_2m) || !Number.isFinite(c.weather_code) || !Number.isFinite(c.wind_speed_10m)) throw new Error('Weather incomplete');
        const value = `${Math.round(c.temperature_2m)} °C · ${weatherText(c.weather_code)} · Wind ${Math.round(c.wind_speed_10m)} km/h`;
        weatherCache.set(location.name, { time: Date.now(), value }); return value;
      } catch { return 'Wetter gerade nicht verfügbar.'; }
      finally { clearTimeout(timer); weatherPending.delete(location.name); }
    })();
    weatherPending.set(location.name, pending); return pending;
  };
  const updateWeather = () => {
    const location = weatherLocation();
    fetchWeather(location).then(value => { if (weatherLocation().name === location.name) document.querySelectorAll('[data-current-weather] small').forEach(el => { el.textContent = value; }); });
  };
  login = function () {
    const people = kind => db[kind].filter(p => !p.archived).map(p => `<option value="${kind}:${p.id}">${esc(p.name)} · ${kind === 'rangers' ? 'Ranger' : p.role || 'Leiter'}</option>`).join('');
    root.innerHTML = `<main class="logbook-login"><section class="entry-story"><a class="entry-wordmark" href="#" aria-label="RangerHub Startseite">RangerHub<span>UNSER DIGITALES LOGBUCH</span></a><div><h1>Dein Stamm.<br>Dein <em>Abenteuer.</em></h1><p>Treffen planen, Neues entdecken und zusammen wachsen. Alles für euren Weg an einem Ort.</p></div></section><section class="entry-access"><div class="entry-form-wrap"><span class="section-kicker">Willkommen im Logbuch</span><h2>Schön, dass du da bist.</h2><p class="entry-description">Wähle einen Stamm und entdecke die Demo aus deiner Perspektive.</p><form id="demo-login-form" class="v24-loginChoice"><label for="demo-stamm">Stamm<select id="demo-stamm" aria-label="Stamm auswählen" onchange="v24PickLoginStamm(this.value)">${Object.keys(V24_STAMM_NAMES).map(id => `<option value="${id}" ${id === v24StammId ? 'selected' : ''}>${esc(v24StammName(id))}</option>`).join('')}</select></label><label for="demo-person">Dein Profil<select id="demo-person" required><option value="">Leiter oder Ranger wählen</option><optgroup label="Leiterteam">${people('leaders')}</optgroup><optgroup label="Ranger">${people('rangers')}</optgroup></select></label><label for="demo-password">Passwort<input id="demo-password" type="password" disabled placeholder="Für die Demo nicht erforderlich" autocomplete="off"></label><button class="btn" type="submit">Logbuch öffnen ${arrow}</button></form><p class="entry-demo-note">Öffentliche Demo · fiktive Profile · ohne Passwort</p>${weatherMarkup()}</div></section></main>`;
    document.getElementById('demo-login-form').onsubmit = event => {
      event.preventDefault(); if (!event.target.reportValidity()) return;
      const [kind, id] = document.getElementById('demo-person').value.split(':');
      if (!['leaders', 'rangers'].includes(kind) || !db[kind].some(p => p.id === Number(id) && !p.archived)) return;
      v24Choose(kind, Number(id));
    };
    root.querySelector('.entry-wordmark').onclick = event => { event.preventDefault(); login(); };
    updateWeather();
  };
  const oldDash = dash;
  dash = function () { oldDash(); RH.content().querySelector('.dash-masthead')?.insertAdjacentHTML('afterend', weatherMarkup()); updateWeather(); };
  const oldPath = path;
  path = function () {
    oldPath();
    RH.content().querySelectorAll('.growth-stage').forEach(button => { button.dataset.stage = button.querySelector('h2').textContent; });
  };
  const closeMenu = () => {
    document.querySelector('.side')?.classList.remove('menu-open');
    const button = document.querySelector('[data-menu-toggle]');
    button?.setAttribute('aria-expanded', 'false'); button?.setAttribute('aria-label', 'Menü öffnen');
  };
  const oldGo = goV17;
  goV17 = function (next) { closeMenu(); oldGo(next); };
  RH.goDashboard = () => { closeM(); goV17('dash'); };
  const oldRender = render;
  render = function () {
    oldRender();
    const side = root.querySelector('.side'); if (!side) return;
    side.querySelector('#v24-mobile-menu')?.remove();
    const brand = side.querySelector('.brand');
    brand.setAttribute('role', 'button'); brand.setAttribute('tabindex', '0'); brand.setAttribute('aria-label', 'RangerHub · Zum Dashboard');
    brand.onclick = RH.goDashboard;
    brand.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); RH.goDashboard(); } };
    const nav = side.querySelector('.nav'), group = nav.querySelector('.navGroup'), sub = group?.querySelector('.navSub');
    const recipe = nav.querySelector('[data-recipe-nav]'); if (recipe && sub) sub.appendChild(recipe);
    if (view === 'recipes') { group?.classList.add('open'); stammOpen = true; }
    const title = group?.querySelector('.navGroupTitle');
    if (title) { title.setAttribute('role', 'button'); title.tabIndex = 0; title.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); title.click(); } }; }
    const panel = document.createElement('div'); panel.className = 'mobile-nav-panel'; panel.id = 'rangerhub-navigation';
    const tribe = side.querySelector('.v24-switcher,.v24-tribeLabel'); if (tribe) panel.appendChild(tribe);
    panel.appendChild(nav); const footer = side.querySelector('.v22-sidefoot'); if (footer) panel.appendChild(footer);
    side.appendChild(panel);
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'menu-toggle'; toggle.dataset.menuToggle = ''; toggle.setAttribute('aria-label', 'Menü öffnen'); toggle.setAttribute('aria-controls', panel.id); toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    toggle.onclick = () => { const opened = side.classList.toggle('menu-open'); toggle.setAttribute('aria-expanded', String(opened)); toggle.setAttribute('aria-label', opened ? 'Menü schließen' : 'Menü öffnen'); };
    brand.after(toggle);
  };
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.side')) closeMenu(); });
  // Keep contact visibility from the existing profile renderer; decorate only visible addresses.
  const oldMeta = v23PersonMeta;
  v23PersonMeta = function (person, kind) {
    const html = oldMeta(person, kind), address = [person.address, person.address2].filter(Boolean).join(', ');
    if (!address) return html;
    const holder = document.createElement('div'); holder.innerHTML = html;
    const row = [...holder.children].find(el => el.textContent.startsWith('📍'));
    if (row) { const button = document.createElement('button'); button.type = 'button'; button.className = 'map-link'; button.textContent = 'Route planen ↗'; button.dataset.mapAddress = address; row.appendChild(button); }
    return holder.innerHTML;
  };
  const oldRangerProfile = v24RangerProfile;
  v24RangerProfile = function (id) {
    oldRangerProfile(id);
    const person = db.rangers.find(p => p.id === id);
    if (!person || !v24ShowContact(person, 'rangers')) return;
    const address = [person.address, person.address2].filter(Boolean).join(', ');
    const row = [...RH.content().querySelectorAll('.v24-detail')].find(el => el.querySelector('label')?.textContent === 'Adresse');
    if (row && address) {
      const button = document.createElement('button'); button.className = 'map-link'; button.type = 'button'; button.textContent = 'Route planen ↗'; button.dataset.mapAddress = address; row.appendChild(button);
    }
  };
  RH.openMaps = address => {
    if (!address) return;
    document.getElementById('map-chooser')?.remove();
    const dialog = document.createElement('dialog'); dialog.id = 'map-chooser'; dialog.className = 'map-chooser';
    const destination = encodeURIComponent(address);
    dialog.innerHTML = `<form method="dialog"><div class="top"><h2>Route planen</h2><button class="btn alt" aria-label="Kartenauswahl schließen">Schließen</button></div><p>${esc(address)}</p><p>Mit welcher Karten-App möchtest du navigieren?</p><div class="map-options"><a class="btn" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&amp;destination=${destination}">Google Maps ↗</a><a class="btn alt" target="_blank" rel="noopener noreferrer" href="https://maps.apple.com/?daddr=${destination}">Apple Karten ↗</a>${/Android/i.test(navigator.userAgent) ? `<a class="btn alt" href="geo:0,0?q=${destination}">Karten-App öffnen ↗</a>` : ''}</div></form>`;
    document.body.appendChild(dialog); dialog.showModal();
    dialog.addEventListener('close', () => dialog.remove());
  };
  document.addEventListener('click', event => { const button = event.target.closest('[data-map-address]'); if (button) RH.openMaps(button.dataset.mapAddress); });
  const stylesheet = document.querySelector('link[data-rangerhub-logbook]'); if (stylesheet) document.head.appendChild(stylesheet);
  render(); RH.logbookReady = true;
})();
