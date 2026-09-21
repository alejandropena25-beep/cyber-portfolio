# Security Policy

## Reporting a vulnerability or leaked credential

Do not publish credentials, exploit details or personal data in a public issue. If GitHub shows private vulnerability reporting for this repository, use that channel. Otherwise contact the repository owner through an existing private channel and provide the affected component, impact, reproduction and suggested remediation.

A real credential must be revoked or rotated immediately and its exposure investigated. Removing it from the latest commit, adding an ignore rule or marking a scanner alert as false positive is not remediation. History rewriting is a separate, explicitly approved operation and never replaces rotation.

Repository configuration cannot prove that GitHub Secret Scanning or Push Protection is enabled. Enabling both is recommended and must be verified in the repository security settings.

## Phase 8 checks

The CI pipeline performs Gitleaks secret detection, CodeQL JavaScript/TypeScript analysis, pull-request dependency review, npm advisory policy evaluation, application tests, an isolated Docker smoke test, Trivy image/configuration scanning and CycloneDX SBOM generation. Publication from `main` depends on successful execution of the required CI jobs and verifies immutable Docker image IDs before scanning, SBOM generation, export and publication.

The weekly scheduled workflow rescans Git history, npm lockfiles, JavaScript/TypeScript source and the three current GHCR `main` images. It neither builds nor publishes nor deploys anything.

## Severity and gate policy

The following conditions block the affected CI run:

- a confirmed secret introduced by the scanned changes;
- any critical npm vulnerability;
- a new high npm vulnerability without a valid explicit exception;
- a newly introduced high or critical vulnerable dependency in dependency review;
- any container critical vulnerability without an exact, unexpired reviewed exception;
- any container high vulnerability outside the exact reviewed fingerprint baseline;
- malformed, duplicate or expired npm exceptions;
- scanner execution failure;
- missing, invalid or empty required SBOM output.

The following remain visible warnings during the initial Phase 8 baseline:

- the exact reviewed Prisma-related advisories recorded in `scripts/ci/npm-audit-baseline.json`;
- medium and low dependency or SAST findings;
- the exact high container fingerprints in `scripts/ci/container-vulnerability-baseline.json` until their mandatory review expires;
- the four exact critical container exceptions documented below until their mandatory review expires;
- medium/informational Dockerfile or supported IaC configuration findings.

`npm audit` retries a recognized temporary registry/transport error up to three times with bounded backoff. A valid vulnerability report is evaluated immediately; malformed data, unrecognized errors and exhausted retries block. No network error changes the severity policy.

CodeQL uploads findings to GitHub code scanning, and publication waits for successful CodeQL execution. A successful analysis job does not mean that no high/critical alerts exist. Enforcing severity-based merge blocking requires a repository-side GitHub Code Scanning ruleset plus protected pull-request-only updates to `main`; both settings require remote verification.

## Reviewed container criticals

All four current critical records are inherited from `node:24-bookworm-slim` / Debian Bookworm, occur in backend, backend-tools and frontend, and expire for mandatory review on **2026-10-20**. They are matched by CVE, package, version, type, vendor status, Debian release, architecture and applicable image. No severity-wide or `--ignore-unfixed` allowance exists.

| CVE | Exact package | Reviewed runtime conclusion | Why Bookworm has no fix / remediation trigger |
| --- | --- | --- | --- |
| `CVE-2026-13221` | `perl-base@5.36.0-7+deb12u3` | Upstream states Perl 5.36 is not affected and identifies 5.37.10 as the introducing change; the Node applications do not invoke Perl. | Debian currently maps the CVE to Bookworm without a fixed package. Remove when Debian corrects/fixes it or after a separately validated base migration. |
| `CVE-2026-42496` | `perl-base@5.36.0-7+deb12u3` | The affected `Archive::Tar` module is absent from every image and no application path invokes Perl archive extraction. | Debian marks the Bookworm fix deferred while upstream regressions are evaluated. Remove if the module becomes present/reachable, Debian fixes it, or the base changes. |
| `CVE-2026-8376` | `perl-base@5.36.0-7+deb12u3` | The flaw requires a 32-bit Perl build; all images are amd64/x86_64 and do not invoke Perl. | Debian classifies it as no-DSA pending a point release. Remove on architecture/reachability change, Debian fix or validated base migration. |
| `CVE-2023-45853` | `zlib1g@1:1.2.13.dfsg-1` | Debian states the vulnerable MiniZip binary/API was not built from this Bookworm source package. | Debian intentionally does not fix an unaffected binary package. Remove if MiniZip is introduced, Debian changes its assessment or the base changes. |

`node:24-trixie-slim` is a possible future remediation, but it is not adopted here: changing the Debian major version and OpenSSL package layout requires a separate full validation task.

## Temporary vulnerability exceptions

There are no permanent or blanket allowlists. Each temporary npm exception must identify exactly one project, GHSA, package, installed version and lockfile node path. Container critical exceptions additionally bind the Debian release, architecture, vendor status and applicable images. Every exception must include:

- severity and `accepted-temporary` status;
- accountable owner;
- creation date;
- mandatory expiration/review date;
- risk-based rationale;
- concrete remediation plan.

The policies reject expired, malformed or duplicate entries and reject unexpected high/critical findings. An exception or high fingerprint that is no longer observed is reported so it can be removed. Reviewers must not broaden an exception to make CI green.

False positives require evidence showing why the detector is wrong. Prefer the detector's exact fingerprint or the narrowest file/rule exclusion, document the decision and add a regression test where practical. Never exclude a directory, severity or entire scanner merely to suppress noise.

## Dependency and image maintenance

Dependabot proposes weekly npm, Docker and GitHub Actions updates without automatic merging. Major Angular and Prisma changes remain separate, reviewable updates and must pass the complete pipeline. Do not use `npm audit fix --force`, downgrade Prisma, or add speculative overrides to silence findings.

The open `mysql2@3.15.3` HIGH (`GHSA-3f6p-5ww8-9rcr`) is patched in mysql2 3.22.0; the separate MODERATE (`GHSA-rgwj-5xj2-c3m3`) is patched in 3.23.1. Prisma 7.10.0 pins mysql2 to exactly 3.15.3 in its CLI dependency graph. This application uses PostgreSQL and does not exercise the affected MySQL authentication or compression paths, but the installed package and Dependabot alert remain open and visible under the exact exception expiring 2026-10-20. The suggested Prisma 6 downgrade is rejected. An npm override can replace the installed package technically, but no upstream compatibility assurance was found for that substitution, and npm installation alone cannot establish CLI compatibility; no override was applied. Reassess when a compatible supported Prisma release removes the vulnerable pin, then validate the full backend and image chain and remove the exception.

Generated SBOMs and complete Trivy JSON reports are CI artifacts, not committed source. The current reports were checked for embedded credentials before retention; Trivy reports are not automatically sanitized, so image metadata must be reviewed if image build configuration changes. Each SBOM carries machine-readable component, source-reference and Docker image-ID properties. The publication manifest carries the same IDs, and publication fails if the IDs after `docker load` differ. These artifacts are evidence, not proof that an image is vulnerability-free.

Phase 8 adds security validation only. It does not deploy the application or introduce Kubernetes, production infrastructure, WAF, SIEM or later roadmap phases.
