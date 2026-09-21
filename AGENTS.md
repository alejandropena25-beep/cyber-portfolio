# Cyber Portfolio — Agent Instructions

## Project

Professional portfolio and technical demonstration project focused on:

- Cybersecurity
- Software Development
- DevOps / DevSecOps
- Cloud / Infrastructure
- Security Monitoring

The project will evolve incrementally from an Angular portfolio into a
full-stack, containerized, monitored and secured platform.

The owner must be able to explain and defend every major technical
decision during a job interview.

## Current Phase

CURRENT PHASE: Phase 8.5 — Public Preview v0.1 preparation.

Phase 1 — Angular Frontend: COMPLETED
Phase 2 — Portfolio Content: COMPLETED
Phase 3 — NestJS Backend: COMPLETED
Phase 4 — PostgreSQL + Prisma: COMPLETED
Phase 5 — Authentication / Administration: COMPLETED
Phase 6 — Docker / Containerization: COMPLETED
Phase 7 — CI/CD: COMPLETED
Phase 8 — DevSecOps: COMPLETED
Phase 8.5 — Public Preview v0.1 preparation: CURRENT

Existing frontend:

- Angular 22
- TypeScript
- SCSS
- Angular Router
- Standalone components
- SSR / prerendering
- Header and footer
- Home
- Projects
- Project Detail
- About
- Contact
- 404
- Responsive design
- Typed API-backed project and profile data
- Passing build and tests

Phase 8.5 priorities:

1. Present the implemented system as a clear, evidence-backed case study.
2. Prepare a safe first public preview without deploying in this phase.
3. Preserve Phase 8 security and exact-image publication guarantees.
4. Do NOT start Phase 9.

Current backend:

- NestJS 12
- Strict TypeScript
- Prisma 7.10.0 / PostgreSQL persistence (validated locally)
- Session authentication and protected administration API
- Health, projects and profile endpoints
- Focused endpoint tests

DO NOT start Phase 9 or later phases.

## Roadmap

Follow this exact order:

1. Angular Frontend — completed baseline
2. Portfolio Content — completed
3. NestJS Backend — completed
4. PostgreSQL + Prisma — completed
5. Administration / Authentication — completed
6. Docker / Docker Compose — completed
7. CI/CD with GitHub Actions — completed
8. DevSecOps — completed
8.5. Public Preview v0.1 preparation — current
9. Kubernetes
10. WAF / Infrastructure Security
11. SIEM / Wazuh
12. Monitoring / Observability
13. Controlled Automated Response
14. Production

Never introduce technology from a future phase unless explicitly requested.

## Planned Stack

Frontend:

- Angular 22
- TypeScript
- SCSS
- Angular Router
- SSR / prerendering

Backend:

- NestJS
- TypeScript
- REST API

Database:

- PostgreSQL

Infrastructure:

- Docker
- Docker Compose
- GitHub Actions
- Kubernetes
- Reverse proxy
- Cloudflare where appropriate

Security:

- HTTPS / TLS
- Secure HTTP headers
- CSP
- Input validation
- Rate limiting
- Authentication / authorization
- Least privilege
- SAST
- Dependency scanning
- Secret scanning
- Container scanning
- WAF
- Security logging
- Wazuh SIEM

Observability:

- Prometheus
- Grafana

Possible later additions:

- Loki
- OpenTelemetry

## Repository

Current relevant structure:

cyber-portfolio/
├── backend/
├── docs/
├── frontend/
├── AGENTS.md
└── README.md

Future directories may include:

- docker/
- kubernetes/
- security/
- monitoring/
- .github/workflows/

Do not create future directories until their phase requires them.

## Angular Application

Public routes:

- /
- /projects
- /projects/:slug
- /about
- /contact
- 404 fallback

Prefer feature-oriented organization.

Do not create empty abstraction layers only to make the architecture look complex.

## Initial Real Projects

Initial portfolio projects:

### BunkerWeb WAF

Potential topics:

- BunkerWeb
- Docker
- WordPress
- MariaDB
- Web Application Firewall
- Application Security

### SOC / Snort / ELK

Potential topics:

- Snort
- Elastic / ELK
- IDS
- Blue Team
- Logging
- Detection

### Mobile Security Lab

Potential topics:

- MobSF
- MSTG
- Android
- Mobile Application Security

### Secure Portfolio Infrastructure

This repository itself will become a major DevSecOps / cybersecurity project.

