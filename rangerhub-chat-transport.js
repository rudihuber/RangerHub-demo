/* Messages transport contract. Default demo uses the existing app store only. */
(() => {
  'use strict';
  const RH = window.RangerHub;
  const same = (a, b) => String(a) === String(b);
  const topics = ['Wachstumspfad', 'Rangertreffen', 'Teilnahme', 'Ausrüstung', 'Glaube & Fragen', 'Sonstiges'];
  RH.messageTopics = topics;
  function actor() {
    const p = v24Principal();
    if (!p || !session || !v24Store.stamms[v24StammId] || session.homeStammId !== v24StammId && !v24IsAdmin()) throw Error('Bitte im eigenen Stamm anmelden.');
    return { kind: session.kind, id: session.id, name: p.name, homeStammId: session.homeStammId, stammId: v24StammId,
      key: `${v24StammId}:${session.homeStammId}:${session.kind}:${session.id}`, leader: isLeader() && (session.homeStammId === v24StammId || v24IsAdmin()) };
  }
  RH.messageActor = actor;
  const text = (value, max) => { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw Error(`Bitte einen Text mit 1 bis ${max} Zeichen eingeben.`); return value.trim(); };
  const canRead = (thread, a) => same(thread.stammId, a.stammId) && (a.leader || a.kind === 'rangers' && same(thread.rangerId, a.id));
  RH.canReadMessage = canRead;
  RH.messageState = (thread, a = actor()) => {
    const last = thread.messages.at(-1), answered = last?.author.kind === 'leaders';
    const own = last && last.author.kind === a.kind && same(last.author.id, a.id) && last.author.homeStammId === a.homeStammId;
    const unread = a.leader ? last?.author.kind === 'rangers' : !!last && !own && thread.readBy?.[a.key] !== last.id;
    return { answered, unread, last };
  };
  function event(type, thread) {
    document.dispatchEvent(new CustomEvent('rangerhub:message', { detail: { type, threadId: thread.id, stammId: thread.stammId, rangerId: thread.rangerId, recipientKind: type === 'leader-replied' ? 'rangers' : 'leaders' } }));
  }
  RH.createLocalMessagesTransport = () => {
    const key = document.querySelector('meta[name="rangerhub-storage"]')?.content;
    if (!/^rhv9(?:-demo)?$/.test(key || '')) throw Error('Der vorhandene App-Speicher ist nicht zugeordnet.');
    function store() { const root = JSON.parse(localStorage.getItem(key) || 'null'); if (!root?.__rhv24 || !root.stamms || !root.shared) throw Error('Der vorhandene App-Speicher konnte nicht gelesen werden. Bitte neu laden.'); return root; }
    function threads(a) { const d = store().stamms[a.stammId]; if (!d) throw Error('Stamm nicht gefunden.'); if (d.messages != null && !Array.isArray(d.messages)) throw Error('Die gespeicherten Nachrichten haben ein unbekanntes Format. Sie bleiben unverändert.'); return d.messages || []; }
    function write(a, mutate) {
      if (actor().key !== a.key) throw Error('Das Profil wurde gewechselt. Bitte erneut öffnen.');
      const root = store(), data = root.stamms[a.stammId]; if (!data) throw Error('Stamm nicht gefunden.');
      const previous = threads(a), next = structuredClone(previous);
      const result = mutate(next); data.messages = next;
      try { localStorage.setItem(key, JSON.stringify(root)); }
      catch { throw Error('Die Nachricht wurde nicht gespeichert. Der Browserspeicher ist voll oder nicht verfügbar. Bitte ein Backup exportieren.'); }
      v24Store.stamms[a.stammId].messages = next; if (db.__v24Stamm === a.stammId) db.messages = next;
      return structuredClone(result);
    }
    return {
      mode: 'demo',
      async list() { const a = actor(); return structuredClone(threads(a).filter(t => Array.isArray(t.messages) && canRead(t, a))).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); },
      async create(value) {
        const a = actor(); if (a.leader || a.kind !== 'rangers') throw Error('Neue Fragen werden von Rangern gestellt.');
        if (!topics.includes(value.topic)) throw Error('Bitte ein Thema auswählen.');
        const body = text(value.text, 6000), subject = text(value.subject || value.topic, 120), now = new Date().toISOString();
        const thread = { id: RH.uid(), stammId: a.stammId, rangerId: a.id, topic: value.topic, subject, createdAt: now, updatedAt: now,
          messages: [{ id: RH.uid(), text: body, createdAt: now, author: { kind: a.kind, id: a.id, homeStammId: a.homeStammId, name: a.name } }], readBy: {} };
        const result = write(a, list => { list.push(thread); return thread; }); event('question-created', result); return result;
      },
      async reply(id, value) {
        const a = actor(), body = text(value.text, 6000);
        const result = write(a, list => {
          const t = list.find(t => same(t.id, id) && canRead(t, a)); if (!t) throw Error('Diese Frage ist für dein Profil nicht verfügbar.');
          const now = new Date().toISOString(); t.messages.push({ id: RH.uid(), text: body, createdAt: now, author: { kind: a.kind, id: a.id, homeStammId: a.homeStammId, name: a.name } }); t.updatedAt = now; t.readBy[a.key] = t.messages.at(-1).id; return t;
        });
        event(a.leader ? 'leader-replied' : 'ranger-followup', result); return result;
      },
      async markRead(id) {
        const a = actor(); return write(a, list => { const t = list.find(t => same(t.id, id) && canRead(t, a)); if (!t) throw Error('Diese Frage ist für dein Profil nicht verfügbar.'); t.readBy ||= {}; t.readBy[a.key] = t.messages.at(-1)?.id; return t; });
      },
      subscribe(callback) {
        const onMessage = () => callback(), onStorage = e => {
          if (e.key !== key) return;
          try { const a = actor(), list = threads(a); v24Store.stamms[a.stammId].messages = list; if (db.__v24Stamm === a.stammId) db.messages = list; callback(); } catch { /* Signed-out/other tribe: show nothing. */ }
        };
        document.addEventListener('rangerhub:message', onMessage); window.addEventListener('storage', onStorage);
        return () => { document.removeEventListener('rangerhub:message', onMessage); window.removeEventListener('storage', onStorage); };
      }
    };
  };
  // Future online integration supplies a real per-user token, never a client-selected role.
  RH.createHttpMessagesTransport = ({ baseURL, getAccessToken }) => {
    const base = new URL(baseURL); if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))) throw Error('Die Online-Anbindung benötigt HTTPS.');
    if (typeof getAccessToken !== 'function' || base.username || base.password || base.search || base.hash) throw Error('Eine gültige persönliche Online-Anmeldung ist erforderlich.');
    async function request(path, method = 'GET', body) {
      const a = actor(), token = await getAccessToken(); if (!token || actor().key !== a.key) throw Error('Bitte persönlich für die Online-Nachrichten anmelden.');
      const url = new URL(base.href.replace(/\/$/, '') + '/messages' + path); url.searchParams.set('stammId', a.stammId);
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(url, { method, credentials: 'omit', signal: controller.signal, headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
        if (response.status === 401) throw Error('Deine Online-Anmeldung ist abgelaufen. Bitte erneut anmelden.');
        if (response.status === 403) throw Error('Du hast keinen Zugriff auf diese Nachricht oder diesen Stamm.');
        if (!response.ok) throw Error('Die Nachricht konnte online nicht geladen oder gespeichert werden. Bitte erneut versuchen.');
        const data = await response.json(); if (actor().key !== a.key) throw Error('Das Profil wurde gewechselt. Bitte erneut öffnen.'); return data;
      } catch (e) { if (e.name === 'AbortError') throw Error('Der Nachrichtendienst antwortet gerade nicht. Bitte erneut versuchen.'); throw e; }
      finally { clearTimeout(timer); }
    }
    return { mode: 'online',
      async list() { const data = await request(''); if (!Array.isArray(data.threads)) throw Error('Ungültige Antwort des Nachrichtendienstes.'); return data.threads; },
      create: value => request('', 'POST', { topic: value.topic, subject: value.subject, text: value.text }),
      reply: (id, value) => request('/'+encodeURIComponent(id)+'/replies', 'POST', { text: value.text }),
      markRead: id => request('/'+encodeURIComponent(id)+'/read', 'POST', {}),
      subscribe: () => () => {}
    };
  };
})();
