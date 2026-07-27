# ShelfZero — DESIGN_SPEC

> Especificación de implementación. Escrita para aplicarse sin consultar a nadie.
> Base: `DESIGN_BRIEF.md` (2026-07-26). React 19 + Tailwind v4, sin dependencias nuevas.
> Todos los ratios de contraste de este documento están calculados (WCAG 2.1, sRGB) y
> anotados con su fondo. Si un valor no aparece, es porque el color no toca texto.
>
> Profundidad deliberada en §10.2–§10.4 (sistema + estante). Las pantallas 3–6 llevan
> cambios concretos pero menos exhaustivos, según la prioridad pedida.

---

## 10.1 Resumen de decisiones

1. La paleta de papel no cambia; cambian los grises cálidos: `ink-soft` y `ink-faint` bajan hasta cumplir AA sobre los tres papeles.
2. `gold` deja de ser un color de texto: se oscurece a `#a07c3c` (uso decorativo, 3:1) y se añade `gold-deep` `#8a6224` (4.64:1) para texto y sellos.
3. Se añaden 7 tokens: `paper-raise`, `gold-deep`, `wood-dark`, `rule`, `rule-strong`, `focus`, `focus-inverse`. Nada más entra en la paleta.
4. Escala tipográfica explícita de 8 niveles con tokens `--text-*` (v4 los soporta con su interlineado), para acabar con los tamaños arbitrarios.
5. Ritmo vertical de 8 px: se permiten solo los pasos 1, 2, 3, 4, 6, 8, 12, 16.
6. Foco global una vez, en `@layer base` (`outline` + `outline-offset`), con variante inversa para superficies oscuras y sobre `spine`.
7. El estante separa por fin los dos contextos: cabecera de 56 px + una sola fila de filtros (antes ~40% del alto), y un FAB de escaneo que abre la cámara en **un** toque.
8. La rejilla se dibuja **por filas** (libros alineados al canto inferior sobre una balda continua), lo que absorbe la disparidad de portadas.
9. "Comprado" pasa de opacidad triste a sello tipográfico + sección propia *Adquiridos* al final del estante.
10. Cuatro componentes nuevos sobre una base común `Sheet` (foco atrapado, `Esc`, animación CSS): `ConfirmDialog`, `PromptDialog`, `Toast`, `Skeleton`. Modo oscuro completo por sobrescritura de variables.

---

## 10.2 Tokens

### Color

| Token | Actual | Nuevo | Contraste | Nota |
|---|---|---|---|---|
| `--color-paper` | `#f4ecdd` | `#f4ecdd` | — | sin cambio (fondo) |
| `--color-paper-2` | `#eee2cd` | `#eee2cd` | — | sin cambio (hover, filas) |
| `--color-paper-3` | `#e6d7bd` | `#e6d7bd` | — | sin cambio (pastillas) |
| `--color-paper-raise` | — | `#faf5ea` | ink 13.94:1 | **añadido**. Superficie elevada: diálogos, toast, tarjetas. Es el papel *nuevo* sobre el papel viejo |
| `--color-ink` | `#2a2521` | `#2a2521` | 12.92 / paper · 11.84 / paper-2 · 10.70 / paper-3 · 13.94 / paper-raise | sin cambio |
| `--color-ink-soft` | `#5c5148` | `#4e443c` | 8.07 / paper · 7.40 / paper-2 · 6.69 / paper-3 | oscurecido; texto secundario largo (autores, resúmenes) |
| `--color-ink-faint` | `#8a7d6f` | `#675a4c` | 5.69 / paper · 5.22 / paper-2 · 4.71 / paper-3 · 6.14 / paper-raise | **corrige AA (6.1)**. Cumple sobre los cuatro fondos, incluido paper-3 |
| `--color-spine` | `#9a3b32` | `#9a3b32` | 5.87 / paper · 5.38 / paper-2 · 4.87 / paper-3 · y **5.87 de paper sobre spine** | sin cambio: ya cumplía AA en ambos sentidos. Marca intacta |
| `--color-spine-dark` | `#7c2d26` | `#7c2d26` | 7.91 / paper · 7.91 de paper sobre spine-dark | sin cambio (hover/active) |
| `--color-gold` | `#b8894b` | `#a07c3c` | 3.29 / paper · 3.01 / paper-2 | **corrige 6.1 parcialmente**: sigue siendo decorativo (viñetas, filetes, reglas) y ahora cumple el 3:1 de elemento de interfaz. **Prohibido para texto** |
| `--color-gold-deep` | — | `#8a6224` | 4.64 / paper · 4.26 / paper-2 · 5.01 / paper-raise | **añadido**. Único dorado válido para texto e iconos: sello "Adquirido", metadatos destacados. Sobre paper-2 solo texto grande (≥18.66 px bold o ≥24 px) |
| `--color-wood` | `#7a5a3a` | `#7a5a3a` | 5.34 / paper | sin cambio (cara de la balda) |
| `--color-wood-dark` | — | `#5f452c` | 7.53 / paper | **añadido**. Canto y sombra de la balda; da grosor sin usar opacidades sueltas |
| `--color-rule` | — | `#a89272` | 2.55 / paper | **añadido**. Filete puramente decorativo (separadores dentro de una tarjeta ya delimitada). No usar como único borde de un control |
| `--color-rule-strong` | — | `#877253` | 3.92 / paper · 3.59 / paper-2 · 4.23 / paper-raise | **añadido**. Borde de controles: inputs, botones secundarios, chips seleccionables. Cumple el 3:1 de componente |
| `--color-focus` | — | `#2a2521` | 12.92 / paper | **añadido** (6.3). Anillo de foco sobre papel |
| `--color-focus-inverse` | — | `#f4ecdd` | 5.87 sobre spine · 14.78 sobre paper oscuro | **añadido**. Anillo de foco dentro de superficies oscuras (escáner, toast oscuro, modo noche) |

Notas de uso obligatorias:

- `ink-faint` es **texto**, no decoración: metadatos, contadores, marcadores de posición, vacíos. Nunca por debajo de 13 px.
- Ningún texto sobre `gold`. Ninguna información **solo** en color (el estado "adquirido" lleva sello + texto).
- Las sombras siguen tintadas con `ink`; se centralizan en tokens `--shadow-*` (abajo) para no seguir inventando `shadow-md shadow-ink/20` por sitio.

### Tipografía, tamaños, radios, sombras

| Token | Actual | Nuevo | Nota |
|---|---|---|---|
| `--font-display` | pila Iowan | igual | sin cambio (ver §10.4.7 sobre fuente web: **opcional, no bloqueante**) |
| `--font-sans` | pila de sistema | igual | sin cambio |
| `--text-micro` | — | `0.75rem` / 1.25 | **añadido**. Solo etiquetas en versalitas con `tracking-wide` |
| `--text-meta` | — | `0.8125rem` / 1.35 | **añadido**. Metadatos, contadores, autor en rejilla |
| `--text-body` | — | `0.9375rem` / 1.55 | **añadido**. Cuerpo de interfaz (15 px; el `text-sm` de hoy es demasiado pequeño en móvil) |
| `--text-lede` | — | `1.0625rem` / 1.6 | **añadido**. Resumen del libro y lema |
| `--radius-sm` … `--radius-2xl` | de Tailwind | fijados | portadas 2 px, tarjetas 16 px, diálogos 20 px |
| `--shadow-cover`, `--shadow-cover-lift`, `--shadow-sheet`, `--shadow-raise`, `--shadow-toast` | — | ver bloque | **añadidos** |
| `--ease-paper`, `--dur-*` | — | ver bloque | **añadidos**. Curva y duraciones únicas (6.12) |

### Bloque `@theme` completo (pegar en `src/index.css`)

Sustituye desde `@import "tailwindcss";` hasta el final del `h1,h2,h3`.

