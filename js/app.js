// ================================================================
//  WEB EXPLORER — app.js
// ================================================================

// ===== FOOTER TAG COUNT (solo para el footer, el header ya no tiene contador) =====
(function countTags() {
  const footerEl = document.getElementById('footer-count');
  if (footerEl) footerEl.textContent = document.querySelectorAll('.tag-card').length;
})();

// ================================================================
//  SCROLL PROGRESS BAR
// ================================================================
const progressBar = document.getElementById('nav-progress-bar');
if (progressBar) {
  function updateScrollProgress() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0).toFixed(1) + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
}

// ================================================================
//  SIDEBAR TOC — toggle (desktop button + mobile drawer)
// ================================================================
const tocSidebar = document.getElementById('toc-sidebar');
const tocOverlay = document.getElementById('toc-overlay');
const tocToggle  = document.getElementById('toc-toggle');
const tocClose   = document.getElementById('toc-close');

function openTOC() {
  if (!tocSidebar) return;
  tocSidebar.classList.add('open');
  if (tocOverlay) tocOverlay.classList.add('visible');
  if (tocToggle) tocToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = window.innerWidth <= 1024 ? 'hidden' : '';
}

function closeTOC() {
  if (!tocSidebar) return;
  tocSidebar.classList.remove('open');
  if (tocOverlay) tocOverlay.classList.remove('visible');
  if (tocToggle) tocToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

if (tocToggle) {
  tocToggle.addEventListener('click', () => {
    if (window.innerWidth > 1024) {
      const layout = document.querySelector('.page-layout');
      if (!layout) return;
      const collapsed = layout.classList.toggle('sidebar-collapsed');
      tocToggle.setAttribute('aria-expanded', String(!collapsed));
    } else {
      tocSidebar && tocSidebar.classList.contains('open') ? closeTOC() : openTOC();
    }
  });
}

if (tocClose) tocClose.addEventListener('click', closeTOC);
if (tocOverlay) tocOverlay.addEventListener('click', closeTOC);

window.addEventListener('resize', () => {
  if (window.innerWidth > 1024) closeTOC();
}, { passive: true });

// ================================================================
//  SCROLL SPY — nav bar + sidebar TOC
// ================================================================
const allSections = Array.from(document.querySelectorAll('.category[id]'));
const navLinks    = Array.from(document.querySelectorAll('#nav-list a[data-section]'));
const tocItems    = Array.from(document.querySelectorAll('.toc-item[data-section]'));

if (allSections.length) {
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(a => {
        const active = a.dataset.section === id;
        a.classList.toggle('active', active);
        if (active) a.scrollIntoView({ block: 'nearest', inline: 'center' });
      });
      tocItems.forEach(item => {
        item.classList.toggle('toc-active', item.dataset.section === id);
      });
    });
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });

  allSections.forEach(s => spyObserver.observe(s));
}

// ================================================================
//  SMOOTH SCROLL — nav links + TOC links
// ================================================================
function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.hidden = false;

  const navList = document.getElementById('nav-list');
  if (navList && navList.classList.contains('nav-open')) {
    navList.classList.remove('nav-open');
    const nt = document.getElementById('nav-toggle');
    if (nt) nt.setAttribute('aria-expanded', 'false');
  }

  if (window.innerWidth <= 1024) closeTOC();

  const headerEl     = document.getElementById('top');
  const headerH      = headerEl ? headerEl.offsetHeight : 0;
  const breadcrumbEl = document.querySelector('.breadcrumb');
  const breadcrumbH  = breadcrumbEl ? breadcrumbEl.offsetHeight : 0;
  const y = target.getBoundingClientRect().top + window.scrollY - headerH - breadcrumbH - 12;
  window.scrollTo({ top: y, behavior: 'smooth' });

  // Marca inmediatamente el ítem activo en el TOC sin esperar al IntersectionObserver
  tocItems.forEach(item => {
    item.classList.toggle('toc-active', item.dataset.section === sectionId);
  });
  const activeTocEl = document.querySelector(`.toc-item[data-section="${sectionId}"]`);
  if (activeTocEl) activeTocEl.scrollIntoView({ block: 'nearest' });

  target.style.outline = '2px solid rgba(61,126,245,.4)';
  target.style.outlineOffset = '6px';
  setTimeout(() => { target.style.outline = ''; target.style.outlineOffset = ''; }, 1400);
}

navLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    scrollToSection(this.dataset.section);
  });
});

document.querySelectorAll('.toc-item a').forEach(a => {
  a.addEventListener('click', function (e) {
    const id = this.closest('.toc-item').dataset.section;
    if (!id) return; // sin data-section → navegación normal a otra página
    e.preventDefault();
    scrollToSection(id);
  });
});

