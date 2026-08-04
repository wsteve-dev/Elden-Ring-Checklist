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

// Guias de localização para os 4 troféus de coleção lendária (índice = posição
// do item na categoria "trophies", já na ordem 01..42 usada nos JSONs).
const TROPHY_GUIDES = {
  14: { // Legendary Armaments
    pt: [
      { name: 'Ruins Greatsword', hint: 'derrote o Guerreiro Bastardo e o Cavaleiro do Crisol no Castelo Redmane' },
      { name: 'Eclipse Shotel', hint: 'baú no Castelo Sol' },
      { name: 'Grafted Blade Greatsword', hint: 'mate o Bastardo Leonino no Castelo Morne' },
      { name: 'Sword of Night and Flame', hint: 'baú na Mansão Caria' },
      { name: "Marais Executioner's Sword", hint: 'mate Elemer dos Espinhos no Castelo Sombrio' },
      { name: 'Dark Moon Greatsword', hint: 'siga a missão de Ranni até o Altar do Luar' },
      { name: "Devourer's Scepter", hint: 'mate o invasor Bernahl em Farum Azula' },
      { name: 'Golden Order Greatsword', hint: 'mate o Cruzado Bastardo na Caverna dos Desamparados' },
      { name: 'Bolt of Gransax', hint: 'saqueie na lança do Gigante em Leyndell, Capital Real (some após virar Capital de Cinzas)' },
    ],
    en: [
      { name: 'Ruins Greatsword', hint: 'defeat the Misbegotten Warrior and Crucible Knight in Redmane Castle' },
      { name: 'Eclipse Shotel', hint: 'chest in Castle Sol' },
      { name: 'Grafted Blade Greatsword', hint: 'kill Leonine Misbegotten in Castle Morne' },
      { name: 'Sword of Night and Flame', hint: 'chest in the Caria Manor' },
      { name: "Marais Executioner's Sword", hint: 'kill Elemer of the Briar in The Shaded Castle' },
      { name: 'Dark Moon Greatsword', hint: "follow Ranni's quest until the Moonlight Altar" },
      { name: "Devourer's Scepter", hint: 'kill invader Bernahl in Farum Azula' },
      { name: 'Golden Order Greatsword', hint: 'kill Misbegotten Crusader in the Cave of the Forlorn' },
      { name: 'Bolt of Gransax', hint: "loot on the giant's spear in Leyndell, Royal Capital (unavailable after it becomes Ashen Capital)" },
    ],
  },
  15: { // Legendary Ashen Remains
    pt: [
      { name: 'Lhutel the Headless', hint: 'derrote a Sombra do Cemitério nas Catacumbas de Tombsward, Península Chorosa' },
      { name: 'Redmane Knight Ogha', hint: 'derrote o Espírito Arbóreo Pútrido nas Catacumbas dos Mortos-em-Guerra, após derrotar Radahn' },
      { name: 'Ancient Dragon Knight Kristoff', hint: 'derrote o Herói Ancião de Zamor na Tumba do Herói Sagrado' },
      { name: 'Black Knife Tiche', hint: 'derrote Tiche no Evergaol do Planalto do Luar, missão de Ranni' },
      { name: 'Mimic Tear', hint: 'Terreno Sagrado da Noite, em Nokron (precisa de Chave de Espada de Pedra)' },
      { name: 'Cleanrot Knight Finlay', hint: 'baú em Elphael, Cinto da Árvore Sacra' },
    ],
    en: [
      { name: 'Lhutel the Headless', hint: 'defeat the Cemetery Shade in Tombsward Catacombs, Weeping Peninsula' },
      { name: 'Redmane Knight Ogha', hint: 'defeat the Putrid Tree Spirit in War-Dead Catacombs, after defeating Radahn' },
      { name: 'Ancient Dragon Knight Kristoff', hint: "defeat the Ancient Hero of Zamor in Sainted Hero's Grave" },
      { name: 'Black Knife Tiche', hint: "defeat Tiche in the Moonlight Plateau Evergaol, Ranni's questline" },
      { name: 'Mimic Tear', hint: "Night's Sacred Ground, in Nokron (requires a Stonesword Key)" },
      { name: 'Cleanrot Knight Finlay', hint: 'chest in Elphael, Brace of the Haligtree' },
    ],
  },
  16: { // Legendary Sorceries and Incantations
    pt: [
      { name: 'Comet Azur', hint: 'recompensa de Azur, o Feiticeiro Primordial, em Cliffbottom' },
      { name: "Ranni's Dark Moon", hint: 'mate as 3 tartarugas ao redor de Chelona\'s Rise, missão de Ranni' },
      { name: 'Founding Rain of Stars', hint: 'recompensa por completar a missão de Ranni' },
      { name: 'Stars of Ruin', hint: 'recompensa de Lusat, o Feiticeiro Primordial, no Esconderijo de Sellia' },
      { name: 'Elden Stars', hint: 'corpo em Deeproot Depths, após derrotar a Gárgula Valente em Nokron' },
      { name: 'Flame of the Fell God', hint: 'derrote Adan, Ladrão do Fogo, no Evergaol do Malfeitor' },
      { name: "Greyoll's Roar", hint: 'derrote o dragão Greyoll em Caelid, ou compre na Catedral da Comunhão dos Dragões' },
    ],
    en: [
      { name: 'Comet Azur', hint: 'reward from Primeval Sorcerer Azur at Cliffbottom' },
      { name: "Ranni's Dark Moon", hint: "kill the 3 turtles around Chelona's Rise, Ranni's questline" },
      { name: 'Founding Rain of Stars', hint: "reward for completing Ranni's questline" },
      { name: 'Stars of Ruin', hint: 'reward from Primeval Sorcerer Lusat at Sellia Hideaway' },
      { name: 'Elden Stars', hint: 'corpse in Deeproot Depths, after defeating the Valiant Gargoyle in Nokron' },
      { name: 'Flame of the Fell God', hint: "defeat Adan, Thief of Fire, at Malefactor's Evergaol" },
      { name: "Greyoll's Roar", hint: 'defeat the dragon Greyoll in Caelid, or buy at the Cathedral of Dragon Communion' },
    ],
  },
  17: { // Legendary Talismans
    pt: [
      { name: 'Radagon Icon', hint: 'baú na Academia de Raya Lucaria, perto do Debate Parlor' },
      { name: 'Godfrey Icon', hint: 'recompensa por derrotar Godefroy, o Enxertado, no Evergaol da Linhagem Dourada' },
      { name: "Radagon's Soreseal", hint: 'Forte Faroth, em Caelid' },
      { name: 'Dragoncrest Greatshield Talisman', hint: 'próximo ao Canal de Drenagem, na Árvore Sacra de Miquella' },
      { name: "Old Lord's Talisman", hint: 'baú em Farum Azula em Ruínas' },
      { name: "Erdtree's Favor +2", hint: 'em Leyndell, Capital de Cinzas (pós-jogo)' },
      { name: "Marika's Soreseal", hint: 'altar em Elphael, precisa de Chave de Espada de Pedra' },
      { name: 'Moon of Nokstella', hint: 'baú em Nokstella, Cidade Eterna, missão de Ranni' },
    ],
    en: [
      { name: 'Radagon Icon', hint: 'chest in the Academy of Raya Lucaria, near the Debate Parlor' },
      { name: 'Godfrey Icon', hint: "reward for defeating Godefroy the Grafted in the Golden Lineage Evergaol" },
      { name: "Radagon's Soreseal", hint: 'Fort Faroth, in Caelid' },
      { name: 'Dragoncrest Greatshield Talisman', hint: "near the Drainage Channel, in Miquella's Haligtree" },
      { name: "Old Lord's Talisman", hint: 'chest in Crumbling Farum Azula' },
      { name: "Erdtree's Favor +2", hint: 'in Leyndell, Ashen Capital (post-game)' },
      { name: "Marika's Soreseal", hint: 'altar in Elphael, requires a Stonesword Key' },
      { name: 'Moon of Nokstella', hint: "chest in Nokstella, Eternal City, Ranni's questline" },
    ],
  },
};

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

