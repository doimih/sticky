# Sticky

Offline-first sticky notes and idea-management canvas with real-time collaboration sync.

## Development stack

- **Frontend:** React 19, TypeScript, Vite 7, React Router 7
- **Styling:** Tailwind CSS v4 + app-level CSS
- **Canvas/UI engine:** Konva + react-konva
- **State management:** Zustand stores (`auth`, `project`, `board`)
- **Local persistence:** Dexie on IndexedDB (`sticky-db`)
- **Backend services:** Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Sync strategy:** Queue-based sync engine with online flush + realtime subscriptions
- **PWA:** `vite-plugin-pwa` + service worker auto-update registration
- **Tooling:** ESLint 9, TypeScript 5, npm scripts
- **Deployment:** Multi-stage Docker build (Node 22 + Nginx 1.27), Traefik reverse proxy

## Architecture (high level)

1. **UI Layer**
  - `src/pages/BoardPage.tsx`
  - `src/components/canvas/BoardCanvas.tsx`
2. **State Layer**
  - `src/store/useAuthStore.ts`
  - `src/store/useProjectStore.ts`
  - `src/store/useBoardStore.ts`
3. **Data Layer**
  - Local: `src/lib/db/appDb.ts`
  - Remote: `src/lib/api/supabaseApi.ts`
4. **Sync Layer**
  - `src/lib/sync/syncEngine.ts`
  - `src/hooks/useRealtimeSync.ts`

## Prerequisites

- Node.js 22+
- npm 10+
- Supabase project (for auth/realtime/cloud sync)
- Docker + Docker Compose (for container deployment)

## Environment variables

Create local env:

```bash
cp .env.example .env
```

Required values in `.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Optional:

- `VITE_APP_BASE_PATH` (default `/`) for subpath hosting like `/sticky/`

If Supabase variables are missing, the app still runs locally with offline mode, but online sync is disabled.

## Local development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Other scripts:

```bash
npm run build
npm run preview
npm run lint
```

## Supabase setup

Apply SQL migrations in order:

1. `supabase/sql/001_init.sql`
2. `supabase/sql/002_profiles_and_superadmin.sql`

Bootstrap superadmin account:

```bash
npm run bootstrap:superadmin
```

## Sync model

For each mutation:

1. Update Zustand state
2. Persist to Dexie immediately
3. Enqueue a sync item in `syncQueue`
4. Flush queue when online/focused/visible
5. Merge remote updates through Supabase Realtime channels

Conflict behavior follows last-write-wins using newer `updated_at` values.

## Deploy behind existing Traefik

This repo includes `docker-compose.traefik.yml` that starts only the Sticky frontend and attaches it to external Traefik network `shop-online_web`.

1. Create deployment env file:

```bash
cp .env.traefik.example .env.traefik
```

2. Configure `.env.traefik`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_BASE_PATH` (example: `/sticky/`)
- `TRAEFIK_HOST` (example: `projects.doimih.net`)
- `TRAEFIK_PATH_PREFIX` (example: `/sticky`)

3. Validate compose:

```bash
docker compose --env-file .env.traefik -f docker-compose.traefik.yml config
```

4. Build and run:

```bash
docker compose --env-file .env.traefik -f docker-compose.traefik.yml up -d --build
```

Default URL:

- `https://projects.doimih.net/sticky`

## Monitoring API

- Public route: `https://projects.doimih.net/sticky/api/health`
- Container route: `/api/health`
- Method: `GET`
- Response: JSON

Example:

```json
{
  "status": "ok",
  "service": "sticky",
  "timestamp": "2026-02-23T12:34:56+00:00"
}
```

Access is restricted to requests with `Origin: https://projects.doimih.net`.

## Troubleshooting: changes not visible on another computer

1. **Code sync (Git)**
  - Push from machine A
  - Run `git pull` on machine B
2. **Data sync (Supabase)**
  - Verify `.env` on both machines
  - Sign in with the same account
  - Select the same project
3. **Offline cache note**
  - Unsynced changes remain in IndexedDB (`sticky-db`) until sync succeeds