// ================================================================
//  NAV TOGGLE (mobile hamburger)
// ================================================================
const navToggle = document.getElementById('nav-toggle');
const navList   = document.getElementById('nav-list');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', e => {
    if (!navToggle.contains(e.target) && !navList.contains(e.target)) {
      navList.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ================================================================
//  LIVE SEARCH + AUTOCOMPLETE
// ================================================================
const searchInput   = document.getElementById('tag-search');
const searchClear   = document.getElementById('search-clear');
const allCards      = Array.from(document.querySelectorAll('.tag-card'));
const allCategories = Array.from(document.querySelectorAll('.category'));

if (searchInput) {

  const mainEl = document.querySelector('main');

  // ── Contenedor fijo al inicio de main (toda la UI de búsqueda) ─
  let searchTop = document.getElementById('search-top');
  if (!searchTop) {
    searchTop = document.createElement('div');
    searchTop.id = 'search-top';
    if (mainEl) mainEl.prepend(searchTop);
  }

  // ── Barra de estado compacta ──────────────────────────────────
  let searchStatus = document.getElementById('search-status');
  if (!searchStatus) {
    searchStatus = document.createElement('div');
    searchStatus.id = 'search-status';
    searchStatus.className = 'search-status';
    searchStatus.hidden = true;
    searchTop.appendChild(searchStatus);
  }

  // ── Panel de resultados locales ───────────────────────────────
  let localPanel = document.getElementById('local-results');
  if (!localPanel) {
    localPanel = document.createElement('div');
    localPanel.id = 'local-results';
    localPanel.hidden = true;
    searchTop.appendChild(localPanel);
  }

  // ── Panel de resultados globales ──────────────────────────────
  let globalPanel = document.getElementById('global-results-panel');
  if (!globalPanel) {
    globalPanel = document.createElement('div');
    globalPanel.id = 'global-results-panel';
    globalPanel.className = 'global-results-panel';
    globalPanel.hidden = true;
    searchTop.appendChild(globalPanel);
  }

  // ── No-results ────────────────────────────────────────────────
  let noResultsEl = document.querySelector('.search-no-results');
  if (!noResultsEl) {
    noResultsEl = document.createElement('div');
    noResultsEl.className = 'search-no-results';
    searchTop.appendChild(noResultsEl);
  }

  // ── Índice local ──────────────────────────────────────────────
  const cardTexts = allCards.map(c =>
    (c.textContent + ' ' + (c.dataset.tag || '')).toLowerCase()
  );

  // ── Índice global ─────────────────────────────────────────────
  const globalIndex = window.SEARCH_INDEX || [];
  // currentPath = "html/estructura.html" o "css/selectores.html"
  const _segs       = location.pathname.split('/').filter(Boolean);
  const _file       = _segs.pop() || 'index.html';
  const _folder     = _segs.pop() || '';
  const currentFile = _folder ? `${_folder}/${_file}` : _file;

  // Convierte una ruta "html/X.html" o "css/X.html" a relativa desde la página actual
  function relLink(targetPath) {
    const [tFolder, tFile] = targetPath.includes('/') ? targetPath.split('/') : [_folder, targetPath];
    return tFolder === _folder ? tFile : `../${tFolder}/${tFile}`;
  }

  // ── Búsqueda local: cuenta coincidencias y construye el panel ──
  function searchLocal(q) {
    if (!allCards.length) return 0;

    // Agrupa tarjetas coincidentes por categoría
    const groups = new Map();
    allCards.forEach((card, i) => {
      if (!cardTexts[i].includes(q)) return;
      const cat    = card.closest('.category');
      const catId  = cat?.id || '_default';
      const label  = cat?.querySelector('h2')?.textContent.trim() || '';
      if (!groups.has(catId)) groups.set(catId, { label, cards: [] });
      groups.get(catId).cards.push(card);
    });

    const total = [...groups.values()].reduce((n, g) => n + g.cards.length, 0);

    if (total === 0) {
      localPanel.innerHTML = '';
      localPanel.hidden = true;
      return 0;
    }

    // Renderiza grupos con tarjetas clonadas
    localPanel.innerHTML = [...groups.values()].map(g => `
      <div class="lr-group">
        ${g.label ? `<p class="lr-group-label">${g.label}</p>` : ''}
        <div class="lr-grid">
          ${g.cards.map(c => c.outerHTML).join('')}
        </div>
      </div>
    `).join('');
    localPanel.hidden = false;
    return total;
  }

  // ── Búsqueda global ───────────────────────────────────────────
  function searchGlobal(q) {
    return globalIndex.filter(item =>
      item.file !== currentFile && item.searchText.includes(q)
    );
  }

  // ── Renderiza panel de resultados globales ────────────────────
  function renderGlobalPanel(results, q) {
    if (!results.length) { globalPanel.hidden = true; return; }

    const bySection = {};
    results.forEach(item => {
      if (!bySection[item.file]) {
        bySection[item.file] = { title: item.sectionTitle, type: item.type, items: [] };
      }
      bySection[item.file].items.push(item);
    });

    const sectionEntries = Object.entries(bySection);

    globalPanel.innerHTML =
      `<p class="global-panel-heading">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        También en otras secciones
      </p>` +
      sectionEntries.map(([file, sec]) => {
        const href    = relLink(file);
        const isCss   = sec.type === 'CSS';
        const shown   = sec.items.slice(0, 5);
        const extra   = sec.items.length - shown.length;
        const hl = (str) => {
          const idx = str.toLowerCase().indexOf(q);
          if (idx === -1) return str;
          return str.slice(0, idx) + `<mark>${str.slice(idx, idx + q.length)}</mark>` + str.slice(idx + q.length);
        };
        const cardsHtml = shown.map(item =>
          `<a href="${href}" class="gr-card">
            <code class="gr-code">${hl(item.code || item.tag)}</code>
            <span class="gr-desc">${item.desc}</span>
          </a>`
        ).join('');
        const moreHtml = extra > 0
          ? `<a href="${href}" class="gr-more">+${extra} más en ${sec.title} →</a>`
          : '';
        return `<div class="global-result-group">
          <div class="global-result-group-hd">
            <span class="gr-badge ${isCss ? 'gr-badge-css' : 'gr-badge-html'}">${sec.type}</span>
            <a href="${href}" class="gr-section-link">${sec.title}</a>
            <span class="gr-section-count">${sec.items.length}</span>
          </div>
          <div class="gr-cards">${cardsHtml}${moreHtml}</div>
        </div>`;
      }).join('');

    globalPanel.hidden = false;
  }

  // ── doSearch ──────────────────────────────────────────────────
  function doSearch(q) {
    q = q.trim().toLowerCase();
    if (searchClear) searchClear.hidden = q === '';
    document.body.classList.toggle('searching', q !== '');

    if (q === '') {
      allCards.forEach(c => c.classList.remove('search-match', 'search-hidden'));
      allCategories.forEach(cat => { cat.classList.remove('all-hidden'); cat.hidden = false; });
      noResultsEl.classList.remove('visible');
      searchStatus.hidden = true;
      localPanel.innerHTML = '';
      localPanel.hidden = true;
      globalPanel.hidden = true;
      return;
    }

    const localCount  = searchLocal(q);
    const globalItems = searchGlobal(q);
    const total       = localCount + globalItems.length;

    // Barra de estado
    if (total > 0) {
      const parts = [];
      if (localCount > 0)
        parts.push(`<strong>${localCount}</strong> en esta sección`);
      if (globalItems.length > 0)
        parts.push(`<strong>${globalItems.length}</strong> en otras secciones`);
      searchStatus.innerHTML =
        `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
         ${parts.join('<span class="ss-sep">·</span>')}`;
      searchStatus.hidden = false;
    } else {
      searchStatus.hidden = true;
    }

    // Sin resultados
    if (total === 0) {
      noResultsEl.innerHTML =
        `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
         <strong>Sin resultados para &ldquo;${q}&rdquo;</strong>
         <span>Prueba con otro término o navega por las secciones.</span>`;
      noResultsEl.classList.add('visible');
    } else {
      noResultsEl.classList.remove('visible');
    }

    renderGlobalPanel(globalItems, q);
  }

  // ── Autocomplete ──────────────────────────────────────────────
  function buildTerms() {
    const terms = new Set();
    globalIndex.forEach(item => {
      item.tag.split(/\s+/).forEach(t => {
        const c = t.replace(/[<>&!()]/g, '').trim();
        if (c.length >= 2) terms.add(c.toLowerCase());
      });
      item.code.split(/[\s·/\-—+()[\]|]+/).forEach(part => {
        const c = part.replace(/[<>&!·…]/g, '').trim();
        if (c.length >= 2) terms.add(c.toLowerCase());
      });
    });
    allCards.forEach(card => {
      (card.dataset.tag || '').split(/\s+/).forEach(t => {
        const c = t.replace(/[<>&!()]/g, '').trim();
        if (c.length >= 2) terms.add(c.toLowerCase());
      });
      card.querySelectorAll('.card-header code').forEach(code => {
        code.textContent.split(/[\s·/\-—+()[\]|]+/).forEach(part => {
          const c = part.replace(/[<>&!·…]/g, '').trim();
          if (c.length >= 2) terms.add(c.toLowerCase());
        });
      });
    });
    return Array.from(terms).sort();
  }

  const allTerms = buildTerms();

  const suggestBox = document.createElement('div');
  suggestBox.id = 'search-suggestions';
  suggestBox.className = 'search-suggestions';
  suggestBox.hidden = true;
  suggestBox.setAttribute('role', 'listbox');
  suggestBox.setAttribute('aria-label', 'Sugerencias de búsqueda');
  searchInput.closest('.search-wrap').appendChild(suggestBox);

  let selectedIdx = -1;

  function hlTerm(term, q) {
    const i = term.indexOf(q);
    if (i === -1) return term;
    return term.slice(0, i) + `<mark>${term.slice(i, i + q.length)}</mark>` + term.slice(i + q.length);
  }

  function showSuggestions(q) {
    if (q.length < 2) { hideSuggestions(); return; }
    const matches = allTerms.filter(t => t.includes(q)).slice(0, 8);
    if (!matches.length) { hideSuggestions(); return; }
    selectedIdx = -1;
    suggestBox.innerHTML = matches.map((term, i) =>
      `<div class="search-suggestion" role="option" data-term="${term}" data-idx="${i}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        ${hlTerm(term, q)}
      </div>`
    ).join('');
    suggestBox.hidden = false;
  }

  function hideSuggestions() { suggestBox.hidden = true; selectedIdx = -1; }

  function selectSuggestion(term) {
    searchInput.value = term;
    hideSuggestions();
    doSearch(term);
    searchInput.focus();
  }

  function moveSelection(dir) {
    const items = suggestBox.querySelectorAll('.search-suggestion');
    if (!items.length) return;
    items[selectedIdx]?.classList.remove('selected');
    selectedIdx = (selectedIdx + dir + items.length) % items.length;
    items[selectedIdx].classList.add('selected');
    items[selectedIdx].scrollIntoView({ block: 'nearest' });
  }

  // ── Eventos ───────────────────────────────────────────────────
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const val = searchInput.value;
    showSuggestions(val.trim().toLowerCase());
    searchTimer = setTimeout(() => doSearch(val), 180);
  });

  searchInput.addEventListener('keydown', e => {
    if (!suggestBox.hidden) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); moveSelection(-1); return; }
      if (e.key === 'Enter') {
        const sel = suggestBox.querySelector('.search-suggestion.selected');
        if (sel) { e.preventDefault(); selectSuggestion(sel.dataset.term); return; }
      }
      if (e.key === 'Escape') { hideSuggestions(); return; }
    }
    if (e.key === 'Escape') { searchInput.value = ''; doSearch(''); hideSuggestions(); return; }
    if (e.key === 'Enter') {
      hideSuggestions();
      const first = document.querySelector('.tag-card.search-match');
      if (first) {
        const h = document.getElementById('top')?.offsetHeight ?? 0;
        window.scrollTo({ top: first.getBoundingClientRect().top + window.scrollY - h - 20, behavior: 'smooth' });
      }
    }
  });

  suggestBox.addEventListener('mousedown', e => {
    const item = e.target.closest('.search-suggestion');
    if (item) { e.preventDefault(); selectSuggestion(item.dataset.term); }
  });

  suggestBox.addEventListener('mouseover', e => {
    const item = e.target.closest('.search-suggestion');
    if (!item) return;
    suggestBox.querySelectorAll('.search-suggestion').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
    selectedIdx = +item.dataset.idx;
  });

  document.addEventListener('click', e => {
    if (!searchInput.contains(e.target) && !suggestBox.contains(e.target)) hideSuggestions();
  });

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      doSearch('');
      hideSuggestions();
      searchInput.focus();
    });
  }
}

