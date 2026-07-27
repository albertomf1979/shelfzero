# ShelfZero — Brief de diseño (UX/UI)

> Documento de encargo para trabajar el diseño de ShelfZero. Describe qué es la
> app, cómo se usa, el sistema visual actual, los problemas detectados y las
> restricciones técnicas que cualquier propuesta debe respetar.

**Estado:** MVP funcional y desplegable. Todas las funciones existen y están
probadas; lo que falta es criterio de diseño.
**Fecha:** 2026-07-26
**Idioma de la interfaz:** español.

---

## 1. Qué es

Una aplicación web instalable (PWA) para **guardar los libros que quieres
comprar**. No es una tienda, ni una red social de lectura, ni un gestor de la
biblioteca que ya tienes: es la lista de deseos de alguien que entra en librerías.

El usuario añade un libro escaneando su código de barras, buscándolo por título o
tecleando el ISBN. La app lo identifica, muestra una ficha con portada, autor,
temática, ISBN y resumen, y lo guarda en un "estante". Después puede ordenarlos,
agruparlos en listas, marcarlos como comprados, compartirlos con un enlace y
saltar a Google para comprarlos.

Es **de un solo usuario por instalación** y de código abierto: cada persona
despliega su propia copia.

## 2. Contexto de uso (lo más importante para el diseño)

Hay dos momentos muy distintos, y ahora mismo la interfaz los trata igual:

**A. Capturar — de pie, en una librería, con una mano, con prisa.**
El usuario tiene un libro físico en la mano, quiere guardarlo en tres segundos y
seguir mirando. Es el momento de mayor fricción y el que justifica la app.
Ocurre casi siempre en **móvil**. Aquí importan: rapidez, un solo pulgar, poca
lectura, tolerancia a mala luz y a que la búsqueda falle.

**B. Curar — sentado, en casa, sin prisa.**
Revisa el estante, lo reorganiza, decide qué comprar, comparte una lista. Ocurre
en móvil o en escritorio. Aquí importan: ver bien las portadas, comparar,
reordenar, disfrutar del estante como objeto.

El estante es también **un objeto de placer**, no solo una lista de tareas: la
gente disfruta viendo sus libros juntos. La estética de librería no es decoración,
es parte de la propuesta.

## 3. Tono y principios

- **Librería, no aplicación de productividad.** Papel, tinta, madera, cartón.
  Cálido y tipográfico. Nada de azules corporativos ni sombras de material design.
- **Las portadas mandan.** Son el contenido más valioso y más bello; el resto de
  la interfaz debe cederles el protagonismo.
- **Sencilla pero no sosa.** El usuario es diseñador: notará la tipografía mal
  ajustada, el ritmo vertical roto y los espaciados arbitrarios.
- **Sin ansiedad.** No hay rachas, ni insignias, ni "llevas 12 libros sin leer".
  El lema es "sin prisa, sin olvidos".

---

## 4. Sistema visual actual

Tailwind v4 con tokens definidos en `src/index.css` (bloque `@theme`).

### Color

| Token | Hex | Uso actual |
|---|---|---|
| `paper` | `#f4ecdd` | Fondo general |
| `paper-2` | `#eee2cd` | Fondos secundarios, hover |
| `paper-3` | `#e6d7bd` | Etiquetas de temática |
| `ink` | `#2a2521` | Texto principal, botones oscuros |
| `ink-soft` | `#5c5148` | Texto secundario |
| `ink-faint` | `#8a7d6f` | Metadatos, contadores, marcadores de posición |
| `spine` | `#9a3b32` | **Color de marca.** Acciones principales, logotipo |
| `spine-dark` | `#7c2d26` | Hover del anterior |
| `gold` | `#b8894b` | Acento decorativo (viñetas) |
| `wood` | `#7a5a3a` | Las baldas de la estantería |

El fondo del `body` lleva dos degradados radiales muy sutiles (papel) con
`background-attachment: fixed`.

### Tipografía

- **Display** (títulos, títulos de libro, logotipo): `Iowan Old Style, Palatino
  Linotype, Palatino, Georgia, Times New Roman, serif`.
- **Texto**: pila de sistema (`ui-sans-serif, system-ui, -apple-system…`).
- **No se carga ninguna fuente web.** Todo son fuentes del sistema. Esto es una
  decisión de rendimiento y coste, pero está abierta a revisión (ver §7).

