/* Personal participation, growth and role-specific presentation. */
(() => {
  'use strict';
  const RH = window.RangerHub;
  const host = RH.content;
  const forbidden = new Set(['meetings', 'leadermeetings', 'nature', 'activities', 'recipes', 'tasks', 'lastmeeting']);
  const lock = '<svg class="stage-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
  const pct = (done, total) => total ? Math.round(done / total * 100) : 0;
  const futureMeetings = () => db.meetings.filter(m => m.date >= RH.localDate()).sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || ''));
  const daysUntil = date => Math.round((Date.parse(date + 'T12:00:00Z') - Date.parse(RH.localDate() + 'T12:00:00Z')) / 86400000);
  RH.growthStats = pid => {
    const progress = stages.map(stage => {
      const c = v21StageCounts(stage, pid), total = c.total, done = Math.min(total, Math.max(0, c.done));
      return { stage, done, total, percent: pct(done, total) };
    });
    const done = progress.reduce((sum, p) => sum + p.done, 0), total = progress.reduce((sum, p) => sum + p.total, 0);
    return { progress, done, total, percent: pct(done, total) };
  };
  RH.attendanceStats = (pid = session?.id) => {
    const past = db.meetings.filter(m => m.date <= RH.localDate());
    const recorded = past.map(m => m.attendance?.rangers?.[pid]).filter(s => ['ANWESEND', 'ABWESEND', 'ENTSCHULDIGT'].includes(s));
    const attended = recorded.filter(s => s === 'ANWESEND').length, excused = recorded.filter(s => s === 'ENTSCHULDIGT').length;
    return { attended, excused, absent: recorded.length - attended - excused, total: recorded.length, percent: recorded.length ? pct(attended, recorded.length) : null };
  };
  const isCancelled = m => db.cancellations.some(c => String(c.meetingId) === String(m.id) && c.kind === 'rangers' && c.personId === session.id);
  const periodAbsence = m => db.absences.find(a => a.kind === 'rangers' && a.personId === session.id && a.from <= m.date && a.to >= m.date);
  const meetingSummary = m => `<div class="meeting-date">${fmt(m.date)} · ${esc(m.start || '')}${m.end ? '–' + esc(m.end) : ''} Uhr</div><h3>Rangertreffen</h3><p>${esc(m.place || 'Ort folgt')}</p>`;
  const previousPublicOpen = openRangerMeeting;
  RH.openPublicMeeting = id => {
    const m = RH.byMeetingId(id);
    if (!session || isLeader() || !m || m.date < RH.localDate()) return;
    box.innerHTML = `<div class="top"><h2>Rangertreffen</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><section class="meeting-block ranger-meeting">${meetingSummary(m)}<div data-meeting-forecast class="muted">Wetter wird geladen …</div></section>`;
    openM(); loadMeetingWeather(m, box.querySelector('[data-meeting-forecast]'));
  };
  openRangerMeeting = function (id) { if (isLeader()) return previousPublicOpen(id); return RH.openPublicMeeting(id); };
  const previousAbs = abs;
  abs = function () {
    if (isLeader()) {
      previousAbs(); host().querySelector('h1').textContent = 'Teilnahme & Abmeldungen';
      return;
    }
    if (!session || session.kind !== 'rangers') return;
    const stats = RH.attendanceStats(), meetings = futureMeetings();
    host().innerHTML = `<div class="top page-heading"><div><span class="section-kicker">${esc(currentUser()?.name || '')} · ${esc(v24StammName())}</span><h1>Meine Teilnahme</h1></div></div><section class="attendance-hero"><div class="attendance-ring" style="--attendance:${stats.percent || 0}%" role="img" aria-label="${stats.total ? 'Anwesenheitsquote ' + stats.percent + ' Prozent bei ' + stats.total + ' erfassten Treffen' : 'Noch keine Anwesenheit erfasst'}"><div><strong>${stats.percent ?? '—'}${stats.total ? '<small>%</small>' : ''}</strong><span>Anwesenheit</span></div></div><div class="attendance-description"><h2>Deine Zeit im Stamm.</h2><p>${stats.total ? `Bei <b>${stats.attended} von ${stats.total}</b> erfassten Treffen warst du dabei.` : 'Sobald dein Leiterteam die erste Teilnahme erfasst hat, siehst du hier deine Quote.'}</p><div class="attendance-numbers"><span><b>${stats.attended}</b>Dabei</span><span><b>${stats.excused}</b>Entschuldigt</span><span><b>${stats.absent}</b>Gefehlt</span></div><small>Alle bisher vom Leiterteam erfassten Rangertreffen.</small></div></section><section class="participation-meetings"><div class="heading-row"><h2>Kommende Rangertreffen</h2><span class="muted">${meetings.length} Termine</span></div>${meetings.map(m => {
      const cancelled = isCancelled(m), absence = periodAbsence(m);
      return `<article class="participation-meeting" data-participation-id="${m.id}"><div>${meetingSummary(m)}<span class="participation-status ${cancelled || absence ? 'is-cancelled' : ''}">${cancelled ? 'Du bist abgemeldet' : absence ? 'Abgemeldet durch einen eingetragenen Zeitraum' : 'Du bist eingeplant'}</span></div><div><button type="button" class="btn ${cancelled ? 'alt' : ''}" ${absence ? 'disabled' : ''} onclick="RangerHub.${cancelled ? 'withdrawCancellation' : 'showCancellation'}(${m.id})">${cancelled ? 'Absage zurücknehmen' : absence ? 'Zeitraum bereits eingetragen' : 'Ich kann nicht dabei sein'}</button></div><div data-cancellation-form class="full"></div></article>`;
    }).join('') || '<p class="muted">Sobald neue Treffen geplant sind, kannst du hier deine Teilnahme verwalten.</p>'}<p data-participation-feedback role="status" aria-live="polite"></p></section>`;
  };
  const allowedCancellation = id => {
    const m = RH.byMeetingId(id);
    return session?.kind === 'rangers' && !isLeader() && view === 'abs' && session.homeStammId === v24StammId && m && m.date >= RH.localDate() ? m : null;
  };
  RH.showCancellation = id => {
    const m = allowedCancellation(id); if (!m || isCancelled(m) || periodAbsence(m)) return;
    const slot = [...host().querySelectorAll('[data-participation-id]')].find(el => el.dataset.participationId === String(id))?.querySelector('[data-cancellation-form]');
    if (!slot) return;
    slot.innerHTML = '<form class="cancellation-form"><label>Nachricht an dein Leiterteam (optional)<textarea name="reason" rows="2" maxlength="1000"></textarea></label><div class="row"><button class="btn" type="submit">Absage speichern</button><button class="btn alt" type="button" data-cancel-form>Abbrechen</button></div></form>';
    slot.querySelector('[data-cancel-form]').onclick = () => { slot.innerHTML = ''; };
    slot.querySelector('form').onsubmit = event => {
      event.preventDefault(); const current = allowedCancellation(id); if (!current || isCancelled(current) || periodAbsence(current)) return;
      const reason = String(new FormData(event.target).get('reason') || '').trim();
      db.cancellations.push({ meetingId: current.id, kind: 'rangers', personId: session.id, reason, createdAt: new Date().toISOString() });
      v24Persist(); abs(); host().querySelector('[data-participation-feedback]').textContent = 'Deine Absage ist gespeichert.';
    };
    slot.querySelector('textarea').focus();
  };
  RH.withdrawCancellation = id => {
    const m = allowedCancellation(id); if (!m) return;
    db.cancellations = db.cancellations.filter(c => !(String(c.meetingId) === String(id) && c.kind === 'rangers' && c.personId === session.id));
    v24Persist(); abs(); host().querySelector('[data-participation-feedback]').textContent = 'Deine Absage wurde zurückgenommen.';
  };
  const oldCancel = cancel;
  cancel = function (id) { if (isLeader()) return oldCancel(id); if (!allowedCancellation(id)) return; const m = RH.byMeetingId(id); if (isCancelled(m)) RH.withdrawCancellation(id); else RH.showCancellation(id); };
  const leaderOnly = fn => function (...args) { if (isLeader()) return fn.apply(this, args); };
  activities = leaderOnly(activities); nature = leaderOnly(nature); lastmeeting = leaderOnly(lastmeeting);
  actionFormV15 = leaderOnly(actionFormV15); saveActionV15 = leaderOnly(saveActionV15);
  absenceForm = leaderOnly(absenceForm); saveAbs = leaderOnly(saveAbs);
  attendance = leaderOnly(attendance); mAtt = leaderOnly(mAtt);
  const oldLeaderProfile = v24ShowLeaderProfile;
  v24ShowLeaderProfile = function (id) { oldLeaderProfile(id); if (!isLeader()) box.querySelector('.v24-details')?.remove(); };
  const oldCalendar = calendar;
  calendar = function () {
    oldCalendar(); if (isLeader()) return;
    host().querySelectorAll('.event[onclick*="openRangerMeeting"]').forEach(el => {
      const id = el.getAttribute('onclick').match(/openRangerMeeting\((\d+)\)/)?.[1], m = RH.byMeetingId(id);
      if (!m) return;
      el.textContent = `Rangertreffen · ${m.start || ''}`; el.removeAttribute('title'); el.classList.remove('is-ready', 'is-urgent', 'is-pending');
    });
  };
  const categoryBreakdown = (stage, pid) => {
    if (stage === 'Beobachter') return [...Object.entries(db.observerTasks).map(([category, tasks]) => ({ category, done: tasks.filter(t => db.observerProgress?.[pid]?.[t.id]).length, total: tasks.length })), { category: 'Aufgabenpakete', done: observerCounts(pid).bcount, total: 4 }];
    const groups = new Map();
    for (const task of db.growthTasks[stage] || []) {
      const category = task.category || 'Allgemein';
      if (!groups.has(category)) groups.set(category, { category, done: 0, total: 0 });
      const group = groups.get(category); group.total++; if (db.stageProgress?.[pid]?.[stage]?.[task.id]) group.done++;
    }
    return [...groups.values()];
  };
  const bar = p => `<span class="personal-progress-track" role="progressbar" aria-label="${esc(p.stage || p.category)}" aria-valuemin="0" aria-valuemax="${p.total || 1}" aria-valuenow="${p.done}"><i style="width:${pct(p.done, p.total)}%"></i></span>`;
  const personalGrowth = () => {
    const stats = RH.growthStats(session.id);
    return `<div class="section-kicker"><span class="number">03</span>Dein Wachstumspfad</div><div class="personal-growth-total"><h2>Dein Weg.</h2><strong>${stats.percent}<small>%</small></strong></div><p class="muted">${stats.done} von ${stats.total} Aufgaben insgesamt bestätigt</p><div class="personal-stage-list">${stats.progress.map(p => `<div><div class="personal-progress-heading"><b>${esc(p.stage)}</b><span>${p.done}/${p.total} · ${p.percent}%</span></div>${bar(p)}</div>`).join('')}</div><details class="growth-area-breakdown"><summary>Bereiche im Detail</summary>${stats.progress.map((p, index) => `<section><h3>${esc(p.stage)}</h3>${stageUnlockedForRanger(index, session.id) ? categoryBreakdown(p.stage, session.id).map(c => `<div class="personal-area"><div class="personal-progress-heading"><span>${esc(c.category)}</span><span>${c.done}/${c.total}</span></div>${bar(c)}</div>`).join('') : `<p class="muted">${lock} Noch gesperrt</p>`}</section>`).join('')}</details><div class="dash-links"><button onclick="goV17('path')">Wachstumspfad öffnen ↗</button></div>`;
  };
  RH.ranking = () => {
    const rows = db.rangers.filter(p => !p.archived).map(p => ({ id: p.id, name: p.name, ...RH.growthStats(p.id) })).sort((a, b) => (b.done * a.total - a.done * b.total) || a.name.localeCompare(b.name, 'de'));
    let rank = 0;
    return rows.map((r, i) => { if (!i || r.done * rows[i - 1].total !== rows[i - 1].done * r.total) rank = i + 1; return { ...r, rank }; });
  };
  const rankingMarkup = () => `<div class="section-kicker"><span class="number">04</span>${esc(v24StammName())}</div><h2>Unsere Rangliste</h2><p class="muted">Bestätigte Aufgaben im gesamten Wachstumspfad.</p><ol class="growth-ranking">${RH.ranking().map(r => `<li data-ranking-id="${r.id}" ${session.kind === 'rangers' && r.id === session.id ? 'data-own-ranking="true"' : ''}><span class="rank-number">${r.rank.toString().padStart(2, '0')}</span><span class="rank-name"><b>${esc(r.name)}${session.kind === 'rangers' && r.id === session.id ? ' <small>Du</small>' : ''}</b><small>${r.done}/${r.total} Aufgaben</small></span><strong>${r.percent}<small>%</small></strong></li>`).join('') || '<li>Noch keine Ranger eingetragen.</li>'}</ol>`;
  const previousDash = dash;
  dash = function () {
    previousDash();
    const next = futureMeetings()[0], note = host().querySelector('.dash-note'), sections = host().querySelectorAll('.dash-section');
    if (note) {
      const days = next ? daysUntil(next.date) : null;
      note.classList.add('countdown-note'); note.dataset.daysUntil = days ?? '';
      note.innerHTML = `<span class="big">${days == null ? '—' : String(days).padStart(2, '0')}</span><p>${days == null ? 'Ein neuer Termin folgt.' : days === 0 ? 'Heute geht’s los!' : days === 1 ? 'Noch ein Tag.<br>Dann sehen wir uns.' : 'Tage bis zu unserem<br>nächsten Treffen.'}</p>${next ? `<small>${fmt(next.date)} · ${esc(next.start || '')} Uhr<br>${days > 1 ? 'Das nächste Abenteuer wartet.' : 'Schön, wenn du dabei bist.'}</small>` : ''}`;
    }
    if (!isLeader() && sections[2]) sections[2].innerHTML = personalGrowth();
    if (sections[3]) sections[3].innerHTML = rankingMarkup();
    if (!isLeader()) {
      sections[0]?.querySelectorAll('.dash-links').forEach(el => el.remove());
    }
    host().querySelector('.dash-footer')?.remove();
  };
  path = function () {
    const leader = isLeader(), pid = leader ? null : session.id;
    const rows = stages.map((stage, i) => {
      const available = leader || stageUnlockedForRanger(i, pid), percent = leader ? null : v23StagePercent(stage, pid), done = !leader && stageDoneForRanger(stage, pid);
      return `<button type="button" class="growth-stage ${available ? '' : 'locked'}" data-stage="${stage}" ${available ? `onclick="stageClickV19('${stage}',${i})"` : 'disabled'} aria-label="${stage}${available ? '' : ' · gesperrt'}"><span class="num">0${i + 1}</span><span><h2>${stage}</h2><small>${esc(v21StageSubtitles[i])}</small><small>${leader ? 'Aufgaben und Fortschritte ansehen' : done ? 'Abgeschlossen' : available ? `${percent}% erreicht` : 'Noch gesperrt'}</small>${!leader ? `<span class="growth-meter"><i style="width:${percent}%"></i></span>` : ''}</span><span class="arrow" aria-hidden="true">${available ? done ? '✓' : '↗' : lock}</span></button>`;
    }).reverse().join('');
    host().innerHTML = `<section class="growth-page" aria-label="Wachstumspfad"><header class="growth-intro"><div><span class="section-kicker">Dein Weg als Ranger</span><h1>Ein Schritt.<br>Neue Möglichkeiten.</h1><p>Fünf Etappen voller Entdeckungen. Jede Erfahrung bringt dich weiter – in deinem Tempo und mit deinem Team.</p></div><span class="pill">${esc(leader ? 'Leiteransicht' : currentUser()?.stage || 'Beobachter')}</span></header><div class="growth-layout"><figure class="growth-art"><img src="assets/growth-journey-clean.png" alt="Zwei Ranger auf dem Weg durch die fünf farbigen Wachstumsstufen"><div class="growth-art-labels" aria-hidden="true"><span class="growth-art-title">Wachstumspfad</span>${stages.map((stage, i) => `<div class="growth-art-label" data-art-stage="${stage}"><h2>${stage}</h2><small>${esc(v21StageSubtitles[i])}</small></div>`).join('')}</div></figure><div class="growth-stages"><div class="growth-column-heading">Wachstumsstufen</div>${rows}</div></div><p class="growth-footnote">Ab 80 % öffnet sich die nächste Etappe. Bei 100 % erreichst du die nächste offizielle Stufe.</p></section>`;
  };
  const previousGo = goV17;
  goV17 = function (next) { if (!isLeader() && forbidden.has(next)) return; return previousGo(next); };
  const previousRender = render;
  render = function () {
    if (session && !isLeader() && forbidden.has(view)) view = 'dash';
    previousRender();
    const side = root.querySelector('.side'); if (!side) return;
    if (!v24IsAdmin()) side.querySelector('.v24-tribeLabel')?.remove();
    const adminLabel = side.querySelector('.v24-switcher label'); if (adminLabel) adminLabel.textContent = 'Stamm wechseln · Admin';
    side.querySelectorAll('.v22-sidefoot').forEach(el => el.remove());
    side.querySelectorAll('.nav button').forEach(button => {
      const route = button.getAttribute('onclick')?.match(/goV17\('([^']+)'\)/)?.[1];
      if (!isLeader() && forbidden.has(route)) button.remove();
      if (route === 'abs') { button.textContent = 'Teilnahme'; button.setAttribute('aria-label', 'Teilnahme'); }
    });
  };
  const style = document.querySelector('[data-rangerhub-ranger-view]'); if (style) document.head.appendChild(style);
  render(); RH.rangerViewReady = true;
})();
