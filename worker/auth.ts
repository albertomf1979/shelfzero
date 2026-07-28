/**
 * Protección por contraseña del estante privado.
 *
 * La contraseña se guarda como secreto de Cloudflare (`wrangler secret put
 * APP_PASSWORD`), nunca en el repositorio. La cookie de sesión no la contiene:
 * guarda un HMAC derivado de ella, de modo que no se puede falsificar sin
 * conocerla, y caducar la sesión es tan simple como cambiar la contraseña.
 */

const COOKIE = "sz_session";
const MESSAGE = "shelfzero-session-v1";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

const enc = new TextEncoder();

async function sign(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(MESSAGE));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparación en tiempo constante: no revela por dónde difieren. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function isAuthenticated(
  request: Request,
  password: string
): Promise<boolean> {
  const cookie = readCookie(request, COOKIE);
  if (!cookie) return false;
  return safeEqual(cookie, await sign(password));
}

export async function sessionCookie(
  password: string,
  base: string
): Promise<string> {
  const value = await sign(password);
  return `${COOKIE}=${value}; Path=${base}; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearCookie(base: string): string {
  return `${COOKIE}=; Path=${base}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function checkPassword(given: string, expected: string): boolean {
  return safeEqual(given, expected);
}

/** Pantalla de acceso, con el mismo lenguaje visual que la app. */
export function loginPage(base: string, failed = false): Response {
  const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ShelfZero</title>
<style>
  :root { color-scheme: light dark; }
  *{box-sizing:border-box}
  body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    color:#2a2521;background:#f9f6ef}
  .card{width:100%;max-width:22rem;text-align:center}
  .mark{width:72px;height:72px;margin:0 auto 28px;border-radius:18px;background:#9a3b32;
    display:grid;place-items:center;box-shadow:0 8px 20px -12px rgb(42 37 33/.5)}
  h1{margin:0;font-size:2.25rem;font-weight:600;letter-spacing:-.01em;
    font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif}
  .eyebrow{margin:0 0 10px;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#675a4c}
  p.lede{margin:14px 0 26px;color:#4e443c;font-size:1.0625rem;line-height:1.6}
  form{display:flex;flex-direction:column;gap:12px}
  input{min-height:48px;padding:0 18px;font-size:1rem;color:#2a2521;background:#fffdf8;
    border:1px solid #877253;border-radius:999px;outline:none}
  input:focus{border-color:#9a3b32;outline:2px solid #2a2521;outline-offset:2px}
  button{min-height:48px;border:0;border-radius:999px;background:#9a3b32;color:#f9f6ef;
    font-size:1rem;font-weight:500;cursor:pointer}
  button:hover{background:#7c2d26}
  .error{margin:0;padding:10px 14px;border-radius:12px;background:rgb(154 59 50/.1);
    color:#9a3b32;font-size:.9375rem}
  .foot{margin-top:28px;font-size:.8125rem;color:#675a4c}
  .foot a{color:#675a4c}
  @media (prefers-color-scheme: dark){
    body{background:#191411;color:#f0e6d6}
    .mark{background:#f2ece1}
    .eyebrow,.foot,.foot a{color:#a3947f}
    p.lede{color:#cbbca6}
    input{background:#241d17;color:#f0e6d6;border-color:#7a6851}
    button{background:#f2ece1;color:#191411}
    button:hover{background:#ded4c4}
    .error{background:rgb(224 129 117/.12);color:#e08175}
  }
</style></head><body>
<div class="card">
  <div class="mark">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f9f6ef"
      stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 6.5v13"/>
      <path d="M12 6.5C10.4 5.2 8.3 4.5 5.5 4.5H3v13h2.5c2.8 0 4.9.7 6.5 2"/>
      <path d="M12 6.5c1.6-1.3 3.7-2 6.5-2H21v13h-2.5c-2.8 0-4.9.7-6.5 2"/>
    </svg>
  </div>
  <p class="eyebrow">Estante privado</p>
  <h1>ShelfZero</h1>
  <p class="lede">Introduce la contraseña para ver tus libros.</p>
  <form method="POST" action="${base}/api/login">
    ${failed ? '<p class="error" role="alert">La contraseña no es correcta.</p>' : ""}
    <input type="password" name="password" placeholder="Contraseña" autocomplete="current-password"
           aria-label="Contraseña" autofocus required>
    <button type="submit">Entrar</button>
  </form>
  <p class="foot">¿Solo quieres probarla? <a href="/shelfzerodemo/">Ver la demostración</a></p>
</div>
</body></html>`;
  return new Response(html, {
    status: failed ? 401 : 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
