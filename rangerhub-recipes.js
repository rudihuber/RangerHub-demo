/* Recipe storage and local, reviewable extraction from files and pasted text. */
(() => {
  'use strict';
  const RH = window.RangerHub;
  let meetingDraft = null, importGeneration = 0, activeWorker = null;
  const scripts = new Map();
  const assetURL = path => new URL(path, document.baseURI).href;
  function loadScript(path) {
    if (!scripts.has(path)) scripts.set(path, new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = assetURL(path); script.onload = resolve;
      script.onerror = () => { scripts.delete(path); reject(Error('Die Datei-Erkennung konnte nicht geladen werden. Bitte erneut versuchen.')); };
      document.head.appendChild(script);
    }));
    return scripts.get(path);
  }
  function cleanLines(value) { return String(value || '').replace(/\r\n?/g, '\n').split('\n').map(s => s.trim()).filter(Boolean); }
  function parseRecipe(text, fallbackTitle = '') {
    const trimmed = String(text || '').trim();
    if (!trimmed) throw Error('Die Datei enthält keinen lesbaren Rezepttext.');
    if (/^[\[{]/.test(trimmed)) {
      try {
        let obj = JSON.parse(trimmed); if (Array.isArray(obj)) obj = obj[0];
        if (obj?.['@graph']) obj = obj['@graph'].find(x => x['@type'] === 'Recipe') || obj;
        const list = obj.ingredients || obj.recipeIngredient;
        const steps = obj.instructions || obj.recipeInstructions;
        if (list && steps) return {
          title: String(obj.title || obj.name || fallbackTitle || 'Neues Rezept'),
          ingredients: (Array.isArray(list) ? list : cleanLines(list)).map(p => typeof p === 'string' ? p : [p.quantity, p.unit, p.name || p.text].filter(Boolean).join(' ')),
          instructions: Array.isArray(steps) ? steps.map(s => typeof s === 'string' ? s : s.text || '').filter(Boolean).join('\n') : String(steps),
          servings: Number.parseInt(obj.servings || obj.recipeYield, 10) || 0
        };
      } catch (error) { if (error instanceof SyntaxError) throw Error('Die JSON-Datei ist nicht gültig. Bitte das Rezept als Text einfügen.'); throw error; }
    }
    const lines = cleanLines(trimmed);
    const ingredientHeading = /^(?:zutaten(?:liste)?|ingredients|einkaufsliste)(?:\s*(?:für|for)\s+.+)?\s*:?(.*)$/i;
    const instructionHeading = /^(?:zubereitung|anleitung|zubereitungsschritte|so geht(?:'s| es)?|instructions|method|preparation)\s*:?(.*)$/i;
    const servingHeading = /^(?:für\s+)?(\d+)\s*(?:portionen|personen|servings)\b/i;
    let section = '', title = '', servings = 0;
    const ingredients = [], instructions = [], unclassified = [];
    for (const line of lines) {
      const value = line.replace(/^#{1,6}\s*/, '');
      const ih = value.match(ingredientHeading), sh = value.match(instructionHeading), portions = value.match(servingHeading);
      if (ih) { section = 'ingredients'; if (ih[1]?.trim()) ingredients.push(ih[1].trim()); continue; }
      if (sh) { section = 'instructions'; if (sh[1]?.trim()) instructions.push(sh[1].trim()); continue; }
      if (portions) { servings = Number(portions[1]); continue; }
      if (!title && !section) { title = value; continue; }
      const cleaned = value.replace(/^[-•*]\s*/, '');
      if (section === 'ingredients') ingredients.push(cleaned);
      else if (section === 'instructions') instructions.push(cleaned.replace(/^\d+[.)]\s+/, ''));
      else unclassified.push(cleaned);
    }
    if (!ingredients.length) for (const line of unclassified) {
      if (/^(?:\d+[\d\s.,/¼½¾]*|[¼½¾])\s*(?:g|kg|ml|l|el|tl|prise|stück|stk|becher|dose|zehe|bund|packung|tasse|paprika|kartoffel|zwiebel|eier?)\b/i.test(line)) ingredients.push(line);
      else instructions.push(line);
    }
    if (!instructions.length && !ingredients.length) instructions.push(...unclassified);
    return { title: title || fallbackTitle || 'Neues Rezept', ingredients, instructions: instructions.join('\n'), servings };
  }
  async function extractFile(file, progress = () => {}, alive = () => true) {
    if (file.size > 25 * 1024 * 1024) throw Error('Bitte eine Rezeptdatei mit höchstens 25 MB auswählen.');
    const extension = file.name.split('.').pop().toLowerCase();
    let worker = null;
    async function recognize(source) {
      if (!alive()) throw Error('Import abgebrochen.');
      await loadScript('vendor/ocr/tesseract.min.js');
      if (!worker) {
        progress('Texterkennung wird vorbereitet …');
        worker = await Tesseract.createWorker('deu+eng', 1, {
          workerPath: assetURL('vendor/ocr/worker.min.js'),
          corePath: assetURL('vendor/ocr/tesseract-core-lstm.wasm.js'),
          langPath: assetURL('vendor/ocr/lang/'),
          workerBlobURL: false,
          logger: info => { if (alive() && info.status === 'recognizing text') progress(`Text wird erkannt … ${Math.round(info.progress * 100)} %`); }
        });
        activeWorker = worker;
      }
      if (!alive()) throw Error('Import abgebrochen.');
      const result = await worker.recognize(source);
      return result.data.text;
    }
    try {
      if (['txt', 'md', 'json'].includes(extension)) return await file.text();
      if (extension === 'docx') {
        progress('Word-Rezept wird gelesen …');
        await loadScript('vendor/mammoth/mammoth.browser.min.js');
        return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
      }
      if (extension === 'pdf') {
        progress('PDF-Rezept wird gelesen …');
        const pdfjs = await import('./vendor/pdfjs/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = assetURL('vendor/pdfjs/pdf.worker.mjs');
        const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, wasmUrl: assetURL('vendor/pdfjs/wasm/'), standardFontDataUrl: assetURL('vendor/pdfjs/standard_fonts/') });
        const pdf = await loading.promise;
        try {
          if (pdf.numPages > 20) throw Error('Bitte ein Rezept mit höchstens 20 PDF-Seiten auswählen.');
          const pages = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            if (!alive()) throw Error('Import abgebrochen.');
            progress(`PDF-Seite ${i} von ${pdf.numPages} wird gelesen …`);
            const page = await pdf.getPage(i), content = await page.getTextContent();
            let text = '', previousY = null;
            for (const item of content.items) if ('str' in item) {
              const y = item.transform[5];
              if (previousY !== null && Math.abs(y - previousY) > 3) text += '\n';
              text += item.str + (item.hasEOL ? '\n' : ' '); previousY = item.hasEOL ? null : y;
            }
            if (text.replace(/\s/g, '').length < 30) {
              const base = page.getViewport({ scale: 1 }), viewport = page.getViewport({ scale: Math.min(2.2, 2000 / base.width) });
              const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
              await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              text = await recognize(canvas); canvas.width = canvas.height = 0;
            }
            pages.push(text);
          }
          return pages.join('\n');
        } finally { await loading.destroy(); }
      }
      if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return await recognize(file);
      throw Error('Unterstützt werden PDF, DOCX, TXT, Markdown, JSON sowie JPG-, PNG- und WebP-Fotos.');
    } finally {
      if (worker) { await worker.terminate(); if (activeWorker === worker) activeWorker = null; }
    }
  }
  RH.cancelRecipeImport = () => { importGeneration++; if (activeWorker) { activeWorker.terminate(); activeWorker = null; } };
  RH.renderRecipes = () => {
    RH.content().innerHTML = `<div class="top page-heading"><div><h1>Rezepte</h1><p class="muted">Für den gemeinsamen Topf und die nächste Runde am Feuer.</p></div>${isLeader() ? '<button class="btn" onclick="RangerHub.openRecipeForm()">+ Rezept hinzufügen</button>' : ''}</div><div class="recipe-grid">${db.recipes.map(r => `<article class="recipe-entry"><h2>${esc(r.title)}</h2><p>${r.ingredients.length} Zutaten${r.servings ? ` · für ${r.servings} Personen` : ''}</p><button class="btn text" onclick="RangerHub.openRecipe('${esc(r.id)}')">Rezept ansehen ↗</button></article>`).join('') || `<section style="padding:35px 0"><h2 style="font:32px Georgia,serif">Was kochen wir zusammen?</h2><p class="muted">Hier ist Platz für eure Lieblingsrezepte.${isLeader() ? ' Einfügen, hochladen oder einfach selbst aufschreiben.' : ''}</p>${isLeader() ? '<button class="btn" onclick="RangerHub.openRecipeForm()">Erstes Rezept anlegen</button>' : ''}</section>`}</div>`;
  };
  RH.openRecipe = id => {
    const recipe = db.recipes.find(r => String(r.id) === String(id)); if (!recipe) return;
    box.innerHTML = `<div class="top"><div><span class="section-kicker">Gemeinsam essen</span><h2>${esc(recipe.title)}</h2>${recipe.servings ? `<p class="muted">Für ${recipe.servings} Personen</p>` : ''}</div><button class="btn alt" onclick="closeM()">Schließen</button></div><div class="recipe-detail-grid"><section><h3>Zutaten</h3><ul class="checklist">${recipe.ingredients.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section><section><h3>Zubereitung</h3><div class="recipe-instructions">${esc(recipe.instructions)}</div></section></div>${isLeader() ? `<div class="row"><button class="btn" onclick="RangerHub.openRecipeForm('${esc(recipe.id)}')">Rezept bearbeiten</button><button class="btn red" onclick="RangerHub.deleteRecipe('${esc(recipe.id)}')">Rezept löschen</button></div>` : ''}`;
    openM();
  };
  RH.newRecipeForMeeting = () => {
    if (!isLeader()) return;
    const form = document.getElementById('meeting-planning-form'); if (!form) return;
    meetingDraft = RH.draftFromForm(form);
    RH.openRecipeForm('', true);
  };
  RH.cancelRecipeEditor = () => {
    RH.cancelRecipeImport();
    const draft = meetingDraft; meetingDraft = null;
    if (draft) meetingFormV15(draft.id, draft.date, draft); else closeM();
  };
  RH.openRecipeForm = (id = '', fromMeeting = false) => {
    if (!isLeader()) return;
    RH.cancelRecipeImport(); if (!fromMeeting) meetingDraft = null;
    const recipe = db.recipes.find(r => String(r.id) === String(id));
    box.innerHTML = `<div class="top"><h2>${recipe ? 'Rezept bearbeiten' : 'Ein Rezept für alle'}</h2><button class="btn alt" onclick="RangerHub.cancelRecipeEditor()">${meetingDraft ? 'Zurück zur Planung' : 'Schließen'}</button></div><form id="recipe-form" class="recipe-form"><details class="recipe-import" ${recipe ? '' : 'open'}><summary>Rezept einfügen oder Datei hochladen</summary><p class="form-note">Text, PDF, Word oder Foto werden auf deinem Gerät gelesen. Prüfe anschließend die erkannten Zutaten und Schritte.</p><label>Rezepttext einfügen<textarea name="sourceText" rows="5" placeholder="Rezeptname&#10;Zutaten&#10;500 g Mehl&#10;Zubereitung&#10;Alles zu einem Teig vermengen …"></textarea></label><button type="button" class="btn alt sm" onclick="RangerHub.parsePastedRecipe()">Text übernehmen</button><label>Oder eine Rezeptdatei auswählen<input type="file" name="recipeFile" accept=".txt,.md,.json,.pdf,.docx,.png,.jpg,.jpeg,.webp" onchange="RangerHub.importRecipeFile(this.files[0])"></label><div id="recipe-import-progress" class="import-progress" role="status" aria-live="polite"></div></details><label>Rezeptname<input name="title" required value="${esc(recipe?.title || '')}"></label><label>Personen (optional)<input type="number" min="1" max="500" name="servings" value="${recipe?.servings || ''}"></label><label>Zutaten · eine pro Zeile<textarea name="ingredients" required rows="6">${esc(recipe?.ingredients?.join('\n') || '')}</textarea></label><label>Zubereitung · Schritte prüfen und ergänzen<textarea name="instructions" required rows="7">${esc(recipe?.instructions || '')}</textarea></label><p class="form-note">Zutaten werden beim Auswählen in einem Rangertreffen automatisch zur Lebensmittel-Checkliste. Mengen werden unverändert übernommen.</p><button data-save-recipe class="btn" type="submit">Rezept speichern${meetingDraft ? ' und übernehmen' : ''}</button></form>`;
    const form = document.getElementById('recipe-form');
    form.addEventListener('submit', event => { event.preventDefault(); if (!isLeader() || !form.reportValidity()) return;
      const item = recipe || { id: RH.uid() };
      const ingredients = cleanLines(form.elements.ingredients.value).map(s => s.replace(/^[-•*]\s*/, ''));
      if (!ingredients.length) { form.elements.ingredients.setCustomValidity('Bitte mindestens eine Zutat eintragen.'); form.elements.ingredients.reportValidity(); return; }
      Object.assign(item, { title: form.elements.title.value.trim(), servings: Number(form.elements.servings.value) || 0, ingredients, instructions: form.elements.instructions.value.trim() });
      if (!item.title || !item.instructions) return;
      if (!recipe) db.recipes.push(item);
      v24Persist();
      const draft = meetingDraft; meetingDraft = null;
      if (draft) { meetingFormV15(draft.id, draft.date, draft); RH.chooseRecipe(item.id, true); }
      else { closeM(); view = 'recipes'; render(); }
    });
    form.elements.ingredients.addEventListener('input', () => form.elements.ingredients.setCustomValidity(''));
    openM();
  };
  function fillRecipeForm(parsed) {
    const form = document.getElementById('recipe-form'); if (!form) return;
    form.elements.title.value = parsed.title;
    form.elements.ingredients.value = parsed.ingredients.join('\n');
    form.elements.instructions.value = parsed.instructions;
    form.elements.servings.value = parsed.servings || '';
    form.elements.ingredients.setCustomValidity('');
  }
  function importMessage(message, error = false) { const el = document.getElementById('recipe-import-progress'); if (el) { el.textContent = message; el.classList.toggle('is-error', error); } }
  RH.parsePastedRecipe = () => {
    if (!isLeader()) return;
    try { const parsed = parseRecipe(document.getElementById('recipe-form').elements.sourceText.value); fillRecipeForm(parsed); importMessage(parsed.ingredients.length ? 'Rezept übernommen. Bitte Zutaten und Zubereitung prüfen.' : 'Text übernommen. Bitte die Zutaten ergänzen und die Schritte prüfen.'); }
    catch (error) { importMessage(error.message, true); }
  };
  RH.importRecipeFile = async file => {
    if (!file || !isLeader()) return;
    RH.cancelRecipeImport(); const generation = importGeneration;
    const form = document.getElementById('recipe-form'); if (!form) return;
    const alive = () => generation === importGeneration && form.isConnected;
    const save = form.querySelector('[data-save-recipe]'); save.disabled = true;
    importMessage('Rezept wird gelesen …');
    try {
      const text = await extractFile(file, message => { if (alive()) importMessage(message); }, alive);
      if (!alive()) return;
      const parsed = parseRecipe(text, file.name.replace(/\.[^.]+$/, ''));
      fillRecipeForm(parsed);
      importMessage(parsed.ingredients.length ? 'Rezept erkannt. Bitte Mengen, Zutaten und Zubereitung prüfen.' : 'Text erkannt. Bitte Zutaten ergänzen und die Anleitung prüfen.');
    } catch (error) { if (alive()) importMessage(error.message || 'Das Rezept konnte nicht gelesen werden. Bitte den Text einfügen.', true); }
    finally { if (alive()) save.disabled = false; }
  };
  RH.deleteRecipe = id => {
    if (!isLeader() || !confirm('Dieses Rezept aus der Bibliothek löschen? Bereits geplante Treffen behalten Zutaten und Zubereitung.')) return;
    db.recipes = db.recipes.filter(r => String(r.id) !== String(id));
    db.meetings.forEach(m => { if (String(m.food?.recipeId) === String(id)) m.food.recipeId = null; });
    v24Persist(); closeM(); view = 'recipes'; render();
  };
  RH.parseRecipe = parseRecipe; RH.extractRecipeFile = extractFile;
  const originalClose = closeM;
  closeM = function () { RH.cancelRecipeImport(); meetingDraft = null; originalClose(); };
  RH.ready = true;
})();
