interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  APP_ORIGIN?: string;
  AUTH_EMAIL_FROM?: string;
  AUTH_EMAIL_SUBJECT?: string;
  SESSION_COOKIE_NAME?: string;
  MAGIC_LINK_TTL_MINUTES?: string;
  SESSION_TTL_DAYS?: string;
  LOGIN_REDIRECT_URL?: string;
}

type User = {
  id: string;
  email: string;
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8"
};

function nowMs(): number {
  return Date.now();
}

function getAllowedOrigins(env: Env): string[] {
  const appOrigin = String(env.APP_ORIGIN || "https://www.simpletrackers.io").trim();
  return [appOrigin, "http://localhost:4321", "http://localhost:3000", "http://127.0.0.1:4321"];
}

function getCorsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowedOrigins = getAllowedOrigins(env);
  const isAllowed = Boolean(origin && allowedOrigins.includes(origin));
  return {
    "access-control-allow-origin": isAllowed && origin ? origin : allowedOrigins[0],
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "Origin"
  };
}

function jsonResponse(data: unknown, status: number, origin: string | null, env: Env): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...jsonHeaders, ...getCorsHeaders(origin, env) }
  });
}

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes: Uint8Array): string {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64Url(bytes);
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function parseCookie(cookieHeader: string | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    map[rawKey] = decodeURIComponent(rest.join("=") || "");
  }
  return map;
}

function makeSessionCookie(name: string, value: string, maxAgeSeconds: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAgeSeconds}`;
}

function clearSessionCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getOrCreateUserByEmail(db: D1Database, email: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.prepare("SELECT id, email FROM users WHERE email = ?1 LIMIT 1")
    .bind(normalizedEmail)
    .first<User>();
  if (existing?.id) return existing;

  const user: User = {
    id: randomId(),
    email: normalizedEmail
  };
  await db.prepare("INSERT INTO users (id, email, created_at) VALUES (?1, ?2, ?3)")
    .bind(user.id, user.email, nowMs())
    .run();
  return user;
}

async function sendMagicLink(env: Env, to: string, link: string): Promise<void> {
  const from = String(env.AUTH_EMAIL_FROM || "SimpleTrackers <login@auth.simpletrackers.io>").trim();
  const subject = String(env.AUTH_EMAIL_SUBJECT || "Your SimpleTrackers sign-in link").trim();
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">Sign in to SimpleTrackers</h2>
      <p style="margin:0 0 16px">Click the secure link below to continue:</p>
      <p style="margin:0 0 16px"><a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Sign In</a></p>
      <p style="margin:0;color:#475569;font-size:14px">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({ from, to, subject, html })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send failed: ${res.status} ${text}`);
  }
}

async function getSession(request: Request, env: Env): Promise<{ sessionId: string; userId: string } | null> {
  const cookieName = String(env.SESSION_COOKIE_NAME || "st_session");
  const cookies = parseCookie(request.headers.get("cookie"));
  const sessionId = cookies[cookieName];
  if (!sessionId) return null;

  const session = await env.DB.prepare("SELECT id, user_id, expires_at FROM sessions WHERE id = ?1 LIMIT 1")
    .bind(sessionId)
    .first<{ id: string; user_id: string; expires_at: number }>();
  if (!session?.id) return null;
  if ((session.expires_at || 0) < nowMs()) return null;

  await env.DB.prepare("UPDATE sessions SET last_seen_at = ?1 WHERE id = ?2")
    .bind(nowMs(), session.id)
    .run();

  return { sessionId: session.id, userId: session.user_id };
}

async function requestMagicLink(request: Request, env: Env, origin: string | null): Promise<Response> {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  if (!validateEmail(email)) {
    return jsonResponse({ ok: false, error: "Enter a valid email address." }, 400, origin, env);
  }

  const user = await getOrCreateUserByEmail(env.DB, email);
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const magicLinkId = randomId();
  const ttlMinutes = Math.max(5, Number.parseInt(String(env.MAGIC_LINK_TTL_MINUTES || "20"), 10) || 20);
  const expiresAt = nowMs() + ttlMinutes * 60 * 1000;
  await env.DB.prepare(
    "INSERT INTO magic_links (id, user_id, token_hash, expires_at, used_at, created_at) VALUES (?1, ?2, ?3, ?4, NULL, ?5)"
  ).bind(magicLinkId, user.id, tokenHash, expiresAt, nowMs()).run();

  const verifyBase = new URL(request.url);
  verifyBase.pathname = "/auth/verify-link";
  verifyBase.search = "";
  verifyBase.searchParams.set("token", token);
  const redirectTo = String(env.LOGIN_REDIRECT_URL || `${String(env.APP_ORIGIN || "https://www.simpletrackers.io")}/settings?sync=connected`);
  verifyBase.searchParams.set("redirect", redirectTo);
  await sendMagicLink(env, email, verifyBase.toString());

  return jsonResponse({ ok: true }, 200, origin, env);
}

