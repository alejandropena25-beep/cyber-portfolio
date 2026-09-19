# Current Architecture

Phase 4: Angular -> NestJS -> Prisma -> PostgreSQL. No authentication, administration or containers.

Browser requests use /api through the Angular development proxy. SSR/prerender call http://127.0.0.1:3000/api. PostgreSQL and NestJS must run during the Angular production build.

## Backend boundary

ProjectsModule and ProfileModule import shared PrismaModule. Nest creates one PrismaService, connects on module initialization and disconnects on shutdown. Shutdown hooks are enabled. Generated client output is CommonJS to match NestJS.

Services query asynchronously. Explicit mappers select public fields, translate enums/field names, omit absent optional sections and reconstruct roadmap lists. IDs, publication flags, timestamps and sort metadata never enter responses. Prisma batches relation queries rather than querying in a project loop. List requests load technology relations; details also load ordered sections/roadmap.

GET /api/projects filters published records and sorts by sortOrder then ID. Details also require publication; missing/unpublished slugs return the existing 404. Malformed slugs retain the existing 400 regex validation. Profile reads ID 1 and ordered children; unseeded profile returns generic 503.

Health remains process-only with exactly { "status": "ok" }. Startup connects to PostgreSQL, but health does not promise ongoing database readiness. No infrastructure metadata is exposed. CORS/header behavior is unchanged.

## Model and constraints

- Project owns ProjectSectionItem and ProjectRoadmapItem.
- ProjectTechnology explicitly joins Project and Technology, with composite PK and unique ordered membership.
- Profile owns Experience, Education and Skill.
- Skill groups match actual content: PROFESSIONAL and TRAINING_AND_LAB.
- Small scalar lists (languages, orientation, experience activities/technologies) use ordered PostgreSQL text arrays; they have no independent identity.
- Experience.company is Cibernos; clientContext preserves the Ericsson service-context copy. Euroxanty stays separate.
- Section title supports existing problem headings. No speculative public fields were added.

Unique slugs support lookup. Unique child order constraints supply parent-prefixed indexes. Published/sortOrder index supports listing; technologyId supports reverse relation checks. Owned children cascade on parent deletion; shared technologies use RESTRICT. Project order ties use ID for deterministic results.

## Content ownership

PostgreSQL is the only runtime source. prisma/seed-data contains unchanged Phase 3 bootstrap content, not a runtime fallback. Obsolete src/*/*.data.ts files were removed after successful database, HTTP and frontend validation.

The public roadmap intentionally retains Phase 3 wording: this persistence-only change must preserve public content. Editorial updates require separate review.

See [backend setup](../backend/README.md) and [Phase 4 status](PHASE-4-DATABASE-PLAN.md).
