// js/app.js
// Lógica principal do checklist. Depende de js/lang.js já carregado antes.
// Suporta categorias simples (ex: Conquistas) e categorias com subcategorias
// (ex: Armas -> Punhais, Katanas...; Feitiços -> Feitiçarias, Encantamentos).

// Base do repositório externo de imagens (GitHub)
const ASSETS_BASE = 'https://raw.githubusercontent.com/wsteve-dev/GameAssets/main/images/elden-ring';

// Números dos arquivos de troféu (01.png..42.png) no repo. Como os itens da
// categoria "trophies" nos JSONs agora seguem a mesma ordem 1..42 do repo,
// isso é simplesmente a sequência direta.
const TROPHY_IMAGE_ORDER = Array.from({ length: 42 }, (_, i) => i + 1);
const TROPHY_IMAGE_FILES = TROPHY_IMAGE_ORDER.map(n => String(n).padStart(2, '0') + '.png');

const STATE_KEY = 'er-checklist-checked';
const EXPANDED_KEY = 'er-checklist-expanded';

let LANG_DATA = null;
let checked = {};
let expanded = {};
let activeCat = null;
let activeSubcat = null;

const PIECE_SLOTS = [
  { id: 'helm', pt: 'Elmo', en: 'Helm' },
  { id: 'chest', pt: 'Peitoral', en: 'Chest Armor' },
  { id: 'gauntlets', pt: 'Braçadeiras', en: 'Gauntlets' },
  { id: 'legs', pt: 'Grevas', en: 'Leg Armor' },
];

function loadLocalState() {
  try {
    const s = localStorage.getItem(STATE_KEY);
    checked = s ? JSON.parse(s) : {};
  } catch (e) { checked = {}; }
  // Limpeza: remove qualquer item personalizado salvo em versões antigas do site
  // (a funcionalidade de adicionar itens foi removida).
  try { localStorage.removeItem('er-checklist-custom'); } catch (e) {}

  // Garante que "Elden Ring" (troféu de Platina) reflita corretamente as outras 41.
  let allOthersDone = true;
  for (let i = 1; i <= 41; i++) {
    if (!checked['trophies-' + i]) { allOthersDone = false; break; }
  }
  checked['trophies-0'] = allOthersDone;
}

function saveChecked() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(checked)); }
  catch (e) { console.error('Erro ao salvar progresso', e); }
}

// Retorna a lista de "folhas" de uma categoria: se ela tem subcategorias,
// uma folha por subcategoria; senão, a própria categoria é a única folha.
function leavesOf(cat) {
  if (cat.subcategories && cat.subcategories.length) {
    return cat.subcategories.map(sub => ({ leafKey: cat.id + '::' + sub.id, leaf: sub }));
  }
  return [{ leafKey: cat.id, leaf: cat }];
}

function allItemsForLeaf(leafKey, leaf, catId) {
  let built;
  if (catId === 'armor') {
    built = [];
    (leaf.items || []).forEach((setObj, i) => {
      PIECE_SLOTS.forEach(slot => {
        const pieceName = (slot.id === 'helm' && setObj.helm) ? setObj.helm
          : (slot.id === 'chest' && setObj.chest) ? setObj.chest
          : (slot.id === 'gauntlets' && setObj.gauntlets) ? setObj.gauntlets
          : (slot.id === 'legs' && setObj.legs) ? setObj.legs
          : null;
        built.push({
          id: leafKey + '-' + i + '-' + slot.id,
          setIndex: i,
          setName: setObj.name,
          slot: slot.id,
          pieceName,
          img: null,
        });
      });
    });
  } else {
    built = (leaf.items || []).map((name, i) => ({
      id: leafKey + '-' + i,
      name,
      img: (catId === 'trophies' && TROPHY_IMAGE_FILES[i])
        ? ASSETS_BASE + '/achievements/' + TROPHY_IMAGE_FILES[i]
        : null,
    }));
  }
  return built;
}

function totalCounts() {
  let total = 0, done = 0;
  LANG_DATA.categories.forEach(cat => {
    leavesOf(cat).forEach(({ leafKey, leaf }) => {
      allItemsForLeaf(leafKey, leaf, cat.id).forEach(it => {
        total++;
        if (checked[it.id]) done++;
      });
    });
  });
  return { total, done };
}