async function verifyMagicLink(request: Request, env: Env, origin: string | null): Promise<Response> {
  const url = new URL(request.url);
  const token = String(url.searchParams.get("token") || "");
  const redirect = String(url.searchParams.get("redirect") || env.LOGIN_REDIRECT_URL || `${String(env.APP_ORIGIN || "https://www.simpletrackers.io")}/settings?sync=connected`);
  if (!token) {
    return new Response("Missing token.", { status: 400 });
  }

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    "SELECT id, user_id, expires_at, used_at FROM magic_links WHERE token_hash = ?1 LIMIT 1"
  ).bind(tokenHash).first<{ id: string; user_id: string; expires_at: number; used_at: number | null }>();

  if (!row?.id || row.used_at || (row.expires_at || 0) < nowMs()) {
    return new Response("This magic link is invalid or expired.", { status: 400 });
  }

  await env.DB.prepare("UPDATE magic_links SET used_at = ?1 WHERE id = ?2")
    .bind(nowMs(), row.id)
    .run();

  const sessionId = randomId();
  const sessionTtlDays = Math.max(1, Number.parseInt(String(env.SESSION_TTL_DAYS || "30"), 10) || 30);
  const sessionTtlMs = sessionTtlDays * 24 * 60 * 60 * 1000;
  const expiresAt = nowMs() + sessionTtlMs;
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at, created_at, last_seen_at) VALUES (?1, ?2, ?3, ?4, ?5)"
  ).bind(sessionId, row.user_id, expiresAt, nowMs(), nowMs()).run();

  const cookieName = String(env.SESSION_COOKIE_NAME || "st_session");
  const headers = new Headers({
    "location": redirect,
    ...getCorsHeaders(origin, env)
  });
  headers.append("set-cookie", makeSessionCookie(cookieName, sessionId, Math.floor(sessionTtlMs / 1000)));
  return new Response(null, { status: 302, headers });
}

async function getAuthSession(request: Request, env: Env, origin: string | null): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) {
    return jsonResponse({ ok: true, authenticated: false }, 200, origin, env);
  }
  const user = await env.DB.prepare("SELECT id, email FROM users WHERE id = ?1 LIMIT 1")
    .bind(session.userId)
    .first<User>();
  return jsonResponse({
    ok: true,
    authenticated: Boolean(user?.id),
    user: user ? { id: user.id, email: user.email } : null
  }, 200, origin, env);
}

async function logout(request: Request, env: Env, origin: string | null): Promise<Response> {
  const cookieName = String(env.SESSION_COOKIE_NAME || "st_session");
  const cookies = parseCookie(request.headers.get("cookie"));
  const sessionId = cookies[cookieName];
  if (sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(sessionId).run();
  }
  const headers = new Headers({ ...jsonHeaders, ...getCorsHeaders(origin, env) });
  headers.append("set-cookie", clearSessionCookie(cookieName));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function exportData(request: Request, env: Env, origin: string | null): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) return jsonResponse({ ok: false, error: "Unauthorized" }, 401, origin, env);

  const row = await env.DB.prepare("SELECT payload, updated_at FROM user_data WHERE user_id = ?1 LIMIT 1")
    .bind(session.userId)
    .first<{ payload: string; updated_at: number }>();
  let payload: Record<string, unknown> = {};
  if (row?.payload) {
    try {
      payload = JSON.parse(row.payload);
    } catch {
      payload = {};
    }
  }
  return jsonResponse({ ok: true, payload, updatedAt: row?.updated_at || null }, 200, origin, env);
}

function mergeStores(remoteStore: Record<string, unknown>, localStore: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...remoteStore };
  for (const [key, value] of Object.entries(localStore)) {
    const remoteValue = merged[key];
    if (Array.isArray(remoteValue) && Array.isArray(value)) {
      const seen = new Set<string>();
      const deduped = [...value, ...remoteValue].filter((entry) => {
        const k = JSON.stringify(entry);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      merged[key] = deduped;
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

async function importData(request: Request, env: Env, origin: string | null): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) return jsonResponse({ ok: false, error: "Unauthorized" }, 401, origin, env);

  const body = await request.json().catch(() => ({}));
  const payload = body?.payload;
  const mode = String(body?.mode || "overwrite");
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return jsonResponse({ ok: false, error: "Payload must be an object." }, 400, origin, env);
  }

  let finalPayload: Record<string, unknown> = payload as Record<string, unknown>;
  if (mode === "merge") {
    const existing = await env.DB.prepare("SELECT payload FROM user_data WHERE user_id = ?1 LIMIT 1")
      .bind(session.userId)
      .first<{ payload: string }>();
    let existingPayload: Record<string, unknown> = {};
    if (existing?.payload) {
      try {
        existingPayload = JSON.parse(existing.payload);
      } catch {
        existingPayload = {};
      }
    }
    finalPayload = mergeStores(existingPayload, finalPayload);
  }

  await env.DB.prepare(
    "INSERT INTO user_data (user_id, payload, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at"
  ).bind(session.userId, JSON.stringify(finalPayload), nowMs()).run();

  return jsonResponse({ ok: true }, 200, origin, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin, env)
      });
    }

    try {
      if (request.method === "POST" && url.pathname === "/auth/request-link") {
        return await requestMagicLink(request, env, origin);
      }
      if (request.method === "GET" && url.pathname === "/auth/verify-link") {
        return await verifyMagicLink(request, env, origin);
      }
      if (request.method === "GET" && url.pathname === "/auth/session") {
        return await getAuthSession(request, env, origin);
      }
      if (request.method === "POST" && url.pathname === "/auth/logout") {
        return await logout(request, env, origin);
      }
      if (request.method === "GET" && url.pathname === "/sync/export") {
        return await exportData(request, env, origin);
      }
      if (request.method === "POST" && url.pathname === "/sync/import") {
        return await importData(request, env, origin);
      }
      if (request.method === "GET" && url.pathname === "/healthz") {
        return jsonResponse({ ok: true, service: "trackers-auth-sync" }, 200, origin, env);
      }
      return jsonResponse({ ok: false, error: "Not found" }, 404, origin, env);
    } catch (error) {
      return jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Unexpected error" }, 500, origin, env);
    }
  }
};
