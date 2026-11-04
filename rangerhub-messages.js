/* Role-scoped message screens and chat button. Demo delivery is labelled explicitly. */
(() => {
  'use strict';
  const RH = window.RangerHub, same = (a, b) => String(a) === String(b);
  let transport = RH.createLocalMessagesTransport(), unsubscribe = null, badgeGeneration = 0, poll = null;
  const drafts = new Map();
  const actor = () => { try { return RH.messageActor(); } catch { return null; } };
  const time = date => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  const isDemo = () => transport.mode === 'demo';
  const label = () => isDemo() ? '<p class="rh-chat-mode"><b>Demo-Nachrichten</b> · nur in diesem Browserprofil. Zum Testen zwischen Ranger- und Leiterprofil wechseln.</p>' : '<p class="rh-chat-mode">Nachrichten an dein Leiterteam</p>';
  const empty = a => a.leader ? '<h2>Alles im Blick.</h2><p class="muted">Hier erscheinen die Fragen der Ranger deines Stamms. Offene Fragen bleiben hervorgehoben, bis jemand aus dem Leiterteam antwortet.</p>' : '<h2>Frag dein Leiterteam.</h2><p class="muted">Ob Wachstumspfad, nächstes Treffen oder eine andere Frage – hier ist Platz dafür.</p>';
  function validThread(t, a) { return t && typeof t.id === 'string' && typeof t.subject === 'string' && typeof t.topic === 'string' && Array.isArray(t.messages) && t.messages.length && RH.canReadMessage(t, a) && t.messages.every(m => typeof m.text === 'string' && m.author && ['leaders', 'rangers'].includes(m.author.kind) && Number.isFinite(Date.parse(m.createdAt))); }
  async function threads(a) { const list = await transport.list(); return list.filter(t => validThread(t, a)).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))); }
  function feedback(node, text, error = false) { const el = node.querySelector('[data-chat-feedback]'); if (el) { el.textContent = text; el.classList.toggle('is-error', error); } }
  function preserveDraft(form, key) { form.addEventListener('input', () => { drafts.set(key, Object.fromEntries(new FormData(form))); }); }
  function compose(node, a) {
    node.dataset.chatScreen = 'compose'; delete node.dataset.chatThread;
    const draftKey = a.key+':new', d = drafts.get(draftKey) || {};
    node.innerHTML = `${label()}<div class="rh-chat-heading"><button type="button" class="btn alt" data-chat-back>${RH.icon('back')} Zurück</button><h2>Neue Frage</h2></div><p class="muted">Deine Frage ist für das Leiterteam deines Stamms sichtbar.</p><form class="rh-message-form" data-new-question><label>Thema<select name="topic" required><option value="">Thema auswählen</option>${RH.messageTopics.map(t => `<option ${t === d.topic ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label><label>Betreff<input name="subject" maxlength="120" placeholder="Worum geht es?" value="${esc(d.subject || '')}"></label><label>Deine Frage<textarea name="text" rows="6" maxlength="6000" required placeholder="Was möchtest du wissen?">${esc(d.text || '')}</textarea></label><button class="btn" type="submit">${isDemo() ? 'Frage in der Demo speichern' : 'Frage senden'}</button></form><p data-chat-feedback role="status" aria-live="polite"></p>`;
    node.querySelector('[data-chat-back]').onclick = () => renderList(node);
    const form = node.querySelector('form'); preserveDraft(form, draftKey);
    form.onsubmit = async e => {
      e.preventDefault(); if (!form.reportValidity() || actor()?.key !== a.key) return;
      const button = form.querySelector('[type=submit]'); button.disabled = true;
      try { const thread = await transport.create(Object.fromEntries(new FormData(form))); if (actor()?.key !== a.key || !node.isConnected) return; drafts.delete(draftKey); await openThread(node, thread.id); RH.refreshMessagesUI(); }
      catch (e) { if (node.isConnected) feedback(node, e.message, true); }
      finally { if (button.isConnected) button.disabled = false; }
    };
    form.elements.topic.focus();
  }
  async function renderList(node) {
    const a = actor(); if (!a || !node.isConnected) return;
    const generation = RH.uid(); node.dataset.chatGeneration = generation; delete node.dataset.chatThread;
    node.dataset.chatScreen = 'list'; node.innerHTML = `${label()}<div class="rh-chat-heading"><h2>${a.leader ? 'Fragen aus deinem Stamm' : 'Deine Nachrichten'}</h2>${!a.leader ? '<button class="btn" data-compose>+ Frage stellen</button>' : ''}</div><div data-thread-list><p class="muted">Nachrichten werden geladen …</p></div><button class="btn text" data-chat-refresh>Aktualisieren</button><p data-chat-feedback role="status" aria-live="polite"></p>`;
    node.querySelector('[data-compose]')?.addEventListener('click', () => compose(node, a));
    node.querySelector('[data-chat-refresh]').onclick = () => renderList(node);
    try {
      const list = await threads(a); if (!node.isConnected || node.dataset.chatGeneration !== generation || actor()?.key !== a.key) return;
      const container = node.querySelector('[data-thread-list]');
      container.innerHTML = list.map(t => { const state = RH.messageState(t, a), person = db.rangers.find(p => same(p.id, t.rangerId)); return `<button type="button" class="rh-thread ${state.unread ? 'is-unread' : ''} ${state.answered ? 'is-answered' : ''}" data-thread-id="${esc(t.id)}"><span class="rh-thread-symbol" aria-hidden="true">${RH.icon(state.answered ? 'check' : 'messages')}</span><span><span class="rh-thread-title">${esc(t.subject)}</span><small>${esc(t.topic)}${a.leader ? ' · ' + esc(person?.name || 'Archiviertes Rangerprofil') : ''}</small><span class="rh-thread-preview">${esc(state.last.text.slice(0, 105))}</span></span><span class="rh-thread-meta"><time datetime="${esc(t.updatedAt)}">${esc(new Date(t.updatedAt).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' }))}</time><small>${state.answered ? 'Beantwortet' : 'Antwort offen'}</small></span></button>`; }).join('') || `<div class="rh-chat-empty">${empty(a)}</div>`;
      container.querySelectorAll('[data-thread-id]').forEach(b => { b.onclick = () => openThread(node, b.dataset.threadId); });
    } catch (e) { if (node.isConnected && node.dataset.chatGeneration === generation) feedback(node, e.message, true); }
  }
  async function openThread(node, id) {
    const a = actor(); if (!a || !node.isConnected) return;
    const generation = RH.uid(); node.dataset.chatGeneration = generation;
    try {
      const list = await threads(a), thread = list.find(t => same(t.id, id));
      if (!node.isConnected || node.dataset.chatGeneration !== generation || actor()?.key !== a.key) return;
      if (!thread) { await renderList(node); feedback(node, 'Diese Frage ist für dein Profil nicht verfügbar.', true); return; }
      node.dataset.chatThread = thread.id; node.dataset.chatScreen = 'thread'; node.dataset.chatLast = thread.messages.at(-1).id;
      const draftKey = a.key+':'+id, draft = drafts.get(draftKey) || {};
      node.innerHTML = `${label()}<div class="rh-chat-heading"><button class="btn alt" type="button" data-chat-back>${RH.icon('back')} Zurück</button><div><small>${esc(thread.topic)}</small><h2 tabindex="-1">${esc(thread.subject)}</h2></div></div><div class="rh-chat-conversation" role="log" aria-label="Gespräch mit dem Leiterteam" aria-live="polite">${thread.messages.map(m => { const mine = m.author.kind === a.kind && same(m.author.id, a.id) && m.author.homeStammId === a.homeStammId; return `<article class="rh-message ${mine ? 'is-mine' : ''}"><div class="rh-message-author">${esc(m.author.name || (m.author.kind === 'leaders' ? 'Leiterteam' : 'Ranger'))}<small>${m.author.kind === 'leaders' ? 'Leiterteam' : 'Ranger'}</small></div><p>${esc(m.text)}</p><time datetime="${esc(m.createdAt)}">${esc(time(m.createdAt))}</time></article>`; }).join('')}</div><form class="rh-message-form" data-message-reply><label>${a.leader ? 'Deine Antwort' : 'Noch eine Frage oder Rückmeldung?'}<textarea name="text" rows="3" maxlength="6000" required>${esc(draft.text || '')}</textarea></label><button class="btn" type="submit">${isDemo() ? 'Antwort in der Demo speichern' : 'Antwort senden'}</button></form><p data-chat-feedback role="status" aria-live="polite"></p>`;
      node.querySelector('[data-chat-back]').onclick = () => renderList(node);
      const form = node.querySelector('form'); preserveDraft(form, draftKey);
      form.onsubmit = async e => {
        e.preventDefault(); if (!form.reportValidity() || actor()?.key !== a.key) return;
        const button = form.querySelector('[type=submit]'); button.disabled = true;
        try { await transport.reply(id, Object.fromEntries(new FormData(form))); if (actor()?.key !== a.key || !node.isConnected) return; drafts.delete(draftKey); await openThread(node, id); RH.refreshMessagesUI(); }
        catch (e) { if (node.isConnected) feedback(node, e.message, true); }
        finally { if (button.isConnected) button.disabled = false; }
      };
      if (!a.leader && RH.messageState(thread, a).unread) { await transport.markRead(id); RH.refreshMessagesUI(); }
      node.querySelector('h2')?.focus({ preventScroll: true });
    } catch (e) { if (node.isConnected) feedback(node, e.message, true); }
  }
  RH.renderMessages = () => {
    if (!actor()) return;
    RH.content().innerHTML = '<header class="top page-heading"><div><span class="section-kicker">Dein Draht zum Leiterteam</span><h1>Nachrichten</h1></div></header><section class="rh-messages-page" data-message-surface></section>';
    RH.decorateBack?.();
    renderList(RH.content().querySelector('[data-message-surface]'));
  };
  RH.openChat = () => {
    const a = actor(); if (!a) return;
    let dialog = document.getElementById('rangerhub-chat'); if (dialog?.open) { dialog.close(); return; }
    dialog?.remove(); dialog = document.createElement('dialog'); dialog.id = 'rangerhub-chat'; dialog.className = 'rh-chat-drawer'; dialog.setAttribute('aria-labelledby', 'rh-chat-title'); dialog.dataset.actorKey = a.key;
    dialog.innerHTML = `<header class="rh-chat-drawer-heading"><div><small>${esc(v24StammName())}</small><h2 id="rh-chat-title">Dein Leiterteam</h2></div><button type="button" class="btn alt" data-close-chat aria-label="Chat schließen">Schließen</button></header><div class="rh-chat-drawer-body" data-message-surface></div><button class="rh-chat-full" type="button" data-open-messages>Alle Nachrichten öffnen ↗</button>`;
    dialog.querySelector('[data-close-chat]').onclick = () => dialog.close();
    dialog.querySelector('[data-open-messages]').onclick = () => { dialog.close(); goV17('messages'); };
    dialog.addEventListener('close', () => document.querySelector('[data-chat-toggle]')?.focus({ preventScroll: true }));
    document.body.append(dialog); dialog.showModal(); renderList(dialog.querySelector('[data-message-surface]'));
  };
  RH.refreshMessagesUI = async () => {
    const a = actor(), generation = ++badgeGeneration;
    const existing = document.querySelector('[data-chat-toggle]'), drawer = document.getElementById('rangerhub-chat');
    if (!a) { existing?.remove(); drawer?.remove(); return; }
    if (drawer && drawer.dataset.actorKey !== a.key) drawer.remove();
    let fab = existing;
    if (!fab) { fab = document.createElement('button'); fab.type = 'button'; fab.className = 'rh-chat-toggle'; fab.dataset.chatToggle = ''; fab.setAttribute('aria-label', 'Chat mit dem Leiterteam öffnen'); fab.setAttribute('title', 'Nachrichten an dein Leiterteam'); fab.innerHTML = RH.icon('messages') + '<span data-message-badge hidden aria-hidden="true"></span>'; fab.onclick = RH.openChat; document.body.append(fab); }
    const nav = root.querySelector('[data-message-nav]'); if (nav && !nav.querySelector('[data-message-badge]')) nav.insertAdjacentHTML('beforeend', '<span data-message-badge hidden aria-hidden="true"></span>');
    try {
      const list = await threads(a); if (generation !== badgeGeneration || actor()?.key !== a.key) return;
      const count = list.filter(t => RH.messageState(t, a).unread).length;
      document.querySelectorAll('[data-message-badge]').forEach(b => { b.hidden = !count; b.textContent = count > 99 ? '99+' : String(count); });
      fab.setAttribute('aria-label', count ? `Chat mit dem Leiterteam öffnen · ${count} offene oder neue Nachrichten` : 'Chat mit dem Leiterteam öffnen');
    } catch { /* The list shows a retryable error; never manufacture a successful delivery. */ }
  };
  function refreshVisible() {
    RH.refreshMessagesUI();
    document.querySelectorAll('[data-message-surface]').forEach(node => {
      if (node.dataset.chatScreen === 'list') renderList(node);
      else if (node.dataset.chatScreen === 'thread') {
        const a = actor(), threadId = node.dataset.chatThread;
        if (!a) return;
        threads(a).then(async list => {
          if (!node.isConnected || node.dataset.chatThread !== threadId || actor()?.key !== a.key) return;
          const t = list.find(t => same(t.id, threadId)); if (!t || t.messages.at(-1).id === node.dataset.chatLast) return;
          const form = node.querySelector('form'), focused = form?.contains(document.activeElement), selection = focused && document.activeElement.selectionStart;
          await openThread(node, threadId);
          if (focused) { const input = node.querySelector('textarea'); input?.focus({ preventScroll: true }); if (typeof selection === 'number') input?.setSelectionRange(selection, selection); }
        }).catch(() => {});
      }
    });
  }
  function subscribe() { unsubscribe?.(); unsubscribe = transport.subscribe?.(refreshVisible); clearTimeout(poll); if (!isDemo()) { const next = () => { if (document.visibilityState === 'visible' && (view === 'messages' || document.getElementById('rangerhub-chat')?.open)) refreshVisible(); poll = setTimeout(next, 20000); }; poll = setTimeout(next, 20000); } }
  RH.setMessagesTransport = next => {
    if (!next || !['demo', 'online'].includes(next.mode) || !['list', 'create', 'reply', 'markRead'].every(name => typeof next[name] === 'function')) throw Error('Ungültige Nachrichten-Anbindung.');
    transport = next; subscribe(); document.getElementById('rangerhub-chat')?.remove(); if (view === 'messages') RH.renderMessages(); RH.refreshMessagesUI();
  };
  RH.messagesTransportMode = () => transport.mode;
  RH.messagePushPayload = detail => ({ title: detail.type === 'leader-replied' ? 'Dein Leiterteam hat geantwortet' : 'Neue Rangerfrage', body: 'Öffne RangerHub, um die Nachricht zu lesen.', threadId: detail.threadId, stammId: detail.stammId });
  const previousRender = render;
  render = function () { previousRender(); if (session && view === 'messages') RH.renderMessages(); RH.refreshMessagesUI(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshVisible(); });
  subscribe(); render(); RH.messagesReady = true;
})();
