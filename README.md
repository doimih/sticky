# Sticky

Cross-platform sticky-notes and idea-management app built with React, Vite, Zustand, Dexie, Supabase, Konva and PWA support.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy behind existing Traefik (isolated)

This repository includes `docker-compose.traefik.yml`, which starts only the Sticky frontend and attaches it to the existing Traefik network.

1. Create env file:

```bash
cp .env.traefik.example .env.traefik
```

2. Configure `.env.traefik` values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, route settings).

3. Validate compose:

```bash
docker compose --env-file .env.traefik -f docker-compose.traefik.yml config
```

4. Start/update Sticky:

```bash
docker compose --env-file .env.traefik -f docker-compose.traefik.yml up -d --build
```

5. Default app URL:

`https://projects.doimih.net/sticky`

## Monitoring API

- Public route: `https://projects.doimih.net/sticky/api/health`
- Backend route inside container: `/api/health`
- Method: `GET`
- Response: JSON

Example response:

```json
{
  "status": "ok",
  "service": "sticky",
  "timestamp": "2026-02-23T12:34:56+00:00"
}
```

Access is restricted to requests with `Origin: https://projects.doimih.net`.
