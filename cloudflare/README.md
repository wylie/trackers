# Cloudflare Auth + Sync API

This Worker provides optional multi-device sync for SimpleTrackers while keeping localStorage as the default mode.

## 1. Prerequisites

- Worker name: `trackers` (already created)
- Resend domain verified
- Secret set on Worker:
  - `RESEND_API_KEY`

## 2. Create D1 database

```bash
npx wrangler d1 create trackers
```

Copy the `database_id` into `cloudflare/wrangler.toml` under `[[d1_databases]]`.

## 3. Apply schema

```bash
npx wrangler d1 execute trackers --file=cloudflare/schema.sql
```

## 4. Deploy Worker

```bash
npx wrangler deploy --config cloudflare/wrangler.toml
```

## 5. Configure frontend

Set `PUBLIC_SYNC_API_BASE` in your frontend env (Vercel project env vars):

```bash
PUBLIC_SYNC_API_BASE=https://trackers.<your-subdomain>.workers.dev
```

For production, point this to a custom domain (recommended), for example:

```bash
PUBLIC_SYNC_API_BASE=https://api.simpletrackers.io
```

## Endpoints

- `POST /auth/request-link` body: `{ "email": "you@example.com" }`
- `GET /auth/verify-link?token=...&redirect=...`
- `GET /auth/session`
- `POST /auth/logout`
- `GET /sync/export`
- `POST /sync/import` body: `{ "payload": {...}, "mode": "overwrite" | "merge" }`

## Notes

- Session cookie is HTTP-only and secure.
- CORS is restricted to `APP_ORIGIN` and common localhost origins.
- Keep local mode as the default. Sync only applies after sign-in.