function progressDot(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isFull = total > 0 && done === total;
  return '<span class="pdot' + (isFull ? ' full' : '') + '" style="--pct:' + pct + '%" title="' + done + '/' + total + '"></span>';
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  LANG_DATA.categories.forEach(cat => {
    let total = 0, done = 0;
    leavesOf(cat).forEach(({ leafKey, leaf }) => {
      allItemsForLeaf(leafKey, leaf, cat.id).forEach(it => {
        total++;
        if (checked[it.id]) done++;
      });
    });
    const btn = document.createElement('button');
    btn.className = cat.id === activeCat ? 'active' : '';
    btn.innerHTML = progressDot(done, total) + '<span class="btn-label">' + escapeHtml(cat.name) + '</span> <span class="count">' + done + '/' + total + '</span>';
    btn.onclick = () => { activeCat = cat.id; activeSubcat = null; render(); };
    nav.appendChild(btn);
  });
}

function renderSubNav(cat) {
  const subnav = document.getElementById('subnav');
  if (!cat.subcategories || !cat.subcategories.length) {
    subnav.innerHTML = '';
    subnav.style.display = 'none';
    return;
  }
  subnav.style.display = 'flex';
  if (!activeSubcat || !cat.subcategories.some(s => s.id === activeSubcat)) {
    activeSubcat = cat.subcategories[0].id;
  }
  subnav.innerHTML = '';
  cat.subcategories.forEach(sub => {
    const leafKey = cat.id + '::' + sub.id;
    const items = allItemsForLeaf(leafKey, sub, cat.id);
    const done = items.filter(it => checked[it.id]).length;
    const btn = document.createElement('button');
    btn.className = sub.id === activeSubcat ? 'active' : '';
    btn.innerHTML = progressDot(done, items.length) + '<span class="btn-label">' + escapeHtml(sub.name) + '</span> <span class="count">' + done + '/' + items.length + '</span>';
    btn.onclick = () => { activeSubcat = sub.id; renderSubNav(cat); renderContent(); renderRing(); };
    subnav.appendChild(btn);
  });
}

function renderRing() {
  const { total, done } = totalCounts();
  const pct = total ? Math.round((done / total) * 100) : 0;
  const circumference = 314;
  const offset = circumference - (pct / 100) * circumference;
  document.getElementById('ringFg').style.strokeDashoffset = offset;
  document.getElementById('pctLabel').textContent = pct + '%';
  document.getElementById('countLabel').textContent = done + '/' + total;
}

function getActiveLeaf() {
  const cat = LANG_DATA.categories.find(c => c.id === activeCat);
  if (cat.subcategories && cat.subcategories.length) {
    let sub = cat.subcategories.find(s => s.id === activeSubcat);
    if (!sub) { sub = cat.subcategories[0]; activeSubcat = sub.id; }
    return { cat, leaf: sub, leafKey: cat.id + '::' + sub.id, leafDesc: sub.desc || cat.desc, leafName: sub.name };
  }
  return { cat, leaf: cat, leafKey: cat.id, leafDesc: cat.desc, leafName: cat.name };
}

