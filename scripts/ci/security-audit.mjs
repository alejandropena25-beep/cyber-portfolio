import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const baselinePath = join(root, "scripts/ci/npm-audit-baseline.json");
const projects = ["backend", "frontend"];
const acceptedSeverities = new Set(["high", "moderate", "low"]);
const transientAuditCodes = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "E502",
  "E503",
  "E504",
]);
const maxAuditAttempts = 3;

function pause(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function requireText(value, field) {
  assert.equal(typeof value, "string", `${field} must be a string`);
  assert.ok(value.trim().length > 0, `${field} must not be empty`);
}

function validDate(value, field) {
  requireText(value, field);
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${field} must use YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00Z`);
  assert.ok(!Number.isNaN(parsed.valueOf()), `${field} must be a valid date`);
  assert.equal(parsed.toISOString().slice(0, 10), value, `${field} is invalid`);
}

function exceptionKey(item) {
  return [
    item.project,
    item.advisory.toUpperCase(),
    item.package,
    item.version,
    item.nodePath,
  ].join("|");
}

export function validateBaseline(
  input,
  today = new Date().toISOString().slice(0, 10),
) {
  assert.equal(
    input?.schemaVersion,
    1,
    "Unsupported npm audit baseline schema",
  );
  assert.ok(Array.isArray(input.exceptions), "exceptions must be an array");
  const seen = new Set();
  for (const [index, item] of input.exceptions.entries()) {
    const label = `exceptions[${index}]`;
    for (const field of [
      "project",
      "advisory",
      "package",
      "version",
      "nodePath",
      "severity",
      "status",
      "owner",
      "created",
      "expires",
      "rationale",
      "remediation",
    ])
      requireText(item?.[field], `${label}.${field}`);
    assert.ok(projects.includes(item.project), `${label}.project is unknown`);
    assert.match(item.advisory, /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i);
    assert.ok(
      acceptedSeverities.has(item.severity),
      `${label}.severity cannot be accepted`,
    );
    assert.equal(
      item.status,
      "accepted-temporary",
      `${label}.status is invalid`,
    );
    assert.match(
      item.nodePath,
      /^node_modules\//,
      `${label}.nodePath must be lockfile-relative`,
    );
    validDate(item.created, `${label}.created`);
    validDate(item.expires, `${label}.expires`);
    assert.ok(
      item.created <= item.expires,
      `${label} expires before it was created`,
    );
    assert.ok(item.expires >= today, `${label} expired on ${item.expires}`);
    const key = exceptionKey(item);
    assert.ok(!seen.has(key), `${label} duplicates another exception`);
    seen.add(key);
  }
  return input.exceptions;
}

function advisoryId(via) {
  try {
    const id = new URL(via.url).pathname.split("/").filter(Boolean).at(-1);
    return /^GHSA-/i.test(id ?? "") ? id.toUpperCase() : null;
  } catch {
    return null;
  }
}

function resolvedAdvisories(packageName, vulnerabilities, trail = []) {
  assert.ok(!trail.includes(packageName), `Circular npm audit via edge: ${[...trail, packageName].join(" -> ")}`);
  const vulnerability = vulnerabilities[packageName];
  assert.ok(vulnerability, `npm audit via edge references missing package ${packageName}`);
  assert.ok(Array.isArray(vulnerability.via), `${packageName}.via must be an array`);
  const advisories = [];
  for (const via of vulnerability.via) {
    if (typeof via === "string")
      advisories.push(...resolvedAdvisories(via, vulnerabilities, [...trail, packageName]));
    else {
      const advisory = advisoryId(via);
      assert.ok(advisory, `Cannot identify advisory for ${packageName}`);
      advisories.push({ advisory, severity: via.severity });
    }
  }
  return advisories;
}

function findingsFrom(report, lockfile) {
  assert.equal(
    report?.auditReportVersion,
    2,
    "Unsupported npm audit report schema",
  );
  assert.ok(
    report.vulnerabilities && typeof report.vulnerabilities === "object",
  );
  const vulnerabilities = report.vulnerabilities;
  const severities = ["info", "low", "moderate", "high", "critical"];
  for (const severity of severities) {
    const observed = Object.values(vulnerabilities).filter(
      (item) => item.severity === severity,
    ).length;
    const reported = Number(report.metadata?.vulnerabilities?.[severity] ?? 0);
    assert.equal(
      observed,
      reported,
      `npm ${severity} metadata count ${reported} does not match ${observed} vulnerability entries`,
    );
  }
  const reportedTotal = Number(report.metadata?.vulnerabilities?.total ?? 0);
  assert.equal(
    Object.keys(vulnerabilities).length,
    reportedTotal,
    `npm total metadata count ${reportedTotal} does not match vulnerability entries`,
  );

  const rank = new Map(severities.map((severity, index) => [severity, index]));
  const findings = [];
  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    assert.ok(
      Array.isArray(vulnerability.nodes),
      `${packageName}.nodes must be an array`,
    );
    const resolved = resolvedAdvisories(packageName, vulnerabilities);
    if (["high", "critical"].includes(vulnerability.severity))
      assert.ok(
        resolved.some(
          (item) => rank.get(item.severity) >= rank.get(vulnerability.severity),
        ),
        `${packageName}: ${vulnerability.severity} via graph has no advisory of matching severity`,
      );
    for (const via of vulnerability.via) {
      if (typeof via === "string") continue;
      const advisory = advisoryId(via);
      assert.ok(advisory, `Cannot identify advisory for ${packageName}`);
      for (const nodePath of vulnerability.nodes) {
        const version = lockfile.packages?.[nodePath]?.version;
        assert.ok(
          version,
          `Cannot resolve ${packageName} version at ${nodePath}`,
        );
        findings.push({
          advisory,
          package: packageName,
          version,
          nodePath,
          severity: via.severity,
          title: via.title,
          range: via.range,
        });
      }
    }
  }
  return findings;
}

export function evaluateAudit({ project, report, lockfile, exceptions }) {
  assert.ok(projects.includes(project), `Unknown project ${project}`);
  const findings = findingsFrom(report, lockfile);
  const errors = [];
  const warnings = [];
  const matched = new Set();

  for (const finding of findings) {
    const match = exceptions.find(
      (item) =>
        item.project === project &&
        item.advisory.toUpperCase() === finding.advisory &&
        item.package === finding.package &&
        item.version === finding.version &&
        item.nodePath === finding.nodePath &&
        item.severity === finding.severity,
    );
    const summary = `${finding.advisory} ${finding.package}@${finding.version} (${finding.severity}) at ${finding.nodePath}`;
    if (finding.severity === "critical") errors.push(`CRITICAL: ${summary}`);
    else if (finding.severity === "high" && !match)
      errors.push(`UNAPPROVED HIGH: ${summary}`);
    else if (match) {
      warnings.push(`ACCEPTED UNTIL ${match.expires}: ${summary}`);
      matched.add(exceptionKey(match));
    } else
      warnings.push(`VISIBLE ${finding.severity.toUpperCase()}: ${summary}`);
  }

  return { errors, warnings, findings, matched };
}

export function runAudit(project, { execute = spawnSync, wait = pause } = {}) {
  assert.ok(projects.includes(project), `Unknown project ${project}`);
  const windowsCli = join(
    dirname(process.execPath),
    "node_modules/npm/bin/npm-cli.js",
  );
  const command = process.platform === "win32" ? process.execPath : "npm";
  const args =
    process.platform === "win32"
      ? [windowsCli, "audit", "--json"]
      : ["audit", "--json"];
  if (process.platform === "win32")
    assert.ok(existsSync(windowsCli), "Cannot locate npm CLI");
  for (let attempt = 1; attempt <= maxAuditAttempts; attempt++) {
    const result = execute(command, args, {
      cwd: join(root, project),
      encoding: "utf8",
      windowsHide: true,
    });
    if (result.stderr?.trim()) process.stderr.write(result.stderr);
    let report;
    let parseError;
    if (result.stdout?.trim()) {
      try {
        report = JSON.parse(result.stdout);
      } catch (error) {
        parseError = error;
      }
    }
    const code =
      result.error?.code ??
      report?.error?.code ??
      [...transientAuditCodes].find((item) => result.stderr?.includes(item));
    if (
      result.status !== 0 &&
      report?.auditReportVersion === undefined &&
      transientAuditCodes.has(code)
    ) {
      if (attempt === maxAuditAttempts)
        throw new Error(`${project}: npm audit transport error ${code} after ${attempt} attempts`);
      console.warn(`${project}: npm audit transport error ${code}; retrying (${attempt}/${maxAuditAttempts}).`);
      wait(250 * attempt);
      continue;
    }
    if (parseError) throw parseError;
    if (result.error) throw result.error;
    assert.ok(result.stdout?.trim(), `${project}: npm audit returned no JSON`);
    assert.equal(report?.auditReportVersion, 2, `${project}: npm audit returned no valid report`);
    console.log(`\n===== ${project}: complete npm audit JSON =====`);
    process.stdout.write(
      result.stdout.endsWith("\n") ? result.stdout : `${result.stdout}\n`,
    );
    return report;
  }
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function runPolicy() {
  const baseline = loadJson(baselinePath);
  const exceptions = validateBaseline(baseline);
  const allErrors = [];
  const allWarnings = [];
  const matched = new Set();
  for (const project of projects) {
    const result = evaluateAudit({
      project,
      report: runAudit(project),
      lockfile: loadJson(join(root, project, "package-lock.json")),
      exceptions,
    });
    allErrors.push(...result.errors.map((message) => `${project}: ${message}`));
    allWarnings.push(
      ...result.warnings.map((message) => `${project}: ${message}`),
    );
    for (const key of result.matched) matched.add(key);
  }
  for (const item of exceptions)
    if (!matched.has(exceptionKey(item)))
      allWarnings.push(
        `${item.project}: BASELINE NOT OBSERVED: ${item.advisory} ${item.package}@${item.version}; remove it after confirming remediation`,
      );

  console.log("\n===== npm vulnerability policy =====");
  for (const warning of allWarnings) console.warn(`WARN ${warning}`);
  for (const error of allErrors) console.error(`BLOCK ${error}`);
  if (allErrors.length)
    throw new Error(
      `npm security policy rejected ${allErrors.length} finding(s)`,
    );
  console.log(
    `PASS npm security policy (${allWarnings.length} visible warning(s)).`,
  );
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) {
  try {
    runPolicy();
  } catch (error) {
    console.error(`BLOCK ${error.message}`);
    process.exitCode = 1;
  }
}