### Formas

- Botones y pastillas: `rounded-full`.
- Tarjetas y diálogos: `rounded-xl` / `rounded-2xl`.
- Portadas: `rounded-sm` (los libros no tienen esquinas redondeadas).
- Sombras: suaves y cálidas, tintadas con `ink` o `spine`.

---

## 5. Inventario de pantallas

| Pantalla | Archivo | Notas |
|---|---|---|
| Bienvenida | `Welcome.tsx` | Logotipo, lema, 3 ventajas, 2 botones. **Solo se ve una vez** (`localStorage`), sin forma de volver |
| Estante | `App.tsx` + `Shelf.tsx` | Cabecera, orden, selector de vista, listas, contenido |
| — vista estantería | `Shelf.tsx` | Rejilla de portadas sobre baldas de madera |
| — vista lista | `Shelf.tsx` | Filas con miniatura, metadatos y acciones |
| Estado vacío | `App.tsx` | Tres lomos dibujados con `div`s |
| Añadir libro | `AddBookDialog.tsx` | 3 pestañas: Escanear / Por título / Por ISBN |
| Escáner | `BarcodeScanner.tsx` | Vídeo, guía de encuadre, errores de permiso |
| Ficha de libro | `BookDetail.tsx` | Portada grande, metadatos, etiquetas, resumen, listas, acciones |
| Compartir | `ShareSheet.tsx` | WhatsApp / Email / SMS / X + copiar enlace |
| Vista pública | `SharedView.tsx` | Solo lectura, sin cuenta, para quien recibe el enlace |

---

## 6. Problemas detectados y oportunidades

Ordenados por impacto. Los marcados **[verificado]** están medidos, no son
impresiones.

### Prioridad alta