// ================================================================
//  TOC — title tooltip en ítems principales (nombre completo al hover)
// ================================================================
// ================================================================
//  TOC SUBMENU — subítems de tarjetas dentro de la sección activa
// ================================================================
(function buildTocSubmenu() {
  const activeTocItem = document.querySelector('.toc-item.toc-active');
  if (!activeTocItem) return;

  // Usa tag-cards si hay; si no, usa .intro-section[id] (páginas de bienvenida)
  const introItems = Array.from(document.querySelectorAll('.intro-section[id]'));
  const items      = allCards.length > 0 ? allCards : introItems;
  if (!items.length) return;

  const isIntroMode = allCards.length === 0;

  // 1. Asigna IDs únicos a las tarjetas (intro-section ya los tienen en el HTML).
  //    Se incluye siempre el índice para evitar colisiones cuando varias tarjetas
  //    tienen el mismo primer token en data-tag (ej: todas empiezan con "selector").
  if (!isIntroMode) {
    allCards.forEach((card, i) => {
      if (!card.id) {
        const raw  = (card.dataset.tag || '').split(/\s+/)[0];
        const slug = raw.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '');
        card.id = slug ? `c-${slug}-${i}` : `c-${i}`;
      }
    });
  }

  // 2. Mueve los hijos actuales a un div de fila para que el submenú quede debajo
  const row = document.createElement('div');
  row.className = 'toc-item-row';
  while (activeTocItem.firstChild) row.appendChild(activeTocItem.firstChild);
  activeTocItem.appendChild(row);

  // 3. Extrae la etiqueta de cada ítem
  function getLabel(item) {
    if (isIntroMode) {
      const h3 = item.querySelector('h3');
      if (!h3) return item.id.replace(/^pg-/, '');
      // Clona el h3 y elimina el span del ícono para obtener solo el texto del título
      const clone = h3.cloneNode(true);
      clone.querySelector('.intro-icon')?.remove();
      return clone.textContent.trim().split('—')[0].trim();
    }
    const code = item.querySelector('.card-header code');
    const raw  = code ? code.textContent : (item.dataset.tag || '').split(' ')[0];
    return raw.replace(/[<>]/g, '').split(/\s*[—·|/+]\s*/)[0].trim().slice(0, 32) || '—';
  }

  // 4. Construye el submenú
  const ul = document.createElement('ul');
  ul.className = 'toc-submenu';
  ul.setAttribute('aria-label', 'Secciones en esta página');

  items.forEach(item => {
    if (!item.id) return;
    const label = getLabel(item);
    const li    = document.createElement('li');
    li.className = 'toc-subitem';
    li.dataset.target = item.id;

    const a = document.createElement('a');
    a.href        = `#${item.id}`;
    a.textContent = label;
    a.addEventListener('click', e => {
      e.preventDefault();
      // Marca este sub-ítem como activo de inmediato
      ul.querySelectorAll('.toc-subitem').forEach(s => s.classList.remove('toc-sub-active'));
      li.classList.add('toc-sub-active');
      li.scrollIntoView({ block: 'nearest' });

      const headerH     = document.getElementById('top')?.offsetHeight ?? 0;
      const breadcrumbH = document.querySelector('.breadcrumb')?.offsetHeight ?? 0;
      const y = item.getBoundingClientRect().top + window.scrollY - headerH - breadcrumbH - 12;
      window.scrollTo({ top: y, behavior: 'smooth' });

      // Resalta brevemente el elemento destino
      item.style.outline       = '2px solid rgba(61,126,245,.4)';
      item.style.outlineOffset = '4px';
      setTimeout(() => { item.style.outline = ''; item.style.outlineOffset = ''; }, 1400);

      if (window.innerWidth <= 1024) closeTOC();
    });

    li.appendChild(a);
    ul.appendChild(li);
  });

  activeTocItem.appendChild(ul);

  const subItems = Array.from(ul.querySelectorAll('.toc-subitem'));

  // 5. Sincroniza el resaltado del TOC con la posición de scroll.
  function syncTocSubmenu() {
    const headerH  = (document.getElementById('top')?.offsetHeight ?? 0)
                   + (document.querySelector('.breadcrumb')?.offsetHeight ?? 0)
                   + 16;
    // Umbral ampliado: 40% del viewport desde el header — detecta ítems
    // que nunca llegarán al tope porque no hay contenido suficiente debajo.
    const threshold = headerH + (window.innerHeight - headerH) * 0.4;

    // Fallback: si el usuario está al final de la página, activa el último ítem
    const nearBottom =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;

    let activeItem;
    if (nearBottom) {
      activeItem = items[items.length - 1];
    } else {
      activeItem = items[0];
      for (const item of items) {
        if (item.getBoundingClientRect().top <= threshold) activeItem = item;
      }
    }

    subItems.forEach(sub => {
      const isActive = sub.dataset.target === activeItem?.id;
      sub.classList.toggle('toc-sub-active', isActive);
      if (isActive) sub.scrollIntoView({ block: 'nearest' });
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncTocSubmenu, 200);
  }, { passive: true });

  window.addEventListener('scroll', syncTocSubmenu, { passive: true });
  syncTocSubmenu();
})();

