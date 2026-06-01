// ================================================================
//  WEB EXPLORER — components.js
//  Inyecta header, sidebar TOC y footer en las páginas de sección.
//  Detecta la subcarpeta (html/ o css/) para generar rutas correctas.
// ================================================================

(function () {
  // Normaliza la ruta: elimina trailing slash para evitar segmentos vacíos
  const parts       = location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  const lastSeg     = parts[parts.length - 1] || '';
  // Si el último segmento tiene extensión es el archivo; si no, es una carpeta (→ index.html)
  const currentFile = lastSeg.includes('.') ? parts.pop() : 'index.html';
  const subFolder   = parts.pop();          // 'html' | 'css'
  const isCSS       = subFolder === 'css';

  // Rutas relativas desde html/ o css/ en la raíz del proyecto
  const homeHref    = '../index.html';
  // Usar rutas explícitas (no directorios) para evitar ambigüedad en Live Server
  const htmlTabHref = isCSS ? '../html/index.html' : 'index.html';
  const cssTabHref  = isCSS ? 'index.html'         : '../css/index.html';

  // ── Datos de secciones ────────────────────────────────────────
  const HTML_SECTIONS = [
    { file: 'index.html',       title: 'Introducción a HTML' },
    { file: 'estructura.html',  title: 'Estructura del Documento',      count: 11 },
    { file: 'texto.html',       title: 'Texto y Tipografía',             count: 27 },
    { file: 'listas.html',      title: 'Listas',                         count: 5  },
    { file: 'media.html',       title: 'Imágenes y Media',               count: 14 },
    { file: 'tablas.html',      title: 'Tablas',                         count: 10 },
    { file: 'formularios.html', title: 'Formularios',                    count: 20 },
    { file: 'semantica.html',   title: 'Semántica HTML5',                 count: 14 },
    { file: 'interactivo.html', title: 'Interactividad y Accesibilidad', count: 7  },
    { file: 'meta.html',        title: 'Scripts y Meta',                 count: 6  },
  ];

  const CSS_SECTIONS = [
    { file: 'index.html',        title: 'Introducción a CSS' },
    { file: 'selectores.html',   title: 'Selectores',                    count: 12 },
    { file: 'boxmodel.html',     title: 'Box Model',                      count: 8  },
    { file: 'display.html',      title: 'Display y Posición',             count: 6  },
    { file: 'flexbox.html',      title: 'Flexbox',                        count: 12 },
    { file: 'grid.html',         title: 'CSS Grid',                       count: 14 },
    { file: 'tipografia.html',   title: 'Tipografía',                     count: 14 },
    { file: 'colores.html',      title: 'Colores y Fondos',               count: 10 },
    { file: 'animaciones.html',  title: 'Transiciones y Animaciones',     count: 12 },
    { file: 'variables.html',    title: 'Variables y Funciones',          count: 8  },
    { file: 'pseudos.html',      title: 'Pseudoclases y Pseudoelementos', count: 20 },
    { file: 'responsive.html',   title: 'Responsive y @Rules',            count: 8  },
  ];

  const sections  = isCSS ? CSS_SECTIONS : HTML_SECTIONS;
  const allPages  = [...HTML_SECTIONS, ...CSS_SECTIONS];
  const pageData  = sections.find(s => s.file === currentFile);

  const tocTitle       = isCSS ? 'CSS' : 'HTML';
  const itemCssClass   = isCSS ? ' toc-css' : '';
  const countCssClass  = isCSS ? ' toc-count-css' : '';
  const activeHtmlTab  = !isCSS ? ' active' : '';
  const activeCssTab   =  isCSS ? ' active' : '';
  const placeholder    = isCSS
    ? 'Buscar propiedad, selector…'
    : 'Buscar etiqueta, atributo…';

  // ── 1. Header ─────────────────────────────────────────────────
  const header = document.createElement('header');
  header.id = 'top';
  header.innerHTML =
    `<div class="header-inner">
      <button id="toc-toggle" aria-label="Mostrar/ocultar tabla de contenido"
              aria-expanded="true" aria-controls="toc-sidebar">
        <span class="toc-toggle-icon" aria-hidden="true"></span>
      </button>
      <a href="${homeHref}" class="brand-link">
        <span class="brand-mark" aria-hidden="true">&lt;/&gt;</span>
        <span class="brand-name">BryanDocs</span>
      </a>
      <nav class="header-tabs" aria-label="Áreas de documentación">
        <a class="header-tab${activeHtmlTab}" href="${htmlTabHref}">HTML</a>
        <a class="header-tab${activeCssTab}"  href="${cssTabHref}">CSS</a>
      </nav>
      <div class="header-right">
        <div class="search-wrap">
          <label for="tag-search" class="sr-only">Buscar en la documentación</label>
          <svg class="search-icon" aria-hidden="true" width="14" height="14"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="search" id="tag-search" placeholder="${placeholder}"
                 autocomplete="off" spellcheck="false">
          <button type="button" id="search-clear" aria-label="Limpiar búsqueda" hidden>✕</button>
        </div>
      </div>
    </div>
    <div id="nav-progress" aria-hidden="true"><div id="nav-progress-bar"></div></div>`;

  document.body.prepend(header);

  // ── 2. Overlay móvil ──────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'toc-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  header.insertAdjacentElement('afterend', overlay);

  // ── 3. Sidebar TOC ────────────────────────────────────────────
  const tocItems = sections.map(s => {
    const active     = s.file === currentFile ? ' toc-active' : '';
    const countBadge = s.count != null
      ? `<span class="toc-count${countCssClass}">${s.count}</span>`
      : '';
    return `<li class="toc-item${itemCssClass}${active}">
              <a href="${s.file}">${s.title}</a>${countBadge}
            </li>`;
  }).join('');

  const sidebar = document.createElement('aside');
  sidebar.id = 'toc-sidebar';
  sidebar.setAttribute('aria-label', 'Tabla de contenido');
  sidebar.innerHTML =
    `<div class="toc-inner">
      <div class="toc-header">
        <span class="toc-title">${tocTitle}</span>
        <button id="toc-close" aria-label="Cerrar tabla de contenido">✕</button>
      </div>
      <nav class="toc-nav" aria-label="Índice de secciones">
        <div class="toc-group"><ul>${tocItems}</ul></div>
      </nav>
    </div>`;

  const pageLayout = document.querySelector('.page-layout');
  if (pageLayout) pageLayout.prepend(sidebar);

  // ── 4. Footer ─────────────────────────────────────────────────
  const sectionTitle = pageData?.title ?? 'BryanDocs';
  const footer = document.createElement('footer');
  footer.id = 'page-footer';
  footer.innerHTML =
    `<div class="footer-brand-block">
       <a href="${homeHref}" class="footer-brand-link">
         <span class="brand-mark" aria-hidden="true">&lt;/&gt;</span>
         BryanDocs
       </a>
       <p>Documentación interactiva de HTML &amp; CSS</p>
     </div>
     <div class="footer-section-block">
       <strong>${sectionTitle}</strong>
       <nav>
         <a href="${htmlTabHref}">HTML</a>
         <a href="${cssTabHref}">CSS</a>
         <a href="${homeHref}">Inicio</a>
       </nav>
     </div>
     <div class="footer-portfolio-block">
       <p>Creado por</p>
       <a href="https://bryancode.dev" target="_blank" rel="noopener noreferrer" class="footer-portfolio-link">
         Bryan López
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
       </a>
       <a href="https://bryancode.dev" target="_blank" rel="noopener noreferrer" class="footer-domain">bryancode.dev</a>
     </div>
     <div class="footer-bottom">
       <a href="#top" class="footer-top-link">↑ Volver arriba</a>
     </div>`;

  const existing = document.getElementById('page-footer');
  if (existing) {
    existing.replaceWith(footer);
  } else {
    document.querySelector('.page-layout')?.insertAdjacentElement('afterend', footer);
  }
})();
