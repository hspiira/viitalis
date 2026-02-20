# HMS Backend

FastAPI backend for HMS (Healthcare Management System). Multi-tenant, CUID2 IDs, supports **Oracle** and **PostgreSQL**.

## Setup

From the project root:

```bash
uv sync
```

## Configuration

Create a `.env` in the project root (or set environment variables):

- `DATABASE_BACKEND` — `postgres` or `oracle`
- `DATABASE_URL` — e.g. `postgresql+asyncpg://user:pass@localhost:5432/hms` or `oracle+oracledb://user:pass@host:1521/service_name`
- `SECRET_KEY` — for JWT (default dev key used if unset)
- `X-Tenant-ID` — header name for tenant (default: `X-Tenant-ID`)

### PostgreSQL: create the database

The app does not create the database for you; the database must exist before you run migrations.

**Option A — command line (if `createdb` is in your PATH):**

```bash
createdb -U postgres hms
```

Use the same user and database name as in your `DATABASE_URL`.

**Option B — psql:**

```bash
psql -U postgres -c "CREATE DATABASE hms;"
```

**Option C — another user:** If your local Postgres user is e.g. `myuser` with no password on `localhost:5432`:

```bash
createdb hms
```

Then in `.env`:

```
DATABASE_BACKEND=postgres
DATABASE_URL=postgresql+asyncpg://myuser@localhost:5432/hms
```

After the database exists, run migrations from the project root:

```bash
uv run alembic upgrade head
```

Alembic will use the same `DATABASE_URL` (the env converts `asyncpg` to `psycopg2` for migrations automatically).

## Run

From the project root:

```bash
uv run fastapi dev
```

For production: `uv run fastapi run` or `uv run uvicorn app.main:app`.

Health: `GET /api/v1/health`

## Migrations

From the project root (ensure `DATABASE_URL` is set; sync driver used: e.g. `postgresql+psycopg2` or `oracle+oracledb`):

```bash
uv run alembic upgrade head
```

## API

- **Health**: `GET /api/v1/health`
- **Auth**: `POST /api/v1/auth/login` (body: `tenant_code`, `username`, `password`) → JWT
- **Tenants** (no tenant header): `POST/GET /api/v1/tenants`, `GET /api/v1/tenants/{id}`
- **Companies** (require `X-Tenant-ID`): `POST/GET/PATCH /api/v1/companies`, `GET /api/v1/companies/{id}`, `GET /api/v1/companies/{id}/branches`
- **Schemes**: `POST/GET/PATCH /api/v1/schemes`, `GET /api/v1/schemes/{id}`
- **Plans**: `POST/GET/PATCH /api/v1/plans`, `GET /api/v1/plans/{id}`
- **Members**: `POST/GET/PATCH/DELETE /api/v1/members`, `GET /api/v1/members/{id}/dependants`
- **Hospitals**: `POST/GET/PATCH /api/v1/hospitals`, `GET /api/v1/hospitals/{id}/branches`
- **Doctors**: `POST/GET/PATCH /api/v1/doctors`
- **Catalogs**: `POST/GET/PATCH /api/v1/medicines`, `/api/v1/services`, `/api/v1/labs`, `/api/v1/diagnoses`
- **Claims**: `POST/GET/PATCH /api/v1/claims`, `GET /api/v1/claims/{id}/details`, `PATCH /api/v1/claims/{id}/approval`, `POST /api/v1/claims/bulk-approve`
- **Claim payments**: `POST/GET /api/v1/claim-payments`, `GET /api/v1/claims/{id}/payments`
- **Reimbursements**: `POST/GET/PATCH /api/v1/reimbursements`, `PATCH /api/v1/reimbursements/{id}/status`

Create a tenant first, then use its `id` as `X-Tenant-ID` when calling tenant-scoped endpoints. Optionally use `POST /auth/login` and send the returned JWT as `Authorization: Bearer <token>` (token includes `tenant_id`).
