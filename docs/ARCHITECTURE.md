# Current Architecture

## Scope

Phase 3 consists of two applications in the same Git repository:

- `frontend/`: Angular public interface.
- `backend/`: NestJS public REST API.

There is no database, authentication, administration or container configuration in this phase.

## Request flow

```text
Browser
  │
  ├─ Angular routes and assets
  │
  └─ /api/*
       │
       └─ development proxy ──> NestJS :3000
                                  │
                                  ├─ HealthModule
                                  ├─ ProfileModule
                                  └─ ProjectsModule
                                       │
                                       └─ typed in-memory content
```

During SSR and prerender, Angular calls `http://127.0.0.1:3000/api` directly. The browser uses the relative `/api` URL so components do not contain deployment URLs.

## Content ownership

NestJS is the source of truth for public profile and project content:

- `backend/src/profile/profile.data.ts`
- `backend/src/projects/projects.data.ts`

Angular keeps API contract interfaces for compile-time checking but contains no independent copy of the portfolio records.

## Backend responsibilities

- Expose confirmed public content.
- Return project summaries separately from complete project details.
- Return 404 for unknown project slugs.
- Keep the health response minimal.
- Restrict local CORS to `http://localhost:4200`.
- Avoid exposing framework identification and stack traces.

## Frontend responsibilities

- Present profile and project content.
- Keep filtering and navigation in the UI.
- Select the correct API base URL for browser or server rendering.
- Generate project routes during prerender by reading slugs from the API.
- Preserve page metadata after API content is loaded.

## Operational constraint

The backend must be running during Angular prerender. This is intentional: it verifies that the generated frontend uses the same source of truth as the runtime API. Deployment orchestration remains a later-phase decision.
