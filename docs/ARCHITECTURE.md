# Sticky Architecture (MVP Foundation)

## Stack
- React + Vite + TypeScript
- React Router
- Zustand
- Dexie (IndexedDB)
- react-konva / Konva
- Supabase (Auth, Realtime, Storage, PostgreSQL)
- Vite PWA plugin + service worker registration

## Runtime Layers
1. UI Layer
   - `src/pages/BoardPage.tsx`
   - `src/components/canvas/BoardCanvas.tsx`
2. State Layer
   - `src/store/useAuthStore.ts`
   - `src/store/useProjectStore.ts`
   - `src/store/useBoardStore.ts`
3. Data Layer
   - Local: `src/lib/db/appDb.ts`
   - Remote: `src/lib/api/supabaseApi.ts`
4. Sync Layer
   - `src/lib/sync/syncEngine.ts`
   - `src/hooks/useRealtimeSync.ts`
   - Queue-based sync with auto flush on reconnect

## Auth & Realtime
- Supabase session bootstrap runs in `useBoardBootstrap`
- UI shows email/password sign-in and sign-up when no session exists
- Realtime channels subscribe to `projects`, `notes`, and `connections`
- Remote events are written to Dexie and reflected in Zustand stores

## Offline-first Flow
1. Write action updates Zustand state
2. Persist mutation to Dexie immediately
3. Enqueue sync record in `syncQueue`
4. Sync engine flushes queue when online
5. Last-write-wins is represented by newer `updated_at`

## Next planned increments
- Attachment uploads to Supabase Storage
- Export pipeline (TXT + PDF)
- Conflict metadata and richer merge policies

## Superadmin bootstrap
- SQL: `supabase/sql/002_profiles_and_superadmin.sql`
- Script: `scripts/bootstrap-superadmin.mjs`
- Command: `npm run bootstrap:superadmin`