# Current Architecture

Phase 6 packages the Phase 5 Angular, NestJS, Prisma and PostgreSQL system as a production-like local Docker stack. Public API response models and server-side authentication boundaries remain unchanged.

Phase 7 adds GitHub Actions validation and main-only delivery of verified images to GHCR. Phase 8 surrounds that path with source, dependency and exact-image security controls. Neither phase deploys the stack.

## CI and delivery

```text
PR to main / push main / manual
  → Repository checks
      ├→ Gitleaks
      ├→ npm policy / Dependency Review (PR only) / CodeQL analysis
      ├→ Backend CI (Node 24 + disposable PostgreSQL 18 :55432)
      └→ Frontend CI (Node 24; no API/database)
          → Docker smoke (real Compose, fresh uniquely named volume)
              → record immutable IDs
                  → one Trivy scan per ID + identity-bound CycloneDX SBOMs
                      → export verified images
                          → load and re-check IDs
                              → Publish verified images (push main only)
                          → GHCR: backend, backend-tools, frontend
```

Jobs run on Ubuntu 24.04 with read-only contents permission. Only the delivery job adds `packages: write`; it downloads the current run's verified image archive and never builds or executes application code. Backend tests validate the database target before running Prisma or opening the app: loopback, explicit port 55432, exactly `cyber_portfolio_test`, constrained URL parameters and separate development/test databases.

The smoke helper uses the existing Compose file plus a generated override changing only image names. Its random project name, fresh volume, loopback application ports 13000/14200 and random temporary database credentials isolate it from host development. It validates resolved volume/network scope, waits for healthchecks and successful one-shot services, checks migrations/seed/API/SSR/UTF-8, and cleans up in `finally` with an additional `always()` workflow cleanup. Configuration and database contents are never exported as artifacts.

Three compiled Linux images are transferred with Docker save/load, avoiding a second build between verification and publication. The manifest binds each temporary reference to an immutable Docker image ID, and the publication job rejects any loaded-ID mismatch before retagging. The backend tools image is needed to migrate/seed a future deployment. Tags contain full commit SHA, workflow run ID and attempt; `main` is a mutable convenience alias. Future deployment should select an immutable registry digest. More detail, limitations and branch protection recommendations are in [Phase 7](PHASE-7-CICD-PLAN.md).

The smoke helper records the three verified local references and IDs after all HTTP/database assertions. Trivy scans each ID once and rejects every critical not covered by an exact expiring exception plus every high outside the exact fingerprint baseline. Syft scans the same IDs; each non-empty CycloneDX document embeds the component, source reference and Docker ID. Export occurs only after those checks. Source-security jobs run in parallel with application CI, and publication depends on their successful execution. CodeQL uploads findings, but severity-based merge blocking additionally requires a remotely configured GitHub Code Scanning ruleset and protected `main`. The separate weekly workflow applies the same container policy to existing GHCR `main` images without rebuilding, publishing or deploying.

## Container topology

```text
Browser
  ├── :4200 ── frontend (Angular SSR) ──┐
  └── :3000 ── backend (NestJS) ◄───────┘ web network
                    │
                    │ data network (internal)
                    ▼
              database (PostgreSQL 18)
```

The browser API URL is `http://localhost:3000/api`; Docker service names are not resolvable by a user's browser. Server rendering uses `http://backend:3000/api` through Compose DNS. NestJS reaches PostgreSQL at `database:5432`. PostgreSQL belongs only to the internal `data` network and has no host-published port.

## Startup lifecycle

Compose enforces this dependency chain:

```text
database healthy
  → migrate completed (`prisma migrate deploy`)
  → seed completed
  → backend healthy
  → frontend
```

`migrate`, `seed` and the opt-in `admin-create` command reuse the backend `tools` image. The normal backend runtime omits Prisma CLI, TypeScript source and development dependencies. A migration or seed failure is visible and blocks application startup.

The seed accepts the Docker database only when `DATABASE_OPERATION_MODE=docker`. With `SEED_IF_EMPTY=true`, it seeds a completely empty database, skips an already populated database and rejects a partially populated state. This prevents a normal restart from overwriting edits made through administration. Administrator creation remains an explicit interactive Argon2id workflow and never belongs to the seed.

## Angular rendering and API configuration

Named public pages use `RenderMode.Server`: home, projects, project detail, about and contact. They render current database state on each request and preserve SEO without requiring NestJS/PostgreSQL during the frontend image build. `/admin/**` uses `RenderMode.Client`, so private content is never rendered or embedded by the SSR server. The wildcard uses server rendering with HTTP 404 so unknown URLs show the application's error page. A missing project slug also sets HTTP 404 after the API responds. No static routes are prerendered.

Browser configuration is loaded from `/runtime-config.js`. In Docker, the SSR Express server generates this response from `BROWSER_API_BASE_URL`; in native Angular development the public default keeps `/api`. The server-side injector independently reads `SERVER_API_BASE_URL`. A focused API XSRF interceptor mirrors `XSRF-TOKEN` for unsafe calls to the configured absolute API origin, preserving Phase 5 CSRF behavior when the Docker browser uses separate ports.

Angular SSR's host allowlist contains only the documented local entry points, `localhost` and `127.0.0.1`. SSRF host validation remains enabled; a future deployed hostname must be added deliberately with its deployment configuration.

## Authentication boundaries

NestJS remains the security boundary. Session and CSRF tokens are random, only digests are stored, and every `/api/admin/*` endpoint uses `SessionAuthGuard`. The session token remains HttpOnly and the CSRF cookie/header pair remains mandatory for authenticated mutations. CORS and unsafe-request Origin validation use the exact `FRONTEND_ORIGIN`.

The Compose profile is local HTTP, so `SESSION_COOKIE_SECURE=false` is explicit configuration and `NODE_ENV=development` permits it. The image itself defaults to production, where the backend forces secure cookies. TLS and an edge reverse proxy remain later-phase concerns.

## Image and runtime security

Both application Dockerfiles use pinned Node 24 Debian slim images and multi-stage builds. Dependencies are installed with `npm ci`; Prisma Client is generated in the Linux backend build stage. Runtime stages copy only production dependencies and compiled output, and execute as the built-in `node` user.

Compose enables `init`, `no-new-privileges`, `cap_drop: ALL`, read-only application root filesystems and a small `noexec,nosuid` `/tmp` tmpfs. No source tree, Docker socket or privileged/host networking is mounted. PostgreSQL keeps its required writable volume and is not forced into application-specific filesystem restrictions.

## Persistence and configuration

`postgres_data` is mounted at `/var/lib/postgresql`, the PostgreSQL 18 image's version-aware storage parent. `docker compose down` preserves it; only an intentional `down -v` deletes it.

Real values live in the ignored `.env.docker`; the tracked `.env.docker.example` contains placeholders only. Images do not copy `.env*`, host `node_modules`, build output, coverage, logs, Git metadata or test output because each build context has a restrictive `.dockerignore`.

## Signals, health and logs

NestJS enables shutdown hooks, allowing Prisma to disconnect during SIGTERM-driven shutdown. Compose's init process forwards signals and reaps children. Containers log to stdout/stderr.

PostgreSQL uses `pg_isready`; backend health calls `/api/health`; frontend health requests the SSR root with Node's built-in `fetch`. No healthcheck-only package is installed.

## Phase boundary

Phase 8 adds DevSecOps validation to the completed container and CI/CD stack. Staging/production deployment, Kubernetes, reverse proxy, WAF, SIEM, observability and automated response remain outside this implementation.
