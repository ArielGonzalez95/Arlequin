# ARLEQUIN — MAPA DE ARQUITECTURA FRONTEND
> Referencia de ingeniería para modificaciones quirúrgicas. Cada sección indica archivo exacto + línea de código afectada.

---

## STACK

| Item | Valor |
|------|-------|
| Framework | React 18.2.0 (Vite) |
| Entrada | `src/main.jsx` → `src/App.jsx` |
| Puerto dev | 5173 |
| Build | `npm run build` |
| Email | @emailjs/browser 4.4.1 |

---

## ÁRBOL DE ARCHIVOS

```
D:/Alequin/
├── index.html                          ← root div #root, carga main.jsx
├── vite.config.js                      ← configuración Vite, port 5173
├── package.json                        ← dependencias
├── src/
│   ├── main.jsx                        ← ReactDOM.createRoot
│   ├── index.css                       ← reset global (margin/padding/overflow)
│   ├── App.jsx                         ← orquestador raíz, máquina de estados de fases
│   ├── App.css                         ← estilos del contenedor raíz
│   ├── config/
│   │   └── contact.json                ← credenciales EmailJS
│   └── components/
│       ├── BackgroundAnimation.jsx/.css
│       ├── ThemeToggleStar.jsx/.css
│       ├── LogoAnimation.jsx/.css
│       ├── ArlequinMaskSystem.jsx/.css  ← orquestador de stages
│       ├── ArlequinMask.jsx/.css        ← animación máscara 2 mitades
│       ├── ArlequinEscudo.jsx/.css      ← botón HOME (escudo)
│       ├── QuestionStage.jsx/.css       ← pantalla "¿Conoces a Arlequín?"
│       ├── GridStage.jsx/.css           ← grilla 2x2 de cartas
│       ├── CardQueEsArlequin.jsx/.css   ← Carta 1
│       ├── CardQuienesSomos.jsx/.css    ← Carta 2
│       ├── CardServicios.jsx/.css       ← Carta 3
│       ├── CardContacto.jsx/.css        ← Carta 4 + formulario
│       ├── FooterBanner.jsx/.css        ← banner inferior scrolling
│       └── [deprecated] CardStage.jsx/.css, casino-title.css
└── public/
    ├── Cartas/                          ← imágenes de cartas (AVIF)
    ├── estrellas/                       ← 191 frames estrella rotando
    ├── isologo/                         ← 96 frames logo
    └── fonts/                           ← Cinzel-Black/Medium/ExtraBold.ttf
```

---

## FLUJO DE ANIMACIÓN — App.jsx

### Máquina de estados (`src/App.jsx` líneas 11-20)
```
HOME → LOGO_SHRINKING → MASK_CLOSING → MASK_OPENING → CONTENT_VISIBLE
                                                              ↕
                                               REVERSE_CLOSING → REVERSE_OPENING → LOGO_GROWING → HOME
```

### Handlers en App.jsx
| Handler | Línea | Qué hace |
|---------|-------|---------|
| `handleLogoClick` | L39 | HOME → LOGO_SHRINKING al clickear logo |
| `handleEscudoReset` | L45 | CONTENT_VISIBLE → REVERSE_CLOSING al clickear escudo |
| `handleMaskTransitionEnd` | L51 | Avanza cada fase al terminar transición CSS |
| `handleLogoGrowComplete` | L77 | LOGO_GROWING → HOME |
| `handleRequestMaskAnimation` | L82 | Reabre máscara para el flujo NO |

### Flags derivados (L88-96)
- `isLogoShrinking`: true en fases intermedias (oculta logo)
- `isLogoRestoring`: true en LOGO_GROWING

---

## SISTEMA DE STAGES — ArlequinMaskSystem.jsx

### Stages (`src/components/ArlequinMaskSystem.jsx` L14-21)
```
NONE → QUESTION → GRID → CARD_DETAIL
              ↘ NO → CARD_DETAIL(1) (con reapertura de máscara)
```

### Mapa de Carta → Componente (L24-29)
| Índice | Componente | Contenido |
|--------|-----------|---------|
| 1 | `CardQueEsArlequin` | "¿Qué es Arlequín?" — 3 páginas |
| 2 | `CardQuienesSomos` | "¿Quiénes somos?" — 4 páginas |
| 3 | `CardServicios` | "Servicios" — 7 páginas |
| 4 | `CardContacto` | Formulario + EmailJS |