// Itens de outras categorias que, juntos, formam cada troféu de coleção
// lendária. Quando todos os itens vinculados a um troféu estiverem marcados,
// o troféu correspondente é marcado automaticamente (e desmarcado se algum
// deles for desmarcado depois).
const TROPHY_LINKS = {
  14: [ // Legendary Armaments
    'weapons::colossal_swords-7', 'weapons::curved_swords-14', 'weapons::colossal_swords-6',
    'weapons::straight_swords-18', 'weapons::greatswords-12', 'weapons::greatswords-19',
    'weapons::great_hammers-15', 'weapons::greatswords-18', 'weapons::spears-18',
  ],
  15: [ // Legendary Ashen Remains
    'spirit_ashes::base-54', 'spirit_ashes::base-53', 'spirit_ashes::base-52',
    'spirit_ashes::base-56', 'spirit_ashes::base-57', 'spirit_ashes::base-55',
  ],
  16: [ // Legendary Sorceries and Incantations
    'spells::sorceries-15', 'spells::sorceries-60', 'spells::sorceries-24', 'spells::sorceries-75',
    'spells::incantations-43', 'spells::incantations-50', 'spells::incantations-68',
  ],
  17: [ // Legendary Talismans
    'talismans::base-74', 'talismans::base-81', 'talismans::base-20', 'talismans::base-30',
    'talismans::base-73', 'talismans::base-18', 'talismans::base-22', 'talismans::base-72',
  ],
};
// Mapa reverso: id do item -> índice(s) de troféu que ele afeta.
const ITEM_TO_TROPHY = {};
Object.entries(TROPHY_LINKS).forEach(([trophyIdx, itemIds]) => {
  itemIds.forEach(itemId => {
    if (!ITEM_TO_TROPHY[itemId]) ITEM_TO_TROPHY[itemId] = [];
    ITEM_TO_TROPHY[itemId].push(trophyIdx);
  });
});

