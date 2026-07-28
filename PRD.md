# ShelfZero — PRD

> Tu estante de libros por comprar. Escanea, guarda, organiza y decide dónde comprarlos.

**Versión:** 1.0 (finalizado tras ronda de decisiones)
**Fecha:** 2026-07-26
**Autor:** Alberto Martín Fernández
**Estado:** Aprobado para planificación (aún no se ha escrito código)

---

## 1. Resumen ejecutivo

ShelfZero es una **PWA** (aplicación web instalable) para **capturar y organizar libros que quieres comprar**: una *wishlist* con estética de librería. El usuario añade libros escaneando el código de barras (ISBN), escribiendo el título o el ISBN; la app los identifica contra Google Books / Open Library y muestra una ficha rica (portada, título, autor, temática, ISBN y resumen). Los libros se guardan en un "estante", se ordenan y se agrupan en listas propias, se pueden marcar como comprados o eliminar, saltar a Google para comprarlos y compartir por enlace.

Es un proyecto **single-user por despliegue** pero **open-source**: cualquiera podrá clonar el repo y desplegar su propia instancia gratuita sobre Cloudflare.

---

## 2. Objetivos y no-objetivos

### Objetivos
- Añadir un libro en **menos de 10 segundos** desde tres vías: escaneo de ISBN, título o ISBN manual.
- Organizar sin fricción: orden flexible + listas propias.
- Compartir listas o libros con un enlace en un toque.
- **Coste 0** para uso personal.
- Ser un repo **fácil de desplegar por terceros** (documentado, sin secretos, un clic).

### No-objetivos (por ahora)
- No es una tienda: no se vende ni se procesan pagos (se delega a Google/librerías).
- No es una red social de lectura tipo Goodreads (sin feed, sin reseñas públicas, sin seguir a otros).
- No gestiona la biblioteca física ya poseída ni préstamos (foco: *deseo de compra*).
- No multiusuario dentro de una misma instancia (una cuenta por despliegue).

---

## 3. Personas y casos de uso

- **Dueño del estante (usuario principal):** descubre un libro (en una librería física, una reseña, una recomendación) y lo guarda para comprarlo más tarde. Usa sobre todo el **móvil** para escanear.
- **Invitado (sin cuenta):** recibe un enlace compartido y ve una lista o un libro en **modo solo lectura**, sin necesidad de registrarse.

Casos de uso principales:
1. En una librería, escaneo el ISBN de un libro y lo guardo en "Por leer".
2. En casa, busco un título, elijo entre varias ediciones y lo añado a mi lista "Ensayo".
3. Reviso mi estante ordenado por autor, marco uno como comprado y elimino otro.
4. Comparto mi lista "Regalos de Navidad" por WhatsApp.
5. Desde la ficha de un libro, pulso "Buscar" y salto a Google para comprarlo.

---

## 4. Requisitos funcionales

### Alta de libros
- **FR1.** Añadir por **ISBN** (escaneando el código de barras con la cámara o escribiéndolo) → búsqueda exacta.
- **FR2.** Añadir por **título** → si hay varias coincidencias, mostrar una **lista de resultados** (portada + autor + año + edición) para que el usuario elija.
- **FR3.** **Alta a mano** como cuarta vía de entrada, no solo como salida de emergencia: formulario completo (título obligatorio; autor, identificador, año, editorial, temática, portada y resumen opcionales) accesible desde el propio selector de método. También es lo que se ofrece cuando el escaneo o la búsqueda **no encuentran coincidencias**.
  - *Corregido tras la verificación:* Amazon no vuelca los metadatos de KDP en Google Books ni en Open Library, así que los autopublicados —y todos los ebooks, que carecen de ISBN— no aparecen por mucho que se afine la búsqueda. El alta a mano es la única respuesta posible, y por eso sube de categoría.
- **FR3b.** El identificador acepta **ISBN-13, ISBN-10 o ASIN de Amazon**, distinguiéndolos por su forma y validando el dígito de control cuando es un ISBN. Se muestra en la ficha y se usa en el enlace de compra.
- **FR4.** Ficha del libro con: **portada, título, autor(es), temática/materia, ISBN y resumen breve**. Campos editables por el usuario si vienen incompletos.

### Organización
- **FR5.** Guardar libros en el **estante**.
- **FR6.** Ordenar por: **alfabético (título)**, **orden de introducción**, **por autor (agrupado)** y **por temática (agrupada)**.
- **FR7.** Crear, renombrar y borrar **listas/categorías** propias (p. ej. "Ciencia ficción", "Ensayo") y asignar un libro a una o varias listas.

### Acciones sobre el libro
- **FR8.** Botón **"Buscar"** → abre **Google** en una pestaña nueva con la búsqueda del libro (título + autor, o ISBN). Disponible **desde la lista y desde la ficha individual**.
- **FR9.** Marcar / desmarcar como **"Comprado"**.
- **FR10.** **Eliminar** del estante (con confirmación).

