# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Sticky

Cross-platform sticky-notes and idea-management app (React + Vite + Zustand + Dexie + Supabase + Konva + PWA).

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

This project ships with a standalone compose file that only starts `sticky` and joins the existing Traefik docker network.

1) Create environment file:

```bash
cp .env.traefik.example .env.traefik
```

2) Edit `.env.traefik` values (Supabase + route).

3) Validate compose:

```bash
docker compose --env-file .env.traefik -f docker-compose.traefik.yml config
```

4) Start/Update only Sticky:

```bash
docker compose --env-file .env.traefik -f docker-compose.traefik.yml up -d --build
```

5) URL (default):

`https://projects.doimih.net/sticky`

No existing project stacks are modified by this deployment.
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
