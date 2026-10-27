# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 19 + Vite SPA for a multi-tenant school management system (SaaS). Consumes the
FastAPI backend in the sibling repo `sistema_escolar_api`. Three roles: `admin`,
`profesor`, `super_admin` (platform-level, manages tenants/colegios).

## Working rules

- Before modifying a module, inspect its current implementation, tests, and relevant documentation.
- Prefer the existing project pattern (see Architecture below) over a new one; prefer the smallest safe change that satisfies the requirement.
- Don't perform unrelated refactors, or delete files/routes/tests/functionality, without explaining why first — and don't do it at all unless it was requested or you flagged it and got a go-ahead.
- Never put secrets, tokens, credentials, or env var values in source code or logs.
- Never weaken authentication, authorization, tenant isolation, or validation to make a feature work — the backend is the source of truth for all of these (see Session & API client below).

### Frontend/backend boundary

This repo is the frontend only.

- Don't modify the sibling `sistema_escolar_api` repo unless explicitly asked.
- Don't invent backend endpoints, payloads, response fields, or authorization behavior — check the relevant `services/<modulo>Api.js`, its tests, and `docs/API_CLIENT.md` first.
- If a requested change needs a backend change too, say so and explain it before proceeding with the frontend side.

### Sensitive changes

Treat these as high risk. Before touching one: inspect the current implementation,
identify affected files/contracts, explain the change, preserve backward
compatibility when possible, and run the relevant tests afterward.

- authentication/session handling
- roles and authorization
- tenant resolution/isolation
- payments and financial reports
- production environment configuration

### Validation

Run the relevant tests after any meaningful change. Never report a
test/build/lint as passing unless it actually ran and passed.

## Commands

Package manager is **pnpm**, enforced by `pre*` scripts that abort under npm/yarn.
pnpm runs the version pinned in `packageManager`. Node is **24 LTS**: `.nvmrc` holds
the exact tested version and `engines.node: "24.x"` makes Vercel build with Node 24.

```bash
pnpm run dev            # start Vite dev server
pnpm run build          # vite build (prebuild validates VITE_API_URL via scripts/check-env.mjs)
pnpm run lint           # eslint .
pnpm run test           # vitest run (all tests, once)
pnpm run check:deploy   # test + lint + build — run before every push, per project convention
pnpm run preview        # serve the production build locally
```

Single test file: `pnpm exec vitest run src/pages/Planilla.test.jsx`
Watch mode: `pnpm exec vitest` (no `run`).

Requires `VITE_API_URL` in `.env` (defaults to `http://localhost:8000` only in dev).

## Architecture

Each domain module (`pagos`, `asistencia`, `planilla`, `boletines`, `observador`,
`carteraTiposPago`, `inventarioVentas`, `nominaEgresosPrestamos`, `dashboards`,
`certificadosImpresion`, `mallaCurricular`, `administracionAcademica`,
`estudiantesObservador`, `reportesFinancieros`, `planeaciones`, `autenticacion`)
follows the same layering, mirrored under `src/{services,utils,hooks,components}/<modulo>/`,
with the page in `src/pages/` as composition root:

1. **`services/<modulo>Api.js`** — the *only* HTTP boundary for that module. Wraps
   `src/utils/api.js` (shared Axios client), owns routes/payloads/multipart/cancellation.
   Returns data, never decides UI messages.
2. **`utils/<modulo>/`** — pure contracts: constants, initial state, response
   normalization, payload builders, formatters, validation. No HTTP, no React, no DOM,
   no storage access. Has adjacent `*.test.js` files.
3. **`hooks/<modulo>/`** — split into *query* hooks (load/reload, filters, pagination,
   cancellation of stale responses) and *command* hooks (editable state, save/delete,
   confirmations, conflict recovery). Hooks coordinate; services keep the transport.
4. **`components/<modulo>/`** — presentational only, receive data/callbacks via props,
   no service imports, no domain-state ownership.