### LocalStorage
| Key | Línea | Uso |
|-----|-------|-----|
| `themeMode` | App.jsx L9,24,31 | Persistir dark/light |
| `arlequin_answered` | ArlequinMaskSystem.jsx L60,89,95 | Si ya respondió la pregunta |

---

## COMPONENTES — REFERENCIA QUIRÚRGICA

---

### BackgroundAnimation
**Archivos:** `src/components/BackgroundAnimation.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| FPS de la animación (55ms) | `BackgroundAnimation.jsx` → constante `FRAME_DURATION` (buscar `55`) |
| Cantidad de estrellas (20) | `BackgroundAnimation.jsx` → constante `STAR_COUNT` |
| Zona segura alrededor del toggle (80px radio) | `BackgroundAnimation.jsx` → `SAFE_RADIUS` |
| Posicionamiento del canvas | `BackgroundAnimation.css` → `.background-canvas` |

---

### ThemeToggleStar
**Archivos:** `src/components/ThemeToggleStar.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| Posición del botón (top/left) | `ThemeToggleStar.css` → `.theme-toggle-btn` (fixed top:20px left:20px) |
| Tamaño del botón (60x60px) | `ThemeToggleStar.css` → `.theme-toggle-btn` width/height |
| Tooltip texto | `ThemeToggleStar.jsx` → texto dentro del elemento `.theme-tooltip` |
| z-index (2000) | `ThemeToggleStar.css` → `.theme-toggle-btn` z-index |
| Animación pulse | `ThemeToggleStar.css` → `@keyframes pulse-dark` / `@keyframes pulse-light` |

---

### LogoAnimation
**Archivos:** `src/components/LogoAnimation.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| Tamaño del logo (500px) | `LogoAnimation.jsx` → `export const LOGO_SIZE = 500` |
| Duración shrink (0.8s) | `LogoAnimation.css` → `.logo-shrinking` transition |
| Duración restore (0.79s) | `LogoAnimation.css` → `@keyframes logoRestoreGrow` |
| FPS apertura (35ms) / loop (55ms) / cierre (35ms) | `LogoAnimation.jsx` → `OPENING_FRAME_DURATION`, `LOOP_FRAME_DURATION`, `CLOSING_FRAME_DURATION` |
| Radio zona hover del logo | `LogoAnimation.jsx` → función de detección de distancia |

---

### ArlequinMask
**Archivos:** `src/components/ArlequinMask.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| Dimensiones máscara desktop (400x410px) | `ArlequinMask.css` → `.arlequin-mask` width/height |
| Dimensiones móvil (330x290px) | `ArlequinMask.css` → `@media (max-width: 600px)` |
| Posición mitad izquierda cerrada (-9px) | `ArlequinMask.css` → `.mask-left.closed` left |
| Posición mitad derecha cerrada (+5px) | `ArlequinMask.css` → `.mask-right.closed` right |
| Apertura izquierda (-200px) | `ArlequinMask.css` → `.mask-left.open` left |
| Apertura derecha (+200px) | `ArlequinMask.css` → `.mask-right.open` right |
| Duración transición (0.8s cubic-bezier) | `ArlequinMask.css` → `.mask-half` transition |

---

### ArlequinEscudo
**Archivos:** `src/components/ArlequinEscudo.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| Tamaño desktop (120px) | `ArlequinEscudo.css` → `.arlequin-escudo img` width |
| Tamaño móvil ≤430px (72px) | `ArlequinEscudo.css` → `@media (max-width: 430px)` |
| Posición vertical (top: 20px) | `ArlequinEscudo.css` → `.arlequin-escudo` top |
| Animación entrada (slide-down) | `ArlequinEscudo.css` → `@keyframes slide-down` |
| z-index (1003) | `ArlequinEscudo.css` → `.arlequin-escudo` z-index |

---

### QuestionStage
**Archivos:** `src/components/QuestionStage.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| Texto de la pregunta | `QuestionStage.jsx` → texto dentro de `.question-text` |
| Texto botón SÍ | `QuestionStage.jsx` → texto dentro de `.si-btn` |
| Texto botón NO | `QuestionStage.jsx` → texto dentro de `.no-btn` |
| Tamaño fuente pregunta (30px) | `QuestionStage.css` → `.question-text` font-size |
| Tamaño fuente móvil (24px) | `QuestionStage.css` → `@media` `.question-text` |
| Color/glow botones hover | `QuestionStage.css` → `.question-btn:hover` |

