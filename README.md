# HMS Backend

FastAPI backend for HMS (Healthcare Management System). Multi-tenant, CUID2 IDs, supports **Oracle** and **PostgreSQL**.

## Setup

```bash
cd backend
uv sync
```

## Configuration

Create a `.env` (or set environment variables):

- `DATABASE_BACKEND` — `postgres` or `oracle`
- `DATABASE_URL` — e.g. `postgresql+asyncpg://user:pass@localhost:5432/hms` or `oracle+oracledb://user:pass@host:1521/service_name`
- `SECRET_KEY` — for JWT (default dev key used if unset)
- `X-Tenant-ID` — header name for tenant (default: `X-Tenant-ID`)

## Run

```bash
uv run uvicorn app.main:app --reload
```

Health: `GET /api/v1/health`

## Migrations

```bash
# Ensure DATABASE_URL is set (sync driver used for migrations: postgresql+psycopg2 or oracle+oracledb)
uv run alembic upgrade head
```

## API

- **Tenants** (no tenant header): `POST/GET /api/v1/tenants`, `GET /api/v1/tenants/{id}`
- **Companies** (require `X-Tenant-ID`): `POST/GET/PATCH /api/v1/companies`, `GET /api/v1/companies/{id}`

Create a tenant first, then use its `id` as `X-Tenant-ID` when calling company endpoints.