// ================================================================
//  CARD FADE-IN
// ================================================================
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.05 });

allCards.forEach(card => {
  card.style.cssText += 'opacity:0;transform:translateY(14px);transition:opacity .3s ease,transform .3s ease,box-shadow .15s,outline .1s;';
  fadeObserver.observe(card);
});

// ================================================================
//  MEDIA QUERY VISUALIZER
// ================================================================
const mqBreakpoints = [
  { cls: 'mq-xs', max: 480,      label: '<480px — Mobile S' },
  { cls: 'mq-sm', max: 768,      label: '480–768px — Mobile L / Tablet S' },
  { cls: 'mq-md', max: 1024,     label: '768–1024px — Tablet / Laptop' },
  { cls: 'mq-lg', max: 1280,     label: '1024–1280px — Desktop' },
  { cls: 'mq-xl', max: Infinity, label: '>1280px — Large Desktop' },
];
function updateMQDemo() {
  const el    = document.getElementById('mq-demo');
  const label = document.getElementById('mq-label');
  if (!el) return;
  const w  = window.innerWidth;
  const bp = mqBreakpoints.find(b => w <= b.max);
  el.className = 'mq-demo ' + (bp?.cls ?? '');
  if (label) label.textContent = `Ventana: ${w}px — ${bp?.label ?? ''}`;
}
window.addEventListener('resize', updateMQDemo, { passive: true });
updateMQDemo();