**6.1. Contraste insuficiente en texto secundario [verificado]**
`ink-faint` (#8a7d6f) sobre `paper` da **3.41:1**, y sobre `paper-2` **3.13:1**.
El mínimo AA para texto normal es 4.5:1. Se usa en metadatos, contadores,
marcadores de posición y textos de estado vacío — texto real, no decoración.
También `gold` (#b8894b) da **2.66:1** y no llega ni a AA grande.
→ Hay que reajustar la escala de grises cálidos sin perder la sensación de papel.

**6.2. Diálogos nativos del navegador [verificado]**
Crear una lista usa `prompt()` y borrar un libro usa `confirm()`
(`App.tsx:81` y `App.tsx:103`). Rompen la estética por completo: aparece una caja
gris del sistema en medio de una app de papel. Necesitan diseño propio.

**6.3. Estados de foco prácticamente inexistentes [verificado]**
Solo hay **una** regla `focus:` en toda la interfaz (el campo de búsqueda). La
navegación por teclado es invisible. Hace falta un estilo de foco que encaje con
la marca y funcione sobre fondos claros y sobre el rojo `spine`.

**6.4. El momento de captura no está optimizado**
Añadir un libro son hoy **tres toques** (+ Añadir → pestaña Escanear → permiso).
La pestaña por defecto es "Por título", no el escáner. En el contexto A (de pie
en una librería) esto es demasiada ceremonia.
→ ¿Botón de escaneo directo? ¿Acción flotante? ¿Recordar la última pestaña usada?

**6.5. No hay confirmación al guardar un libro**
Al pulsar "Guardar", el diálogo se cierra y el libro aparece en el estante sin
más. En móvil, con el estante largo, el usuario no ve qué ha pasado y duda de si
se ha guardado. No hay ningún sistema de avisos (toast) en la app.

### Prioridad media

**6.6. Las temáticas vienen sucias y en inglés**
Los datos reales de Open Library dan cosas como `Spanish language books`,
`Fiction`, `Fiction in English`, `Dune (imaginary place), fiction` — para un libro
en español. Se muestran tal cual como etiquetas en la ficha, y la primera de ellas
es la que se usa para agrupar por temática y la que sale en la vista lista.
→ Problema mixto de datos y diseño: ¿cuántas mostrar? ¿jerarquía visual?
¿editable por el usuario? ¿ocultar las que son ruido?

**6.7. Las portadas son heterogéneas**
Vienen de terceros con tamaños y calidades dispares (se han visto 128×219 y
180×292 px). Algunas están borrosas al ampliarlas y muchas son de ediciones
extranjeras. Los libros sin portada reciben una **cubierta tipográfica generada**
con uno de 8 colores de lomo (`Cover.tsx`).
→ La rejilla debe tolerar esa disparidad con elegancia, y la cubierta generada
merece más cariño (¿texturas? ¿mejor jerarquía tipográfica? ¿sello editorial?).

**6.8. El estado "comprado" es débil**
Hoy solo baja la opacidad y quita la saturación de la portada, más una etiqueta.
Conceptualmente es un cambio importante (sale de la lista de deseos) y podría
tener un tratamiento más bonito y claro: ¿se archiva? ¿va a otra sección? ¿un
sello de "adquirido"?

**6.9. Densidad y jerarquía en móvil**
La cabecera, la fila de ordenación, el selector de vista y la fila de listas
consumen ~40% del alto útil antes de ver un solo libro. La fila de ordenación se
desliza en horizontal pero sin ninguna señal visual de que se puede deslizar.

**6.10. La bienvenida se pierde para siempre**
Se muestra una vez y no hay manera de volver a verla. Es la pieza con más
personalidad de la app y desaparece tras el primer uso.

### Prioridad baja / oportunidades

**6.11. Sin modo oscuro [verificado]**
No hay ni una sola regla `dark:`. Una app de librería con modo noche (papel
crema → papel viejo/cuero oscuro) sería muy agradecida para leer en la cama.

**6.12. Sin animación de ninguna clase [verificado]**
37 `transition` para hover y cero animaciones propias. No hay transiciones de
entrada de los diálogos, ni aparición escalonada de las portadas, ni feedback al
guardar. Hay margen para dar sensación de calidad sin recargar.

**6.13. Sin estados de carga cuidados**
Se muestra texto plano ("Cargando…", "Buscando en Google Books y Open Library…").
Faltan esqueletos de carga, sobre todo en la rejilla de portadas.

**6.14. No se puede buscar dentro del estante**
Cuando haya 80 libros, no hay filtro ni buscador local. Tampoco hay forma de ver
solo los pendientes o solo los comprados desde la interfaz (la API sí lo soporta).

**6.15. La vista pública compartida es la más pobre**
Es la única que verán terceros — la cara pública del producto — y es una lista
simple sin la personalidad de la estantería.

---

## 7. Restricciones técnicas

Cualquier propuesta debe poder implementarse dentro de esto:

- **React 19 + Tailwind v4.** Los tokens se definen en `@theme` dentro de
  `src/index.css`. Se prefieren utilidades de Tailwind a CSS suelto.
- **Sin librerías de componentes** (nada de shadcn, MUI, Chakra). La app no tiene
  dependencias de interfaz y conviene que siga así: es un proyecto de código
  abierto que otros van a desplegar.
- **Sin librerías de animación** por ahora (Framer Motion añadiría ~50 kB). CSS y
  Web Animations API son suficientes salvo justificación fuerte.
- **Presupuesto de peso.** El bundle principal son 226 kB (70 kB gzip). El
  escáner son otros 456 kB que solo se descargan al usarlo. Conviene no crecer
  mucho más.
- **Fuentes.** Ahora son del sistema. Se puede proponer una fuente web
  **autoalojada** (no Google Fonts por CDN) si el salto de calidad lo justifica;
  hay que contar su peso y el parpadeo de carga.
- **Mobile-first de verdad.** El caso de uso principal es un móvil sujeto con una
  mano. Los objetivos táctiles, mínimo 44 px.
- **PWA.** Funciona instalada y sin conexión; el diseño no puede depender de estar
  siempre en línea ni de recursos externos.
- **Coste cero.** Nada que implique servicios de pago.

## 8. Qué no tocar

- **El nombre y el monograma "S0"** (aunque su dibujo sí se puede mejorar; el
  actual es un marcador de posición hecho con texto).
- **La estructura de datos** (libros, listas, estados wishlist/bought) y las
  funciones existentes: todas responden a requisitos acordados en el PRD.
- **El idioma**: la interfaz es en español.
- **La idea de librería.** Se puede reinterpretar, no sustituir por otra estética.

## 9. Qué se espera como entrega

Por orden de utilidad:

1. **Una revisión del sistema**: paleta corregida (con contrastes que cumplan AA),
   escala tipográfica, escala de espaciado, radios, sombras y estados (reposo,
   hover, foco, activo, deshabilitado).
2. **Rediseño de las pantallas clave** en este orden: estante (ambas vistas) →
   añadir libro → ficha → vista pública compartida.
3. **Los componentes que faltan**: diálogo de confirmación propio, diálogo de
   crear lista, sistema de avisos (toast), esqueletos de carga.
4. **Modo oscuro**, si da tiempo.

---

## 10. Formato de la entrega (importante)

El resultado lo va a implementar un agente de programación que **no participará en
la conversación de diseño**: solo recibirá el archivo. Por eso el formato importa
tanto como el contenido.

### Devuelve **un único archivo** llamado `DESIGN_SPEC.md`

Con esta estructura exacta:

#### 10.1 Resumen de decisiones
Máximo 10 líneas: qué cambia y por qué. Sin literatura.

#### 10.2 Tokens
Una tabla con **todos** los tokens, en formato token → valor actual → valor nuevo.
Usa **los mismos nombres** que ya existen (`--color-paper`, `--color-ink-faint`…)
y marca claramente los que se añaden. Incluye el ratio de contraste de cada
color de texto sobre su fondo previsto.

| Token | Actual | Nuevo | Contraste | Nota |
|---|---|---|---|---|
| `--color-ink-faint` | `#8a7d6f` | `#…` | 4.6:1 sobre paper | corrige AA |

Después, el bloque `@theme { … }` completo listo para pegar en `src/index.css`.

#### 10.3 Fundamentos
Escala tipográfica (tamaño / interlineado / grosor / cuándo usar cada nivel),
escala de espaciado, radios, sombras y **estados de foco**. Exprésalo como
utilidades de Tailwind siempre que se pueda: `text-lg leading-snug font-medium`.

#### 10.4 Pantalla por pantalla
Una sección por pantalla, **titulada con el archivo real** que hay que tocar:

```
### Estante — vista estantería (`src/components/Shelf.tsx`, ShelfView)
**Problema que resuelve:** …
**Cambios:** lista concreta y numerada
**Clases:** las utilidades Tailwind del contenedor y de cada elemento
**Móvil (375px):** qué cambia
**Antes/después:** una frase describiendo la diferencia visible
```

Si un cambio necesita HTML nuevo, escribe el **fragmento JSX completo** listo para
sustituir. Es la forma más rápida de que se implemente sin interpretación.

#### 10.5 Componentes nuevos
Para cada uno: nombre de archivo propuesto (`src/components/Toast.tsx`), props con
sus tipos de TypeScript, estados, y el JSX completo. Los que hacen falta seguro:

- `ConfirmDialog` — sustituye a `confirm()` en `App.tsx:81`
- `PromptDialog` (o formulario en línea) — sustituye a `prompt()` en `App.tsx:103`
- `Toast` — confirmar que un libro se ha guardado
- `Skeleton` — carga de la rejilla y de la lista

#### 10.6 Orden de implementación
Numerado, en tandas que se puedan aplicar y revisar por separado. Marca cuáles
son independientes entre sí.

#### 10.7 Lo que deliberadamente no cambias
Para que no se toque por error.

### Reglas de la entrega

- **Colores en hexadecimal exacto.** Nada de "un ocre más cálido".
- **Todo contraste de texto, verificado** y anotado. Mínimo AA (4.5:1 texto
  normal, 3:1 texto grande y elementos de interfaz).
- **Nada de dependencias nuevas.** Ni librerías de componentes, ni de animación,
  ni de iconos. Los iconos actuales son SVG en línea de 24×24 con
  `stroke-width: 2`; si hacen falta más, entrégalos como SVG en línea.
- **Tailwind v4**: los tokens van en `@theme`, no en `tailwind.config.js` (no
  existe ese archivo).
- **Móvil primero.** Cada pantalla debe especificar su comportamiento a 375 px.
- Si propones una **fuente web**, indica cuál, su peso en kB, de dónde se
  autoaloja y qué hacer mientras carga.
- Si algo no te cuadra o falta información, **dilo en el archivo** en vez de
  inventarlo.

---

## Apéndice A — Datos reales para maquetar

Libros que hay ahora mismo en el estante de pruebas, útiles para trabajar con
contenido verdadero (títulos largos, autores acentuados, temáticas en inglés,
portadas de calidad desigual, uno sin portada):

| Título | Autor | Año | Temática (primera) | Portada |
|---|---|---|---|---|
| Cien años de soledad | Gabriel García Márquez | 1967 | Spanish language books | sí |
| La sombra del viento | Carlos Ruiz Zafón | 2001 | Mothers and sons | sí |
| Children of Dune | Frank Herbert | 1976 | Dune (Imaginary place) | sí |
| Foundation | Isaac Asimov | 1951 | Psychohistory | sí |
| Il nome della rosa | Umberto Eco | 1980 | Novela de misterio | sí |
| Sapiens | Yuval Noah Harari | 2011 | Technology and civilization | sí |

Ejemplo de resumen real (longitud típica, ~400 caracteres):

> Cien años de soledad es una novela del escritor colombiano Gabriel García
> Márquez, ganador del Premio Nobel de Literatura en 1982. Es considerada una obra
> maestra de la literatura hispanoamericana y universal, cumbre del denominado
> "realismo mágico". Narra la historia de la familia Buendía a lo largo de siete
> generaciones en el pueblo ficticio de Macondo.

Casos límite que conviene contemplar:

- Título muy largo: *"Cien años de soledad [de] Gabriel García Márquez"*.
- Libro sin portada, sin resumen y sin temática (alta manual).
- Estante vacío / lista vacía.
- Un solo libro en el estante.
- Búsqueda con 19 resultados casi idénticos (varias ediciones del mismo título).
- Sin conexión.

---

## Apéndice B — Estado actual del código (verbatim)

### `src/index.css`, bloque de tokens

```css
@import "tailwindcss";

@theme {
  --color-paper: #f4ecdd;
  --color-paper-2: #eee2cd;
  --color-paper-3: #e6d7bd;
  --color-ink: #2a2521;
  --color-ink-soft: #5c5148;
  --color-ink-faint: #8a7d6f;
  --color-spine: #9a3b32;
  --color-spine-dark: #7c2d26;
  --color-gold: #b8894b;
  --color-wood: #7a5a3a;

  --font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia,
    "Times New Roman", serif;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
}

body {
  margin: 0;
  min-height: 100dvh;
  font-family: var(--font-sans);
  color: var(--color-ink);
  background-color: var(--color-paper);
  background-image:
    radial-gradient(circle at 20% 20%, rgba(184, 137, 75, 0.06), transparent 40%),
    radial-gradient(circle at 80% 0%, rgba(154, 59, 50, 0.05), transparent 35%);
  background-attachment: fixed;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 { font-family: var(--font-display); }
```

### Ejemplos de marcado actual

Botón principal:
```jsx
className="rounded-full bg-spine px-5 py-2 text-sm font-medium text-paper
           shadow-sm transition hover:bg-spine-dark active:scale-95"
```

Botón secundario:
```jsx
className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium
           text-ink transition hover:bg-ink/5"
```

Pastilla de temática:
```jsx
className="rounded-full bg-paper-3/70 px-2.5 py-1 text-xs text-ink-soft"
```

Portada en la rejilla (`ShelfView`), con su balda de madera debajo:
```jsx
<Cover className="aspect-[2/3] w-full shadow-md shadow-ink/20
                  transition group-hover:shadow-xl" />
<div className="mt-1 h-1.5 rounded-b-sm bg-gradient-to-b from-wood to-wood/60 shadow-sm" />
```

Rejilla del estante:
```jsx
className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
```

Diálogo (Añadir / Ficha / Compartir comparten patrón):
```jsx
// Fondo
className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[8vh] backdrop-blur-sm"
// Panel
className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl"
```

### Tipos de datos que maneja la interfaz

```ts
type Book = {
  id: number;
  isbn13: string | null; isbn10: string | null;
  title: string;
  authors: string[];        // puede venir vacío
  subjects: string[];       // puede venir vacío; en inglés a menudo
  description: string | null;
  coverUrl: string | null;  // null -> cubierta tipográfica generada
  publisher: string | null;
  publishedYear: number | null;
  language: string | null;
  status: "wishlist" | "bought";
  createdAt: number; updatedAt: number;
  listIds: number[];
};

type BookList = { id: number; name: string; color: string | null; count: number };
type SortMode = "created" | "alpha" | "author" | "subject";
type ViewMode = "shelf" | "list";
```

`color` en `BookList` existe en la base de datos pero **la interfaz no lo usa
todavía**: es una oportunidad para distinguir listas visualmente.