### Compartir
- **FR11.** Compartir una **lista** o un **libro** mediante un **enlace público de solo lectura**, vía: **email** (`mailto:`), **SMS** (`sms:`), **WhatsApp** (`wa.me`) y **X** (intent de publicación). En móvil se usa además la **Web Share API** nativa.

### Presentación
- **FR12.** **Pantalla de bienvenida** con onboarding breve y acceso a "Añadir mi primer libro".
- **FR13.** **Dos vistas** del estante:
  - **Estantería:** galería visual de portadas (aspecto librería).
  - **Lista:** filas compactas con miniatura, metadatos y acciones rápidas.
- **FR14.** Estética de librería: cálida, tipográfica, sencilla pero atractiva. Instalable como app (PWA) y usable con una mano en móvil.

---

## 5. Requisitos no funcionales

- **Rendimiento:** interacción fluida en móvil de gama media; escaneo de ISBN en < 2 s con buena luz.
- **~~Offline:~~ retirado.** El requisito original era que el estante ya cargado se consultase sin conexión. Con el estante tras contraseña resultó incompatible: el service worker seguía sirviendo su copia guardada cuando el servidor ya respondía «identifícate». Se renunció al uso sin conexión a cambio de que **cada carga pase por el candado**.
- **Accesibilidad:** contraste AA, navegación por teclado, `alt` en portadas, objetivos táctiles ≥ 44 px, **campos de 16 px en táctil** y **zoom del usuario nunca deshabilitado** (WCAG 1.4.4).
- **Sin desbordamiento horizontal:** ninguna pantalla puede hacer que la página se arrastre de lado. Se verifica midiendo `scrollWidth` contra `clientWidth` a 320 px, no a ojo.
- **Privacidad:** datos mínimos; nada se comparte sin acción explícita del usuario.
- **Portabilidad (open-source):** despliegue reproducible por terceros con documentación clara y configuración por variables de entorno.

---

## 6. Arquitectura y stack (100% Cloudflare, gratis)

| Capa | Tecnología | Notas |
|---|---|---|
| **Frontend** | React + Vite + TypeScript + Tailwind, empaquetado como **PWA** (`vite-plugin-pwa`) | Un solo código para web y móvil instalable |
| **Escaneo ISBN** | `@zxing/browser` (lectura de EAN-13 en el dispositivo con la cámara) | Gratis, en cliente, sin enviar imágenes a ningún servidor |
| **Hosting** | **Cloudflare Pages** | CI desde GitHub, HTTPS y CDN incluidos |
| **API / lógica** | **Cloudflare Workers** con **Hono** | Proxy a Google Books (oculta claves + CORS + caché), CRUD del estante |
| **Base de datos** | **Cloudflare D1** (SQLite) + **Drizzle ORM** | Sincroniza entre dispositivos; migraciones versionadas para self-hosters |
| **Almacenamiento** | **Cloudflare R2** (opcional) | Solo para imágenes subidas a mano; las portadas se enlazan desde la fuente |
| **Protección de acceso** | **Cloudflare Access** (Zero Trust, capa gratis ≤ 50 usuarios) | El dueño protege toda la app con su email/Google, sin código de login |
| **Metadatos de libros** | **Google Books API** (principal) + **Open Library** (respaldo) | Ambas gratuitas; Google funciona sin clave a menor cuota |
| **Dominio** | Subdominio propio, p. ej. `shelfzero.albertomartinfernandez.com` | Coste 0 |

### Diagrama lógico
```
[ PWA React ]  --HTTPS-->  [ Cloudflare Access ]  -->  [ Worker (Hono) ]
   |  cámara/ZXing (ISBN en cliente)                        |
   |                                                        +--> [ D1 (estante, listas, shares) ]
   |                                                        +--> [ Google Books / Open Library ]
   |                                                        +--> [ R2 (imágenes opcionales) ]
   +-- Enlaces de compartir (mailto/sms/wa.me/X + Web Share API)

  Ruta pública /s/:token  -->  Worker (solo lectura, sin Access)
```

---

## 7. Flujo de reconocimiento por ISBN

1. El usuario abre "Añadir" → la cámara arranca (ZXing).
2. Se detecta el EAN-13 → se extrae el ISBN.
3. El Worker consulta **Google Books** por ISBN; si no hay datos suficientes, cae a **Open Library**.
4. Se muestra la ficha para confirmar y elegir estante/lista.
5. Si no hay coincidencia (o sin cámara): campo de **ISBN manual** o **búsqueda por título** (FR2) o **alta manual** (FR3).

---

## 8. Modelo de datos (D1)

