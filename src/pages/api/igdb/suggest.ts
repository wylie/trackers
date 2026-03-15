import type { APIRoute } from "astro";

let cachedAccessToken = "";
let tokenExpiresAt = 0;

async function getIgdbAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 60_000) {
    return cachedAccessToken;
  }

  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials"
    })
  });

  if (!tokenRes.ok) return null;
  const tokenData = await tokenRes.json();
  if (!tokenData?.access_token) return null;

  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = Date.now() + (Number(tokenData.expires_in) || 0) * 1000;
  return cachedAccessToken;
}

function formatGameTitle(game: { name?: string; first_release_date?: number }): string {
  if (!game?.name) return "";
  if (!game.first_release_date) return game.name;
  const year = new Date(game.first_release_date * 1000).getUTCFullYear();
  if (!Number.isFinite(year)) return game.name;
  return `${game.name} (${year})`;
}

export const GET: APIRoute = async ({ url }) => {
  const clientId = import.meta.env.IGDB_CLIENT_ID;
  const clientSecret = import.meta.env.IGDB_CLIENT_SECRET;
  const query = (url.searchParams.get("q") || "").trim();

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
  }

  if (query.length < 2) {
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
  }

  const token = await getIgdbAccessToken(clientId, clientSecret);
  if (!token) {
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
  }

  const escapedQuery = query.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const body = `search "${escapedQuery}"; fields name,first_release_date; where version_parent = null; limit 8;`;

  const igdbRes = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    },
    body
  });

  if (!igdbRes.ok) {
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
  }

  const games = await igdbRes.json();
  const suggestions = Array.isArray(games)
    ? games.map(formatGameTitle).filter(Boolean).slice(0, 8)
    : [];

  return new Response(JSON.stringify({ suggestions }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