function renderContent() {
  const ui = LANG_DATA.ui;
  const { cat, leaf, leafKey, leafDesc } = getActiveLeaf();
  const items = allItemsForLeaf(leafKey, leaf, cat.id);
  const done = items.filter(it => checked[it.id]).length;
  const content = document.getElementById('content');
  const isTable = cat.id === 'trophies';
  const isArmor = cat.id === 'armor';
  const langCode = (LangModule.getCurrentCode() || 'pt-BR').startsWith('pt') ? 'pt' : 'en';

  let listHtml;

  if (items.length === 0) {
    listHtml = '<p class="empty-note">' + escapeHtml(ui.emptyNote || 'Em construção — em breve.') + '</p>';
  } else if (isArmor) {
    const setsRaw = leaf.items || [];
    const rows = setsRaw.map((setObj, i) => {
      const expKey = leafKey + '-' + i;
      const isOpen = !!expanded[expKey];
      let setDone = 0;
      const pieceRows = PIECE_SLOTS.map(slot => {
        const pieceId = leafKey + '-' + i + '-' + slot.id;
        const isChecked = !!checked[pieceId];
        if (isChecked) setDone++;
        const pieceName = (slot.id === 'helm' && setObj.helm) ? setObj.helm
          : (slot.id === 'chest' && setObj.chest) ? setObj.chest
          : (slot.id === 'gauntlets' && setObj.gauntlets) ? setObj.gauntlets
          : (slot.id === 'legs' && setObj.legs) ? setObj.legs
          : null;
        const slotLabel = slot[langCode];
        return '<div class="apiece ' + (isChecked ? 'checked' : '') + '" data-id="' + pieceId + '">'
          + '<div class="seal small"></div>'
          + '<div class="apiece-text">'
            + '<span class="apiece-slot">' + escapeHtml(slotLabel) + '</span>'
            + (pieceName
                ? '<span class="apiece-name">' + escapeHtml(pieceName) + '</span>'
                : '<span class="apiece-name pending">' + escapeHtml(langCode === 'pt' ? 'nome exato pendente' : 'exact name pending') + '</span>')
          + '</div>'
        + '</div>';
      }).join('');
      return '<div class="aset ' + (isOpen ? 'open' : '') + '">'
        + '<div class="aset-header" data-exp="' + expKey + '">'
          + '<span class="aset-chevron">▸</span>'
          + '<span class="aset-name">' + escapeHtml(setObj.name) + '</span>'
          + progressDot(setDone, 4)
          + '<span class="aset-count">' + setDone + '/4</span>'
        + '</div>'
        + '<div class="aset-body">' + pieceRows + '</div>'
      + '</div>';
    }).join('');
    listHtml = '<div class="aset-list">' + rows + '</div>';
  } else if (isTable) {
    const rows = items.map(it => {
      const isChecked = !!checked[it.id];
      const parts = it.name.split(' — ');
      const title = parts[0];
      const desc = parts.slice(1).join(' — ');
      return '<div class="trow ' + (isChecked ? 'checked' : '') + '" data-id="' + it.id + '">'
        + '<div class="trow-check"><div class="seal small"></div></div>'
        + '<div class="trow-icon">' + (it.img ? '<img src="' + it.img + '" alt="" />' : '<div class="seal"></div>') + '</div>'
        + '<div class="trow-text">'
          + '<span class="trow-title">' + escapeHtml(title) + '</span>'
          + (desc ? '<span class="trow-desc">' + escapeHtml(desc) + '</span>' : '')
        + '</div>'
        + '</div>';
    }).join('');
    listHtml = '<div class="trophy-table">' + rows + '</div>';
  } else {
    listHtml = '<div class="grid">' + items.map(it => {
      const isChecked = !!checked[it.id];
      return '<div class="item ' + (isChecked ? 'checked' : '') + '" data-id="' + it.id + '">'
        + '<div class="seal"></div>'
        + (it.img ? '<img class="item-img" src="' + it.img + '" alt="" />' : '')
        + '<div class="item-text"><span class="name">' + escapeHtml(it.name) + '</span></div>'
        + '</div>';
    }).join('') + '</div>';
  }

  content.innerHTML =
    '<div class="section-head"><h2>' + escapeHtml(cat.subcategories ? cat.name + ' — ' + getActiveLeaf().leafName : cat.name) + '</h2><span class="stat">' + done + ' / ' + items.length + ' ' + escapeHtml(ui.completedLabel) + '</span></div>'
    + '<p class="section-desc">' + escapeHtml(leafDesc || '') + '</p>'
    + listHtml;

  content.querySelectorAll('.item, .trow, .apiece').forEach(el => {
    el.addEventListener('click', () => {
      toggleItem(el.getAttribute('data-id'));
    });
  });
  content.querySelectorAll('.aset-header').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-exp');
      expanded[key] = !expanded[key];
      renderContent();
    });
  });
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function toggleItem(id) {
  // "Elden Ring" (troféu de Platina) é automático: marca sozinho quando
  // as outras 41 conquistas estiverem completas. Não pode ser clicado direto.
  if (id === 'trophies-0') return;

  checked[id] = !checked[id];

  if (id.startsWith('trophies-')) {
    let allOthersDone = true;
    for (let i = 1; i <= 41; i++) {
      if (!checked['trophies-' + i]) { allOthersDone = false; break; }
    }
    checked['trophies-0'] = allOthersDone;
  }

  render();
  saveChecked();
}

function renderStaticText() {
  const ui = LANG_DATA.ui;
  document.getElementById('heroTitle').textContent = 'Elden Ring';
  document.getElementById('footerQuote').textContent = ui.footerQuote;
  document.getElementById('resetBtn').textContent = ui.resetBtn;
}

function render() {
  renderStaticText();
  renderNav();
  const cat = LANG_DATA.categories.find(c => c.id === activeCat);
  renderSubNav(cat);
  renderContent();
  renderRing();
}

async function initApp(langData) {
  LANG_DATA = langData;
  if (!activeCat || !LANG_DATA.categories.some(c => c.id === activeCat)) {
    activeCat = LANG_DATA.categories[0].id;
    activeSubcat = null;
  }
  render();
}

document.getElementById('resetBtn').addEventListener('click', () => {
  const msg = LANG_DATA ? LANG_DATA.ui.resetConfirm : 'Reset progress?';
  if (!confirm(msg)) return;
  checked = {};
  render();
  saveChecked();
});

(async function start() {
  loadLocalState();
  LangModule.onChange((data) => { initApp(data); });
  const defaultLang = LangModule.detectDefaultLang();
  const data = await LangModule.loadLang(defaultLang);
  LangModule.renderSwitcher(document.getElementById('langSwitch'));
  await initApp(data);
})();
