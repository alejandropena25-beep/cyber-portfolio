# Phase 4 — PostgreSQL Plan

> Planning only. PostgreSQL is not installed or configured in the current phase.

## Goal

Replace the NestJS in-memory content source with PostgreSQL while preserving the public API contract and Angular behavior.

## Candidate persisted content

- Public profile fields and confirmed links.
- Projects, categories, statuses and display order.
- Project technologies and detail sections.
- Publication state for content that is safe to expose.

Navigation, general UI copy, design tokens and route definitions should remain in Angular.

## Proposed migration sequence

1. Define the relational model from the existing API contracts.
2. Choose and document the database access approach.
3. Create migrations and development seed data from the confirmed content.
4. Replace the in-memory services without changing endpoint responses.
5. Verify unknown slugs, ordering and optional project sections.
6. Run backend endpoint tests and Angular SSR/prerender validation.

## Decisions requiring review

- Database library or ORM.
- Normalized tables versus JSON columns for flexible project sections.
- Content identifiers and ordering rules.
- Local database configuration and secret management.
- Seed strategy and migration ownership.
- Backup and production hosting requirements.

Authentication and administration remain Phase 5 concerns. Phase 4 should not introduce public write endpoints.
