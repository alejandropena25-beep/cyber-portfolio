# Phase 7 — CI/CD

Status: **READY FOR REMOTE VALIDATION** after local checks recorded below. This is not a claim that GitHub Actions or GHCR has run successfully. No commit or push is performed by the implementation task.

## Design and scope

CI checks whether a revision builds, passes tests and bootstraps correctly. Continuous delivery publishes the verified container artifacts so a later deployment can choose them. Deployment would run those artifacts on a server; this phase does not do that.

One workflow, `.github/workflows/ci.yml`, implements:

| Job/check name | Depends on | Responsibility |
| --- | --- | --- |
| Repository checks | — | Committed whitespace, helper syntax, 18 database-target guard tests |
| Backend CI | Repository checks | Clean npm install, Prisma generation, NestJS build, 17 PostgreSQL e2e tests |
| Frontend CI | Repository checks | Clean npm install, 18 tests, production SSR build without API/database |
| Docker smoke | Backend CI, Frontend CI | Real Dockerfiles, isolated fresh Compose bootstrap, HTTP and UTF-8 assertions, cleanup |
| Publish verified images | All four checks | Current run's verified image archive to GHCR; push to main only |

Every job has a timeout and failures block downstream jobs. There is no `continue-on-error`. The real `compose.yaml` and Dockerfiles remain unchanged. No new application dependency or lint ecosystem was added; the existing repository has no lint/format script. npm caches contain downloaded package data, never `node_modules`, database data or environment files. Docker uses ordinary layer caching locally; no persistent remote Docker cache was added.

## Events and permissions

- `pull_request` targeting `main`: validation only, including forks; no package write permission or publication. No `pull_request_target` workflow is used.
- `push` to `main`: validation, then publication if all required jobs succeed.
- `workflow_dispatch`: validation only, even when manually selected on main.
- No release/tag or deployment triggers are configured.

Concurrency groups include workflow, event and ref. New PR runs cancel stale runs on that PR. Running main validations/publications are not cancelled by new pushes; GitHub may replace an older pending run with the newest pending run. Different refs/events do not cancel one another.

Default permission is `contents: read`. Only `Publish verified images` has `packages: write` as well. No PR, issue, deployment, administration, OIDC or Actions write permission is requested. Checkout does not persist credentials. All actions are official GitHub actions: checkout v7, setup-node v7, upload-artifact v7 and download-artifact v8. Major versions are intentional; reviewing SHA pinning belongs to Phase 8.

## Backend and database safety

`postgres:18-bookworm` runs as an ephemeral service with `cyber_portfolio_test`, test-only credentials and mapping `127.0.0.1:55432:5432`. `pg_isready` must pass before the job executes. Credentials are disposable configuration, not repository secrets or production credentials.

The existing `npm test` launcher checks the URL **before spawning Prisma or Jest**. It requires PostgreSQL protocol, loopback hostname, explicit port `55432`, exact database `/cyber_portfolio_test`, no fragment and only optional `schema=public` parameters. It also rejects a development URL using the same database name. It then sets `DATABASE_URL=TEST_DATABASE_URL` and `NODE_ENV=test`. The e2e suite independently checks these conditions before initializing NestJS. Both layers now reject port 5432, omitted ports, `database`, `host.docker.internal`, external hosts and non-test databases. Eighteen focused Node tests exercise the actual launcher's rejection and child-process environment without connecting to any database.

These are configuration guards, not proof of what server somebody manually binds to port 55432. CI owns its newly created disposable service. Local testing must create the documented disposable container, not reuse an unknown listener. The Windows PostgreSQL installation must never be used by these helpers.

The commands are `npm ci`, `npm run build` (already generates Prisma), and `npm test` (generates Prisma, applies `prisma migrate deploy`, runs Jest). The repeated generation preserves the existing tested lifecycle. No reset, `migrate dev`, or alternate test seeding path was added. All 17 existing e2e cases remain.

## Frontend independence

Node 24 executes `npm ci`, `npm test -- --watch=false`, then `npm run build`. This runner has no API or database. Public routes stay runtime SSR; admin stays client-rendered; the wildcard retains its existing 404 behavior. Zero static prerendered routes remains expected. No production/backend environment value is required for compilation.

## Compose smoke and local reproduction

Prerequisites: Node 24, Docker Engine/Desktop with Compose v2 supporting `up --wait`, available loopback ports 13000 and 14200. From the repository root:

```powershell
node --test backend/test/database-safety.test.cjs
node scripts/ci/compose-smoke.mjs
```

The same cross-platform Node helper runs locally and on Linux CI. It:

