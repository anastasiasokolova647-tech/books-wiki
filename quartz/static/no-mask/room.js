/* No draft persistence, text transport, telemetry, AI, or third-party dependencies. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const INSIGHTS = 'chai-no-mask-insights-v1';
  const pictures = [
    ['chai-opivnochi-bg-2.png', 'Оригінальний нічний'],
    ['chai-opivnochi-light.png', 'Оригінальний денний'],
    ...Array.from({ length: 15 }, (_, i) => [`chai-gallery/chai-${String(i + 1).padStart(2, '0')}.png`, `Краєвид ${String(i + 1).padStart(2, '0')}`]),
  ];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let busy = false;
  let finishTimer;
  let manualReduce = false;
  function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function readInsights() {
    try {
      const value = JSON.parse(read(INSIGHTS) || '[]');
      return Array.isArray(value) ? value.filter(x => typeof x === 'string') : [];
    } catch { return []; }
  }
  function writeInsights(items) {
    // The only persistent write in the room. Never pass the letter here.
    if (items.length) localStorage.setItem(INSIGHTS, JSON.stringify(items));
    else localStorage.removeItem(INSIGHTS);
  }
  function dirty() { return Boolean($('letter').value || $('insight').value); }
  function refresh() {
    $('release').disabled = busy || !$('letter').value;
    $('save-insight').disabled = busy || !$('insight').value.trim();
  }
  function eraseField(id) {
    // Replace the control too, dropping its native undo history.
    const old = $(id);
    old.value = '';
    old.defaultValue = '';
    const fresh = old.cloneNode(false);
    fresh.value = '';
    fresh.defaultValue = '';
    old.replaceWith(fresh);
  }
  function eraseDrafts() { eraseField('letter'); eraseField('insight'); refresh(); }
  function renderInsights() {
    const items = readInsights();
    $('saved-list').replaceChildren();
    $('saved-panel').classList.toggle('has-saved', items.length > 0);
    items.forEach((value, index) => {
      const article = document.createElement('div');
      article.className = 'saved-item';
      const p = document.createElement('p');
      p.textContent = value;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Видалити';
      remove.setAttribute('aria-label', `Видалити інсайт ${index + 1}`);
      remove.addEventListener('click', () => {
        try { const current = readInsights(); current.splice(index, 1); writeInsights(current); renderInsights(); }
        catch { $('save-status').textContent = 'Браузер не дозволив видалення. Спробуй ще раз.'; }
      });
      article.append(p, remove);
      $('saved-list').append(article);
    });
  }
  function chooseScene(file) {
    if (!pictures.some(p => p[0] === file)) file = 'chai-gallery/chai-03.png';
    $('landscape').style.backgroundImage = `linear-gradient(90deg,#071421e8 0%,#071421b0 55%,#07142145),url("../${file}")`;
    document.querySelectorAll('.scene-choice').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.file === file)));
  }
  pictures.forEach(([file, name]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'scene-choice'; button.dataset.file = file;
    const img = document.createElement('img'); img.src = `../${file}`; img.alt = ''; img.loading = 'lazy';
    const span = document.createElement('span'); span.textContent = name;
    button.append(img, span);
    button.addEventListener('click', () => { chooseScene(file); $('scenes').close(); });
    $('scene-list').append(button);
  });
  let initialScene = read('chai-gallery-choice-v1') || 'chai-gallery/chai-03.png';
  if (read('chai-gallery-auto-v1') === 'on') {
    const day = new Date().getHours() >= 7 && new Date().getHours() < 19;
    const dayIndices = new Set([1, 2, 3, 8, 11, 12]);
    const candidates = pictures.filter((_, i) => dayIndices.has(i) === day);
    initialScene = candidates[Math.floor(Date.now() / 86400000) % candidates.length][0];
  }
  chooseScene(initialScene);
  function updateMotion() {
    $('reduce-motion').checked = manualReduce || media.matches;
    $('reduce-motion').disabled = media.matches;
    document.body.classList.toggle('reduced', manualReduce || media.matches);
    if (busy && (manualReduce || media.matches)) { clearTimeout(finishTimer); finishTimer = setTimeout(finish, 600); }
  }
  $('reduce-motion').addEventListener('change', e => { manualReduce = e.target.checked; updateMotion(); });
  media.addEventListener('change', updateMotion); updateMotion();
  [['scenes-open', 'scenes'], ['privacy-open', 'privacy'], ['help-open', 'help']].forEach(([button, dialog]) => {
    $(button).addEventListener('click', () => $(dialog).showModal());
  });
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  document.addEventListener('input', e => {
    if (e.target.id === 'letter' || e.target.id === 'insight') { $('save-status').textContent = ''; refresh(); }
  });
  $('save-insight').addEventListener('click', () => {
    if (!$('insight').value.trim() || busy) return;
    try {
      const items = readInsights();
      items.push($('insight').value); // Exact user-authored insight, no summarization.
      writeInsights(items);
      eraseField('insight');
      $('save-status').textContent = 'Збережено в цьому браузері.';
      renderInsights(); refresh();
    } catch { $('save-status').textContent = 'Не вдалося зберегти. Текст залишився в полі.'; }
  });
  $('release').addEventListener('click', () => {
    if (busy || !$('letter').value) return;
    $('release-description').textContent = $('insight').value
      ? 'Лист і незбережений інсайт зникнуть без можливості відновлення. Щоб залишити інсайт, повернись і натисни «Зберегти собі».'
      : 'Текст зникне без можливості відновлення. Збережені інсайти залишаться.';
    $('confirm-release').showModal();
  });
  function finish() {
    $('river-scene').hidden = true;
    busy = false; $('writing').inert = false;
    $('insight-panel').inert = false;
    refresh(); $('letter').focus({ preventScroll: true });
  }
  $('confirm-send').addEventListener('click', () => {
    if (busy) return;
    $('confirm-release').close();
    busy = true;
    eraseDrafts(); // Clear before animation; never copy text into animation DOM.
    $('save-status').textContent = '';
    $('writing').inert = true; $('insight-panel').inert = true;
    $('river-scene').hidden = false;
    finishTimer = setTimeout(finish, manualReduce || media.matches ? 650 : 8200);
  });
  $('home').addEventListener('click', e => {
    if (dirty()) { e.preventDefault(); $('confirm-leave').showModal(); }
  });
  $('leave').addEventListener('click', () => { eraseDrafts(); location.assign($('home').href); });
  window.addEventListener('beforeunload', e => {
    if (dirty()) { e.preventDefault(); e.returnValue = ''; }
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(finishTimer); eraseDrafts();
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    $('river-scene').hidden = true; busy = false;
    $('writing').inert = false; $('insight-panel').inert = false;
  });
  window.addEventListener('pageshow', e => { if (e.persisted) eraseDrafts(); refresh(); });
  window.addEventListener('storage', e => { if (e.key === INSIGHTS || e.key === null) renderInsights(); });
  eraseDrafts(); renderInsights();
})();