Planned evolution:

Angular
→ NestJS
→ PostgreSQL
→ Docker
→ CI/CD
→ DevSecOps
→ Kubernetes
→ WAF
→ Wazuh
→ Prometheus / Grafana
→ Controlled Response

Never invent missing project information.

Ask the owner when required information is unavailable.

## Project Content Rules

Important project pages should include relevant information such as:

- Summary
- Objective
- Context
- Architecture
- Technologies
- Environment
- Implementation
- Testing
- Security considerations
- Detection / mitigation
- Results
- Problems and solutions
- Lessons learned
- Screenshots
- Architecture diagrams
- Repository link

Never fabricate:

- Experience
- Employers
- Certifications
- Metrics
- Vulnerabilities
- Results
- Dates
- Production usage

## Engineering Rules

Use:

- Strict TypeScript
- Modern Angular APIs
- Modern NestJS conventions when Phase 3 begins
- Meaningful naming
- Small focused components
- Clear responsibilities
- Simple solutions
- Reuse only where justified

Avoid:

- Huge components
- Duplicate logic
- Dead code
- Deprecated APIs
- Premature abstractions
- Unnecessary dependencies
- Complexity without technical benefit

## Dependencies

Before adding a dependency:

1. Check whether the framework already provides the functionality.
2. Explain why the dependency is necessary.
3. Prefer maintained packages.
4. Consider security implications.

Do not install packages only because they are popular.

## UI Direction

Preserve the existing visual direction unless explicitly requested otherwise:

- Dark professional interface
- Green cybersecurity accent
- Strong typography
- Clear hierarchy
- Minimal visual noise
- Responsive layout

Avoid cliché hacker aesthetics such as:

- Matrix effects
- Excessive neon
- Fake terminals everywhere
- Fake attack screens
- Gratuitous animations

The portfolio should appeal to recruiters and engineers.

## Security

This will be a public repository and public website.

Never expose:

- Passwords
- API keys
- Tokens
- Private keys
- Database credentials
- Session secrets
- Sensitive logs
- Personal data
- Private infrastructure information

Sanitize logs and screenshots before publication.

## Git

Use focused professional commits.

Examples:

feat: add cybersecurity project content
feat: implement project details
feat: add NestJS API
chore: dockerize backend
ci: add build workflow
security: add dependency scanning
deploy: add Kubernetes manifests
docs: document security architecture

Never automatically:

- commit
- push
- force push
- rewrite Git history

unless explicitly requested by the owner.

## Validation

After significant code changes:

- Run the relevant build.
- Run existing tests.
- Check TypeScript errors.
- Check affected routing.
- Check SSR / prerendering when affected.

For the current Angular application, normally validate with:

npm run build
npm test -- --watch=false

If a command cannot run because of sandbox restrictions, report that
instead of claiming success.

## Agent Workflow

Before modifying files:

1. Read this file.
2. Identify the current phase.
3. Inspect the relevant existing code.
4. Preserve working architecture.
5. Do not introduce future-phase technologies.

Before significant changes:

- Briefly explain the intended approach.
- Identify the files likely to change.

During implementation:

- Make focused changes.
- Preserve existing functionality.
- Avoid unnecessary dependencies.
- Avoid speculative features.

After implementation:

- Summarize changed files.
- Explain important decisions.
- Run relevant validation.
- Report warnings and errors.
- Do not commit automatically.

## Learning Requirement

This is also a learning project.

For important technical changes, briefly explain:

- What was implemented.
- Why it is needed.
- How it works.
- Important alternatives.
- Security implications where relevant.

Do not generate large unexplained implementations.

The owner should be able to explain every important part during a
technical interview.

## Definition of Done

A task is complete only when:

- The requested scope is implemented.
- Existing functionality is preserved.
- Relevant build/tests pass when available.
- No unnecessary dependencies were introduced.
- No future phase was started accidentally.
- Security-sensitive data was not exposed.
- Important decisions were explained.
- Changed files and validation results were reported.

## Final Goal

The finished platform should demonstrate:

Angular

- NestJS
- PostgreSQL
- Docker
- CI/CD
- DevSecOps
- Kubernetes
- WAF
- SIEM
- Monitoring
- Incident Detection
- Controlled Response

The final result must be:

- Technically credible
- Secure
- Maintainable
- Documented
- Visually professional
- Publicly demonstrable
- Defensible during technical interviews
