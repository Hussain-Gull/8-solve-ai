## ai-saas-admin

Monorepo for a multi-tenant AI SaaS admin platform.

### Stack

- Frontend: Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- Backend: Node.js + Express + TypeScript
- ORM/DB: Prisma + MySQL (DB-agnostic via Prisma)
- Auth: JWT access + rotating refresh tokens (httpOnly Secure cookie)
- Tests: Jest + Supertest
- Tooling: Turborepo, pnpm, ESLint, Prettier, shared tsconfig
- Docker: Dockerfile per app + docker-compose with MySQL

### Quickstart (Local Dev)

1. Install prerequisites:
   - Node.js 20+
   - pnpm (see `https://pnpm.io/installation`)
   - Docker (optional if you want DB via Docker)
2. Generate local env files with random secrets:

```bash
pnpm env:gen
```

3. Start a MySQL 8 instance (choose one):
   - Using Docker (recommended):

```bash
docker compose up -d db
```

   - Or use your own MySQL and set `DATABASE_URL` in `apps/api/.env`

4. Install deps and prepare DB:

```bash
pnpm install
pnpm db:generate
# If migrate fails (first run), push the schema instead
pnpm db:migrate || pnpm db:push
pnpm db:seed
```

5. Run everything in dev:

```bash
pnpm dev
```

API: `http://localhost:4000`  
Web: `http://localhost:3000`

Login (seed data):
- SUPER_ADMIN: `superadmin@example.com` / `ChangeMe123!`
- ADMIN: `admin@acme.com` / `Admin123!`
- MANAGER: `manager@acme.com` / `Manager123!`
- USER: `user@acme.com` / `User123!`

Notes:
- In development, refresh cookie is not `secure` so it works on `http://localhost`.
- Access token is stored in memory (sessionStorage). A short-lived cookie `aat` helps middleware redirects.
- If you change the schema, run `pnpm db:generate` then `pnpm db:migrate` (or `pnpm db:push`) and re-seed if needed.

### Scripts

- `pnpm dev`: run web + api
- `pnpm build`: build all
- `pnpm start`: start all
- `pnpm lint`: lint all
- `pnpm typecheck`: typecheck
- `pnpm test`: run tests
- `pnpm db:migrate`: run migrations (deploy)
- `pnpm db:push`: apply schema without migrations (dev helper)
- `pnpm db:seed`: seed DB

### Docker (Full Stack)

To build and run API + Web + DB:

```bash
docker compose up -d --build
```

Then prepare the DB from your host:

```bash
pnpm db:generate && pnpm db:migrate || pnpm db:push && pnpm db:seed
```

### CI

Run typecheck, lint, test on push.

### Structure

```
apps/
  api/         # Express + Prisma API
  web/         # Next.js 14 app
packages/
  config/      # shared eslint/tsconfig
  types/       # shared TypeScript types
  ui/          # shared UI (optional)
```

### How it works
- Multi-tenant: `tenantId` is derived from the authenticated user; all queries enforce tenant scoping.
- Auth: JWT access (15m) + rotating refresh token (7d) in httpOnly cookie; auto-refresh on 401.
- RBAC: SUPER_ADMIN (tenants), ADMIN (tenant users CRUD), MANAGER (team read), USER (limited).
- Notifications: stored per-user with read/unread; header badge shows unread count.
- Optional 2FA (TOTP) and password reset endpoints are included.

### Troubleshooting
- If Prisma errors like “table does not exist”: run `pnpm db:push` then `pnpm db:seed`.
- If MySQL isn’t ready: ensure `docker compose up -d db` finished and wait a few seconds.
- Windows path issues with Docker: run commands from repo root in an elevated shell.
- If `pnpm dev` exits or shows "Terminate batch job (Y/N)?": use two terminals:
  - `pnpm --filter @ai-saas-admin/api dev`
  - `pnpm --filter @ai-saas-admin/web dev`
- If port 3000 is in use on Windows:
  - `netstat -ano | findstr :3000` → note PID
  - `taskkill /PID <PID> /F`



