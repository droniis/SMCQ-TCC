# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SMCQ (Sistema de Monitoramento de Queimadas) — a React 19 + Vite 8 SPA for monitoring wildfire alerts. Plain JavaScript/JSX (no TypeScript). UI text, identifiers for domain concepts, and code comments are in Brazilian Portuguese (`alertas`, `senha`, `usuario`, `erro`); keep new code consistent with that, including file names for pages (`Alertas.jsx`, `NovoAlerta.jsx`, `Mapa.jsx`).

## Commands

Package manager is npm (`package-lock.json`).

- `npm run dev` — Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build
- `npm run lint` — oxlint (config in `.oxlintrc.json`; `npx oxlint src/App.jsx` for a single file)

There is no test runner configured.

## Backend dependency

The app requires a separate backend at `http://localhost:3000/api`, hardcoded in `src/services/api.js` (no env var or Vite proxy). It lives in the sibling folder `../smcq-prototype` (`npm start`; Express, in-memory data that resets on restart) and `server.js` there is the source of truth for the API:

- `POST /login` `{ email, senha }` → `{ token, usuario }`; all errors come back as `{ erro }`
- `GET /alertas`, `POST /alertas`, `PATCH /alertas/:id/status` `{ status }`, `POST /alertas/:id/observacoes` `{ observacao }`
- Alert shape: `id`, `titulo`, `descricao`, `status` (`NOVO` | `EM_ANALISE` | `EM_ATENDIMENTO` | `RESOLVIDO`), `risco` (`BAIXO` | `MODERADO` | `ALTO` | `CRITICO`, computed server-side), `latitude`, `longitude`, `areaAfetada`, `vento`, `zonaUrbana`, `pessoasRisco`, `criadoEm`, `historico`, `observacoes`

## Architecture

- `src/App.jsx` holds only routing: the `Layout` (sidebar + logout + `<Outlet />`), the `RotaProtegida` guard, and the route table. `/login` is public; `/dashboard`, `/alertas`, `/novo-alerta`, `/mapa` are nested under `Layout`; any other path redirects to `/dashboard`.
- `src/pages/*` are the screens. Each supplies its own `padding: 24px` wrapper and fetches its own data.
- `src/services/api.js` is the only place that talks to the backend. Its request interceptor attaches the JWT; its response interceptor treats any 401/403 (except from `/login`) as an expired session: clears `localStorage` and hard-redirects to `/login`. Pages must go through its exported functions, not call `axios` directly.
- `src/hooks/useAuth.js` exports `useAuth()` (`user`, `login`, `logout`) and `sessaoValida()`. Auth state lives in `localStorage` (`token`, plus the user object JSON-serialized under `user`), not in a React context: `useAuth` state is per-component, and `RotaProtegida` calls `sessaoValida()` on every render (token present and JWT `exp` not passed). Keep the guard reading from storage — caching auth in `App` state previously caused login to bounce back to `/login` until a reload.
- Styling: CSS variables and the `.card` / `.btn-primary` classes in `src/styles/global.css`, plus inline style objects that reference those variables. Do not hardcode palette hex values in components (exception: Leaflet path colors in `Mapa.jsx`, which need literal colors).

Most sidebar items are still unlinked placeholders.