5. **`pages/<Pagina>.jsx`** — composition root: reads route/params, wires hooks to
   components, keeps navigation. No direct HTTP, no large transforms, no big visual
   blocks.

**A module never imports from `utils/<other-module>/`.** Data or logic used by two+
modules goes to `src/constants/` (constants) or the root of `src/utils/` (pure
contracts) — e.g. `src/utils/periodoProfesor.js`, `src/utils/valoracionesDesarrollo.js`.
This rule exists because `VALORACIONES_DESARROLLO` was once duplicated three times and
silently drifted (see `docs/ARQUITECTURA_FRONTEND.md` for the full story) — treat any
copy-pasted domain constant as a bug waiting to happen.

This structure is the result of an ongoing module-by-module migration
(`docs/modularizacion/README.md`); not every module may be fully migrated yet.

### Entry & routing

`src/main.jsx` renders `BrowserRouter` + `App`. `src/App.jsx` lazy-loads all pages
(`React.lazy`/`Suspense`) and defines the route tree and guards:

- `/login`, `/cambiar-password` (forced password change) sit outside the main layout.
- `/super-admin` is its own layout, guarded by `SuperAdminRoute`.
- `/*` is the authenticated layout: reads `usuario`/`profesor` from `localStorage` to
  pick `NavAdminView` or `NavProfesorView`, redirects to `/login` if neither exists.
- `ProtectedRoute` (any session), `AdminRoute` (`usuario.rol === "admin"`),
  `SuperAdminRoute` (`super_admin.rol === "super_admin"`) are frontend-only UX guards —
  **real authorization always lives in the backend**; see `docs/CHECKLIST_PRODUCCION_FRONTEND.md`.

Full route table: `docs/RUTAS_FRONTEND.md`. Role/guard details: `docs/ROLES_UI.md`.

### Session & API client

- `src/utils/api.js`: shared Axios instance, `baseURL` from `src/config/env.js`
  (`VITE_API_URL`), `withCredentials: true`. Request interceptor adds
  `Authorization: Bearer <token>` only when the `token` cookie is JS-readable (in
  production it's HttpOnly, so auth travels via the cookie alone). Response
  interceptor clears session `localStorage` keys and redirects to `/login` on `401`.
- The tenant is resolved server-side from the cookie/JWT — **the frontend never sends
  a tenant header**. Full contract: `docs/API_CLIENT.md`.
- Session data (`usuario`, `profesor`, `super_admin` in `localStorage`) is visual only;
  it must never hold the JWT.

### Money/period rules

The frontend never decides which periods are billable — it only renders options
computed and validated by the backend (e.g. `mes_final` on monthly payment
concepts). Don't add client-side date-range logic for cartera/cuotas/adelantos.

### Printable documents

`components/impresion/DocumentoImprimible` is the shared entry point for branding,
header, signatures, footer and print behavior. Convention: regular documents adapt to
screen width; `boletin`, `certificados` and `cartera` keep fixed A4 width (`210mm`)
with horizontal scroll on mobile.

## Testing conventions

Vitest + JSDOM + React Testing Library, config lives in `vite.config.js`
(`src/test/setup.js` registers matchers, cleans up DOM after each test).
Prefer testing pure `utils/` transformations directly, service contracts (routes,
payloads, cancellation) in `*Api.test.js`, hooks in isolation from full pages, and
keep one integration/characterization test per page for the critical flow.

## Docs

`docs/README.md` is the index; read it before touching a module you don't know.
Notably: `docs/modularizacion/<MODULO>.md` per-module migration status,
`docs/API_CLIENT.md` (backend contract), `docs/CHECKLIST_PRODUCCION_FRONTEND.md`
(known production risks). Update the relevant doc when you change a screen, route,
API call, or auth/session/role behavior — see the "Rutina recomendada" section of
`docs/README.md`.