```css
@import "tailwindcss";

/* Modo oscuro por clase en <html>, no por media query:
   la app ofrece Claro / Oscuro / Sistema. */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* ---- papel ---- */
  --color-paper: #f4ecdd;
  --color-paper-2: #eee2cd;
  --color-paper-3: #e6d7bd;
  --color-paper-raise: #faf5ea;

  /* ---- tinta ---- */
  --color-ink: #2a2521;
  --color-ink-soft: #4e443c;
  --color-ink-faint: #675a4c;

  /* ---- marca y madera ---- */
  --color-spine: #9a3b32;
  --color-spine-dark: #7c2d26;
  --color-gold: #a07c3c;
  --color-gold-deep: #8a6224;
  --color-wood: #7a5a3a;
  --color-wood-dark: #5f452c;

  /* ---- líneas y foco ---- */
  --color-rule: #a89272;
  --color-rule-strong: #877253;
  --color-focus: #2a2521;
  --color-focus-inverse: #f4ecdd;

  /* ---- tipografía ---- */
  --font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia,
    "Times New Roman", serif;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;

  --text-micro: 0.75rem;
  --text-micro--line-height: 1.25;
  --text-micro--letter-spacing: 0.08em;
  --text-meta: 0.8125rem;
  --text-meta--line-height: 1.35;
  --text-body: 0.9375rem;
  --text-body--line-height: 1.55;
  --text-lede: 1.0625rem;
  --text-lede--line-height: 1.6;

  /* ---- radios ---- */
  --radius-sm: 0.125rem;   /* portadas: los libros no tienen esquinas redondas */
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;       /* tarjetas */
  --radius-2xl: 1.25rem;   /* diálogos */

  /* ---- sombras (siempre tinta cálida, nunca negro puro) ---- */
  --shadow-cover: 0 1px 2px rgb(42 37 33 / 0.20), 0 6px 12px -6px rgb(42 37 33 / 0.22);
  --shadow-cover-lift: 0 2px 4px rgb(42 37 33 / 0.22), 0 14px 24px -10px rgb(42 37 33 / 0.30);
  --shadow-raise: 0 1px 2px rgb(42 37 33 / 0.08), 0 8px 20px -12px rgb(42 37 33 / 0.20);
  --shadow-sheet: 0 24px 48px -12px rgb(42 37 33 / 0.35);
  --shadow-toast: 0 10px 30px -10px rgb(42 37 33 / 0.45);

  /* ---- movimiento ---- */
  --ease-paper: cubic-bezier(0.2, 0.7, 0.2, 1);
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 320ms;
}

/* ---- modo oscuro: mismos nombres, otros valores ----
   Las utilidades (bg-paper, text-ink-faint…) siguen funcionando sin
   escribir una sola regla dark: en los componentes.
   Papel viejo y cuero: no gris azulado. */
html.dark {
  --color-paper: #191411;
  --color-paper-2: #211a15;
  --color-paper-3: #2b221a;
  --color-paper-raise: #241d17;

  --color-ink: #f0e6d6;        /* 14.78:1 sobre paper */
  --color-ink-soft: #cbbca6;   /* 9.82:1 */
  --color-ink-faint: #a3947f;  /* 6.18:1 / 5.27:1 sobre paper-3 */

  --color-spine: #d06253;      /* 4.83:1 sobre paper; texto encima: #191411 (4.83:1) */
  --color-spine-dark: #dd7566; /* hover = más claro en oscuro (5.93:1) */
  --color-gold: #c99a55;       /* 7.17:1 */
  --color-gold-deep: #d0a260;  /* 7.85:1 — el dorado de texto también invierte */
  --color-wood: #4a3524;
  --color-wood-dark: #2f2117;

  --color-rule: #453a2e;
  --color-rule-strong: #7a6851; /* 3.42:1 sobre paper */
  --color-focus: #f0e6d6;
  --color-focus-inverse: #191411;

  --shadow-cover: 0 1px 2px rgb(0 0 0 / 0.55), 0 6px 14px -6px rgb(0 0 0 / 0.6);
  --shadow-cover-lift: 0 2px 6px rgb(0 0 0 / 0.6), 0 16px 28px -10px rgb(0 0 0 / 0.7);
  --shadow-raise: 0 1px 2px rgb(0 0 0 / 0.5), 0 8px 22px -12px rgb(0 0 0 / 0.6);
  --shadow-sheet: 0 24px 48px -12px rgb(0 0 0 / 0.7);
  --shadow-toast: 0 10px 30px -10px rgb(0 0 0 / 0.75);
}

body {
  margin: 0;
  min-height: 100dvh;
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: 1.55;
  color: var(--color-ink);
  background-color: var(--color-paper);
  background-image:
    radial-gradient(circle at 20% 20%, rgb(160 124 60 / 0.07), transparent 42%),
    radial-gradient(circle at 80% 0%, rgb(154 59 50 / 0.05), transparent 35%);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

html.dark body {
  background-image:
    radial-gradient(circle at 20% 20%, rgb(201 154 85 / 0.10), transparent 42%),
    radial-gradient(circle at 80% 0%, rgb(208 98 83 / 0.08), transparent 38%);
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 600;
  text-wrap: balance;
}

/* Títulos y textos largos: evitar líneas huérfanas y palabras partidas. */
p { text-wrap: pretty; }

@layer base {
  /* ---- FOCO: una sola regla para toda la app (6.3) ---- */
  :focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
  /* Sobre superficies oscuras o sobre spine, el elemento se marca
     con .on-dark y el anillo se invierte. */
  .on-dark :focus-visible,
  .on-dark:focus-visible {
    outline-color: var(--color-focus-inverse);
  }
  :focus:not(:focus-visible) { outline: none; }

  /* Nada de scroll encadenado desde los diálogos. */
  [data-sheet] { overscroll-behavior: contain; }
}

/* ---- movimiento propio, sin librerías (6.12) ---- */
@keyframes sz-rise {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to   { opacity: 1; transform: none; }
}
@keyframes sz-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes sz-sheet-in {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}
@keyframes sz-toast-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
@keyframes sz-shimmer {
  from { background-position: -160% 0; }
  to   { background-position: 260% 0; }
}
@keyframes sz-stamp {
  from { opacity: 0; transform: rotate(-6deg) scale(1.4); }
  60%  { opacity: 1; transform: rotate(-6deg) scale(0.96); }
  to   { opacity: 1; transform: rotate(-6deg) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
  }
}
```

---

## 10.3 Fundamentos

### Escala tipográfica

| Nivel | Utilidades Tailwind | Px (móvil) | Cuándo |
|---|---|---|---|
| Display 1 | `font-display text-3xl leading-[1.08] font-semibold tracking-[-0.01em]` | 30 | Título de la ficha de libro, lema de bienvenida. Uno por pantalla |
| Display 2 | `font-display text-2xl leading-[1.15] font-semibold` | 24 | Título de pantalla ("Estante"), logotipo, título de la vista pública |
| Display 3 | `font-display text-lg leading-snug font-semibold` | 18 | Cabecera de diálogo, nombre de sección ("Adquiridos") |
| Título de libro | `font-display text-base leading-snug font-medium` | 16 | Filas de la vista lista, resultados de búsqueda |
| Título en rejilla | `font-display text-meta leading-tight font-medium` | 13 | Bajo la portada en la rejilla (2 líneas máx.) |
| Cuerpo | `text-body leading-normal` | 15 | Interfaz general, botones, campos |
| Lede | `text-lede leading-relaxed text-ink-soft` | 17 | Resumen del libro, párrafos de bienvenida |
| Meta | `text-meta text-ink-faint` | 13 | Autor secundario, año, contadores, marcadores de posición |
| Micro | `text-micro font-medium uppercase tracking-wide text-ink-faint` | 12 | Etiquetas de sección, sello, "3 de 47". **Nunca frases** |

Reglas: máximo **tres** niveles por pantalla. La display siempre en `font-medium`/`font-semibold` (la pila Palatino/Georgia en `bold` se ensucia). Nada de `font-bold` en serif. Los números de contadores con `tabular-nums`.

### Espaciado (ritmo de 8)

Pasos permitidos: `1` (4 px, solo entre icono y su etiqueta), `2` (8), `3` (12), `4` (16), `6` (24), `8` (32), `12` (48), `16` (64). **Nada de `p-5`, `gap-7`, `mt-1.5`** — el ritmo roto es lo primero que se nota.

| Uso | Valor |
|---|---|
| Margen lateral de pantalla, móvil | `px-4` |
| Margen lateral, ≥640 px | `px-6`; contenedor `mx-auto max-w-6xl` |
| Separación entre bloques de una pantalla | `space-y-6` |
| Relleno de tarjeta / panel de diálogo | `p-4` móvil, `sm:p-6` |
| Fila de lista | `px-4 py-3` (alto resultante ≥ 72 px) |
| Rejilla del estante | `gap-x-3 gap-y-8` móvil, `sm:gap-x-4` |
| Área táctil mínima | `min-h-11 min-w-11` (44 px). Los iconos de 24 px van centrados dentro |
| Zona segura inferior (FAB, barras) | `pb-[max(1rem,env(safe-area-inset-bottom))]` |

### Radios

`rounded-sm` portadas y miniaturas · `rounded-md` campos e imágenes secundarias · `rounded-xl` tarjetas · `rounded-2xl` paneles de diálogo · `rounded-full` botones, pastillas, FAB. Sin excepciones nuevas.

### Sombras

`shadow-cover` portadas en reposo · `shadow-cover-lift` en `group-hover`/`focus-within` · `shadow-raise` tarjetas y toast · `shadow-sheet` paneles de diálogo. Prohibido `shadow-2xl` y cualquier sombra sin tinte cálido.

### Estados (todos los controles)

