# Phase 5 — Authentication and Administration

Status: COMPLETE — implemented and validated locally with PostgreSQL 18 and Node 24.19.0. An integrated real-account browser walkthrough remains a documented manual handoff because no real administrator credential was created during implementation.

## Delivered

- Argon2id administrator password hashes and interactive local bootstrap.
- PostgreSQL-backed, revocable sessions with hashed 256-bit tokens and expiration.
- HttpOnly/SameSite session cookie with production-enforced Secure behavior.
- Exact-Origin validation plus a per-session synchronizer CSRF token.
- Login rate limiting and generic invalid-credential responses.
- Reusable server-side session guard covering all admin endpoints.
- Transactional project and profile aggregate administration.
- Angular login, route guard, dashboard and reactive editors.
- Client-rendered/noindex administration routes; public SSR/prerender configuration retained.
- Database-backed auth, CSRF, expiry, logout and administration tests.

## Security decisions

Sessions were selected over JWT because a single first-party browser client benefits from immediate server-side revocation and does not need token rotation complexity. Password hashes use Argon2id; session and CSRF secrets use independent cryptographically random values, and only SHA-256 digests are persisted.

The login limiter is process-local. A future multi-instance deployment will require shared rate-limit storage and explicit trusted-proxy configuration. Production HTTPS and external infrastructure remain future-phase work.

See [architecture](ARCHITECTURE.md) and [backend setup](../backend/README.md).
