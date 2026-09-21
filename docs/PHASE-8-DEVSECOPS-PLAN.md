# Phase 8 — DevSecOps

Status: **IMPLEMENTED AND VALIDATED ON GITHUB** as reported for the Phase 8 milestone. Main CI, scheduled security and verified GHCR publication passed. Two HIGH CodeQL findings were remediated in source, regression-tested, reanalysed and closed. Repository settings such as branch rules and GitHub Secret Scanning remain separate checks unless independently confirmed.

## Scope and architecture

Phase 8 adds evidence-producing security gates around the Phase 7 pipeline without changing application behavior or deployment infrastructure.

```text
Repository checks
  ├─ Secret scan (Gitleaks)
  ├─ Dependency security (npm policy + policy tests)
  ├─ Dependency review (pull requests only)
  ├─ CodeQL analysis/upload (hosted ruleset required for severity blocking)
  ├─ Backend CI ──┐
  └─ Frontend CI ─┴─ Docker smoke
                       └─ exact-ID Trivy policy + identity-bound CycloneDX SBOMs
                              └─ export → load/ID verification → publish (main push only)
```

`Secret scan`, `Dependency security`, `CodeQL`, `Backend CI` and `Frontend CI` fan out after repository checks. Docker smoke waits for the required source checks and application jobs. After smoke assertions, the helper records each random local reference plus immutable Docker image ID in the ignored `.ci-images/images.json`. Trivy and Syft consume those IDs directly. Only after policy and SBOM validation does the helper export the images; the publication job loads the archive and verifies every loaded ID against the manifest before retagging.

Dependency Review is PR-only and blocks newly introduced high/critical vulnerable packages. It is deliberately not a prerequisite of the push-only publication job because it is skipped outside pull requests. Publication still depends on all security gates applicable to a main push.

## Controls and policies

### Secrets

Gitleaks Action v3 runs with full history checkout. PR/push behavior is selected by the action, and scheduled runs inspect repository history. The pinned action invokes Gitleaks 8.24.3 with `--redact`; the PR/push job also runs `gitleaks git --redact` over the complete checkout so an event-specific commit range cannot omit repository history. That job has `pull-requests: read` for the action's PR commits API call. PR comments, job summary and raw SARIF artifact upload are disabled so a detected value is not copied into an unsafe artifact. No `.gitleaks.toml` exists because no verified false positive currently requires one.

GitHub Secret Scanning and Push Protection are recommended repository settings. They are not represented as enabled because local repository files cannot prove their state. Any genuine leaked value must be rotated/revoked before considering history cleanup.

### SAST

CodeQL analyzes `javascript-typescript`, covering Angular and NestJS, with `security-extended` queries. Only the CodeQL jobs receive `security-events: write`; all other global workflow access remains `contents: read`. Publication waits for successful analysis/upload, but workflow success does not assert that no high/critical CodeQL alert exists. Severity-based merge blocking requires a GitHub Code Scanning ruleset and protected pull-request-only updates to `main`; these settings must be confirmed remotely.

### npm vulnerability policy

`scripts/ci/security-audit.mjs` runs `npm audit --json` independently for backend and frontend, prints each complete npm JSON report, then evaluates the underlying GHSA records. Critical findings and unapproved high findings fail. Medium/low findings remain visible. Policy/schema failures and expired exceptions also fail.

Only recognized transient transport/registry errors retry, for at most three attempts with 250/500 ms backoff. A valid audit report is evaluated on its first successful retrieval even when npm exits nonzero for vulnerabilities. Unknown errors, malformed reports and exhausted retries fail closed.

The machine-readable baseline is `scripts/ci/npm-audit-baseline.json`. Each entry binds project + advisory + package + exact installed version + lockfile node path, with owner, dates, rationale and remediation. The initial entries expire on **2026-10-20**:

| Advisory              | Package/version      | Severity | Context                                        |
| --------------------- | -------------------- | -------- | ---------------------------------------------- |
| `GHSA-ggr8-5vv4-36mx` | `deepmerge-ts@7.1.5` | high     | Prisma configuration dependency                |
| `GHSA-3f6p-5ww8-9rcr` | `mysql2@3.15.3`      | high     | Prisma CLI dependency; project uses PostgreSQL |
| `GHSA-rgwj-5xj2-c3m3` | `mysql2@3.15.3`      | moderate | Prisma CLI dependency; project uses PostgreSQL |