1. Refuses existing `.ci-smoke` state, creates a random `cyber-portfolio-ci-<16 hex>` project and temporary random credentials. It does not read `.env.docker` or backend `.env`.
2. Uses the real Compose file plus a generated override containing only isolated image names. Generated environment values override local shell values; Compose project/file settings are explicit.
3. Inspects rendered configuration without printing secrets. It requires a single project-scoped `postgres_data` volume, no external networks/volumes or bind mounts, and no database host port. It refuses a pre-existing volume of that name.
4. Builds backend runtime, backend tools and frontend runtime with the existing multi-stage Dockerfiles. Linux generates Prisma and uses the existing OpenSSL packages. No database is needed during build. Default build attestations are disabled; no Phase 8 provenance system is introduced.
5. Runs `up -d --no-build --wait --wait-timeout 180`. Compose enforces database healthy → migrate exit 0 → seed exit 0 → backend healthy → frontend healthy. It then independently inspects all five container states.
6. Confirms two successfully applied migrations, the log `Public content seeded.`, no administrators, and UTF8 server/client/database encoding.
7. Requests `/api/health`, populated `/api/profile`, exactly four `/api/projects`, all four project details, and SSR `/`, `/about`, `/projects`, `/projects/bunkerweb-waf`. It requires populated Spanish text and rejects the observed question-mark/mojibake regression. It never edits public content or creates an admin.
8. On main delivery runs only, exports the three tested images and their local names to `.ci-images/verified-images.tar` and `images.json`. Database volumes and env files are not included.
9. Always runs project-scoped `down --volumes --remove-orphans`, verifies removal of its exact volume and removes temporary configuration. It never targets `cyber-portfolio_postgres_data` or globally prunes Docker.

Successful and failing runs clean up via `finally`; the workflow also runs `node scripts/ci/compose-smoke.mjs cleanup` under `if: always()` to handle ordinary cancellation/failure between steps. If interrupted locally, run that cleanup command from the same checkout. An unresponsive daemon or forced runner termination cannot guarantee an in-process cleanup; GitHub-hosted runners themselves are disposable. Do not delete unknown local Docker resources to compensate.

Failures print `compose ps -a` and the last 150 lines of Compose service logs before cleanup. The helper redacts generated passwords and PostgreSQL URLs and does not print config/env dumps, cookies or tokens. Logs from the current application contain no admin secrets because the smoke never authenticates. Cleanup errors also fail the job.

Optional local export, without any registry publication:

```powershell
$env:CI_EXPORT_IMAGES='true'
try { node scripts/ci/compose-smoke.mjs } finally { Remove-Item Env:CI_EXPORT_IMAGES }
```

The resulting ignored `.ci-images` directory contains only image artifacts, not runtime configuration. The helper leaves its uniquely named local image tags in Docker's cache; it never globally prunes images. Tests/builds may reuse existing Docker build layers, but the database volume is always new. Backend test reproduction, including disposal of the separate port-55432 PostgreSQL container, is in [backend/README.md](../backend/README.md).

## GHCR delivery

Only a successful **push to main** can enter the publication job. PRs and manual runs cannot. The smoke job uploads exactly the verified image tar and names manifest with one-day artifact retention. The publish job downloads that artifact from its own run, loads it and pushes; it does not rebuild or execute application images. This costs artifact transfer time/storage but guarantees the delivered image bytes were smoke-tested even if base image tags or package repositories change between jobs.

Image names derive from lowercase `GITHUB_REPOSITORY`:

- `ghcr.io/<owner>/<repo>-backend`: runtime NestJS.
- `ghcr.io/<owner>/<repo>-backend-tools`: migrations, seed and optional future explicit admin creation.
- `ghcr.io/<owner>/<repo>-frontend`: runtime Angular SSR.

For this repository the prefix is `ghcr.io/alejandropena25-beep/cyber-portfolio`. All three use the same `sha-<full-commit>-<run-id>-<run-attempt>` identifier. Including run/attempt avoids overwriting an earlier delivery when rebuilding a commit against changing upstream inputs. No semantic releases are invented. The registry does not enforce tag immutability: use the pushed **digest** for a future deployment's hard identity. `main` is a convenience alias, updated only if the published SHA is still the current main head. No `latest` tag is required. Publication is not atomic across three packages; a failure may leave partial immutable tags, and the run remains failed. Select versions only from fully successful runs.

GitHub's automatic `GITHUB_TOKEN` authenticates via stdin; a temporary Docker registry config is removed on shell exit. No custom GitHub secrets are required. No Docker Hub password, PAT, SSH key, production/staging database password, cloud credential or deployment secret is needed. Existing package ownership/organization policy can still prevent token publication. Package access and visibility must be checked during the first remote run; public source does not by itself prove packages are publicly readable.

## First real GitHub run

1. Review the local diff and validation results. The owner performs the commit and push; this task does neither.
2. Prefer push to a feature branch and open a PR targeting main. Branch pushes alone do not trigger CI; opening/updating the PR does.
3. In repository **Settings → Actions → General**, ensure GitHub Actions and the used official actions are allowed. Keep default workflow permissions read-only. The workflow requests package-write only for delivery; an organization policy must allow that request.
4. In **Actions → CI**, inspect the four validation checks on the PR. Fork PRs may require a maintainer's normal approval to run. No secrets need to be added.
5. After review, merge to main. Its push run validates again and publishes the three images using `GITHUB_TOKEN`.
6. Inspect **Publish verified images**, its summary, and GHCR package tags/digests. Confirm all three tags share commit/run/attempt and the run is green. For pre-existing packages, grant this repository Actions write access in the package settings if denied; do not work around it with a PAT.
7. Once the workflow exists on the default branch, use **Actions → CI → Run workflow** for manual validation. Manual dispatch deliberately does not publish.
8. Only after actual successful GitHub validation and main publication can Phase 7 be marked CI/CD complete. The badge then reports remote state.