Al ser single-user por instancia, la identidad la resuelve Cloudflare Access en el borde; no hace falta tabla de usuarios.

```sql
-- Libros del estante
books(
  id INTEGER PK,
  isbn13 TEXT, isbn10 TEXT,
  title TEXT NOT NULL,
  authors TEXT,        -- JSON: ["..."]
  subjects TEXT,       -- JSON: ["..."] (temática/materia)
  description TEXT,     -- resumen breve
  cover_url TEXT,
  publisher TEXT, published_year INTEGER, language TEXT,
  status TEXT DEFAULT 'wishlist',  -- 'wishlist' | 'bought'
  source TEXT,         -- 'google' | 'openlibrary' | 'manual'
  created_at INTEGER, updated_at INTEGER
)

-- Listas propias
lists(id INTEGER PK, name TEXT NOT NULL, color TEXT, created_at INTEGER)

-- Relación N:M libro-lista
book_lists(book_id INTEGER, list_id INTEGER, PRIMARY KEY(book_id, list_id))

-- Enlaces públicos de solo lectura
shares(token TEXT PK, kind TEXT, ref_id INTEGER, created_at INTEGER, expires_at INTEGER NULL)

-- Preferencias (orden y vista por defecto)
settings(key TEXT PK, value TEXT)
```

---

