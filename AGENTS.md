# AGENTS.md — SIMU_MES Oficina

## Dev Commands

```bash
cd frontend && npm run dev        # Vite dev server (port 5001)
cd frontend && npm run build      # tsc -b && vite build
cd frontend && npm run lint       # ESLint
docker compose up -d              # Start all services (db:5004, django:5002, fastapi:5003, frontend:5001)
```

No test runner configured (no `npm test`, no Django tests wired up).

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS v4 + Zustand
- **Backend Django** (port 5002 mapped to internal 8000): DRF API, apps: `core`, `veiculos`, `catalogo`, `operacional`, `suprimentos`, `financeiro`, `governanca`, `societario`
- **Backend FastAPI** (port 5003 mapped to internal 8001): Minimal service in `backend/fastapi_app/main.py`
- **DB**: PostgreSQL 15 (docker-compose service `simumes_db`, port 5004)
- **Middleware**: `core.middleware.CurrentUserMiddleware` (Django)

## API Proxy (Critical)

Vite proxy in `frontend/vite.config.ts` strips prefix before forwarding:
- `/api/django/*` → `http://127.0.0.1:5002/api/*`
- `/api/fastapi/*` → `http://127.0.0.1:5003/api/*`

Frontend calls use `/api/django/api/...` (double `/api` — proxy strips the first).

## Auth / RBAC

- Mock auth in `frontend/src/store/useAuthStore.ts` — password is always `admin`
- Roles (hierarchy): `ADMIN` > `FINANCEIRO` > `SUPERVISOR` > `COLABORADOR`
- `hasAccess(role, requiredRoles)` checks hierarchy level, not exact match
- Login users: `admin`, `financeiro`, `supervisor`, `colaborador`
- Auth persisted in localStorage key `simumes-auth`

## API Endpoints (Django)

All under `/api/...`, all viewsets use `AllowAny` (dev mode), paginated to 50/page via `core.pagination.StandardPagination`.

| Endpoint | Filter params |
|----------|---------------|
| `/api/veiculos/marcas/` | `?nome_marca=X` (iexact), `?categoria=X` |
| `/api/veiculos/modelos/` | `?marca=<id>` |
| `/api/veiculos/versoes/` | `?modelo=<id>`, `?codigo_fipe=<code>` |
| `/api/veiculos/categorias/` | — |
| `/api/veiculos/motores/` | — |
| `/api/veiculos/ativos/` | — |
| `/api/core/clientes/` | — |

## FIPE Catalog Import

Source: `Lista veiculos 2.CSV` (11,758 rows, latin-1, semicolon-delimited)
Script: `backend/django_app/import_veiculos.py` (or `import_veiculos_batches.py` for batch mode)

4 sequential phases (FK order matters):
1. **Marcas** (435) → `veic_marca`
2. **Modelos** (~11,300) → `veic_modelo`, unique on `(marca, nome_modelo)`
3. **Versoes** (11,727) → `veic_versao`, `codigo_fipe` is unique
4. **Cotacoes** (~38,606) → `veic_cotacao_mercado`, 15 year columns (2002-2016)

Data quirks: empty Fabricante/Modelo rows skipped; Combustível G=Gasolina, D=Diesel, Comb→G; strip Fabricante prefix from Modelo; Categoria: A→carro, B→utilitario, C→caminhao, D→onibus, E→moto, F→outro.

## Django Settings

- DB credentials from env: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT`
- Defaults: `simumes_db`, `simumes_user`, `simumes_password`, `simumes_db:5432`
- `CORS_ALLOW_ALL_ORIGINS = True`, `DEBUG = True` (dev only)
- Seed: `seed.py`, `seed_operacional.py` (seed_plano_contas.py is empty)

## Conventions

- All page components use `DefaultLayout` wrapper
- Shared UI: `Card`, `PageHeader` in `components/shared/`
- Tailwind custom colors: `surface-*`, `primary-*`, `danger-*`, `accent-*`
- Theme: dark/light via CSS variables in `DefaultLayout`
- UI language: Portuguese (pt-BR)
- `useVehicleStore` has cascading selects: marca → modelo → versao
