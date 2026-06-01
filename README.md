# BryanDocs

Sitio de documentación interactiva de tecnologías web, disponible en **[docs.bryancode.dev](https://docs.bryancode.dev)**. Parte del portafolio personal en [bryancode.dev](https://bryancode.dev).

---

## Vista general

BryanDocs es una referencia técnica con demos en vivo, playgrounds interactivos y búsqueda integrada. Sin dependencias de terceros ni frameworks de build — HTML, CSS y JavaScript puro.

### Características principales

- **Búsqueda en tiempo real** — filtra tarjetas localmente y muestra resultados de otras secciones gracias a un índice global pre-generado
- **Autocomplete** — sugerencias mientras se escribe, navegable con teclado
- **Playgrounds interactivos** — Flexbox, Grid, Box Model, Tipografía, Colores, Animaciones, Box Shadow, Border Radius y más
- **Sidebar TOC con scroll spy** — resalta automáticamente la sección visible; incluye sub-ítems por tarjeta dentro de la sección activa
- **Modo búsqueda enfocado** — al buscar, el contenido normal se reemplaza por los resultados en una vista limpia
- **Componentes globales** — `components.js` inyecta header, sidebar y footer dinámicamente para evitar duplicación de código
- **Diseño responsive** — sidebar colapsable, drawer móvil, layout adaptable

---

## Estructura del proyecto

```
bryandocs/
├── index.html                  # Landing page
│
├── html/                       # Documentación HTML
│   ├── index.html              # Introducción a HTML
│   ├── estructura.html         # Estructura del documento
│   ├── texto.html              # Texto y tipografía
│   ├── listas.html             # Listas
│   ├── media.html              # Imágenes y media
│   ├── tablas.html             # Tablas
│   ├── formularios.html        # Formularios
│   ├── semantica.html          # Semántica HTML5
│   ├── interactivo.html        # Interactividad y accesibilidad
│   └── meta.html               # Scripts y meta
│
├── css/                        # Documentación CSS
│   ├── index.html              # Introducción a CSS
│   ├── selectores.html         # Selectores
│   ├── boxmodel.html           # Box Model
│   ├── display.html            # Display y posición
│   ├── flexbox.html            # Flexbox
│   ├── grid.html               # CSS Grid
│   ├── tipografia.html         # Tipografía
│   ├── colores.html            # Colores y fondos
│   ├── animaciones.html        # Transiciones y animaciones
│   ├── variables.html          # Variables y funciones CSS
│   ├── pseudos.html            # Pseudoclases y pseudoelementos
│   └── responsive.html         # Responsive y @rules
│
├── styles/
│   └── styles.css              # Estilos globales (~3100 líneas)
│
└── js/
    ├── components.js           # Inyección de header, TOC y footer
    ├── app.js                  # Lógica de búsqueda, scroll spy, playgrounds
    └── search-index.js         # Índice de búsqueda pre-generado
```

---

## Arquitectura

### Componentes globales (`js/components.js`)

Cada página de sección es un archivo HTML mínimo que solo contiene el `<head>` con meta únicos y el `<main>` con el contenido. Al cargar, `components.js`:

1. Detecta la carpeta actual (`html/` o `css/`) desde `location.pathname`
2. Inyecta el `<header>` con el tab activo correcto y la barra de búsqueda
3. Genera e inyecta el `<aside>` con el TOC completo, marcando el ítem activo
4. Inyecta el `<footer>` con el título de la sección y links al portafolio

Esto elimina ~100 líneas de código repetido por archivo (×22 archivos = ~2.200 líneas eliminadas).

### Búsqueda (`js/app.js` + `js/search-index.js`)

- `search-index.js` es un índice plano pre-generado con todos los conceptos del sitio
- La búsqueda local filtra las tarjetas de la página actual en tiempo real
- La búsqueda global consulta el índice para encontrar coincidencias en otras secciones
- Cuando hay resultados, el modo búsqueda oculta el contenido normal y muestra los resultados agrupados por sección con `body.searching`
- Las rutas en el índice usan formato `"html/estructura.html"` / `"css/selectores.html"` para que `relLink()` genere paths relativos correctos desde cualquier carpeta

### Scroll spy

Dos niveles de scroll spy independientes:

| Nivel | Selector | Comportamiento |
|---|---|---|
| Sección principal | `.category[id]` | IntersectionObserver — resalta el ítem del TOC de la sección visible |
| Sub-ítems (tarjetas) | IDs generados por JS | Scroll listener — resalta la tarjeta más cercana al tope del viewport; fallback para los últimos ítems cuando se llega al final de la página |

---

## Añadir una nueva sección

### Dentro de una tecnología existente (ej. nueva página CSS)

1. Crear `css/mi-seccion.html` copiando la estructura de cualquier página existente
2. Añadir la entrada en `js/components.js` dentro del array `CSS_SECTIONS`
3. Añadir las entradas en `js/search-index.js` con el formato `{file:"css/mi-seccion.html", ...}`
4. Añadir la tarjeta en `index.html` dentro del grupo CSS

### Nueva tecnología completa (ej. JavaScript)

Ver la sección [Roadmap](#roadmap) más abajo para el plan detallado.

---

## Desarrollo local

No requiere instalación ni build. Abre el proyecto con Live Server (VS Code) o cualquier servidor estático:

```bash
# Con Node.js
npx serve .

# Con Python
python3 -m http.server 5500
```

Navegar a `http://localhost:5500`.

> **Nota:** el proyecto debe servirse desde un servidor HTTP, no abrirse directamente como archivo (`file://`) por las rutas relativas entre carpetas.

---

## Roadmap

El objetivo a largo plazo es convertir BryanDocs en una referencia completa del desarrollo web moderno. Cada tecnología tendrá su propia carpeta con la misma arquitectura de componentes.

### En progreso

| Tecnología | Estado | Carpeta |
|---|---|---|
| HTML | ✅ Completo | `html/` |
| CSS | ✅ Completo | `css/` |

### Planeado

#### JavaScript — `js-docs/`

Documentación del lenguaje con énfasis en ejemplos prácticos y demos de consola integrados.

| Sección | Contenido |
|---|---|
| Fundamentos | Variables, tipos, operadores, control de flujo |
| Funciones | Declaraciones, arrow functions, closures, callbacks |
| Arrays y objetos | Métodos, desestructuración, spread/rest |
| DOM | Selección, manipulación, eventos, delegación |
| Async | Promises, async/await, fetch, manejo de errores |
| ES Modules | import/export, módulos dinámicos |
| Web APIs | localStorage, IntersectionObserver, Fetch API, Web Workers |
| Patrones | Módulo, observer, factory, clases |

#### TypeScript — `typescript/`

Extensión natural de la sección JS, centrada en el sistema de tipos.

| Sección | Contenido |
|---|---|
| Tipos básicos | Primitivos, arrays, tuplas, enums |
| Interfaces y tipos | type vs interface, union, intersection |
| Generics | Funciones, clases, constraints |
| Utility Types | Partial, Required, Pick, Omit, Record |
| tsconfig | Opciones del compilador, strict mode |

#### React — `react/`

Librería de UI con hooks, patrones de estado y ecosistema.

| Sección | Contenido |
|---|---|
| Fundamentos | JSX, componentes, props, renderizado |
| Hooks | useState, useEffect, useContext, useRef, useMemo |
| Formularios | Controlled/uncontrolled, validación |
| Routing | React Router, rutas dinámicas, navegación |
| Estado global | Context API, Zustand, Redux Toolkit |
| Performance | memo, useCallback, lazy, Suspense |
| Patrones | Compound components, render props, HOC |

#### Git & CLI — `git/`

Referencia de comandos con explicaciones del modelo de datos de Git.

| Sección | Contenido |
|---|---|
| Conceptos | Working tree, staging area, commits, HEAD |
| Flujos | Feature branches, rebase vs merge, cherry-pick |
| Colaboración | Fork, pull requests, resolución de conflictos |
| Avanzado | Stash, bisect, reflog, hooks |

#### Accesibilidad — `a11y/`

| Sección | Contenido |
|---|---|
| Fundamentos WCAG | Niveles A, AA, AAA — criterios clave |
| ARIA | Roles, states, properties, live regions |
| Teclado | Orden de foco, skip links, modales accesibles |
| Testing | Herramientas: axe, Lighthouse, screen readers |

#### Node.js — `nodejs/`

Backend JavaScript con enfoque en APIs REST y herramientas de línea de comandos.

| Sección | Contenido |
|---|---|
| Core | Módulos, file system, path, streams |
| HTTP | http module, Express.js, middleware |
| Base de datos | Prisma, consultas, migraciones |
| CLI tools | process.argv, chalk, prompts |
| Testing | Vitest, mocking, coverage |

---

## Decisiones de diseño

**Sin framework de build** — el sitio es HTML/CSS/JS puro para que cualquiera pueda leerlo, modificarlo y desplegarlo sin configuración.

**Índice de búsqueda pre-generado** — `search-index.js` se genera una vez y se actualiza manualmente cuando se añade contenido. Evita depender de un backend o un servicio externo para la búsqueda.

**Componentes vía JS, no SSG** — `components.js` inyecta el shell compartido en el cliente. Es suficiente para un sitio de documentación sin sacrificar la simplicidad de un servidor estático.

**Una carpeta por tecnología** — escala linealmente; añadir JavaScript no toca nada de HTML ni CSS.

---

## Créditos

Creado por **Bryan López** — [bryancode.dev](https://bryancode.dev)  
Disponible en **[docs.bryancode.dev](https://docs.bryancode.dev)**