| Estado | Botón principal | Botón secundario | Fila / tarjeta pulsable |
|---|---|---|---|
| Reposo | `bg-spine text-paper shadow-raise` | `border border-rule-strong text-ink` | `bg-transparent` |
| Hover (solo `@media (hover:hover)`) | `hover:bg-spine-dark` | `hover:bg-paper-2` | `hover:bg-paper-2` |
| Foco | anillo global (`:focus-visible`); el botón spine lleva `.on-dark` **solo** si su contenido es interactivo — el anillo cae fuera, sobre el papel, así que la regla global basta | idem | `focus-visible:outline-2` |
| Activo | `active:scale-[0.97] active:bg-spine-dark` | `active:bg-paper-3` | `active:bg-paper-3` |
| Deshabilitado | `disabled:bg-ink/25 disabled:text-paper disabled:shadow-none disabled:cursor-not-allowed` (nunca por debajo de 3:1 de forma) | `disabled:border-rule disabled:text-ink-faint` | `aria-disabled:opacity-60` |
| Cargando | texto intacto + `Spinner` de 16 px a la izquierda, ancho fijo con `min-w-` para que el botón no salte | idem | esqueleto |

Clase base de botón, copiar tal cual:

```jsx
// principal
className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-spine
           px-5 text-body font-medium text-paper shadow-raise transition
           duration-[--dur-fast] ease-[--ease-paper] hover:bg-spine-dark
           active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-ink/25
           disabled:shadow-none"

// secundario
className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border
           border-rule-strong px-4 text-body font-medium text-ink transition
           duration-[--dur-fast] hover:bg-paper-2 active:bg-paper-3
           disabled:border-rule disabled:text-ink-faint"

// icono suelto (siempre con aria-label)
className="inline-flex size-11 items-center justify-center rounded-full text-ink
           transition hover:bg-ink/8 active:bg-ink/12"
```

Campo de texto:

```jsx
className="w-full min-h-11 rounded-md border border-rule-strong bg-paper-raise px-3
           text-body text-ink placeholder:text-ink-faint
           focus:border-spine focus-visible:outline-2"
```

Iconos: SVG en línea 24×24, `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"`, con `aria-hidden="true"` y `class="size-6 shrink-0"`. Los que hacen falta nuevos están al final de §10.5.

---

## 10.4 Pantalla por pantalla

### 10.4.1 Estante — armazón (`src/App.tsx`)

**Problema que resuelve:** 6.9 (la cabecera, el orden, el selector de vista y las listas se comen ~40% del alto antes del primer libro), 6.4 (capturar cuesta tres toques), 6.14 (no se puede buscar ni filtrar), 6.10 (la bienvenida desaparece).

**Cambios:**

1. **Un solo bloque de cabecera pegajoso de 56 px**: monograma + "Estante" + contador a la izquierda; a la derecha tres botones de 44 px: *buscar*, *cambiar vista*, *menú*. Desaparecen la fila de ordenación y el selector de vista como filas independientes.
2. **El orden se mueve al menú** (`⋯` → hoja inferior con Añadidos / Título / Autor / Temática, marca de verificación en el activo). Elimina la fila que se deslizaba sin señal.
3. **Una única fila de filtros**, 44 px, con las listas y los estados: `Todo · Pendientes · Adquiridos · —filete— · Lista A · Lista B · ＋`. Se desliza en horizontal **con señal**: máscara de degradado en los bordes (`mask-image`) y el chip activo autoenfocado. Si no hay listas y no hay comprados, la fila no se renderiza.
4. **Búsqueda local** (6.14): el botón de buscar sustituye la cabecera por un campo a pantalla completa de ancho, con contador "12 de 47" y botón de limpiar. Filtra por título, autor y temática, sin acentos ni mayúsculas.
5. **La cabecera se condensa al bajar**: el título pasa de Display 2 a Cuerpo y la fila de filtros se retrae (`-translate-y-full`), volviendo al subir. Un solo `useEffect` con `scrollY` y un umbral de 24 px.
6. **FAB de escaneo** (6.4): fijo abajo a la derecha, 56 px, `bg-spine`, icono de código de barras. Un toque abre `AddBookDialog` con la pestaña *Escanear* activa. Añadir por título/ISBN sigue disponible desde el `＋` del menú y desde el propio diálogo. El FAB se oculta mientras hay un diálogo abierto.
7. **Los diálogos nativos desaparecen** (6.2): `App.tsx:81` usa `<PromptDialog>` y `App.tsx:103` usa `<ConfirmDialog>` (§10.5).
8. **Toast** al guardar, borrar y marcar como adquirido (6.5), con acción *Deshacer* en borrar.
9. La bienvenida vuelve desde el menú (`⋯` → "Sobre ShelfZero") reutilizando `Welcome.tsx` en modo diálogo (6.10).

**Móvil (375px):** cabecera 56 + filtros 44 = 100 px de cromo (antes ~256). El FAB queda a 16 px del borde y respeta `env(safe-area-inset-bottom)`. La búsqueda ocupa la cabecera completa; nada se coloca a menos de 44 px del pulgar.

**Antes/después:** antes se veía media portada al abrir la app; ahora se ven dos filas completas de libros, y escanear es un toque en lugar de tres.

**JSX del armazón** (sustituye el `return` de `App.tsx`; los nombres de estado existentes se mantienen):

```jsx
<div className="min-h-dvh">
  {/* ---------- cabecera ---------- */}
  <header
    className="sticky top-0 z-30 border-b border-rule/50 bg-paper/85 backdrop-blur-md
               supports-[backdrop-filter]:bg-paper/70"
  >
    <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
      {searching ? (
        <>
          <label htmlFor="shelf-q" className="sr-only">Buscar en el estante</label>
          <input
            id="shelf-q"
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && closeSearch()}
            placeholder="Título, autor o temática"
            className="min-h-11 flex-1 rounded-md border border-rule-strong bg-paper-raise
                       px-3 text-body placeholder:text-ink-faint focus:border-spine"
          />
          <span className="shrink-0 text-meta tabular-nums text-ink-faint">
            {visible.length} de {books.length}
          </span>
          <button
            onClick={closeSearch}
            aria-label="Cerrar búsqueda"
            className="inline-flex size-11 items-center justify-center rounded-full
                       text-ink transition hover:bg-ink/8"
          >
            {/* icono X */}
          </button>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-sm bg-spine
                       font-display text-[0.9375rem] font-semibold leading-none text-paper
                       shadow-[inset_0_-1px_0_rgb(0_0_0/0.25)]"
          >
            S0
          </span>
          <h1
            className={
              "font-display font-semibold text-ink transition-all duration-[--dur-base] " +
              (condensed ? "text-body" : "text-2xl")
            }
          >
            Estante
          </h1>
          <span className="mt-0.5 text-meta tabular-nums text-ink-faint">
            {pendingCount}
          </span>
          <div className="ml-auto flex items-center">
            <button onClick={openSearch} aria-label="Buscar en el estante"
              className="inline-flex size-11 items-center justify-center rounded-full transition hover:bg-ink/8">
              {/* icono lupa */}
            </button>
            <button
              onClick={() => setView(view === "shelf" ? "list" : "shelf")}
              aria-label={view === "shelf" ? "Ver como lista" : "Ver como estantería"}
              className="inline-flex size-11 items-center justify-center rounded-full transition hover:bg-ink/8">
              {/* icono rejilla o lista según view */}
            </button>
            <button onClick={() => setMenuOpen(true)} aria-label="Más opciones"
              aria-haspopup="dialog"
              className="inline-flex size-11 items-center justify-center rounded-full transition hover:bg-ink/8">
              {/* icono ⋯ */}
            </button>
          </div>
        </>
      )}
    </div>

    {/* ---------- filtros: una sola fila, con señal de deslizamiento ---------- */}
    {(lists.length > 0 || boughtCount > 0) && (
      <div
        className={
          "transition-transform duration-[--dur-base] ease-[--ease-paper] " +
          (condensed ? "-translate-y-full h-0 overflow-hidden" : "")
        }
      >
        <div
          className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2 sm:px-6
                     [-ms-overflow-style:none] [scrollbar-width:none]
                     [&::-webkit-scrollbar]:hidden
                     [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-24px),transparent)]"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={
                "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3 " +
                "text-meta font-medium transition duration-[--dur-fast] " +
                (filter === f.id
                  ? "bg-ink text-paper"
                  : "border border-rule-strong text-ink-soft hover:bg-paper-2")
              }
            >
              {f.color && (
                <span aria-hidden="true" className="size-2 rounded-full"
                      style={{ backgroundColor: f.color }} />
              )}
              {f.name}
              <span className="tabular-nums opacity-70">{f.count}</span>
            </button>
          ))}
          <button onClick={() => setNewListOpen(true)}
            className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full
                       border border-dashed border-rule-strong px-3 text-meta
                       text-ink-faint transition hover:bg-paper-2">
            {/* icono + 16px */} Nueva lista
          </button>
        </div>
      </div>
    )}
  </header>

  {/* ---------- contenido ---------- */}
  <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6">
    {loading ? <ShelfSkeleton view={view} /> : <Shelf … />}
  </main>

  {/* ---------- captura en un toque ---------- */}
  {!anyDialogOpen && (
    <button
      onClick={() => openAdd("scan")}
      aria-label="Escanear el código de barras de un libro"
      className="fixed right-4 z-40 inline-flex size-14 items-center justify-center
                 rounded-full bg-spine text-paper shadow-sheet transition
                 duration-[--dur-fast] hover:bg-spine-dark active:scale-95"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      {/* icono de código de barras, 26px */}
    </button>
  )}
</div>
```

