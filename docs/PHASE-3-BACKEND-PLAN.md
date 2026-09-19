# Phase 3 — NestJS Backend

## Status

Implemented. The backend exposes the initial public API and Angular consumes it in the browser, during SSR and while prerendering.

## Delivered endpoints

- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/:slug`
- `GET /api/profile`

Unknown project slugs return HTTP 404. The API contains no write, authentication or administration endpoints.

## Implementation decisions

- NestJS 12 and strict TypeScript.
- Focused health, profile and projects modules.
- Typed in-memory data until the PostgreSQL phase.
- Project list responses omit detail-only fields.
- Exact local CORS origin for Angular development.
- No database or repository abstraction before persistence exists.
- Angular browser requests use `/api`; SSR uses the configured absolute server URL.
- Prerender obtains project slugs from the API.

## Content ownership

The backend is the only editable source for public project and profile records. Angular keeps TypeScript interfaces for the API contract and presentation logic.

## Validation

- Backend build.
- Five HTTP endpoint tests.
- Angular unit tests with a fake API service.
- Angular SSR/prerender build against the running API.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the current request flow and [PHASE-4-DATABASE-PLAN.md](PHASE-4-DATABASE-PLAN.md) for the next planned phase.