---

### GridStage
**Archivos:** `src/components/GridStage.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| Duración animación deal entrada (700ms total) | `GridStage.jsx` → delay de cada carta en deal phase |
| Texto overlay dark mode (color/stroke) | `GridStage.css` → `.card-text-overlay` con `.dark` |
| Texto overlay light mode | `GridStage.css` → `.card-text-overlay` con `.light` |
| Fuente overlay (22px CinzelExtraBold) | `GridStage.css` → `.card-text-overlay` font-size |
| Tamaño texto móvil ≤430px (18px) | `GridStage.css` → `@media (max-width: 430px)` |
| Tamaño texto móvil ≤390px (17px) | `GridStage.css` → `@media (max-width: 390px)` |
| Tamaño texto móvil ≤360px (14px) | `GridStage.css` → `@media (max-width: 360px)` |

---

### CardQueEsArlequin
**Archivos:** `src/components/CardQueEsArlequin.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| **Texto Página 1** | `CardQueEsArlequin.jsx` → array `PAGES[0]` |
| **Texto Página 2** | `CardQueEsArlequin.jsx` → array `PAGES[1]` |
| **Texto Página 3** | `CardQueEsArlequin.jsx` → array `PAGES[2]` |
| Tamaño canvas (550x680px) | `CardQueEsArlequin.jsx` → `CARD_WIDTH=550`, `CARD_HEIGHT=680` |
| Tamaño display (450x680px) | `CardQueEsArlequin.css` → `.card-canvas` width/height |
| Posición botón cerrar (X) | `CardQueEsArlequin.css` → `.card-close-btn` top/right |
| Posición flechas nav | `CardQueEsArlequin.css` → `.card-nav-btn` / `.card-nav-btn--prev` / `.card-nav-btn--next` |
| FPS animación carta (40ms) | `CardQueEsArlequin.jsx` → `CARD_FRAME_DURATION = 40` |
| Duración scale entrada (0.6s) | `CardQueEsArlequin.css` → `@keyframes card-enter-scale` |
| Duración scale salida (0.38s) | `CardQueEsArlequin.css` → `.card-canvas--exiting` animation |
| Fuente texto (Cinzel-Medium) | `CardQueEsArlequin.css` → `.card-text-content` font-family |
| Color texto | `CardQueEsArlequin.css` → `.card-text-content` color |
| Responsive escala ≤500px | `CardQueEsArlequin.css` → `@media (max-width: 500px)` scale |
| Responsive escala ≤390px (0.935) | `CardQueEsArlequin.css` → `@media (max-width: 390px)` scale |
| Responsive escala ≤360px (0.847) | `CardQueEsArlequin.css` → `@media (max-width: 360px)` scale |

---

### CardQuienesSomos
**Archivos:** `src/components/CardQuienesSomos.jsx` / `CardQuienesSomos.css`
*(también hereda `CardQueEsArlequin.css`)*

| Qué cambiar | Dónde |
|------------|-------|
| Foto Lucas | `CardQuienesSomos.jsx` → `src` con `arlequin_quienes_somos_lucas_web.avif` |
| Foto Ariel | `CardQuienesSomos.jsx` → `src` con `arlequin_quienes_somos_ariel.avif` |
| **Texto Página 3** (descripción equipo) | `CardQuienesSomos.jsx` → `PAGES[2]` |
| **Texto Página 4** (visión) | `CardQuienesSomos.jsx` → `PAGES[3]` |
| Posición/tamaño fotos (195px top, 95px left, 240x330px) | `CardQuienesSomos.css` → `.quienes-somos-photo` |

---

### CardServicios
**Archivos:** `src/components/CardServicios.jsx` / `CardServicios.css`
*(también hereda `CardQueEsArlequin.css`)*