Filtrado local (añadir a `App.tsx`, sin dependencias):

```ts
const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const visible = useMemo(() => {
  let out = books;
  if (filter === "pending") out = out.filter((b) => b.status === "wishlist");
  else if (filter === "bought") out = out.filter((b) => b.status === "bought");
  else if (typeof filter === "number") out = out.filter((b) => b.listIds.includes(filter));
  const q = norm(query.trim());
  if (q) {
    out = out.filter((b) =>
      norm([b.title, b.authors.join(" "), b.subjects.join(" ")].join(" ")).includes(q)
    );
  }
  return out;
}, [books, filter, query]);
```

Cabecera condensada:

```ts
const [condensed, setCondensed] = useState(false);
useEffect(() => {
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (Math.abs(y - last) < 8) return;
    setCondensed(y > 24 && y > last);
    last = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

---

### 10.4.2 Estante — vista estantería (`src/components/Shelf.tsx`, `ShelfView`)

**Problema que resuelve:** 6.7 (portadas heterogéneas y borrosas), 6.8 (el estado comprado es débil), 6.12/6.13 (sin animación ni esqueletos), y el principio "las portadas mandan".

**El cambio estructural:** hoy cada libro dibuja su propia baldita de 6 px, así que con portadas de proporciones distintas las baldas quedan a alturas diferentes y el efecto estantería se rompe. **A partir de ahora la balda se dibuja por fila:** se parten los libros en filas de N (N = número de columnas), los libros de una fila se alinean al canto inferior (`items-end`) y bajo la fila va **una sola balda continua** con canto de madera. Ese es el 80% del salto de calidad de esta pantalla.

**Cambios:**

1. Filas explícitas con balda continua (`ShelfRow`), en vez de rejilla + balda por libro.
2. Todas las portadas en caja `aspect-[2/3]` con `object-cover object-center`: la disparidad de proporciones deja de verse. Las portadas nunca se escalan por encima de su ancho natural (`max-w`) para no reventar de nitidez las de 128 px.
3. Los libros se alinean al canto inferior; la portada tiene un lomo pintado a la izquierda (degradado de 3 px) que la hace leer como objeto físico sin imágenes extra.
4. `loading="lazy"`, `decoding="async"` y un fondo `bg-paper-3` mientras carga (nada de saltos).
5. Título y autor **debajo** de la portada, 2 y 1 líneas máximo (`line-clamp`), visibles siempre (antes había que abrir la ficha para saber qué es la portada extranjera).
6. Entrada escalonada: `animation: sz-rise` con `animationDelay: min(i, 11) * 24ms`. Solo en el primer montaje.
7. **Adquiridos** (6.8): salen de la rejilla principal y van a una sección propia al final, `Adquiridos · 4`, plegable, con la balda más oscura. Cada uno lleva **sello tipográfico** en lugar de solo opacidad: etiqueta en versalitas `gold-deep` girada −6° con `mix-blend-multiply`, más `saturate-[.55] opacity-90` (antes era `grayscale` + opacidad, que parecía un error de carga).
8. Los huecos de la última fila se rellenan con separadores invisibles para que la balda llegue de lado a lado.
9. Toda portada es un `<button>` de 44 px mínimos con `aria-label` "Ver ficha de {título}".

**Móvil (375px):** 3 columnas, `gap-x-3 gap-y-8`; portada ≈ 104×156 px (por debajo del ancho nativo de las peores portadas, así que se ven nítidas). Título 13 px / autor 12 px. Sin hover: el `active:` baja la sombra. 2 columnas si el ancho es < 340 px.

**Antes/después:** antes, una rejilla de portadas de alturas desiguales con listones flotando a distintos niveles; ahora, filas de libros apoyados sobre una balda continua, con los comprados sellados y apartados al final.

**JSX completo** (sustituye `ShelfView`):

```jsx
function useColumns() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setCols(w < 340 ? 2 : w < 640 ? 3 : w < 768 ? 4 : w < 1024 ? 5 : 6);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return cols;
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

function ShelfRow({
  row, cols, offset, onOpen, tone = "light",
}: {
  row: Book[]; cols: number; offset: number;
  onOpen: (b: Book) => void; tone?: "light" | "dark";
}) {
  return (
    <li className="list-none">
      <div className="flex items-end gap-3 sm:gap-4">
        {row.map((b, i) => (
          <BookOnShelf key={b.id} book={b} index={offset + i} cols={cols} onOpen={onOpen} />
        ))}
        {/* rellenos para que la balda llegue al borde */}
        {Array.from({ length: cols - row.length }).map((_, i) => (
          <div key={`gap-${i}`} aria-hidden="true" className="min-w-0 flex-1" />
        ))}
      </div>
      {/* la balda: cara + canto */}
      <div aria-hidden="true" className="mt-1.5">
        <div
          className={
            "h-2 rounded-[1px] " +
            (tone === "dark"
              ? "bg-gradient-to-b from-wood-dark to-wood-dark/70"
              : "bg-gradient-to-b from-wood to-wood-dark")
          }
          style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.18)" }}
        />
        <div className="h-1 rounded-b-sm bg-wood-dark/45 blur-[0.5px]" />
      </div>
    </li>
  );
}