// ================================================================
//  CSS DEMO: BOX MODEL PLAYGROUND
// ================================================================
function updateBoxModel() {
  const margin  = +document.getElementById('bm-margin').value;
  const padding = +document.getElementById('bm-padding').value;
  const border  = +document.getElementById('bm-border').value;
  const sizing  = document.getElementById('bm-sizing').value;
  document.getElementById('bm-margin-val').value  = margin  + 'px';
  document.getElementById('bm-padding-val').value = padding + 'px';
  document.getElementById('bm-border-val').value  = border  + 'px';
  const mBox = document.getElementById('bm-margin-box');
  const bBox = document.getElementById('bm-border-box');
  const pBox = document.getElementById('bm-padding-box');
  const code = document.getElementById('bm-code');
  if (mBox) mBox.style.padding  = margin  + 'px';
  if (bBox) { bBox.style.borderWidth = border + 'px'; bBox.style.boxSizing = sizing; }
  if (pBox) pBox.style.padding  = padding + 'px';
  if (code) code.textContent = `.el {\n  margin:  ${margin}px;\n  border:  ${border}px solid;\n  padding: ${padding}px;\n  box-sizing: ${sizing};\n}`;
}
document.addEventListener('DOMContentLoaded', updateBoxModel);

// ================================================================
//  CSS DEMO: FLEXBOX PLAYGROUND
// ================================================================
function updateFlex() {
  const c = document.getElementById('fp-container');
  if (!c) return;
  const dir     = document.getElementById('fp-direction').value;
  const wrap    = document.getElementById('fp-wrap').value;
  const justify = document.getElementById('fp-justify').value;
  const align   = document.getElementById('fp-align').value;
  const gap     = document.getElementById('fp-gap').value;
  document.getElementById('fp-gap-val').value = gap + 'px';
  c.style.flexDirection  = dir;
  c.style.flexWrap       = wrap;
  c.style.justifyContent = justify;
  c.style.alignItems     = align;
  c.style.gap            = gap + 'px';
  const code = document.getElementById('fp-code');
  if (code) code.textContent = `.container {\n  display: flex;\n  flex-direction: ${dir};\n  flex-wrap: ${wrap};\n  justify-content: ${justify};\n  align-items: ${align};\n  gap: ${gap}px;\n}`;
}

// ================================================================
//  CSS DEMO: GRID PLAYGROUND
// ================================================================
function updateGrid() {
  const c = document.getElementById('gp-container');
  if (!c) return;
  const cols = document.getElementById('gp-cols').value;
  const rows = document.getElementById('gp-rows').value;
  const gap  = document.getElementById('gp-gap').value;
  document.getElementById('gp-gap-val').value = gap + 'px';
  c.style.gridTemplateColumns = cols;
  c.style.gridTemplateRows    = rows;
  c.style.gap                 = gap + 'px';
  const special = c.querySelector('.gp-special');
  if (special) special.style.gridColumn = cols.split(' ').length >= 2 ? '1 / span 2' : '1';
  const code = document.getElementById('gp-code');
  if (code) code.textContent = `.grid {\n  display: grid;\n  grid-template-columns: ${cols};\n  grid-template-rows: ${rows};\n  gap: ${gap}px;\n}`;
}

// ================================================================
//  CSS DEMO: TYPOGRAPHY PLAYGROUND
// ================================================================
function updateTypo() {
  const preview = document.getElementById('tp-preview');
  if (!preview) return;
  const size      = document.getElementById('tp-size').value;
  const weight    = document.getElementById('tp-weight').value;
  const lhRaw     = document.getElementById('tp-lh').value;
  const lsRaw     = document.getElementById('tp-ls').value;
  const align     = document.getElementById('tp-align').value;
  const transform = document.getElementById('tp-transform').value;
  const lh = (lhRaw / 10).toFixed(1);
  const ls = lsRaw + 'px';
  document.getElementById('tp-size-val').value = size + 'px';
  document.getElementById('tp-lh-val').value   = lh;
  document.getElementById('tp-ls-val').value   = ls;
  preview.style.cssText += `font-size:${size}px;font-weight:${weight};line-height:${lh};letter-spacing:${ls};text-align:${align};text-transform:${transform};`;
  const code = document.getElementById('tp-code');
  if (code) code.textContent = `p {\n  font-size: ${size}px;\n  font-weight: ${weight};\n  line-height: ${lh};\n  letter-spacing: ${ls};\n  text-align: ${align};\n  text-transform: ${transform};\n}`;
}

// ================================================================
//  CSS DEMO: COLOR PLAYGROUND
// ================================================================
function hexToRgb(hex) {
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
}
function rgbToHsl(r,g,b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if (max===min){h=s=0;}else{
    const d=max-min; s=l>.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;default:h=((r-g)/d+4)/6;}
  }
  return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
}
function updateColorPlayground() {
  const hex   = document.getElementById('cp-color').value;
  const alpha = document.getElementById('cp-alpha').value;
  document.getElementById('cp-alpha-val').value = alpha + '%';
  const a = (alpha/100).toFixed(2);
  const {r,g,b} = hexToRgb(hex);
  const {h,s,l} = rgbToHsl(r,g,b);
  const formats = [
    { label:'HEX',     value: alpha<100?`${hex}${Math.round(alpha*2.55).toString(16).padStart(2,'0')}`:hex },
    { label:'RGB',     value:`rgb(${r}, ${g}, ${b})` },
    { label:'RGBA',    value:`rgba(${r}, ${g}, ${b}, ${a})` },
    { label:'HSL',     value:`hsl(${h}, ${s}%, ${l}%)` },
    { label:'HSLA',    value:`hsla(${h}, ${s}%, ${l}%, ${a})` },
    { label:'color()', value:`color(srgb ${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)})` },
  ];
  const fEl = document.getElementById('cp-formats');
  if (fEl) fEl.innerHTML = formats.map(f=>`<div class="cp-format-row"><div class="cp-swatch" style="background:${f.value}"></div><span class="cp-format-code" title="${f.value}"><strong>${f.label}:</strong> ${f.value}</span></div>`).join('');
  const swatches = [10,20,30,40,50,60,70,80,90].map(li=>`hsl(${h},${s}%,${li}%)`);
  const sEl = document.getElementById('cp-swatches');
  if (sEl) sEl.innerHTML = swatches.map(c=>`<div class="cp-shade" style="background:${c}" title="${c}" onclick="navigator.clipboard?.writeText('${c}')"></div>`).join('');
}
document.addEventListener('DOMContentLoaded', updateColorPlayground);