| Qué cambiar | Dónde |
|------------|-------|
| **Texto Página 1** (intro) | `CardServicios.jsx` → `PAGES[0]` |
| **Texto Página 2** (Landing Page) | `CardServicios.jsx` → `PAGES[1]` |
| **Texto Página 3** (Personal/Profesional) | `CardServicios.jsx` → `PAGES[2]` |
| **Texto Página 4** (Reservas) | `CardServicios.jsx` → `PAGES[3]` |
| **Texto Página 5** (Empresa) | `CardServicios.jsx` → `PAGES[4]` |
| **Texto Página 6** (Sistemas) | `CardServicios.jsx` → `PAGES[5]` |
| **Texto Página 7** (Próximamente) | `CardServicios.jsx` → `PAGES[6]` |
| Color bullets diamante (♦ rojo) | `CardServicios.css` / inline → `rgba(220,50,50,0.68)` |

---

### CardContacto
**Archivos:** `src/components/CardContacto.jsx` / `CardContacto.css`
*(también hereda `CardQueEsArlequin.css`)*

| Qué cambiar | Dónde |
|------------|-------|
| **Posición formulario desktop** (top, right, width) | `CardContacto.css` L12-24 → `.contacto-form` top/right/width |
| **Rotación formulario** (25deg) | `CardContacto.css` L10 → `:root { --contacto-form-rotation: 25deg; }` |
| **Posición formulario móvil ≤430px** | `CardContacto.css` L119-130 → `@media (max-width: 430px)` |
| **Posición botón enviar desktop** (bottom:126px right:91px) | `CardContacto.css` L111-117 → `.contacto-send-area` bottom/right |
| **Posición botón enviar móvil ≤430px** (bottom:125px right:65px) | `CardContacto.css` L126-129 → `@media (max-width: 430px)` `.contacto-send-area` |
| Rotación botón enviar (-34deg) | `CardContacto.css` L142 → `.contacto-send-btn` transform |
| Color botón enviar (dorado #e7b81d) | `CardContacto.css` L136 → `.contacto-send-btn` color |
| Tamaño ícono enviar (28x28px) | `CardContacto.jsx` L403 → `width="28" height="28"` en SVG |
| Font/tamaño campos (Caveat 17px) | `CardContacto.css` L69-70 → `.contacto-field` font-family/size |
| Color texto campos (#1a3a6b) | `CardContacto.css` L71 → `.contacto-field` color |
| Color placeholder (rgba 26,58,107,0.65) | `CardContacto.css` L47-51 → `.contacto-field::placeholder` |
| Altura textarea (52px) | `CardContacto.css` L85 → `.contacto-textarea` height |
| Límite palabras descripción (30) | `CardContacto.jsx` L118 → `countWords(val) <= 30` |
| Mensaje éxito "¡Enviado!" | `CardContacto.jsx` L388 → texto span `.contacto-status--ok` |
| Mensaje error "Error al enviar" | `CardContacto.jsx` L389 → texto span `.contacto-status--error` |
| **Credenciales EmailJS** | `src/config/contact.json` → serviceId, templateId, publicKey, destinatario |
| Frames animación apertura | `CardContacto.jsx` L7-37 → arrays `CARD_FRAMES_CLEAR/BLACK` |
| Frame final (con botón visible) | `CardContacto.jsx` L39-40 → `CARD_FINAL_FRAME_CLEAR/BLACK` |

---

### FooterBanner
**Archivos:** `src/components/FooterBanner.jsx` / `.css`

| Qué cambiar | Dónde |
|------------|-------|
| Velocidad scroll (30s) | `FooterBanner.css` → `@keyframes scroll-left` duration |
| Escala móvil ≤500px (1.4x) | `FooterBanner.css` → `@media (max-width: 500px)` transform scale |
| z-index (50) | `FooterBanner.css` → `.footer-banner` z-index |

---

## SISTEMA DE TEMAS (dark/light)

| Qué cambiar | Dónde |
|------------|-------|
| Tema por defecto (dark=true) | `App.jsx` L25 → `return savedTheme ? savedTheme === 'dark' : true` |
| Key de localStorage | `App.jsx` L9 → `const THEME_STORAGE_KEY = 'themeMode'` |
| Prop que reciben todos los hijos | `isDarkMode` — prop drilling desde `App.jsx` |
| Suffix de imágenes dark | Todos los componentes usan `isDarkMode ? 'dark' : 'clear'` |

---

## ASSETS — CONVENCIÓN DE NOMBRES

```
/public/Cartas/
  arlequin_dorso_[clear|dark]_NNNNN.avif       ← frames reverso carta (00000-00023)
  arlequin_frente_[clear|dark]_NNNNN.avif       ← frames frente carta (00000-00023)
  arlequin_contacto_[clear|black]_NNNNN.avif    ← frames contacto (00007-00023)
  arlequin_contacto_[clear|dark]_boton.avif     ← frame final contacto (con botón)
  arlequin_mask_[1|2]_transition_[dark|clear].avif
  arlequin_escudo_[dark|clear].avif
  arlequin_elemento_web_X_[dark|clare].avif     ← botón cerrar (atención: "clare" no "clear")
  arlequin_baraja_A_pieza_[avanzar|retroceder]_web.avif ← flechas nav
  arlequin_quienes_somos_lucas_web.avif
  arlequin_quienes_somos_ariel.avif
  arlequin_banner_zocalo_[dark|clear].avif

/public/estrellas/
  estrella_giro_[clear|dark]_NNNNN.avif         ← 191 frames (00001-00191)

/public/isologo/
  isologo_[clear|dark]_NNNNN.avif               ← 96 frames (00000-00095)
```

> ⚠️ **TYPO conocido:** El botón cerrar usa `clare` (no `clear`) en el nombre de archivo.
> Ver `CardQueEsArlequin.jsx` y demás cartas: `arlequin_elemento_web_X_${isDarkMode ? 'dark' : 'clare'}.avif`

---

## BREAKPOINTS RESPONSIVE

| Breakpoint | Componentes afectados | Qué cambia |
|-----------|----------------------|-----------|
| `≤600px` | ArlequinMask | Dimensiones y posiciones de la máscara |
| `≤500px` | GridStage, FooterBanner | Grid, footer scale 1.4x |
| `≤430px` | ArlequinEscudo, CardContacto, GridStage | Escudo 72px, form right 18%, send btn right 65px, texto grid 18px |
| `≤390px` | Cards, GridStage | Card scale 0.935, texto grid 17px |
| `≤360px` | Cards, GridStage | Card scale 0.847, texto grid 14px |

---

## CACHING DE IMÁGENES

Todos los componentes de cartas usan cache a nivel de módulo para no re-descargar al cambiar tema:

```javascript
// Patrón en CardQueEsArlequin / CardQuienesSomos / CardServicios / CardContacto
const _openCache  = {};   // { 'dark': [...imgs], 'clear': [...imgs] }
const _closeCache = {};
```

Si se agregan nuevos frames, **limpiar este cache** cambiando el themeKey o recargando la app.

---

## CONFIG EMAILJS

**Archivo:** `src/config/contact.json`
```json
{
  "emailjs": {
    "serviceId":   "...",
    "templateId":  "...",
    "publicKey":   "..."
  },
  "destinatario": "..."
}
```
Modificar solo este archivo para cambiar credenciales. No hay hardcode de keys en el JSX (se leen via `contactConfig.emailjs.*` en `CardContacto.jsx` L128).

---

## PATRONES DE ANIMACIÓN USADOS

| Patrón | Componentes | Cómo modificar |
|--------|------------|----------------|
| `requestAnimationFrame` | Background, Logo, todas las Cartas | Cambiar `FRAME_DURATION` en el componente |
| CSS `transition` | ArlequinMask (movimiento), Logo (shrink) | Editar `transition:` en el CSS del componente |
| CSS `@keyframes` | Escudo (slide-down), Cards (scale enter/exit), Footer (scroll) | Editar el keyframe en el CSS correspondiente |
| Canvas 2D | Todos los animados | Cambiar `CARD_WIDTH`/`CARD_HEIGHT` y escala DPR |

---

## ARCHIVOS DEPRECATED (no modificar)

| Archivo | Estado |
|---------|--------|
| `src/components/CardStage.jsx/.css` | Reemplazado por GridStage + cards individuales |
| `src/components/casino-title.css` | Sin uso en producción |
| `src/components/GridStage-ORIGINAL.css` | Backup, ignorar |
| `src/components/GridStage.css.backup-casino` | Backup, ignorar |
| `src/components/CardQuemiesSomos.css` | Typo en nombre, usar `CardQuienesSomos.css` |
