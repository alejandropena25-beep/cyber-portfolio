# Current Architecture

Phase 5 adds session-based authentication and administration to the existing Angular -> NestJS -> Prisma -> PostgreSQL system. Public API response models and published-only filtering remain unchanged.

## Runtime boundaries

Browser requests use `/api` through the Angular development proxy. Public SSR/prerender calls `http://127.0.0.1:3000/api`; private `/admin/**` routes use client rendering and are neither prerendered nor supplied authenticated data during SSR.

NestJS uses one shared `PrismaService`. Public `ProjectsModule` and `ProfileModule` still return explicit public mappers. The protected `AdminModule` exposes editable aggregates and uses transactions when replacing a project’s technologies, sections and roadmap or the profile’s experience, education and skills.

## Authentication

`POST /api/auth/login` verifies an Argon2id password and creates a PostgreSQL `AdminSession`. The browser receives a random 256-bit session token in an HttpOnly, SameSite=Strict cookie; only its SHA-256 digest is stored. Sessions expire after `SESSION_TTL_HOURS` (eight hours by default), disabled users cannot authenticate, expired rows are rejected and removed, and logout deletes the row.

The session cookie is scoped to `/api`, uses `Secure` in production (or when explicitly configured), and is inaccessible to Angular. JWT was intentionally avoided: this is one browser administration client, and server-side sessions provide immediate logout, revocation and disablement without access/refresh-token machinery.

Admin passwords never enter seeds or API responses. `npm run admin:create` prompts interactively, hashes with Argon2id (`m=19456 KiB`, `t=2`, `p=1`) and revokes existing sessions when replacing a password.

## CSRF and request controls

Unsafe auth/admin requests must have the exact configured `FRONTEND_ORIGIN`. Login is limited to five attempts per minute per tracker key using Nest’s throttler. Behind a future trusted reverse proxy, proxy/IP handling and shared rate-limit storage must be configured deliberately; the current in-memory limiter is suitable for the single local process only.

Login also creates a separate random CSRF token. Its SHA-256 digest is tied to the database session; the raw value is placed in the readable `XSRF-TOKEN` cookie. Angular mirrors it in `X-XSRF-TOKEN`. Mutations require the header, cookie and stored digest to match. SameSite is defense in depth, not the only CSRF control. CORS allows credentials only from the exact configured frontend origin.

`SessionAuthGuard` is the security boundary for every `/api/admin/*` endpoint. The Angular guard only redirects users for usability.

## Data model and API

`AdminUser` owns cascading `AdminSession` rows. The only role is `ADMIN`. No public registration, password reset, OAuth, hard-delete endpoint, IP history or raw credential/session response exists.

Protected endpoints:

- `GET /api/admin/projects`
- `GET /api/admin/projects/:id`
- `POST /api/admin/projects`
- `PATCH /api/admin/projects/:id`
- `GET /api/admin/profile`
- `PUT` or `PATCH /api/admin/profile`

Public endpoints remain `GET /api/health`, `GET /api/projects`, `GET /api/projects/:slug` and `GET /api/profile`. Public project queries still require `published=true`; internal IDs, publication metadata, timestamps, users and sessions do not enter public responses.

## Current limitations

Production secrets, TLS termination, distributed session/rate-limit cleanup, reverse-proxy trust and deployment hardening belong to later phases. Phase 5 does not add Docker, CI/CD, WAF, SIEM or monitoring infrastructure.