## Recommended main branch protection

No remote settings have been changed or verified. In **Settings → Branches → Add branch protection rule**, target `main` (or create an equivalent branch ruleset):

- Enable **Require a pull request before merging** when appropriate for the owner's workflow; choose reviewer requirements deliberately for a solo-maintained project.
- Enable **Require status checks to pass before merging**. After the first run registers them, select exact check names `Repository checks`, `Backend CI`, `Frontend CI`, `Docker smoke` from GitHub Actions.
- Enable **Require branches to be up to date before merging** if strict integration with current main is desired.
- Keep force pushes and deletions disabled. Choose whether administrators may bypass the rule; do not claim protection without checking the actual settings.

Do not require `Publish verified images` on PRs: it is intentionally skipped until a main push. No merge queue trigger is implemented; enabling a merge queue later requires explicit `merge_group` support.

## Diagnosis and limits

Check the first failed job, not skipped downstream jobs. For backend inspect install/build/migration/Jest output and the PostgreSQL service health. For frontend, compilation must succeed without services. For Docker, inspect the helper's redacted states/logs before the cleanup step. A bind-port conflict locally is a setup issue: use free 13000/14200 ports rather than stopping the user's existing stack. GHCR 403 errors usually require checking repository/package policy, not adding broader credentials.

Local validation exercises real commands and Docker, but cannot prove GitHub expression evaluation, hosted runner availability, artifact transfer, organization policy or GHCR authorization. No GitHub run or package push has been claimed. Node 24, PostgreSQL 18 and dependency lockfiles constrain versions; floating base-image/action major tags are not byte-for-byte rebuild guarantees. The workflow ships the exact images it tested instead of making that claim.

Local validation (2026-09-20):

| Validation | Result |
| --- | --- |
| Backend and frontend `npm ci` | Both clean-lock installations passed; lockfiles unchanged |
| Backend Prisma generation and NestJS build | Passed |
| PostgreSQL 18 e2e on isolated `127.0.0.1:55432` | 17/17 passed; temporary container removed |
| Launcher safety tests without database access | 18/18 passed |
| Frontend tests and production SSR build | 18/18 passed; build passed, zero prerendered routes as expected |
| YAML and workflow structure | Parsed with existing js-yaml; triggers, needs, permissions, ports, Node versions and cleanup assertions passed |
| Workflow shell syntax | All Bash steps passed `bash -n`; actionlint was not installed |
| Real Docker image builds and fresh Compose | Passed; database/backend/frontend healthy, migrate/seed exited 0 |
| Smoke assertions | Two migrations, fresh seed, zero admins, UTF8, profile/four projects/four detail endpoints and four SSR pages passed |
| Intentional frontend-port conflict | Failed as expected; emitted diagnostics without the generated password and removed temporary resources/configuration |
| Verified image export/import | Docker save/load preserved all three image IDs; export about 428 MB before artifact compression |
| Final text/format checks | New workflow/helpers pass existing Prettier; changed/new text valid UTF-8; `git diff --check` passed |

The usual Phase 6 stack remained healthy throughout, and its database volume was not reset. Windows PostgreSQL was not accessed. No existing coverage was reduced. Some subprocess checks needed execution outside the local sandbox after `EPERM`; the final represented checks passed.

Installation warnings: backend npm reported four high-severity dependency advisories and a deprecated `glob` dependency; frontend reported zero advisories. npm also reported pending install-script approval warnings, and the existing seed/Jest tooling emitted `fs.Stats` deprecation / VM Modules experimental warnings. These did not fail the validated commands. No dependency versions were changed and no security gate was added; assessment/remediation of dependency advisories remains Phase 8 work, not a claim of a vulnerability-free build.

## Staging handoff and Phase 8 boundary

Future staging work receives three verified image digests and the existing migration/seed ordering. It must deliberately supply deployment environment, secrets, external hostname allowlist, TLS/cookie configuration, persistence/backups and a release/rollback policy. The current Compose file remains local HTTP configuration; this phase does not pretend it is a ready production deployment manifest.

No SSH, server changes, DNS, Cloudflare, VPS, production environment, Kubernetes, WAF, Wazuh, monitoring or incident response is added. SAST, CodeQL, Semgrep, dependency/container security gates, Trivy, secret scanners, SBOM, signatures/attestations, DAST/ZAP and action SHA pinning review remain Phase 8 or later.

## Reference behavior

Implementation choices were checked against the official [setup-node documentation](https://github.com/actions/setup-node), [artifact upload](https://github.com/actions/upload-artifact), [artifact download](https://github.com/actions/download-artifact), [GitHub container publication guide](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images) and [Compose health waiting](https://docs.docker.com/reference/cli/docker/compose/up/). No additional third-party CI actions are needed.