// ================================================================
//  CSS DEMO: VARIABLES PLAYGROUND
// ================================================================
function updateVarDemo() {
  const primary = document.getElementById('var-primary').value;
  const radius  = document.getElementById('var-radius').value;
  const spacing = document.getElementById('var-spacing').value;
  document.getElementById('var-radius-val').value  = radius  + 'px';
  document.getElementById('var-spacing-val').value = spacing + 'px';
  document.querySelectorAll('.vp-card').forEach(card => {
    card.style.background   = primary;
    card.style.borderColor  = primary;
    card.style.borderRadius = radius + 'px';
    card.style.padding      = `${spacing}px ${Math.round(spacing*1.5)}px`;
  });
  const code = document.getElementById('vp-code');
  if (code) code.textContent = `:root {\n  --primary: ${primary};\n  --radius: ${radius}px;\n  --spacing: ${spacing}px;\n}\n.card {\n  background: var(--primary);\n  border-radius: var(--radius);\n  padding: var(--spacing);\n}`;
}
document.addEventListener('DOMContentLoaded', updateVarDemo);

// ================================================================
//  CSS DEMO: SELECTOR HIGHLIGHTER
// ================================================================
function demoCSSSelector(btn, containerId, selector) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.css-highlighted').forEach(el => el.classList.remove('css-highlighted'));
  if (!selector) return;
  try { container.querySelectorAll(selector).forEach(el => el.classList.add('css-highlighted')); }
  catch(e) { /* selector inválido */ }
}

// ================================================================
//  CSS DEMO: nth-child highlighter
// ================================================================
function demoNth(type) {
  const items = Array.from(document.querySelectorAll('#nth-demo .nth-item'));
  items.forEach(el => el.classList.remove('nth-active'));
  if (!type) return;
  let targets = [];
  if (type === 'odd')   targets = items.filter((_,i) => i % 2 === 0);
  if (type === '3n')    targets = items.filter((_,i) => (i+1) % 3 === 0);
  if (type === 'first') targets = [items[0]];
  if (type === 'last')  targets = [items[items.length-1]];
  targets.forEach(el => el.classList.add('nth-active'));
}

// ================================================================
//  CSS DEMO: ANIMATION TOGGLE
// ================================================================
function toggleAnimations() {
  const showcase = document.querySelector('.anim-showcase');
  const btn      = document.getElementById('anim-toggle');
  if (!showcase || !btn) return;
  showcase.classList.toggle('anim-paused');
  btn.textContent = showcase.classList.contains('anim-paused') ? 'Reanudar animaciones' : 'Pausar animaciones';
}

// ================================================================
//  HTML DEMOS
// ================================================================
let titleTimeout;
function demoTitle() {
  const original = document.title;
  document.title = '¡El <title> cambió!';
  document.getElementById('title-demo-info').textContent = 'El título de la pestaña cambió. Volviendo en 3s…';
  clearTimeout(titleTimeout);
  titleTimeout = setTimeout(() => {
    document.title = original;
    document.getElementById('title-demo-info').textContent = 'Haz clic para ver el efecto en la pestaña';
  }, 3000);
}

const divColors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c'];
let divCount = 0;
function demoDiv() {
  const area  = document.getElementById('div-demo-area');
  const div   = document.createElement('div');
  const color = divColors[divCount % divColors.length];
  div.style.cssText = `background:${color};color:white;padding:6px 10px;border-radius:5px;font-size:.75rem;font-weight:600;animation:slideIn .2s ease`;
  div.textContent = `div #${++divCount}`;
  area.appendChild(div);
  if (divCount > 8) area.removeChild(area.firstChild);
}

function dibujarCanvas() {
  const canvas = document.getElementById('demo-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#3d7ef5');
  grad.addColorStop(1, '#9b59b6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,.15)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, 15+Math.random()*25, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle = 'white';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Dibujado con <canvas>', canvas.width/2, canvas.height/2);
}

function mostrarDatosForm(e) {
  e.preventDefault();
  const obj = {};
  for (const [k,v] of new FormData(e.target).entries()) {
    obj[k] = obj[k] ? (Array.isArray(obj[k]) ? [...obj[k],v] : [obj[k],v]) : v;
  }
  const out = document.getElementById('form-output');
  out.style.display = 'block';
  out.textContent = '// Datos del formulario:\n' + JSON.stringify(obj, null, 2);
}

let progressInterval;
function animarProgress() {
  const prog = document.getElementById('prog');
  const val  = document.getElementById('prog-val');
  clearInterval(progressInterval);
  prog.value = 0;
  progressInterval = setInterval(() => {
    if (prog.value >= 100) { clearInterval(progressInterval); val.textContent = 'Completado'; return; }
    prog.value += 2;
    val.textContent = prog.value + '%';
  }, 60);
}

function toggleHidden() {
  const el = document.getElementById('hidden-demo');
  el.hidden = !el.hidden;
}

function mostrarDataset(el) {
  document.getElementById('dataset-output').textContent =
    Object.entries(el.dataset).map(([k,v]) => `dataset.${k} = "${v}"`).join('\n');
}

let ariaMsg = 0;
const ariaMsgs = [
  'Evento 1: Formulario enviado correctamente.',
  'Evento 2: Cargando datos del servidor…',
  'Evento 3: Tres nuevas notificaciones.',
  'Evento 4: aria-live anuncia a lectores de pantalla.',
];
function demoAria() {
  document.getElementById('aria-demo-output').textContent = ariaMsgs[ariaMsg++ % ariaMsgs.length];
}
function toggleAriaBool(btn) {
  const pressed = btn.getAttribute('aria-pressed') === 'true';
  btn.setAttribute('aria-pressed', String(!pressed));
  btn.textContent = `aria-pressed: ${!pressed}`;
}

const templateData = [
  {name:'charset',val:'UTF-8'},{name:'viewport',val:'width=device-width'},
  {name:'lang',val:'es'},{name:'defer',val:'true'},
];
let templateIdx = 0;
function usarTemplate() {
  const template = document.getElementById('card-template');
  const output   = document.getElementById('template-output');
  if (templateIdx >= templateData.length) { output.innerHTML = ''; templateIdx = 0; }
  const item  = templateData[templateIdx++];
  const clone = template.content.cloneNode(true);
  clone.querySelector('.tc-name').textContent = item.name;
  clone.querySelector('.tc-val').textContent  = item.val;
  output.appendChild(clone);
}