## 9. API (boceto, Hono sobre Workers)

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/lookup?isbn=` | Busca por ISBN (Google → Open Library), con caché |
| GET | `/api/search?q=` | Busca por título → lista de coincidencias |
| GET | `/api/books?sort=&list=` | Lista el estante (ordenado/filtrado) |
| POST | `/api/books` | Añade un libro (por ISBN o manual) |
| PATCH | `/api/books/:id` | Edita campos / cambia `status` (comprado) |
| DELETE | `/api/books/:id` | Elimina del estante |
| GET/POST/DELETE | `/api/lists` · `/api/lists/:id` | CRUD de listas |
| POST/DELETE | `/api/lists/:id/books/:bookId` | Asignar / quitar de lista |
| POST | `/api/shares` | Crea enlace público (token) |
| GET | `/s/:token` | **Vista pública** de solo lectura (sin Access) |

> Las búsquedas se proxian por el Worker para ocultar claves, evitar CORS y cachear resultados.

---

## 10. Diseño y experiencia

- **Estética de librería:** paleta cálida (papel/madera/tinta), tipografía serif para títulos, mucho aire, las portadas como protagonistas.
- **Bienvenida:** breve, con una acción principal clara ("Añadir mi primer libro").
- **Dos vistas** conmutables (Estantería / Lista) con la preferencia recordada.
- **Compartir:** hoja de acción con Web Share API nativa en móvil y botones directos (email, SMS, WhatsApp, X) en escritorio.
- **Mobile-first**, instalable, usable con una mano.

---

## 11. Seguridad y privacidad

- Acceso al estante protegido por **Cloudflare Access**; solo el dueño (o identidades que configure) entra.
- Rutas públicas `/s/:token` sirven **solo lectura** y con token aleatorio no adivinable; opción de caducidad.
- Sin claves en el frontend: las APIs externas se llaman desde el Worker.
- El escaneo de ISBN ocurre **en el dispositivo**; no se suben imágenes.

---

## 12. Costes

**MVP y uso personal: 0 €/mes.**

| Servicio | Capa gratuita | Suficiente para uso personal |
|---|---|---|
| Cloudflare Pages | Ilimitado (estático), 500 builds/mes | ✅ |
| Cloudflare Workers | 100.000 peticiones/día | ✅ |
| Cloudflare D1 | 5 GB + 5M lecturas/día | ✅ |
| Cloudflare R2 | 10 GB, sin coste de egreso | ✅ (uso mínimo) |
| Cloudflare Access | ≤ 50 usuarios | ✅ |
| Google Books / Open Library | Gratis | ✅ |
| Dominio | Subdominio propio | ✅ |

**Costes solo si:** se añadiera reconocimiento de portada por IA a volumen (fuera de alcance) o un crecimiento de escala que superara las capas gratuitas (plan Workers de pago, 5 $/mes).

---

## 13. Roadmap por fases

**Fase 0 — Base**
- Repo, PWA base, Cloudflare Pages + Worker + D1, Cloudflare Access.

**Fase 1 — MVP (todo lo pedido)**
- Alta por ISBN (escaneo + manual) y por título (con lista de coincidencias) + alta manual.
- Ficha completa (FR4).
- Estante con dos vistas, ordenación (FR6) y listas (FR7).
- Buscar en Google (FR8), comprado (FR9), eliminar (FR10).
- Compartir por enlace (FR11) + vista pública.
- Bienvenida (FR12).

**Fase 2 — Mejoras (post-MVP, opcional)**
- Reconocimiento de portada por IA (Workers AI / OCR).
- Sincronización offline avanzada y edición en cola.
- Estadísticas ("cuántos por leer / comprados"), etiquetas, exportar/importar.
- Internacionalización (la app nace en español).

---

## 14. Consideraciones open-source

- **Licencia:** MIT (a confirmar).
- **README** con guía de despliegue paso a paso y botón *Deploy to Cloudflare*.
- **Configuración** por variables de entorno (`wrangler.toml`, `.dev.vars.example`); sin secretos en el repo.
- **Migraciones D1** versionadas para reproducir la base de datos.
- **Modo alternativo de acceso** documentado (contraseña por variable de entorno) para quien no quiera configurar Cloudflare Access.

---

## 15. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Metadatos incompletos en algunos títulos en español | Respaldo en Open Library + edición manual de la ficha |
| Escaneo falla con poca luz / sin cámara | ISBN manual + búsqueda por título + alta manual |
| Fricción de Cloudflare Access para self-hosters | Documentación clara + modo contraseña alternativo |
| Límites de cuota de Google Books | Caché en el Worker + clave opcional para más cuota |
| **Autopublicados de Amazon KDP ausentes de los catálogos** *(confirmado, no hipotético)* | Alta a mano con soporte de ASIN. No hay mitigación por la vía de la búsqueda: Amazon no publica esos metadatos |
| **Fallos que solo aparecen en pantallas estrechas** | Revisión explícita a 320 px con medición de desbordamiento; no basta con reducir la ventana del escritorio |

---

## 16. Métricas de éxito (uso personal)

- Tiempo medio de alta de un libro < 10 s.
- % de altas resueltas automáticamente por ISBN (objetivo > 90%).
- El dueño usa la app en librería física sin fricción (prueba real).

---

## 17. Decisiones registradas

1. **Alcance:** single-user por despliegue, **open-source** (self-hosteable).
2. **Captura por imagen:** **escaneo de ISBN/código de barras** (portada por IA queda para Fase 2).
3. **Plataforma:** **PWA instalable** (web + móvil).
4. **Presupuesto:** **100% gratis** (capa free de Cloudflare + Google Books/Open Library).
5. **Datos:** en **Cloudflare D1** (sincroniza entre dispositivos, facilita compartir).
6. **Protección:** ~~Cloudflare Access~~ → **contraseña propia** como modo principal (cookie `HttpOnly` con un HMAC derivado de la contraseña), y Cloudflare Access documentado como alternativa. Se invirtió el orden porque la contraseña no obliga a quien se despliegue una copia a configurar Zero Trust.
7. **Sin service worker:** se retira el uso sin conexión. Un estante privado tiene que preguntarle siempre al servidor (ver §5).
8. **Alta a mano de primera clase**, con ASIN además de ISBN, tras confirmar que los autopublicados de KDP no están en los catálogos (ver §4 y §15).
9. **El zoom del usuario no se deshabilita nunca.** El salto de escala de iOS al enfocar un campo se resuelve subiendo la letra a 16 px, no con `maximum-scale=1`.

---

## 18. Revisión previa a la publicación

Verificación completa de las dos versiones antes de abrir el repositorio. Lo que se comprobó y lo que se corrigió.

**Fallos encontrados y subsanados** — los cuatro solo se manifestaban en pantallas estrechas, y ninguno era visible reduciendo la ventana del escritorio:

| Fallo | Causa | Corrección |
|---|---|---|
| La pantalla se descuadraba al escribir y había que recolocarla a mano | Campos de 15 px; iOS Safari amplía la página por debajo de 16 px | 16 px en pantallas táctiles, conservando el zoom del usuario |
| El resumen de la portada perdía media frase y los dos botones | Rejilla sin columnas explícitas dimensionada a `max-content`, recortada por `overflow-hidden` | `grid-cols-1`, que es `minmax(0, 1fr)` |
| La página se podía arrastrar en horizontal | La cabecera desbordaba 4 px por debajo de 360 px | «Añadir» se queda con el icono en esos anchos |
| La elipsis de `truncate` no aparecía en toda la app | `p { text-wrap: pretty }` fuera de capa ganaba a las utilidades, y anulaba el `nowrap` | Regla movida a `@layer base`; cubiertas medidas en `cqw` |

**Comprobado sin incidencias:** candado (sin sesión, todas las rutas privadas responden acceso o 401, también con cabeceras de navegación real); contraseña errónea sin cookie; cookie `HttpOnly; Secure; SameSite=Lax` acotada a la ruta; cookies falsificadas rechazadas; alta, edición, listas, comprados y compartir; inyección SQL en el parámetro de orden ignorada; campos no editables rechazados; XSS almacenado devuelto como texto literal; límite de 3 libros de la demostración y bloqueo de escrituras en servidor (403).