The three underlying advisories produce npm's four vulnerable-package count through `@prisma/config` and `prisma`. npm's proposed Prisma 6 downgrade is rejected. Remediation is a compatible, tested Prisma/client upgrade; no forced fix or speculative override is allowed.

[Prisma 7.10.0's CLI package](https://github.com/prisma/orm/blob/7.10.0/packages/cli/package.json) declares `mysql2: "3.15.3"` exactly, so normal npm resolution cannot select a patched 3.x release. The [HIGH advisory](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr) is fixed in mysql2 3.22.0 and the [MODERATE advisory](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3) in 3.23.1. At this review, 7.10.0 is the latest stable Prisma 7 release shown by [Prisma's releases](https://github.com/prisma/orm/releases); no supported 7.x update removes the pin. [npm `overrides`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides) could force a newer mysql2 package but would substitute a version outside Prisma's declared dependency. No upstream compatibility assurance was found, so an override was not applied. The project uses PostgreSQL, the finding stays visible and the exact exception expires on 2026-10-20. A supported compatible Prisma release and full backend/Docker validation are the remediation trigger.

Focused Node tests prove accepted, unapproved-high, critical, expired and malformed cases plus transient retry, retry exhaustion and immediate high-finding evaluation. They use synthetic advisory data and never commit a test secret.

### Containers and SBOMs

Trivy 0.74.0 performs one JSON vulnerability scan per exact image ID. The shared evaluator prints every HIGH/CRITICAL record, retains the complete JSON, rejects every unapproved critical regardless of fix availability, and rejects every high outside the exact reviewed fingerprint baseline. Current reports were checked for embedded credentials; Trivy does not sanitize image metadata automatically, so changes to image build configuration require renewed artifact review. This replaces the draft's separate gate/report passes, reducing image scans from six to three. There is no `--ignore-unfixed` or severity-wide exception. Trivy configuration scanning covers the two Dockerfiles and reports supported MEDIUM/HIGH/CRITICAL configuration findings without initially blocking. Trivy 0.74.0 did not recognize `compose.yaml` as a configuration target in local validation, so Compose security continues to rely on its explicit hardening plus the smoke helper's rendered network, volume, port and mount assertions; no unsupported Compose scan is claimed.

Syft 1.52.0 scans the same immutable IDs and generates `backend.cdx.json`, `backend-tools.cdx.json` and `frontend.cdx.json`. The helper requires non-empty CycloneDX content and injects validated `cyber-portfolio:component`, `cyber-portfolio:image-id` and `cyber-portfolio:source-reference` properties. GitHub retains the manifest, three SBOMs and three Trivy reports for 14 days; generated files remain ignored locally.

The machine-readable policy is `scripts/ci/container-vulnerability-baseline.json`. Its four critical exceptions are `CVE-2026-13221`, `CVE-2026-42496`, `CVE-2026-8376` and `CVE-2023-45853`, all inherited from the shared Bookworm base and expiring on **2026-10-20**. Their version, architecture, module/binary and reachability conclusions are documented in [SECURITY.md](../SECURITY.md). The high baseline contains 56 exact fingerprints common to all images and two additional backend/backend-tools Prisma fingerprints. A changed Debian release, architecture, CVE, package, version, type or vendor status requires review. A possible future `node:24-trixie-slim` migration is deliberately excluded because it changes the Debian major version and OpenSSL package layout.

## Scheduled rescanning

`.github/workflows/security-scheduled.yml` runs every Tuesday at 04:17 UTC and on manual dispatch. It performs:

- full-history Gitleaks scanning;
- current backend/frontend npm audit policy evaluation, including exception expiry;
- CodeQL source analysis;
- one remote Trivy JSON scan of each GHCR `main` image, evaluated by the same exact baseline used in normal CI.

The scheduled workflow does not run tests, rebuild images, create SBOMs, publish packages or deploy. It uses `packages: read` only for the image-scan job. Missing/unreadable `main` images fail that job rather than silently claiming coverage.

## Supply-chain controls

All workflow actions are pinned to full commit SHAs resolved from their official upstream release tags. A repository test enumerates every YAML workflow and validates every list-style or named-step `uses:` reference; repository-local actions must exist and Docker actions must use an image digest. Comments retain the reviewed release version. Dependabot checks backend/frontend npm manifests, both Dockerfiles and GitHub Actions weekly. Minor/patch npm and Actions updates are grouped; major updates remain independent and reviewable. No auto-merge is configured.

Base images remain on their existing Node 24/PostgreSQL 18 tags in this phase implementation. Dependabot will propose updates. Digest pinning requires a deliberate refresh policy and is not claimed here.

## Local reproduction

From the repository root with Node 24:

```powershell
node --check scripts/ci/security-audit.mjs
node --check scripts/ci/compose-smoke.mjs
node --check scripts/ci/container-security.mjs
node --test scripts/ci/security-audit.test.mjs scripts/ci/ssr-content.test.mjs scripts/ci/container-security.test.mjs scripts/ci/workflow-security.test.mjs
node scripts/ci/security-audit.mjs
```

With Docker, Trivy 0.74.0 and Syft 1.52.0 available:

```powershell
node scripts/ci/compose-smoke.mjs
node scripts/ci/container-security.mjs
```

Linux CI uses the pinned native Syft binary. Native Syft on Windows can encounter invalid `sha256:` cache filenames while unpacking Docker layers; local Windows validation may instead set `SYFT_CONTAINER_IMAGE` to the reviewed official Syft image digest. The helper then runs Syft in a temporary container, uses the Docker API only to inspect the target image and captures the CycloneDX output. This fallback does not rebuild or mutate the target images.

The smoke helper uses only its random Compose project, disposable database volume and loopback ports 13000/14200. It never loads `.env.docker`, touches Windows PostgreSQL or removes the normal project volume.

## Blocking, warning and exception process

The canonical policy is [SECURITY.md](../SECURITY.md). Confirmed secrets, critical npm findings, unapproved high npm findings, dependency-review high/critical additions, every unapproved container critical, every new container high fingerprint, scanner failures, identity mismatches, invalid/expired exceptions and SBOM failures block. Only exact unexpired npm/container exceptions and high fingerprints warn visibly.

Every exception must be exact and expiring. The repository owner owns the current baseline. A false positive needs evidence and a narrow fingerprint/rule exclusion; broad or permanent allowlists are prohibited.

## Local validation (2026-09-20 to 2026-09-21)

| Validation                           | Result                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Phase 8 policy/helper/workflow tests | 47/47 passed, including retry and SSR regression paths                        |
| Live npm policy                      | Passed; three accepted Prisma-related advisories visible, frontend clean        |
| Gitleaks                             | Full history and intended worktree directory scans clean; zero findings          |
| Backend                              | Prisma generation/NestJS build passed; auth unit 4/4; PostgreSQL e2e 17/17 passed |
| Database guard                       | 18/18 passed without database access                                            |
| Frontend                             | 18/18 tests passed; production SSR build passed                                 |
| Compose smoke                        | Passed migrations, seed, health, API, SSR and UTF-8; isolated resources removed |
| Trivy configuration                  | Two Dockerfiles detected; zero supported misconfiguration findings              |
| Backend image                        | 4 critical (0 fixable); 58 high (6 fixable); blocking gate passed               |
| Backend-tools image                  | 4 critical (0 fixable); 58 high (6 fixable); blocking gate passed               |
| Frontend image                       | 4 critical (0 fixable); 56 high (4 fixable); blocking gate passed               |
| SBOMs                                | Three non-empty CycloneDX documents matched manifest IDs (3,908/4,711/3,543 components) |
| Export/import identity               | Archive loaded; all three loaded references matched the immutable manifest IDs    |
| Workflow/YAML                        | actionlint/YAML and Dependabot structure passed; 34 `uses:` references validated |

The four exact reviewed criticals and 58 exact high fingerprints remain visible until their 2026-10-20 review deadline. Any mismatch or additional high/critical blocks. No Trivy ignore file was created.

## Hosted limitations and phase boundary

The Phase 8 milestone was subsequently validated on GitHub: main CI, scheduled security and GHCR publication passed; the two HIGH CodeQL alerts closed after source fixes and re-analysis. Those results do not establish Secret Scanning/Push Protection settings, branch rules, artifact retention policy or future runs. Confirm those separately before a public preview. If a hosted feature becomes unavailable, retain scanner coverage and document the observed limitation before choosing a fallback; do not silently weaken a gate.

Phase 8 is not deployment. Kubernetes, production hosting, reverse proxy/TLS, WAF, SIEM, monitoring and automated response remain later phases.