function syncLegendaryTrophies() {
  Object.entries(TROPHY_LINKS).forEach(([trophyIdx, itemIds]) => {
    checked['trophies-' + trophyIdx] = itemIds.every(id => !!checked[id]);
  });
}

function loadLocalState() {
  try {
    const s = localStorage.getItem(STATE_KEY);
    checked = s ? JSON.parse(s) : {};
  } catch (e) { checked = {}; }
  // Limpeza: remove qualquer item personalizado salvo em versões antigas do site
  // (a funcionalidade de adicionar itens foi removida).
  try { localStorage.removeItem('er-checklist-custom'); } catch (e) {}

  syncLegendaryTrophies();

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
    let othersDone = 0;
    for (let i = 1; i <= 41; i++) { if (checked['trophies-' + i]) othersDone++; }
    const langCode = (LangModule.getCurrentCode() || 'pt-BR').startsWith('pt') ? 'pt' : 'en';
    const rows = items.map((it, i) => {
      const isChecked = !!checked[it.id];
      const parts = it.name.split(' — ');
      const title = parts[0];
      const desc = parts.slice(1).join(' — ');
      let checkHtml;
      if (it.id === 'trophies-0') {
        checkHtml = progressDot(othersDone, 41);
      } else if (TROPHY_LINKS[i]) {
        const linkedDone = TROPHY_LINKS[i].filter(lid => checked[lid]).length;
        checkHtml = progressDot(linkedDone, TROPHY_LINKS[i].length);
      } else {
        checkHtml = '<div class="seal small"></div>';
      }
      const guide = TROPHY_GUIDES[i];
      const expKey = 'trophies-guide-' + i;
      const isOpen = !!expanded[expKey];
      const guideToggle = guide
        ? '<button class="guide-toggle" data-guide="' + expKey + '">'
          + (isOpen ? (langCode === 'pt' ? 'Ocultar guia ▴' : 'Hide guide ▴') : (langCode === 'pt' ? 'Ver guia ▾' : 'Show guide ▾'))
          + '</button>'
        : '';
      const linkedIds = TROPHY_LINKS[i];
      const guideBody = (guide && isOpen)
        ? '<ul class="guide-list">' + guide[langCode].map((g, gi) => {
            const isDone = linkedIds && checked[linkedIds[gi]];
            return '<li class="' + (isDone ? 'done' : '') + '">'
              + (isDone ? '✓ ' : '')
              + '<strong>' + escapeHtml(g.name) + ':</strong> ' + escapeHtml(g.hint)
              + '</li>';
          }).join('') + '</ul>'
        : '';
      return '<div class="trow ' + (isChecked ? 'checked' : '') + '" data-id="' + it.id + '">'
        + '<div class="trow-check">' + checkHtml + '</div>'
        + '<div class="trow-icon">' + (it.img ? '<img src="' + it.img + '" alt="" />' : '<div class="seal"></div>') + '</div>'
        + '<div class="trow-text">'
          + '<span class="trow-title">' + escapeHtml(title) + '</span>'
          + (desc ? '<span class="trow-desc">' + escapeHtml(desc) + '</span>' : '')
          + guideToggle
          + guideBody
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
    el.addEventListener('click', (e) => {
      if (e.target.closest('.guide-toggle')) return;
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
  content.querySelectorAll('.guide-toggle').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = el.getAttribute('data-guide');
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
  // "Elden Ring" (Platina) e os 4 troféus de coleção lendária são automáticos:
  // marcam sozinhos conforme o progresso em outras abas. Não podem ser clicados direto.
  if (id === 'trophies-0' || id === 'trophies-14' || id === 'trophies-15'
    || id === 'trophies-16' || id === 'trophies-17') return;

  checked[id] = !checked[id];

  if (id.startsWith('trophies-')) {
    let allOthersDone = true;
    for (let i = 1; i <= 41; i++) {
      if (!checked['trophies-' + i]) { allOthersDone = false; break; }
    }
    checked['trophies-0'] = allOthersDone;
  }

  if (ITEM_TO_TROPHY[id]) {
    syncLegendaryTrophies();
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
