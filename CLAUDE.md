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

The app requires a separate backend at `http://localhost:3000/api`, hardcoded in `src/services/api.js` (no env var or Vite proxy). It lives in the separate repository [SMCQ-Backend](https://github.com/droniis/SMCQ-Backend) (formerly `smcq-prototype`), cloned as the sibling folder `../SMCQ-Backend` (`npm start`; Express with PostgreSQL, or in memory with `PERSISTENCIA=memoria`, which resets on restart — use memory mode for browser testing) and `server.js` there is the source of truth for the API (its README documents every route and the permission matrix):

- `POST /login` `{ email, senha }` → `{ token, usuario }` (`usuario.senhaProvisoria` → go to `/trocar-senha`); all errors come back as `{ erro }`
- `GET /alertas`, `POST /alertas`, `GET /alertas/:id` (with author names), `PATCH /alertas/:id` (edit; `POST /alertas/:id/risco/simulacao` previews the risk without saving), `PATCH /alertas/:id/status` `{ status }` (only the transitions in `TRANSICOES_STATUS`, else 422), `POST /alertas/:id/observacoes` `{ observacao }`
- `GET|PATCH /perfil`, `PATCH /perfil/senha` (own data and password); `/usuarios` routes for user management, permissions mirrored in `constantes.js` (`podeCadastrarUsuario` etc.) but enforced by the backend
- Deletion is logical (`excluido: true`, `excluidoEm`, `excluidoPor`); deleted alerts disappear from `GET /alertas` and 404 on the other routes. `DELETE /alertas/:id` is for `ADMINISTRADOR` and `GESTOR` (`PERFIS_EXCLUSAO_DIRETA` in `constantes.js`). `OPERADOR` instead `POST /alertas/:id/solicitacoes-exclusao` `{ motivo }` (one pending request per alert, else 409); an admin or gestor resolves with `PATCH /alertas/:id/solicitacoes-exclusao/:sid` `{ decisao: 'APROVADA' | 'REJEITADA', resposta? }`. `GET /solicitacoes-exclusao[?status=]` returns a flat list (all for admin/gestor, own for operador) with `alertaId`, `alertaTitulo`, `alertaExcluido`, `solicitadoPorNome`.
- Status codes: 401 = invalid/expired token or deactivated user (frontend logs out), 403 = permission denied (frontend must show the message and stay logged in; with `codigo: 'TROCA_SENHA_OBRIGATORIA'` the interceptor goes to `/trocar-senha`), 404/409/422 = show the backend message.
- Test users: `admin@smcq.com`/`admin123`, `operador@smcq.com`/`operador123`, `gestor@smcq.com`/`gestor123` (`perfil`: `ADMINISTRADOR`, `OPERADOR`, `GESTOR`).
- Alert shape: `id`, `titulo`, `descricao`, `status` (`NOVO` | `EM_ANALISE` | `EM_ATENDIMENTO` | `RESOLVIDO`), `risco` (`BAIXO` | `MODERADO` | `ALTO` | `CRITICO`, computed server-side), `tipoOcorrencia` (`QUEIMADA_VEGETACAO` | `INCENDIO_URBANO`), `latitude`, `longitude`, `estado` (UF), `municipio`, `cep`, `logradouro`, `numero`, `bairro`, `areaAfetada`, `vento`, `pessoasRisco`, `criadoEm`, `historico`, `observacoes`
- Occurrence type: `POST /alertas` sends `tipoOcorrencia`; the frontend no longer sends `zonaUrbana` (the API still accepts it from old clients; `tipoOcorrencia` wins when both come). `INCENDIO_URBANO` requires `logradouro` (street or reference point), `bairro`, `municipio` and `estado`; CEP and número are optional. `QUEIMADA_VEGETACAO` needs only the coordinates. The type only sets defaults (tipo de área Urbana, pessoas em risco checked — the latter only in the form, never in the API) and does not enter the IRS formula. Alerts without the field are vegetation fires (`tipoOcorrenciaDe` in `constantes.js`).

## Architecture

- `src/App.jsx` holds only routing: the `RotaProtegida` guard (also sends users with a provisional password to `/trocar-senha`), `RotaComSessao` and the route table. `/login` is public; `/trocar-senha` only needs a session; `/dashboard`, `/alertas`, `/alertas/:id`, `/novo-alerta`, `/mapa`, `/solicitacoes-exclusao`, `/usuarios`, `/perfil` are nested under `components/Layout.jsx`; any other path redirects to `/dashboard`.
- `src/components/Layout.jsx` composes `Sidebar` + `Header` + `<Outlet />`. The screen title shown in `Header` comes from the `TITULOS` map in `Layout` (keyed by pathname), so pages do not render their own title — add an entry there when adding a route, and a sidebar entry in `ITENS` in `Sidebar.jsx`.
- `src/pages/*` are thin screens: each supplies its own `padding: 24px` wrapper, gets data from `useAlertas()`, and delegates rendering to components (`AlertTable`, `AlertForm`, `MapView`, `MetricCard`, `ActionCard`). `FilterBar` holds the global filters (including tipo de ocorrência), shared through `FiltrosProvider`.
- `AlertForm` adapts to the occurrence type, its first field: vegetation puts the map first (mobile) with typed coordinates (`services/localizacao.js`), "Usar minha localização" (Geolocation API, needs HTTPS or localhost) and município/UF from reverse geocoding; urban puts the address first. Reverse geocoding (`buscarEnderecoPorPonto`) runs once per user action, never per keystroke (Nominatim usage policy).
- `src/hooks/useAlertas.js` returns `alertas`, `loading`, `erro`, `recarregar`, `criarAlerta`, `alterarStatus`. Load errors land in `erro`; `criarAlerta`/`alterarStatus` throw so the page can show the message (use `mensagemDeErro(err, padrao)` from `services/api.js`). State is per-component, not shared between pages.
- `src/services/constantes.js` is the single source for risk/status labels and colors (`RISCOS`, `STATUS`), `PERFIS`, `ESTADOS`, `TIPOS_OCORRENCIA`, and `FILTROS_VAZIOS`. Render them through `RiskBadge` / `StatusBadge` / `TipoOcorrenciaBadge` (icons in `services/iconesTipoOcorrencia.js`).
- `src/services/api.js` is the only place that talks to the backend. Its request interceptor attaches the JWT; its response interceptor treats a 401 (except from `/login`) as an expired session: clears `localStorage` and hard-redirects to `/login`. Pages must go through its exported functions, not call `axios` directly.
- `src/hooks/useAuth.js` exports `useAuth()` (`user`, `login`, `logout`) and `sessaoValida()`. Auth state lives in `localStorage` (`token`, plus the user object JSON-serialized under `user`), not in a React context: `useAuth` state is per-component, and `RotaProtegida` calls `sessaoValida()` on every render (token present and JWT `exp` not passed). Keep the guard reading from storage — caching auth in `App` state previously caused login to bounce back to `/login` until a reload.
- Styling is mid-migration to Tailwind CSS v4 (`@tailwindcss/vite` plugin; there is no `tailwind.config.js` — the theme lives in the `@theme` block at the top of `src/styles/global.css`). Palette utilities are `smcq-orange`, `smcq-orange-dark`, `smcq-red`, `smcq-navy`, `smcq-blue`, `smcq-green`, `smcq-yellow` (e.g. `bg-smcq-orange`); use Tailwind's `slate` scale for neutrals. Font is Inter (`@fontsource-variable/inter`, imported in `main.jsx`); icons are `lucide-react`. Migrated so far: `Sidebar`, `Layout`, `Header` (with the user menu: Meu perfil / Sair). Everything else still uses the legacy classes further down `global.css` (`.card`, `.btn-primary`, `.campo`, `.tabela`, ...) — when migrating a screen, replace them with utilities and delete the now-unused legacy rules, and remove the heading shim in `@layer base` once nothing depends on it. Legacy rules are unlayered and therefore override utilities on the same element, so do not mix both on one element. Do not add a global `*` reset (it would override every utility).
- Tailwind's preflight makes `<button>` use the default cursor — add `cursor-pointer` to clickable elements.
- Overlays must sit above Leaflet (its controls use z-index up to 1000): the mobile sidebar drawer uses `z-[1100]`.
- The literal risk/status hex values live in `constantes.js` because Leaflet path options cannot use CSS variables.
- `Layout` owns the sidebar state: collapsed (persisted in `localStorage` as `sidebarRecolhida`, defaults to collapsed below 1024px) and the mobile drawer (below the `md` breakpoint). `Sidebar` takes a `contadores` prop (`{ [chave]: number }`) to show a badge on items that declare a `chave`.
- After changing `vite.config.js`, restart `npm run dev` and confirm the page actually picks up the change.

Anexos (attachments) are planned as browser-only (`localStorage`); the backend has no file endpoint.
