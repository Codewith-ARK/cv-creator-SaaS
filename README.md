# Folio

Folio is a reusable career-content library and CV builder. This workspace keeps the API, client app, and admin app in separate project folders so each can be pushed to its own repository. All three projects connect through the `VITE`-style `NEXT_PUBLIC_API_URL` setting to the same FastAPI backend.

## Projects

- `backend/` — FastAPI service, auth, persistence, schema registry, CV and content APIs.
- `client/` — Next.js TypeScript CV editor, reusable content library, PDF preview and export.
- `admin/` — Next.js TypeScript admin dashboard for block schemas.

## Product stack

- **Frontend:** Next.js App Router, React 19, TypeScript.
- **Design system:** a small Folio Paper token system and reusable semantic CSS components. It keeps the interface light and avoids a large component framework getting between the product and its main workflow.
- **Drag and drop:** dnd-kit for pointer and keyboard accessible library-to-CV placement and section reordering.
- **PDF:** `@react-pdf/renderer`; the live viewer and download share one document component.
- **Backend:** FastAPI, Pydantic 2, SQLAlchemy 2, Alembic migrations, SQLite locally and PostgreSQL in deployment.

## Run locally

1. Start the API: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && alembic upgrade head && uvicorn app.main:app --reload`
2. Start the client: `cd client && npm install && npm run dev`
3. Start the admin app in another terminal: `cd admin && npm install && npm run dev`

In development the API seeds local demo accounts on first launch: `demo@folio.local` / `folio-demo` and `admin@folio.local` / `folio-admin`. Demo accounts are disabled when `APP_ENV=production`. The API docs are at `http://localhost:8000/docs`.

Set `NEXT_PUBLIC_API_URL` in either frontend to point at the backend. The default is `http://localhost:8000`.

## Before a public launch

Add email verification and password recovery, rate-limit auth endpoints, move browser sessions to a secure deployment-appropriate cookie strategy, add billing if plans require it, configure production CORS and backups, and run integration/browser checks after installing dependencies. The included demo credentials are development-only.

## PDF and preview

The client renders the CV with `@react-pdf/renderer`. The inline document viewer and downloaded PDF use the same document tree and data, so pagination, typography, and section ordering stay aligned. PDF generation is local to the browser; no CV content needs to be sent to a third-party conversion service.

## Data model and schema changes

The backend is the source of truth for `BlockSchema`. Admin schema changes are persisted centrally and are returned by `/schemas`; the client creates and edits blocks from that live contract. Existing block JSON is preserved when a schema changes. Schema edits should remain backward-compatible for already saved user blocks, or include an explicit migration before removing fields.

Each CV stores an ordered list of sections, linked source block IDs, and a content snapshot. Library changes do not silently alter an existing CV. The API marks a CV item stale when its source version has changed; users can review and apply that update.

## Separate repositories

Each project folder is self-contained and can be initialized as its own Git repository. When deploying, set the backend origin in `NEXT_PUBLIC_API_URL`, configure CORS origins, and replace the local SQLite database with PostgreSQL through `DATABASE_URL`.
