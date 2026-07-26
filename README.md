# ShelfZero

**Tu estante de libros por comprar.** Escanea el código de barras, guárdalos en tu
estante y decide dónde comprarlos. Sin prisa, sin olvidos.

ShelfZero es una aplicación web instalable (PWA) con aspecto de librería para
llevar la lista de libros que quieres comprar. Añade libros escaneando su ISBN
con la cámara, buscándolos por título o introduciendo el ISBN a mano; organízalos
en listas, ordénalos como quieras, y salta a Google cuando llegue el momento de
comprarlos.

Está pensada para **una persona por instalación**: despliegas tu propia copia y tus
libros son solo tuyos. Funciona íntegramente sobre la **capa gratuita de Cloudflare**.

---

## Qué hace

- **Añadir libros** de tres formas: escaneando el código de barras (EAN-13),
  buscando por título (con lista de ediciones para elegir) o tecleando el ISBN.
  Si no hay coincidencias, avisa y permite darlo de alta a mano.
- **Fichas completas**: portada, título, autor, temática, ISBN y resumen.
- **Dos vistas**: estantería (galería de portadas sobre baldas) y lista compacta.
- **Ordenar** por reciente, A–Z, autor (agrupado) o temática (agrupada).
- **Listas propias** ("Ciencia ficción", "Ensayo"…) para agrupar a tu gusto.
- **Buscar dónde comprarlo**: abre Google con el libro ya buscado.
- **Marcar como comprado** o **eliminar** del estante.
- **Compartir** un libro o una lista con un enlace de solo lectura, por WhatsApp,
  email, SMS, X o copiando la URL.
- **Instalable** en el móvil y consultable sin conexión.

## Tecnología

| Capa | Qué usa |
|---|---|
| Interfaz | React 19 + Vite + TypeScript + Tailwind v4, empaquetado como PWA |
| Escaneo | ZXing, **en el dispositivo** (no se sube ninguna imagen) |
| API | Cloudflare Workers con Hono |
| Base de datos | Cloudflare D1 (SQLite) |
| Metadatos | Google Books API + Open Library (ambas gratuitas) |
| Acceso | Cloudflare Access (Zero Trust) |

## Coste

**0 € al mes** para uso personal. Todo cabe holgadamente en las capas gratuitas:
Workers (100.000 peticiones/día), D1 (5 GB), Cloudflare Access (hasta 50 usuarios),
Google Books y Open Library.

---

## Puesta en marcha

Necesitas [Node.js](https://nodejs.org) 20 o superior y una cuenta de Cloudflare.

### 1. Instalar

```bash
git clone https://github.com/<tu-usuario>/shelfzero.git
cd shelfzero
npm install
```

### 2. Crear la base de datos

```bash
npm run db:create
```

Copia el `database_id` que devuelve el comando y pégalo en `wrangler.jsonc`,
sustituyendo `local-dev-placeholder`.

### 3. Aplicar el esquema

```bash
npm run db:migrate:local
```

### 4. Arrancar en local

```bash
npm run dev
```

La app queda en `http://localhost:5173`.

### 5. Desplegar

```bash
npm run db:migrate:remote
npm run deploy
```

---

## Proteger tu estante

Tras el primer despliegue la URL es pública. Para que solo entres tú:

1. En el panel de Cloudflare, ve a **Zero Trust → Access → Applications**.
2. Crea una aplicación de tipo **Self-hosted** apuntando al dominio de tu Worker.
3. Añade una política **Allow** con tu correo electrónico.
4. Deja **fuera** la ruta `/s/*`: es la vista pública de los enlaces que compartes
   y debe seguir siendo accesible sin identificarse.

Cloudflare Access es gratuito hasta 50 usuarios y no requiere escribir código de
inicio de sesión.

## Clave de Google Books (opcional)

La app funciona sin ninguna clave: si Google Books no responde o agota su cuota
diaria, cae automáticamente a Open Library. Si quieres más cuota en Google:

```bash
cp .dev.vars.example .dev.vars   # para desarrollo local
# y para producción:
npx wrangler secret put GOOGLE_BOOKS_API_KEY
```

---

## Estructura

```
shelfzero/
├── migrations/       Esquema de la base de datos (D1)
├── public/           Iconos de la PWA
├── src/              Interfaz React
│   ├── components/   Estante, ficha, escáner, compartir, bienvenida
│   ├── api.ts        Cliente de la API
│   └── types.ts      Tipos compartidos
├── worker/
│   ├── index.ts      API (Hono): libros, listas, enlaces compartidos
│   └── providers.ts  Google Books + Open Library
└── wrangler.jsonc    Configuración de Cloudflare
```

## Privacidad

- El escaneo ocurre **en tu dispositivo**; no se envía ninguna imagen a ningún servidor.
- Las consultas a Google Books y Open Library pasan por tu propio Worker.
- Los enlaces compartidos usan un identificador aleatorio y son de **solo lectura**;
  nada se comparte sin que lo pidas explícitamente.

## Licencia

MIT
