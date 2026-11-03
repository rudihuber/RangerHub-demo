/* Annual plans belong to one tribe and one calendar year. */
(() => {
  'use strict';
  const RH = window.RangerHub;
  const yearNow = () => Number(RH.localDate().slice(0, 4));
  const plan = year => db.annualPlans?.[year] || { vision: '', goals: [] };
  const validYear = year => Number.isInteger(Number(year)) && year >= 1900 && year <= 2200;
  const panel = (year, meetingId = 0) => {
    const p = plan(year);
    return `<section class="annual-plan" data-annual-plan><span class="section-kicker">Unser gemeinsamer Kurs · ${year}</span><h2>Jahresvision</h2><p class="annual-vision">${esc(p.vision || 'Für dieses Jahr ist noch keine Vision hinterlegt.')}</p>${p.goals.length ? `<h3>Unsere Ziele</h3><ul>${p.goals.map(goal => `<li>${esc(goal)}</li>`).join('')}</ul>` : ''}<button class="btn alt sm" onclick="RangerHub.editAnnualPlan(${year},${meetingId})">${p.vision ? 'Jahresvision und Ziele bearbeiten' : 'Jahresvision und Ziele hinterlegen'}</button></section>`;
  };
  leadermeetings = function (selectedYear = yearNow()) {
    if (!isLeader() || !validYear(selectedYear)) return;
    selectedYear = Number(selectedYear);
    const years = [...new Set([yearNow() - 1, yearNow(), yearNow() + 1, selectedYear, ...db.leaderMeetings.map(m => Number(m.date.slice(0, 4))), ...Object.keys(db.annualPlans || {}).map(Number)])].filter(validYear).sort((a, b) => b - a);
    const meetings = db.leaderMeetings.filter(m => Number(m.date.slice(0, 4)) === selectedYear).sort((a, b) => b.date.localeCompare(a.date));
    RH.content().innerHTML = `<div class="top"><h1>Leitermeetings</h1><button class="btn" onclick="leaderForm()">+ Leitermeeting</button></div><label class="year-picker">Planungsjahr<select aria-label="Planungsjahr" onchange="leadermeetings(Number(this.value))">${years.map(y => `<option ${y === selectedYear ? 'selected' : ''}>${y}</option>`).join('')}</select></label>${panel(selectedYear)}<h2>Unsere Treffen</h2>${meetings.map(m => `<button class="dash-person" onclick="openLeaderMeeting(${m.id})"><span><b>${fmt(m.date)} · ${esc(m.place)}</b><small>${esc(m.start || '')}${m.end ? ' – ' + esc(m.end) : ''}</small></span><span>↗</span></button>`).join('') || '<p class="muted">Für dieses Jahr sind noch keine Leitermeetings eingetragen.</p>'}`;
  };
  RH.editAnnualPlan = (year = yearNow(), meetingId = 0) => {
    if (!isLeader() || !validYear(year)) return;
    const p = plan(year);
    box.innerHTML = `<div class="top"><h2>Jahresvision ${year}</h2><button class="btn alt" onclick="closeM()">Schließen</button></div><p class="muted">Diese Vision und Ziele begleiten alle Leitermeetings im Jahr ${year}.</p><form id="annual-plan-form" class="form"><label class="full">Vision für das Jahr<textarea name="vision" rows="3" required>${esc(p.vision)}</textarea></label><label class="full">Ziele · ein Ziel pro Zeile<textarea name="goals" rows="6">${esc(p.goals.join('\n'))}</textarea></label><button class="btn full">Jahresplanung speichern</button></form>`;
    document.getElementById('annual-plan-form').onsubmit = event => {
      event.preventDefault(); if (!isLeader() || !event.target.reportValidity()) return;
      const f = new FormData(event.target), vision = String(f.get('vision') || '').trim();
      if (!vision) return;
      (db.annualPlans ||= {})[year] = { vision, goals: String(f.get('goals') || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean) };
      v24Persist();
      if (meetingId) openLeaderMeeting(meetingId); else { closeM(); leadermeetings(year); }
    };
    openM();
  };
  const previousOpen = openLeaderMeeting;
  openLeaderMeeting = function (id) {
    const m = db.leaderMeetings.find(m => m.id === id);
    if (!isLeader() || !m) return;
    previousOpen(id);
    box.querySelector('.top')?.insertAdjacentHTML('afterend', panel(Number(m.date.slice(0, 4)), id));
  };
  const previousForm = leaderForm;
  leaderForm = function (id = 0, date = '') {
    if (!isLeader()) return;
    previousForm(id, date);
    const form = box.querySelector('form'), input = form.elements.date;
    const update = () => {
      box.querySelector('[data-annual-plan]')?.remove();
      const year = Number(input.value.slice(0, 4)) || yearNow(), p = plan(year);
      form.insertAdjacentHTML('beforebegin', `<section class="annual-plan" data-annual-plan><b>Jahresvision ${year}</b><p>${esc(p.vision || 'Noch keine Jahresvision hinterlegt. In den Leitermeetings kannst du sie für das gesamte Jahr festlegen.')}</p>${p.goals.length ? `<ul>${p.goals.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}</section>`);
    };
    input.addEventListener('change', update); update();
  };
})();
