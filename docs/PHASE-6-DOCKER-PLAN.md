# Phase 6 — Docker / Containerization

## Scope and outcome

Phase 6 containerizes the existing Angular SSR, NestJS, Prisma and PostgreSQL applications without changing their public content or security model. It provides a production-like local stack; it does not implement CI/CD, deployment, reverse proxy, Kubernetes, WAF, scanning or observability.

## Architecture

| Service        | Image/target                     | Networks      | Host port       | Responsibility                     |
| -------------- | -------------------------------- | ------------- | --------------- | ---------------------------------- |
| `database`     | `postgres:18-bookworm`           | `data`        | none            | Persistent PostgreSQL database     |
| `migrate`      | backend `tools`                  | `data`        | none            | One-shot `prisma migrate deploy`   |
| `seed`         | backend `tools`                  | `data`        | none            | One-shot fresh-database bootstrap  |
| `backend`      | backend `runtime`                | `web`, `data` | 3000 by default | NestJS API and authentication      |
| `frontend`     | frontend `runtime`               | `web`         | 4200 by default | Angular production SSR server      |
| `admin-create` | backend `tools`, profile `tools` | `data`        | none            | Interactive administrator creation |

The `data` network is `internal: true`. Only NestJS joins both networks; the frontend cannot reach PostgreSQL and the database is not published to the host. The browser reaches the API through the host-published backend port, while SSR uses the backend service DNS name.

## Environment setup

Create an ignored local configuration from the safe example:

```powershell
Copy-Item .env.docker.example .env.docker
```

Replace `POSTGRES_PASSWORD` with a strong local secret. Put the same value in `DATABASE_URL`, percent-encoded when it contains reserved URL characters. Do not use a real production credential or commit `.env.docker`.

Key values:

- `DATABASE_URL` uses `database:5432`, not localhost.
- `BROWSER_API_BASE_URL` normally uses `http://localhost:3000/api`.
- `SERVER_API_BASE_URL` is fixed to `http://backend:3000/api` inside Compose.
- `FRONTEND_ORIGIN` must exactly match the browser origin.
- `SESSION_COOKIE_SECURE=false` is for local HTTP only. Production mode still forces secure cookies.
- Host ports may be changed with `BACKEND_PORT` and `FRONTEND_PORT`; update browser URL/origin consistently.
- Angular SSR accepts only `localhost` and `127.0.0.1` host headers in this local phase; a future deployed hostname requires an explicit allowlist update.

## Build and first startup

```powershell
docker version
docker compose version
docker compose --env-file .env.docker config
docker compose --env-file .env.docker up --build
```

Expected order is database healthy, migration complete, seed complete, backend healthy, frontend start. In another terminal:

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs
```

Open `http://localhost:4200`; the health endpoint is `http://localhost:3000/api/health`.

## Images and stages

Both Dockerfiles pin `node:24-bookworm-slim`, use `npm ci` and separate build from runtime. The backend generates its Prisma Client within Linux, avoiding Windows-generated artifacts. Production dependency stages use `npm ci --omit=dev`; application runtime stages contain compiled output and runtime dependencies only.

The backend's `tools` target intentionally includes development tooling for Prisma migration/seed and the interactive TypeScript admin script. Keeping that out of `runtime` reduces the normal API image surface without duplicating Dockerfiles.

Both runtime images execute as the base image's `node` user. Build artifacts are copied with `--chown=node:node`.

## Migration, seed and administration

Migration always uses the deployment command:

```text
prisma migrate deploy
```

It never uses `migrate dev`, reset or destructive schema recreation. A failed migration blocks downstream services.

On a fresh empty database, seed inserts the confirmed portfolio content. On a database where both projects and profile exist, it exits without writing. A partial state fails visibly so bootstrap cannot silently mask corruption or overwrite administration data.

Create or replace the administrator interactively after startup:

```powershell
docker compose --env-file .env.docker --profile tools run --rm admin-create
```

The prompt masks the password, uses the existing Argon2id implementation and revokes old sessions. No password is passed as an environment variable, image argument or source value.

## SSR strategy

Phase 5 prerendered data-backed routes during build. That made HTML stale after administration edits and made the Angular image build depend on a running API/database. Phase 6 intentionally changes:

- Home, projects, project detail, about and contact to runtime `RenderMode.Server`.
- Admin routes to `RenderMode.Client`.
- The wildcard 404 to `RenderMode.Prerender`.

This preserves public SEO and current database content while decoupling image builds. A wildcard does not represent a finite set of build-time URLs, so the intentional result is zero prerendered routes. Unknown URLs still return HTTP 404.

Browser and server URL resolution are separate. `/runtime-config.js` exposes only the public API base to browser code at container startup; `SERVER_API_BASE_URL` configures the server injector. Neither is a secret. The host-native development fallback stays `/api` through Angular's proxy.

## Authentication validation

After creating an administrator, verify login, `/api/auth/me`, project editor, profile editor and logout. Make a small reversible edit, confirm it through the public page/API, restart with `down` and `up -d`, confirm it persists, then restore the original value. Verify the session cookie is HttpOnly, the CSRF cookie/header exchange remains present, disallowed origins fail, and logged-out admin calls return unauthorized.

The separate browser/API ports are cross-origin but same-site for localhost. NestJS CORS explicitly allows only `FRONTEND_ORIGIN` with credentials. The frontend API interceptor sends the configured CSRF header for unsafe API requests; no CSRF or Origin control is disabled.

## Persistence and lifecycle

PostgreSQL 18 stores versioned data beneath `/var/lib/postgresql`; Compose mounts the named `postgres_data` volume there. Normal stop/restart preserves it:

```powershell
docker compose --env-file .env.docker down
docker compose --env-file .env.docker up -d
```

Rebuild changed images with:

```powershell
docker compose --env-file .env.docker up --build -d
```

Inspect or follow logs with:

```powershell
docker compose --env-file .env.docker logs
docker compose --env-file .env.docker logs -f backend frontend
```

**Destructive operation:** the following removes the isolated Docker database volume and all administrators, sessions and edits in it:

```powershell
docker compose --env-file .env.docker down -v
```

Use it only when deliberately validating a completely fresh bootstrap. It does not target host PostgreSQL, but the Docker data cannot be recovered unless separately backed up.

## Health, shutdown and hardening

- Database: `pg_isready` against the configured database/user.
- Backend: Node `fetch` to `/api/health`.
- Frontend: Node `fetch` to the SSR root.
- Sensible start periods and retries prevent aggressive startup failures.
- `init: true` improves signal forwarding and child reaping.
- NestJS shutdown hooks allow Prisma cleanup on SIGTERM.
- Frontend/backend use non-root users, read-only roots and constrained `/tmp` tmpfs mounts.
- Application and tool containers use `no-new-privileges` and drop all Linux capabilities.
- No privileged mode, host network, Docker socket, source bind mount or application log volume is used.

PostgreSQL retains its standard runtime permissions because it legitimately writes to its data volume. Containers log to stdout/stderr.

## Validation checklist

1. Run `docker compose config`, build and start.
2. Wait for frontend/backend/database health and inspect `ps` plus logs.
3. Confirm both application processes run as non-root.
4. Confirm database has no published port.
5. Load public pages and inspect SSR HTML for profile/project content.
6. Validate login, CSRF, `/auth/me`, both editors, reversible writes and logout.
7. Restart without `-v` and prove data persistence.
8. Restore edited values.
9. When safe, remove only the isolated Docker volume and validate the full fresh startup.
10. Run native backend generate/build/migration status/tests and frontend tests/build.
11. Run full and production-only npm audits.
12. Inspect image sizes, build contexts and Git changes for secrets/artifacts.

If Docker Engine/Desktop is unavailable, image, container, health, authentication and persistence claims must remain explicitly unvalidated and Phase 6 remains blocked.

## Host development versus Docker

Native development keeps `npm run start:dev`, `npm start`, the Angular proxy and the developer's local PostgreSQL configuration. Docker runs compiled production artifacts with no source mounts and uses its own isolated PostgreSQL named volume. Neither workflow overwrites the other's database.

## Phase boundary

Phase 7 has not started. There are no GitHub Actions, registries, deployment pipelines, scanners or later-phase services in this implementation.