function BookOnShelf({
  book, index, cols, onOpen,
}: { book: Book; index: number; cols: number; onOpen: (b: Book) => void }) {
  const bought = book.status === "bought";
  return (
    <div className="min-w-0 flex-1">
      <button
        onClick={() => onOpen(book)}
        aria-label={`Ver ficha de ${book.title}`}
        className="group block w-full text-left focus-visible:outline-2"
      >
        <div
          className="relative"
          style={{
            animation: "sz-rise var(--dur-slow) var(--ease-paper) both",
            animationDelay: `${Math.min(index, 11) * 24}ms`,
          }}
        >
          <Cover
            book={book}
            className={
              "aspect-[2/3] w-full rounded-sm object-cover object-center bg-paper-3 " +
              "shadow-cover transition duration-[--dur-base] ease-[--ease-paper] " +
              "group-hover:-translate-y-1 group-hover:shadow-cover-lift " +
              "group-active:translate-y-0 group-active:shadow-cover " +
              (bought ? "saturate-[.55] opacity-90" : "")
            }
            loading="lazy"
          />
          {/* lomo: da cuerpo físico a la portada, sin imágenes */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-sm
                       bg-gradient-to-r from-ink/35 via-ink/10 to-transparent"
          />
          {bought && (
            <span
              className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2
                         rounded-[2px] border border-gold-deep/70 px-1.5 py-0.5
                         text-[0.625rem] font-semibold uppercase tracking-[0.14em]
                         text-gold-deep mix-blend-multiply bg-paper/70"
              style={{ animation: "sz-stamp var(--dur-slow) var(--ease-paper) both",
                       transform: "rotate(-6deg)" }}
            >
              Adquirido
            </span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 font-display text-meta font-medium leading-tight text-ink">
          {book.title}
        </p>
        {book.authors[0] && (
          <p className="line-clamp-1 text-[0.75rem] leading-tight text-ink-faint">
            {book.authors[0]}
          </p>
        )}
      </button>
    </div>
  );
}

export function ShelfView({ books, onOpen }: { books: Book[]; onOpen: (b: Book) => void }) {
  const cols = useColumns();
  const [showBought, setShowBought] = useState(false);

  const pending = books.filter((b) => b.status === "wishlist");
  const bought = books.filter((b) => b.status === "bought");
  const rows = chunk(pending, cols);
  const boughtRows = chunk(bought, cols);

  return (
    <div className="space-y-8">
      <ul className="space-y-8">
        {rows.map((row, r) => (
          <ShelfRow key={r} row={row} cols={cols} offset={r * cols} onOpen={onOpen} />
        ))}
      </ul>

      {bought.length > 0 && (
        <section className="space-y-4 border-t border-rule/60 pt-6">
          <button
            onClick={() => setShowBought((v) => !v)}
            aria-expanded={showBought}
            className="flex min-h-11 w-full items-center gap-2 text-left"
          >
            <h2 className="font-display text-lg font-semibold text-ink">Adquiridos</h2>
            <span className="text-meta tabular-nums text-ink-faint">{bought.length}</span>
            <span aria-hidden="true"
                  className={"ml-auto transition-transform duration-[--dur-base] " +
                             (showBought ? "rotate-180" : "")}>
              {/* icono chevron-abajo */}
            </span>
          </button>
          {showBought && (
            <ul className="space-y-8">
              {boughtRows.map((row, r) => (
                <ShelfRow key={r} row={row} cols={cols} offset={r * cols}
                          onOpen={onOpen} tone="dark" />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
```

**Cubierta generada (`src/components/Cover.tsx`)** — se mantiene la lógica de 8 colores de lomo; se mejora la jerarquía (6.7):

1. Fondo: color de lomo + textura de papel con dos degradados (`repeating-linear-gradient` de 1 px al 4% + radial cálido). Sin imágenes.
2. Composición: filete doble arriba, título centrado en `font-display` con `text-balance` y `line-clamp-4`, autor abajo en micro versalitas, y sello editorial "S0" pequeño en el pie.
3. Tamaño de título por longitud: `≤18 → text-base`, `≤40 → text-meta`, resto `text-[0.6875rem]`.
4. Texto siempre `#f4ecdd` (paper) sobre el color de lomo; los 8 lomos deben cumplir ≥4.5:1 con paper — **verificar y sustituir los que no lleguen** (ver §10.4.8, punto abierto 2).

```jsx
<div className="relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden
                rounded-sm p-2 text-paper"
     style={{
       backgroundColor: spineColor,
       backgroundImage:
         "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.045) 0 1px, transparent 1px 3px)," +
         "radial-gradient(circle at 30% 12%, rgb(255 255 255 / 0.14), transparent 60%)",
     }}>
  <div aria-hidden="true" className="mt-1 border-y border-paper/35 py-[3px]">
    <div className="h-px bg-paper/25" />
  </div>
  <p className="px-1 text-center font-display font-medium leading-tight text-balance
                line-clamp-4 [text-shadow:0_1px_0_rgb(0_0_0/0.25)]">
    {title}
  </p>
  <p className="truncate px-1 text-center text-[0.625rem] uppercase tracking-[0.12em]
                text-paper/85">
    {authors[0] ?? "Autor desconocido"}
  </p>
  <span aria-hidden="true"
        className="absolute bottom-1 right-1 font-display text-[0.5rem] text-paper/50">
    S0
  </span>
</div>
```

---

### 10.4.3 Estante — vista lista (`src/components/Shelf.tsx`, `ListView`)

**Problema que resuelve:** densidad y jerarquía en móvil (6.9), temáticas sucias (6.6), estado comprado (6.8), acciones sin área táctil suficiente.

**Cambios:**

1. Fila de 3 zonas: miniatura 40×60 · texto flexible · una sola acción (`⋯`) de 44 px. Las acciones múltiples de hoy se agrupan en ese menú; en escritorio (`sm:`) se despliegan en línea.
2. Jerarquía: título Display (16/medium) → autor + año en una línea `text-meta text-ink-faint` separados por `·` → **una** pastilla de temática (limpia, §10.5.5). Nunca dos filas de pastillas.
3. Separadores con `divide-y divide-rule/50` en lugar de tarjetas: menos ruido, más lista de librería. La fila es un `<button>` completo.
4. Alto mínimo 72 px (`py-3`), miniatura `rounded-sm shadow-cover` — el libro sigue siendo un objeto.
5. Adquiridos: la fila lleva `text-ink-faint` en el título, sello micro "Adquirido" en `gold-deep` y la miniatura `saturate-[.55]`. También se agrupan al final, con el mismo encabezado que en la estantería.
6. Estado vacío del filtro: `text-meta text-ink-faint` centrado, con acción para limpiar el filtro.

**Móvil (375px):** una columna; el bloque de texto es `min-w-0` con `truncate`/`line-clamp-1` para que un título largo no empuje la acción fuera de pantalla. La pastilla de temática se oculta por debajo de 360 px (`hidden min-[360px]:inline-flex`).

**Antes/después:** antes filas de altura irregular con metadatos en inglés compitiendo con el título; ahora una lista de librería con un dato por línea y una sola acción visible.

```jsx
<ul className="divide-y divide-rule/50 border-y border-rule/50">
  {books.map((b) => {
    const bought = b.status === "bought";
    const subject = cleanSubjects(b.subjects)[0];
    return (
      <li key={b.id}>
        <div className="group flex items-center gap-3 px-1 py-3 transition
                        hover:bg-paper-2/60">
          <button onClick={() => onOpen(b)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left
                             focus-visible:outline-2"
                  aria-label={`Ver ficha de ${b.title}`}>
            <Cover book={b} loading="lazy"
                   className={"h-[60px] w-10 shrink-0 rounded-sm object-cover shadow-cover " +
                              (bought ? "saturate-[.55]" : "")} />
            <div className="min-w-0 flex-1">
              <p className={"line-clamp-1 font-display text-base font-medium leading-snug " +
                            (bought ? "text-ink-soft" : "text-ink")}>
                {b.title}
              </p>
              <p className="line-clamp-1 text-meta text-ink-faint">
                {[b.authors[0], b.publishedYear].filter(Boolean).join(" · ")}
              </p>
            </div>
            {bought ? (
              <span className="hidden shrink-0 rounded-[2px] border border-gold-deep/70 px-1.5
                               py-0.5 text-[0.625rem] font-semibold uppercase
                               tracking-[0.12em] text-gold-deep min-[360px]:inline-flex">
                Adquirido
              </span>
            ) : subject ? (
              <span className="hidden shrink-0 rounded-full bg-paper-3 px-2.5 py-1
                               text-[0.75rem] text-ink-faint min-[360px]:inline-flex">
                {subject}
              </span>
            ) : null}
          </button>
          <button onClick={() => onMenu(b)} aria-label={`Acciones de ${b.title}`}
                  aria-haspopup="menu"
                  className="inline-flex size-11 shrink-0 items-center justify-center
                             rounded-full text-ink-soft transition hover:bg-ink/8">
            {/* icono ⋯ */}
          </button>
        </div>
      </li>
    );
  })}
</ul>
```

---

### 10.4.4 Estado vacío (`src/App.tsx`)

**Problema que resuelve:** los tres lomos dibujados con `div`s no dicen qué hacer, y el texto usaba `ink-faint` con 3.41:1.

**Cambios:** una balda vacía real (el mismo componente de balda del `ShelfRow`, sin libros) + título Display 2 "El estante está vacío" + una línea `text-lede text-ink-soft` "Sin prisa, sin olvidos. Escanea el primer libro que te apetezca." + botón principal *Escanear un libro* y secundario *Buscar por título*. Contraste: `ink-soft` 8.07:1.

**Móvil (375px):** bloque centrado, `max-w-[20rem] mx-auto`, botones a ancho completo apilados con `gap-3`; el FAB se oculta en este estado (el botón principal ya está en pantalla).

**Antes/después:** de un adorno mudo a una invitación clara, con la balda como promesa visual.

```jsx
<div className="mx-auto max-w-[20rem] py-12 text-center">
  <div aria-hidden="true" className="mb-6">
    <div className="h-20 rounded-t-sm bg-paper-2/70" />
    <div className="h-2 bg-gradient-to-b from-wood to-wood-dark" />
    <div className="h-1 bg-wood-dark/45" />
  </div>
  <h2 className="font-display text-2xl font-semibold">El estante está vacío</h2>
  <p className="mt-2 text-lede text-ink-soft">
    Sin prisa, sin olvidos. Escanea el primer libro que te apetezca.
  </p>
  <div className="mt-6 flex flex-col gap-3">
    <button onClick={() => openAdd("scan")} className="{botón principal, w-full}">
      Escanear un libro
    </button>
    <button onClick={() => openAdd("title")} className="{botón secundario, w-full}">
      Buscar por título
    </button>
  </div>
</div>
```

---

### 10.4.5 Añadir libro (`src/components/AddBookDialog.tsx`) y escáner (`BarcodeScanner.tsx`)

**Problema que resuelve:** 6.4 (ceremonia en el momento de captura), 6.5 (no hay confirmación), 6.13 (carga en texto plano), tolerancia a fallo de búsqueda y a estar sin conexión.

**Cambios:**

1. La pestaña inicial la decide quien abre el diálogo: `initialTab` (`"scan"` desde el FAB). Si no se pasa, se recupera de `localStorage.szLastAddTab`, con `"scan"` por defecto. Se guarda al cambiar de pestaña.
2. Pestañas como segmentado de 44 px de alto, `role="tablist"`, con `aria-selected`; indicador = fondo `bg-ink text-paper` (no un subrayado de 2 px, invisible en móvil).
3. **Escanear en curso, en marcha**: al abrir con `"scan"` la cámara arranca sola (sin botón intermedio). El marco de encuadre es una ventana con las cuatro esquinas en `paper` de 3 px y el resto atenuado (`bg-ink/55`), con una guía horizontal `spine` de 2 px. La zona del escáner lleva `.on-dark` para invertir el foco.
4. Errores del escáner en el mismo hueco, sin sacar al usuario: permiso denegado → texto + botón *Reintentar* + *Escribir el ISBN*; sin cámara → salta a la pestaña ISBN con aviso; mala luz / 8 s sin lectura → sugerencia *"¿Poca luz? Prueba a teclear el ISBN"*.
5. Resultados de búsqueda: filas idénticas a la vista lista (misma miniatura, misma jerarquía) para que 19 ediciones parecidas se distingan por **año + editorial**, que pasan a ser el dato de segunda línea. Máximo 12 resultados, con "Mostrar más".
6. Esqueletos en lugar de "Buscando en Google Books y Open Library…": 4 filas `<SkeletonRow>`. El texto de fuentes pasa a nota `text-micro text-ink-faint` bajo el campo.
7. **Guardar** cierra el diálogo, dispara `toast("Guardado en el estante", { action: "Ver" })` y hace un `sz-rise` del libro nuevo en el estante (6.5).
8. Sin conexión (`navigator.onLine === false`): banda `bg-paper-3 text-ink` sobre las pestañas — "Sin conexión: puedes teclear el ISBN y completaremos la ficha al volver". Escanear y buscar quedan deshabilitados con `disabled` y explicación.
9. Alta manual: si el ISBN no da resultados, formulario mínimo (título obligatorio, autor, año) en lugar de un callejón sin salida.

**Móvil (375px):** el diálogo es una hoja inferior a ancho completo (`items-end`, `rounded-t-2xl`, `max-h-[92dvh]`); en `sm:` vuelve a ser panel centrado `max-w-2xl rounded-2xl`. El campo de búsqueda queda en el tercio superior y los resultados se deslizan por debajo; el botón *Guardar* es una barra pegajosa inferior (`sticky bottom-0 bg-paper-raise/95 pt-3`) siempre alcanzable con el pulgar.

**Antes/después:** antes, tres toques hasta la cámara y una pestaña de texto por defecto; ahora un toque desde el estante y la cámara ya buscando, con salidas claras cuando falla.

---

### 10.4.6 Ficha de libro (`src/components/BookDetail.tsx`)

**Problema que resuelve:** 6.6 (temáticas sucias y en inglés), 6.8 (comprado), jerarquía y contraste del resumen.

**Cambios:**

1. Cabecera de dos columnas incluso en móvil: portada 128 px de ancho a la izquierda (`shadow-cover-lift`, lomo pintado) y a la derecha título Display 1, autores `text-lede text-ink-soft`, y meta en una línea (`año · editorial · idioma`).
2. Acciones en barra pegajosa inferior: **Comprar en Google** (principal) y *Marcar como adquirido* (secundario). Compartir, listas y borrar en `⋯`. Los tres de 44 px.
3. Temáticas (6.6): pasan por `cleanSubjects()` (§10.5.5). Máximo 3 pastillas + `＋n` que despliega el resto; las descartadas por el filtro se ven solo tras pulsar *Ver todas las etiquetas originales* (`text-micro`). Cada pastilla es pulsable → filtra el estante por esa temática.
4. Resumen: `text-lede leading-relaxed text-ink-soft max-w-[38rem]`, `line-clamp-6` con *Seguir leyendo*. Si no hay resumen, línea `text-meta text-ink-faint` "Sin resumen" — sin bloque vacío.
5. Marcar como adquirido: animación `sz-stamp` del sello sobre la portada (320 ms) y toast "Adquirido. Está al final del estante." con *Deshacer*.
6. Borrar usa `ConfirmDialog` (6.2), texto: "¿Quitar *{título}* del estante?" · "No se puede deshacer." · botones *Quitar* (destructivo) / *Cancelar*.

**Móvil (375px):** portada 112 px, título `text-2xl`, todo en una columna con la portada flotando a la izquierda del bloque de título; barra de acciones pegajosa con zona segura.

**Antes/después:** antes cuatro etiquetas en inglés al mismo peso que el título; ahora un titular claro, tres temáticas útiles y la compra siempre a un pulgar de distancia.

---

### 10.4.7 Vista pública compartida (`src/components/SharedView.tsx`)

**Problema que resuelve:** 6.15 — es la cara pública del producto y hoy es una lista pelada.

**Cambios:**

1. Reutiliza `ShelfView` completo (mismas baldas, mismas portadas) en modo lectura: sin FAB, sin acciones, sin menús. La estantería *es* la carta de presentación.
2. Cabecera editorial: monograma, "Estante compartido", nombre de la lista en Display 1 y `N libros` en meta. Debajo, filete `border-rule` y, si existe, el color de la lista como banda de 3 px.
3. Cada portada enlaza a Google Books en pestaña nueva (`rel="noopener"`); no hay ficha propia en la vista pública.
4. Pie: "Hecho con ShelfZero" + enlace al repositorio, `text-micro text-ink-faint`.
5. Vacío / enlace caducado: mensaje en el mismo tono ("Este estante ya no está compartido"), sin jerga de error.
6. Sin dependencia de estado local: respeta el modo oscuro del sistema (`prefers-color-scheme` aplica la clase `dark` si no hay preferencia guardada).

**Móvil (375px):** idéntica a la vista estantería (3 columnas). Cabecera 2 líneas máximo.

**Antes/después:** antes una lista anónima; ahora el mismo objeto bonito que ve el dueño, sin controles.

---

### 10.4.8 Bienvenida (`src/components/Welcome.tsx`) y modo oscuro

**Cambios:**

1. `Welcome` se convierte en componente reutilizable con prop `mode: "onboarding" | "about"`. En `"about"` se abre desde el menú del estante dentro de un `Sheet` (6.10), con botón *Cerrar* en lugar de *Empezar*.
2. Las 3 ventajas pierden los iconos decorativos si no aportan; el lema "Sin prisa, sin olvidos" sube a Display 1 y las ventajas van en lista con viñeta `gold` (decorativa, `aria-hidden`) y texto `ink-soft`.
3. **Modo oscuro** (6.11): tres opciones (Claro / Oscuro / Sistema) en el menú del estante. Implementación:

```ts
// src/lib/theme.ts
export type Theme = "light" | "dark" | "system";
export function applyTheme(t: Theme) {
  const dark = t === "dark" ||
    (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#191411" : "#f4ecdd");
  localStorage.setItem("szTheme", t);
}
```

Llamar en el arranque (antes del primer render, en `index.html` con un script en línea de 3 líneas para evitar el destello blanco) y al cambiar la preferencia del sistema.

**Fuente web (opcional, no bloqueante):** la pila actual da Iowan en Apple, Palatino en Windows y Georgia en Android — tres siluetas distintas, la más floja Georgia. Si se quiere unificar, la recomendación es **Source Serif 4** (SIL OFL), autoalojada en `public/fonts/`, subconjunto latino + puntuación, **dos ficheros woff2: Regular y SemiBold, ~28–34 kB cada uno** (medir al generar el subconjunto con `pyftsubset`). Reglas: `font-display: swap`, y un `@font-face` de reserva con `size-adjust` para que el salto no mueva el texto:

```css
@font-face { font-family: "Source Serif 4"; src: url("/fonts/source-serif-4-latin-400.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Source Serif 4"; src: url("/fonts/source-serif-4-latin-600.woff2") format("woff2");
  font-weight: 600; font-style: normal; font-display: swap; }
/* reserva con métricas ajustadas: evita el salto al cargar */
@font-face { font-family: "SS4 Fallback"; src: local("Georgia"); size-adjust: 96%;
  ascent-override: 92%; descent-override: 24%; }
```

y `--font-display: "Source Serif 4", "SS4 Fallback", "Iowan Old Style", Palatino, Georgia, serif;`.
**Recomendación:** hacerlo en la última tanda; el diseño no depende de ello.

---

## 10.5 Componentes nuevos

Los tres diálogos comparten base para no repetir foco atrapado, `Esc`, bloqueo de scroll y animación.

### 10.5.1 `src/components/Sheet.tsx` (base de todos los diálogos)

```tsx
import { useEffect, useRef, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  children: ReactNode;
  /** "sheet" = hoja inferior en móvil (por defecto); "center" = siempre centrado */
  placement?: "sheet" | "center";
  size?: "sm" | "md" | "lg";
};

const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" } as const;

export function Sheet({
  open, onClose, labelledBy, describedBy, children,
  placement = "sheet", size = "md",
}: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const first = panel.current?.querySelector<HTMLElement>(
      "[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = Array.from(
        panel.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])"
        )
      ).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const firstN = nodes[0], lastN = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstN) { e.preventDefault(); lastN.focus(); }
      else if (!e.shiftKey && document.activeElement === lastN) { e.preventDefault(); firstN.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      restore.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={
        "fixed inset-0 z-50 flex justify-center bg-ink/45 backdrop-blur-sm " +
        (placement === "sheet" ? "items-end sm:items-start sm:pt-[8vh]" : "items-center p-4")
      }
      style={{ animation: "sz-fade var(--dur-fast) both" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panel}
        data-sheet
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={
          "w-full bg-paper-raise text-ink shadow-sheet " + SIZES[size] + " " +
          (placement === "sheet"
            ? "max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            : "max-h-[86dvh] overflow-y-auto rounded-2xl")
        }
        style={{
          animation: "sz-sheet-in var(--dur-base) var(--ease-paper) both",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

### 10.5.2 `src/components/ConfirmDialog.tsx` — sustituye `confirm()` (`App.tsx:103`)

```tsx
import { Sheet } from "./Sheet";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;      // por defecto "Aceptar"
  cancelLabel?: string;       // por defecto "Cancelar"
  tone?: "default" | "danger"; // danger = spine
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open, title, description, confirmLabel = "Aceptar", cancelLabel = "Cancelar",
  tone = "default", busy = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Sheet open={open} onClose={onCancel} placement="center" size="sm"
           labelledBy="confirm-title" describedBy={description ? "confirm-desc" : undefined}>
      <div className="p-6">
        <h2 id="confirm-title" className="font-display text-lg font-semibold text-ink">
          {title}
        </h2>
        {description && (
          <p id="confirm-desc" className="mt-2 text-body text-ink-soft">{description}</p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border
                       border-rule-strong px-4 text-body font-medium text-ink transition
                       hover:bg-paper-2 active:bg-paper-3">
            {cancelLabel}
          </button>
          <button data-autofocus onClick={onConfirm} disabled={busy}
            className={
              "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-body " +
              "font-medium text-paper shadow-raise transition active:scale-[0.97] " +
              "disabled:bg-ink/25 disabled:shadow-none " +
              (tone === "danger" ? "bg-spine hover:bg-spine-dark" : "bg-ink hover:bg-ink/90")
            }>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
```

Uso en `App.tsx` (sustituye el `confirm()`):

```tsx
const [toDelete, setToDelete] = useState<Book | null>(null);
// … en la acción de borrar: setToDelete(book);

<ConfirmDialog
  open={!!toDelete}
  tone="danger"
  title={`¿Quitar «${toDelete?.title}» del estante?`}
  description="No se puede deshacer."
  confirmLabel="Quitar"
  onConfirm={async () => { await removeBook(toDelete!.id); setToDelete(null);
                           toast("Libro quitado del estante"); }}
  onCancel={() => setToDelete(null)}
/>
```

### 10.5.3 `src/components/PromptDialog.tsx` — sustituye `prompt()` (`App.tsx:81`)

Incluye el color de lista (`BookList.color`, hoy sin usar): 8 colores fijos que doblan como identidad de la lista en los chips.

```tsx
import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";

export const LIST_COLORS = [
  "#9a3b32", "#8a6224", "#5f452c", "#4e6b52",
  "#3f5d72", "#6a4a6b", "#7a5a3a", "#4e443c",
] as const;

export type PromptDialogProps = {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  maxLength?: number;         // 40 por defecto
  withColor?: boolean;        // muestra el selector de color
  validate?: (v: string) => string | null;  // devuelve el error o null
  onSubmit: (value: string, color: string | null) => void;
  onCancel: () => void;
};

export function PromptDialog({
  open, title, label, placeholder, initialValue = "", confirmLabel = "Crear",
  maxLength = 40, withColor = false, validate, onSubmit, onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [color, setColor] = useState<string>(LIST_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setValue(initialValue); setError(null); } }, [open, initialValue]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    const err = !v ? "Escribe un nombre." : validate?.(v) ?? null;
    if (err) { setError(err); return; }
    onSubmit(v, withColor ? color : null);
  };

  return (
    <Sheet open={open} onClose={onCancel} placement="center" size="sm"
           labelledBy="prompt-title">
      <form onSubmit={submit} className="p-6">
        <h2 id="prompt-title" className="font-display text-lg font-semibold">{title}</h2>

        <label htmlFor="prompt-input" className="mt-4 block text-meta font-medium text-ink-soft">
          {label}
        </label>
        <input
          id="prompt-input" data-autofocus value={value} maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          aria-invalid={!!error}
          aria-describedby={error ? "prompt-error" : "prompt-count"}
          className="mt-1 min-h-11 w-full rounded-md border border-rule-strong bg-paper px-3
                     text-body placeholder:text-ink-faint focus:border-spine"
        />
        <div className="mt-1 flex justify-between">
          {error
            ? <p id="prompt-error" role="alert" className="text-meta text-spine">{error}</p>
            : <span />}
          <span id="prompt-count" className="text-micro tabular-nums text-ink-faint">
            {value.length}/{maxLength}
          </span>
        </div>

        {withColor && (
          <fieldset className="mt-4">
            <legend className="text-meta font-medium text-ink-soft">Color</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LIST_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  aria-label={`Color ${c}`} aria-pressed={color === c}
                  className={"size-11 rounded-full transition " +
                             (color === c ? "ring-2 ring-ink ring-offset-2 ring-offset-paper-raise" : "")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border
                       border-rule-strong px-4 text-body font-medium hover:bg-paper-2">
            Cancelar
          </button>
          <button type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-spine
                       px-5 text-body font-medium text-paper shadow-raise transition
                       hover:bg-spine-dark active:scale-[0.97]">
            {confirmLabel}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
```

Uso (sustituye el `prompt()` de `App.tsx:81`):

```tsx
<PromptDialog
  open={newListOpen}
  title="Nueva lista"
  label="Nombre"
  placeholder="Para el verano"
  withColor
  validate={(v) => lists.some((l) => l.name.toLowerCase() === v.toLowerCase())
    ? "Ya tienes una lista con ese nombre." : null}
  onSubmit={async (name, color) => { await createList(name, color);
    setNewListOpen(false); toast(`Lista «${name}» creada`); }}
  onCancel={() => setNewListOpen(false)}
/>
```

### 10.5.4 `src/components/Toast.tsx` — avisos (6.5)

Contexto + hook, cola de 1 aviso visible, 4 s (6 s si tiene acción), pausa al enfocar, `aria-live="polite"`.

```tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState,
         type ReactNode } from "react";

export type ToastAction = { label: string; onClick: () => void };
export type ToastOptions = { action?: ToastAction; duration?: number };
type ToastState = { id: number; message: string } & ToastOptions;

const ToastCtx = createContext<(message: string, opts?: ToastOptions) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((message: string, opts: ToastOptions = {}) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, ...opts });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const ms = toast.duration ?? (toast.action ? 6000 : 4000);
    timer.current = window.setTimeout(() => setToast(null), ms);
    return () => window.clearTimeout(timer.current);
  }, [toast]);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" aria-atomic="true"
           className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
           style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}>
        {toast && (
          <div key={toast.id} data-sheet
               className="on-dark pointer-events-auto flex w-full max-w-sm items-center gap-3
                          rounded-full bg-ink px-4 py-3 text-body text-paper shadow-toast"
               style={{ animation: "sz-toast-in var(--dur-base) var(--ease-paper) both" }}>
            <p className="min-w-0 flex-1 truncate">{toast.message}</p>
            {toast.action && (
              <button onClick={() => { toast.action!.onClick(); setToast(null); }}
                className="shrink-0 rounded-full px-3 py-1 text-body font-medium
                           text-paper underline decoration-paper/40 underline-offset-2
                           transition hover:bg-paper/12">
                {toast.action.label}
              </button>
            )}
            <button onClick={() => setToast(null)} aria-label="Cerrar aviso"
              className="grid size-8 shrink-0 place-items-center rounded-full
                         transition hover:bg-paper/12">
              {/* icono X 16px */}
            </button>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}
```

Notas: `paper` sobre `ink` = 12.92:1. El toast va **encima** del FAB (`z-60` frente a `z-40`) y a 24 px del borde inferior; el FAB se desplaza `-translate-y-14` mientras hay un toast visible para no taparlo. Montar `<ToastProvider>` en `main.tsx`, envolviendo `<App/>`.

Mensajes exactos: `"Guardado en el estante"` (acción *Ver*) · `"Libro quitado del estante"` (acción *Deshacer* si la API lo permite; si no, sin acción) · `"Adquirido. Está al final del estante."` (acción *Deshacer*) · `"Lista «X» creada"` · `"Enlace copiado"` · `"Sin conexión: se guardará al volver"`.

### 10.5.5 `src/lib/subjects.ts` — limpieza de temáticas (6.6)

Problema de datos con solución de diseño: se filtra el ruido, se traducen los casos frecuentes y se limita a 3.

```ts
const NOISE = [
  /^(spanish|english|french|german|italian|portuguese) language books?$/i,
  /^fiction in (english|spanish|french|german)$/i,
  /^(fiction|non-?fiction|literature|general|miscellanea)$/i,
  /^(large type books|reading materials|texts|accessible book)$/i,
  /^(protected daisy|in library|internet archive wishlist|overdrive)$/i,
  /^new york times bestseller/i,
  /\(imaginary place\)/i,
  /^translations into/i,
];

const ES: Record<string, string> = {
  "science fiction": "Ciencia ficción",
  "fantasy fiction": "Fantasía",
  "detective and mystery stories": "Misterio",
  "historical fiction": "Novela histórica",
  "psychohistory": "Psicohistoria",
  "mothers and sons": "Madres e hijos",
  "technology and civilization": "Tecnología y civilización",
  "human evolution": "Evolución humana",
  "families": "Familia",
  "love stories": "Novela romántica",
  "biography": "Biografía",
  "essays": "Ensayo",
  "poetry": "Poesía",
};

const titleCase = (s: string) =>
  s.replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());

/** Devuelve hasta `max` temáticas útiles, sin ruido, en español cuando se conoce. */
export function cleanSubjects(subjects: string[] = [], max = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of subjects) {
    for (const part of raw.split(/\s*[,;—]\s*|\s+--\s+/)) {
      const s = part.trim();
      if (!s || s.length < 3 || s.length > 34) continue;
      if (NOISE.some((re) => re.test(s))) continue;
      const label = ES[s.toLowerCase()] ?? titleCase(s);
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(label);
      if (out.length >= max) return out;
    }
  }
  return out;
}
```

Reglas de uso: la **agrupación por temática** (`SortMode = "subject"`) usa `cleanSubjects(b.subjects, 1)[0] ?? "Sin temática"`. Los libros sin temática limpia van a un grupo *Sin temática* al final, nunca a uno llamado `Fiction`. La ficha permite ver las originales (`text-micro`), por transparencia con los datos de Open Library.

### 10.5.6 `src/components/Skeleton.tsx` — carga (6.13)

```tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true"
      className={"rounded-sm bg-paper-2 " + className}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.45) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "sz-shimmer 1.4s linear infinite",
      }} />
  );
}

/** Rejilla del estante: 2 filas con su balda, para que la carga tenga la forma final. */
export function ShelfSkeleton({ view, cols = 3 }: { view: "shelf" | "list"; cols?: number }) {
  if (view === "list") {
    return (
      <div className="divide-y divide-rule/50 border-y border-rule/50" role="status"
           aria-label="Cargando el estante">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-[60px] w-10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5 rounded-md" />
              <Skeleton className="h-3 w-2/5 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-8" role="status" aria-label="Cargando el estante">
      {Array.from({ length: 2 }).map((_, r) => (
        <div key={r}>
          <div className="flex items-end gap-3 sm:gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="min-w-0 flex-1 space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-3 w-4/5 rounded-md" />
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="mt-1.5">
            <div className="h-2 bg-gradient-to-b from-wood to-wood-dark opacity-60" />
            <div className="h-1 bg-wood-dark/30" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 10.5.7 Iconos nuevos (SVG en línea, 24×24, `stroke-width: 2`)

Todos con `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`.

```jsx
// código de barras (FAB de escaneo)
<svg viewBox="0 0 24 24" className="size-6"><path d="M3 7V5a2 2 0 0 1 2-2h2M21 7V5a2 2 0 0 0-2-2h-2M3 17v2a2 2 0 0 0 2 2h2M21 17v2a2 2 0 0 1-2 2h-2M7 8v8M11 8v8M15 8v8M18 8v8"/></svg>

// lupa
<svg viewBox="0 0 24 24" className="size-6"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>

// rejilla (vista estantería)
<svg viewBox="0 0 24 24" className="size-6"><path d="M4 4h6v8H4zM14 4h6v8h-6zM4 16h16"/></svg>

// lista
<svg viewBox="0 0 24 24" className="size-6"><path d="M4 6h16M4 12h16M4 18h10"/></svg>

// más opciones
<svg viewBox="0 0 24 24" className="size-6"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>

// cerrar
<svg viewBox="0 0 24 24" className="size-6"><path d="M6 6l12 12M18 6L6 18"/></svg>

// chevron abajo
<svg viewBox="0 0 24 24" className="size-6"><path d="m6 9 6 6 6-6"/></svg>

// añadir
<svg viewBox="0 0 24 24" className="size-6"><path d="M12 5v14M5 12h14"/></svg>

// comprobado (orden activo)
<svg viewBox="0 0 24 24" className="size-6"><path d="m5 13 4 4L19 7"/></svg>

// luna / sol (modo oscuro)
<svg viewBox="0 0 24 24" className="size-6"><path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>
<svg viewBox="0 0 24 24" className="size-6"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/></svg>
```

---

## 10.6 Orden de implementación

**Tanda 1 — Sistema (bloquea a las demás).**
1. Sustituir el bloque de `src/index.css` por el de §10.2 (tokens, `@custom-variant dark`, `body`, `@layer base` del foco, `@keyframes`).
2. Barrido de sustituciones mecánicas: `text-sm` → `text-body` en interfaz, `text-xs` → `text-meta`, `shadow-md shadow-ink/20` → `shadow-cover`, `shadow-2xl` → `shadow-sheet`.
3. Comprobar que ningún texto usa `gold` (si lo hay → `gold-deep`) y que los botones de icono llegan a 44 px.
*Resultado revisable: la app entera cumple AA y tiene foco visible, sin cambiar ni una estructura.*

**Tanda 2 — Componentes nuevos (independientes entre sí a partir de `Sheet`).**
4. `Sheet.tsx`.
5. `ConfirmDialog.tsx` + `PromptDialog.tsx` y eliminación de `confirm()`/`prompt()` (`App.tsx:81`, `App.tsx:103`).
6. `Toast.tsx` + `ToastProvider` en `main.tsx`; avisos de guardar/borrar/adquirir.
7. `Skeleton.tsx` (los puntos 5, 6 y 7 pueden ir en paralelo).

**Tanda 3 — Estante (el grueso).**
8. `ShelfRow` + `BookOnShelf` + `ShelfView` de §10.4.2.
9. `ListView` de §10.4.3.
10. Armazón de `App.tsx` de §10.4.1: cabecera de 56 px, fila única de filtros, orden en el menú, búsqueda local, FAB de escaneo.
11. Estado vacío (§10.4.4).
*8 y 9 son independientes de 10; 11 depende de la balda del 8.*

**Tanda 4 — Datos y captura.**
12. `src/lib/subjects.ts` + usarlo en `ListView`, `BookDetail` y en el orden por temática. *Independiente de todo lo anterior.*
13. `AddBookDialog`: pestaña recordada, cámara directa, esqueletos, barra de guardar pegajosa, sin conexión, alta manual.
14. `Cover.tsx`: textura, jerarquía y sello (§10.4.2). *Independiente.*

**Tanda 5 — Resto de pantallas.**
15. `BookDetail` (§10.4.6).
16. `SharedView` (§10.4.7). *Independiente de 15.*
17. `Welcome` reutilizable en modo "about" + entrada en el menú.

**Tanda 6 — Opcionales.**
18. Modo oscuro: interruptor de tres estados, script antidestello en `index.html`, `theme-color`. (Los tokens ya están desde la tanda 1.)
19. Fuente web autoalojada (§10.4.8), solo si se acepta el peso.

---

## 10.7 Lo que deliberadamente no cambia

- **La paleta de papel** (`paper`, `paper-2`, `paper-3`) y **la marca** (`spine`, `spine-dark`): ya cumplen AA y son la identidad. `spine` sigue siendo exactamente `#9a3b32`.
- **El nombre y el monograma "S0"**: solo se le da caja, peso y un realce interior; el dibujo sigue siendo tipográfico y se puede sustituir después.
- **La estructura de datos y la API**: `Book`, `BookList`, `SortMode`, `ViewMode`, los estados `wishlist`/`bought` y todas las funciones existentes. `BookList.color` empieza a usarse, pero el esquema no cambia.
- **Las cuatro maneras de añadir** (escanear / título / ISBN / alta manual) y los cuatro modos de orden: solo cambia dónde se eligen.
- **El idioma** (español) y el tono "sin prisa, sin olvidos": nada de rachas, insignias ni recuentos de culpa.
- **Los degradados radiales del `body`** y `background-attachment: fixed`: solo se ajusta la opacidad al nuevo `gold`.
- **Sin dependencias nuevas**: ni componentes, ni animación, ni iconos. Todo lo de aquí es CSS, Tailwind v4 y SVG en línea.
- **El presupuesto de peso**: nada de este documento añade JavaScript de terceros; el escáner sigue cargándose solo al usarlo.

---

## Dudas y decisiones que no me corresponden

Las digo aquí en vez de inventarlas:

1. **Deshacer al borrar.** El toast propone *Deshacer*, pero no sé si la API permite recuperar un libro borrado. Si no existe borrado suave, quitad la acción del toast y dejad solo el `ConfirmDialog` (no inventéis un borrado suave sin hablarlo).
2. **Los 8 colores de lomo de `Cover.tsx`.** No están en el brief; hay que verificar que cada uno da ≥4.5:1 con `paper` (`#f4ecdd`) como color de texto y sustituir los que no lleguen. Los cuatro primeros de `LIST_COLORS` (§10.5.3) sirven como referencia de nivel de luminosidad correcto.
3. **Traducción de temáticas.** El diccionario de `subjects.ts` cubre lo que aparece en el apéndice A y los casos más frecuentes de Open Library; no es exhaustivo por definición. Decisión pendiente: ¿se permite al usuario **editar** las temáticas de un libro? Sería la solución real a 6.6, pero toca la estructura de datos y he preferido no proponerlo.
4. **"Adquiridos" plegado al final.** Es un cambio conceptual (el libro comprado sale de la lista de deseos). Si en el PRD "comprado" debía seguir mezclado con el resto, mantened el sello y el filtro y descartad solo la sección aparte.
5. **Alto de la balda.** He fijado 8 px de cara + 4 px de canto. Con 6 columnas en escritorio la proporción se queda algo fina; si se ve raro por encima de 1024 px, subid a `h-2.5` con `lg:`, nada más.
6. **Vista pública y modo oscuro.** Asumo que `SharedView` puede leer `prefers-color-scheme`; si se sirve como HTML estático sin JS, dejadla siempre en claro.