let draggedId = null;
function dragStart(e) { draggedId = e.target.id; e.dataTransfer.effectAllowed = 'move'; }
function dropHandler(e) {
  e.preventDefault();
  if (!draggedId) return;
  const el   = document.getElementById(draggedId);
  const zone = document.getElementById('drop-zone');
  if (el) {
    const c = el.cloneNode(true);
    c.style.display = 'inline-block'; c.style.margin = '4px';
    zone.style.color = 'inherit';
    zone.appendChild(c);
  }
  draggedId = null;
}

// ================================================================
//  NUEVOS PLAYGROUNDS
// ================================================================

// ── Border-radius playground ─────────────────────────────────
function updateBR() {
  const tl = document.getElementById('br-tl')?.value ?? 12;
  const tr = document.getElementById('br-tr')?.value ?? 12;
  const br = document.getElementById('br-br')?.value ?? 12;
  const bl = document.getElementById('br-bl')?.value ?? 12;
  ['tl','tr','br','bl'].forEach(k => {
    const v = document.getElementById(`br-${k}`)?.value;
    if (document.getElementById(`br-${k}-v`)) document.getElementById(`br-${k}-v`).textContent = v;
  });
  const val = `${tl}px ${tr}px ${br}px ${bl}px`;
  const el  = document.getElementById('br-preview');
  const code = document.getElementById('br-code');
  if (el)   el.style.borderRadius = val;
  const simple = tl===tr && tr===br && br===bl ? `${tl}px` : val;
  if (code) code.textContent = `border-radius: ${simple}`;
}
function setBR(tl, tr, br, bl) {
  ['tl','tr','br','bl'].forEach((k,i) => {
    const el = document.getElementById(`br-${k}`);
    if (el) { el.value = [tl,tr,br,bl][i]; }
  });
  updateBR();
}
document.addEventListener('DOMContentLoaded', updateBR);

// ── Box-shadow playground ─────────────────────────────────────
function updateShadow() {
  const x    = document.getElementById('sh-x')?.value ?? 4;
  const y    = document.getElementById('sh-y')?.value ?? 6;
  const b    = document.getElementById('sh-b')?.value ?? 16;
  const s    = document.getElementById('sh-s')?.value ?? 0;
  const c    = document.getElementById('sh-c')?.value ?? '#000000';
  const ins  = document.getElementById('sh-i')?.checked ? 'inset ' : '';
  ['x','y','b','s'].forEach(k => {
    const out = document.getElementById(`sh-${k}-v`);
    if (out) out.textContent = document.getElementById(`sh-${k}`)?.value;
  });
  const hex2rgba = (hex) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const bb2 = parseInt(hex.slice(5,7),16);
    const a = hex.length > 7 ? (parseInt(hex.slice(7,9),16)/255).toFixed(2) : 1;
    return `rgba(${r},${g},${bb2},${a})`;
  };
  const shadow = `${ins}${x}px ${y}px ${b}px ${s}px ${hex2rgba(c)}`;
  const el   = document.getElementById('sh-preview');
  const code = document.getElementById('sh-code');
  if (el)   el.style.boxShadow = shadow;
  if (code) code.textContent   = `box-shadow: ${shadow}`;
}
document.addEventListener('DOMContentLoaded', updateShadow);

// ── Gap demo ─────────────────────────────────────────────────
function updateGapDemo(val) {
  const box = document.getElementById('gap-demo-box');
  const out = document.getElementById('gap-demo-out');
  if (box) box.style.gap = `${val}px`;
  if (out) out.textContent = `${val}px`;
}

// ── Grid areas layouts ────────────────────────────────────────
const GA_LAYOUTS = {
  classic: {
    areas: '"header header" "sidebar main" "footer footer"',
    cols: '120px 1fr', rows: '36px 80px 28px',
    show: ['header','sidebar','main','footer'],
    code: `grid-template-areas:\n  "header  header"\n  "sidebar main"\n  "footer  footer";\ngrid-template-columns: 200px 1fr;`
  },
  holy: {
    areas: '"header header header" "nav main aside" "footer footer footer"',
    cols: '80px 1fr 80px', rows: '32px 80px 28px',
    show: ['header','sidebar','main','footer'],
    code: `grid-template-areas:\n  "header header  header"\n  "nav    main    aside"\n  "footer footer  footer";\ngrid-template-columns: 160px 1fr 160px;`
  },
  magazine: {
    areas: '"a a b" "c d b" "c d e"',
    cols: '1fr 1fr 1fr', rows: '40px 40px 40px',
    show: ['header','sidebar','main','footer'],
    code: `grid-template-areas:\n  "a a b"\n  "c d b"\n  "c d e";\ngrid-template-columns: 1fr 1fr 1fr;`
  },
  dashboard: {
    areas: '"header header header" "sidebar chart chart" "sidebar stats stats"',
    cols: '80px 1fr 1fr', rows: '32px 60px 40px',
    show: ['header','sidebar','main','footer'],
    code: `grid-template-areas:\n  "header header header"\n  "sidebar chart  chart"\n  "sidebar stats  stats";\ngrid-template-columns: 180px 1fr 1fr;`
  }
};
function setGridAreas(name) {
  const g = GA_LAYOUTS[name];
  if (!g) return;
  const grid = document.getElementById('ga-grid');
  const code = document.getElementById('ga-code');
  if (grid) {
    grid.style.gridTemplateAreas   = g.areas;
    grid.style.gridTemplateColumns = g.cols;
    grid.style.gridTemplateRows    = g.rows;
  }
  if (code) code.textContent = g.code;
}
document.addEventListener('DOMContentLoaded', () => {
  setGridAreas('classic');
  updateBR();
  updateShadow();
});

