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
- Deletion is logical (`excluido: true`, `excluidoEm`, `excluidoPor`); deleted alerts disappear from `GET /alertas` and 404 on the other routes. `DELETE /alertas/:id` is `ADMINISTRADOR` only. `OPERADOR`/`GESTOR` instead `POST /alertas/:id/solicitacoes-exclusao` `{ motivo }` (one pending request per alert, else 409); the admin resolves with `PATCH /alertas/:id/solicitacoes-exclusao/:sid` `{ decisao: 'APROVADA' | 'REJEITADA', resposta? }`. `GET /solicitacoes-exclusao[?status=]` returns a flat list (all for admin, own for others) with `alertaId`, `alertaTitulo`, `alertaExcluido`, `solicitadoPorNome`.
- Status codes: 401 = invalid/expired token (frontend logs out), 403 = permission denied (frontend must show the message and stay logged in).
- Test users: `admin@smcq.com`/`admin123`, `operador@smcq.com`/`operador123`, `gestor@smcq.com`/`gestor123` (`perfil`: `ADMINISTRADOR`, `OPERADOR`, `GESTOR`).
- Alert shape: `id`, `titulo`, `descricao`, `status` (`NOVO` | `EM_ANALISE` | `EM_ATENDIMENTO` | `RESOLVIDO`), `risco` (`BAIXO` | `MODERADO` | `ALTO` | `CRITICO`, computed server-side), `latitude`, `longitude`, `estado` (UF), `municipio`, `areaAfetada`, `vento`, `zonaUrbana`, `pessoasRisco`, `criadoEm`, `historico`, `observacoes`

## Architecture

- `src/App.jsx` holds only routing: the `RotaProtegida` guard and the route table. `/login` is public; `/dashboard`, `/alertas`, `/novo-alerta`, `/mapa` are nested under `components/Layout.jsx`; any other path redirects to `/dashboard`.
- `src/components/Layout.jsx` composes `Sidebar` + `Header` + `<Outlet />`. The screen title shown in `Header` comes from the `TITULOS` map in `Layout` (keyed by pathname), so pages do not render their own title — add an entry there when adding a route, and a sidebar entry in `ITENS` in `Sidebar.jsx`.
- `src/pages/*` are thin screens: each supplies its own `padding: 24px` wrapper, gets data from `useAlertas()`, and delegates rendering to components (`AlertTable`, `AlertForm`, `MapView`, `MetricCard`, `ActionCard`). `FilterBar` exists but is not wired into a page yet.
- `src/hooks/useAlertas.js` returns `alertas`, `loading`, `erro`, `recarregar`, `criarAlerta`, `alterarStatus`. Load errors land in `erro`; `criarAlerta`/`alterarStatus` throw so the page can show the message (use `mensagemDeErro(err, padrao)` from `services/api.js`). State is per-component, not shared between pages.
- `src/services/constantes.js` is the single source for risk/status labels and colors (`RISCOS`, `STATUS`), `PERFIS`, `ESTADOS`, and `FILTROS_VAZIOS`. Render them through `RiskBadge` / `StatusBadge`.
- `src/services/api.js` is the only place that talks to the backend. Its request interceptor attaches the JWT; its response interceptor treats a 401 (except from `/login`) as an expired session: clears `localStorage` and hard-redirects to `/login`. Pages must go through its exported functions, not call `axios` directly.
- `src/hooks/useAuth.js` exports `useAuth()` (`user`, `login`, `logout`) and `sessaoValida()`. Auth state lives in `localStorage` (`token`, plus the user object JSON-serialized under `user`), not in a React context: `useAuth` state is per-component, and `RotaProtegida` calls `sessaoValida()` on every render (token present and JWT `exp` not passed). Keep the guard reading from storage — caching auth in `App` state previously caused login to bounce back to `/login` until a reload.
- Styling: CSS variables and shared classes in `src/styles/global.css` (`.card`, `.btn-primary`, `.campo`, `.rotulo`, `.tabela`, `.badge`, layout classes). Prefer a class there over inline style objects. Do not hardcode palette hex values in components; the literal hex values live in `constantes.js` because Leaflet path options cannot use CSS variables.

Anexos (attachments) are planned as browser-only (`localStorage`); the backend has no file endpoint.
