# Folio API

FastAPI service shared by the client and admin projects. API prefix: `/api/v1`.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

SQLite is the default. Set `DATABASE_URL=postgresql+psycopg://...` to use PostgreSQL. Set `CLIENT_ORIGINS` to a comma-separated origin list. In production, set `APP_ENV=production` and a strong random `JWT_SECRET`; demo accounts are not seeded in production. To provision the first admin, set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` for the initial API startup, then remove those environment variables.

## Core routes

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `GET /api/v1/schemas`
- `GET|POST /api/v1/blocks`, `PATCH|DELETE /api/v1/blocks/{id}`
- `GET|POST /api/v1/cvs`, `GET|PUT|DELETE /api/v1/cvs/{id}`
- `GET /api/v1/admin/stats`, `GET /api/v1/admin/schemas`, `PUT|DELETE /api/v1/admin/schemas/{key}`

Client resources are scoped to the authenticated user. Admin schema changes are shared across both frontends. CV items retain content snapshots and source references; the CV detail endpoint reports whether a source block has changed.
