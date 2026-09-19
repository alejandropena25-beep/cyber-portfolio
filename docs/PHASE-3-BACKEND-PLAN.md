# Phase 3 — NestJS Backend Plan

> Planning document only. No backend is implemented yet.

## Goal

Introduce a small NestJS REST API without changing the current public experience. The first backend should expose public portfolio content, preserve Angular SSR, and create a clear path toward PostgreSQL in Phase 4.

## Initial public endpoints

- `GET /api/projects`: list project summaries for the Projects page.
- `GET /api/projects/:slug`: return the complete content for one project.
- `GET /api/profile`: return the public professional profile and confirmed links.
- `GET /api/health`: report whether the API process is available, without exposing infrastructure details.

Administration and authentication belong to Phase 5 and should not be introduced in Phase 3.

## Proposed structure

```text
backend/src/
├── app.module.ts
├── health/
├── profile/
└── projects/
    ├── projects.controller.ts
    ├── projects.service.ts
    ├── projects.module.ts
    └── dto/
```

Controllers should handle HTTP concerns, while services own content access and project lookup. DTOs should validate the public response shape when validation is introduced.

## Conceptual data model

A project needs:

- Identity: slug, card title and page title.
- Classification: category, type and status.
- Content: summary, objective, technologies and architecture.
- Evidence: work performed, confirmed results, problems and lessons.
- Review state: documentation notes and public resources.
- Optional roadmap: implemented, in-progress and planned items.

This mirrors the current typed Angular model. It is conceptual until the persistence phase defines the database schema.

## Angular integration

Angular would consume the API through a focused project data service. Routes and page components should keep using typed project objects, while loading changes from local constants to HTTP.

SSR requires the API to be reachable during server rendering. The implementation must define environment-specific API URLs and avoid browser-only APIs in the data-loading path. A fallback strategy should be decided before removing local content.

## What may deserve persistence

Potential database-backed content in Phase 4:

- Project records and detail sections.
- Project status and technologies.
- Public professional profile and confirmed links.
- Ordering and publication state.

Content that can remain static:

- Navigation labels.
- General UI copy.
- Error-page content.
- Design tokens and layout.
- Roadmap explanations that are part of repository documentation.

## Decisions and risks

- Decide whether Phase 3 initially serves in-memory data or reads versioned JSON before PostgreSQL exists.
- Avoid maintaining two editable sources of truth in Angular and NestJS.
- Preserve prerendering or define a deliberate SSR strategy for API-backed routes.
- Keep unconfirmed and private information out of API responses.
- Return stable error responses for unknown slugs.
- Do not introduce write endpoints before administration and authentication are designed.
- Define CORS and deployment topology only when the frontend/backend runtime arrangement is known.