// ── Text decoration playground ────────────────────────────────
function updateTextDeco() {
  const line   = document.getElementById('td-line')?.value   ?? 'underline';
  const style  = document.getElementById('td-style')?.value  ?? 'solid';
  const color  = document.getElementById('td-color')?.value  ?? '#3d7ef5';
  const thick  = document.getElementById('td-thick')?.value  ?? 2;
  const offset = document.getElementById('td-offset')?.value ?? 2;
  if (document.getElementById('td-thick-v'))  document.getElementById('td-thick-v').textContent  = thick;
  if (document.getElementById('td-offset-v')) document.getElementById('td-offset-v').textContent = offset;
  const preview = document.getElementById('td-preview');
  const code    = document.getElementById('td-code');
  if (preview) {
    preview.style.textDecoration      = `${line} ${style} ${color} ${thick}px`;
    preview.style.textUnderlineOffset = `${offset}px`;
  }
  if (code) code.textContent = `text-decoration: ${line} ${style} ${color} ${thick}px;\ntext-underline-offset: ${offset}px;`;
}
document.addEventListener('DOMContentLoaded', updateTextDeco);

// ── Position playground ──────────────────────────────────────
const POS_DATA = {
  static:   { top:'auto', left:'auto', style:'',                  desc:'Flujo normal del documento. top/left/right/bottom no tienen efecto.' },
  relative: { top:'8px',  left:'16px', style:'top:8px;left:16px', desc:'Se desplaza DESDE su posición normal. El espacio original se conserva.' },
  absolute: { top:'8px',  left:'auto', style:'top:8px;right:6px', desc:'Se posiciona respecto al ancestro posicionado más cercano (no static).' },
  sticky:   { top:'0px',  left:'auto', style:'top:0',             desc:'Fluye normalmente hasta llegar al umbral, luego se queda fijo en el viewport.' },
};
function setPos(type) {
  const el   = document.getElementById('pos-demo-el');
  const desc = document.getElementById('pos-desc');
  const code = document.getElementById('pos-code');
  if (!el) return;
  const d = POS_DATA[type];
  el.style.cssText = `background:#3d7ef5;color:white;padding:6px 10px;border-radius:4px;transition:all .3s;font-weight:600;font-size:.8rem;position:${type};${d.style}`;
  if (desc) desc.textContent = d.desc;
  if (code) code.textContent = `.el { position: ${type}; ${d.style} }`;
}
document.addEventListener('DOMContentLoaded', () => setPos('static'));

// ── animation-fill-mode demo ─────────────────────────────────
function runFillDemo(mode, btn) {
  const id  = mode === 'none' ? 'fill-none' : 'fill-fwd';
  const el  = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = `an-bounce .8s ease-in-out 1 ${mode}`;
}

// ── Dark mode preview toggle ─────────────────────────────────
let _darkOn = false;
function toggleDarkPreview() {
  _darkOn = !_darkOn;
  const el = document.getElementById('dark-mode-preview');
  if (!el) return;
  el.style.background = _darkOn ? '#0f172a' : '';
  el.style.color      = _darkOn ? '#e2e8f0' : '';
  el.style.border     = _darkOn ? '1px solid rgba(255,255,255,.1)' : '';
}

// ── Fluid typography playground ──────────────────────────────
function updateFluidTypo() {
  const minPx  = document.getElementById('ft-min')?.value   ?? 16;
  const ideal  = document.getElementById('ft-ideal')?.value ?? 2.5;
  const maxPx  = document.getElementById('ft-max')?.value   ?? 32;
  const minRem = (minPx / 16).toFixed(2).replace(/\.?0+$/, '');
  const maxRem = (maxPx / 16).toFixed(2).replace(/\.?0+$/, '');
  const val    = `clamp(${minRem}rem, ${ideal}vw, ${maxRem}rem)`;
  const prev   = document.getElementById('fluid-typo-preview');
  const code   = document.getElementById('ft-code');
  const mV     = document.getElementById('ft-min-val');
  const iV     = document.getElementById('ft-ideal-val');
  const xV     = document.getElementById('ft-max-val');
  if (prev) prev.style.fontSize = val;
  if (code) code.textContent = `font-size: ${val};`;
  if (mV)   mV.textContent   = `${minRem}rem`;
  if (iV)   iV.textContent   = `${ideal}vw`;
  if (xV)   xV.textContent   = `${maxRem}rem`;
}
document.addEventListener('DOMContentLoaded', updateFluidTypo);

// ── Tabla: información de celda ──────────────────────────────
function showCellInfo(attrs, desc) {
  const el = document.getElementById('cell-info');
  if (!el) return;
  el.textContent = attrs ? `Atributos: ${attrs} — ${desc}` : desc;
  el.style.color = '#1a56db';
}

// ── Constraint Validation ────────────────────────────────────
function checkInputValidity(input) {
  const msg = input.nextElementSibling;
  if (!msg) return;
  if (input.validity.valid) {
    msg.textContent = '✓ Válido';
    msg.style.color = '#16a34a';
    input.style.borderColor = '#86efac';
  } else {
    msg.textContent = input.validationMessage;
    msg.style.color = '#dc2626';
    input.style.borderColor = '#fca5a5';
  }
}
function validateAll() {
  document.querySelectorAll('#validation-form input').forEach(checkInputValidity);
}

// ── FormData demo ────────────────────────────────────────────
function demoFormData(e) {
  e.preventDefault();
  const fd  = new FormData(e.target);
  const out = document.getElementById('fd-output');
  if (!out) return;
  const lines = [];
  for (const [k, v] of fd) lines.push(`${k}: "${v}"`);
  out.textContent = lines.length ? lines.join('\n') : '(vacío)';
  out.style.display = 'block';
}

// ── Form events log ──────────────────────────────────────────
function logFormEvent(e, type) {
  const log = document.getElementById('form-events-log');
  if (!log) return;
  const colors = { input:'#7dd3fc', change:'#a5f3fc', focus:'#86efac',
                   blur:'#fde68a', submit:'#f9a8d4', reset:'#d8b4fe' };
  const div = document.createElement('div');
  div.style.color = colors[type] || 'white';
  const val  = e.target?.value ?? '';
  const trim = val.length > 20 ? val.slice(0, 20) + '…' : val;
  div.textContent = `[${type}]${trim ? ' → "' + trim + '"' : ''}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  if (log.children.length > 12) log.removeChild(log.firstChild);
  if (type === 'submit' || type === 'reset') e.preventDefault?.();
}
