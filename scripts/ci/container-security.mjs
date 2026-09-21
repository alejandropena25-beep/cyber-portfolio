import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = join(root, ".ci-images/images.json");
const baselinePath = join(root, "scripts/ci/container-vulnerability-baseline.json");
const sbomDirectory = join(root, ".ci-images/sboms");
const trivyDirectory = join(root, ".ci-images/trivy");
const archivePath = join(root, ".ci-images/verified-images.tar");
export const components = ["backend", "backend-tools", "frontend"];

function requireText(value, field) {
  assert.equal(typeof value, "string", `${field} must be a string`);
  assert.ok(value.trim().length > 0, `${field} must not be empty`);
}

function validDate(value, field) {
  requireText(value, field);
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${field} must use YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00Z`);
  assert.equal(parsed.toISOString().slice(0, 10), value, `${field} is invalid`);
}

function command(name, args, options = {}) {
  console.log(`\n$ ${name} ${args.join(" ")}`);
  const result = spawnSync(name, args, {
    cwd: root,
    encoding: options.capture ? "utf8" : undefined,
    stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
    maxBuffer: options.capture ? 64 * 1024 * 1024 : undefined,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${name} exited with status ${result.status}`);
  return options.capture ? result.stdout.trim() : "";
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function validateImageManifest(value) {
  assert.equal(value?.schemaVersion, 1, "unsupported image manifest schema");
  assert.ok(value.images && typeof value.images === "object");
  assert.deepEqual(
    Object.keys(value.images).sort(),
    [...components].sort(),
    "manifest must identify exactly the three verified images",
  );
  for (const component of components) {
    const image = value.images[component];
    assert.ok(image && typeof image === "object", `${component}: missing image`);
    assert.equal(typeof image.reference, "string");
    assert.match(image.reference, /^[a-zA-Z0-9][a-zA-Z0-9._/:\-]+$/);
    assert.match(image.id, /^sha256:[a-f0-9]{64}$/);
    assert.equal(image.os, "linux", `${component}: expected a Linux image`);
    requireText(image.architecture, `${component}.architecture`);
  }
  return value;
}

function exceptionKey(item) {
  return [
    item.id,
    item.package,
    item.installedVersion,
    item.type,
    item.status,
    item.osFamily,
    item.debianRelease,
    item.architecture,
    [...item.images].sort().join(","),
  ].join("|");
}

export function vulnerabilityKey(item) {
  return [item.id, item.package, item.installedVersion, item.type, item.status].join("|");
}

export function validateContainerBaseline(input, today = new Date().toISOString().slice(0, 10)) {
  assert.equal(input?.schemaVersion, 1, "unsupported container baseline schema");
  assert.ok(Array.isArray(input.criticalExceptions));
  const seenCritical = new Set();
  for (const [index, item] of input.criticalExceptions.entries()) {
    const label = `criticalExceptions[${index}]`;
    for (const field of [
      "id", "package", "installedVersion", "type", "status", "osFamily",
      "debianRelease", "architecture", "rationale", "runtimeRelevance", "owner",
      "created", "reviewDate", "expires", "remediationTrigger",
    ]) requireText(item?.[field], `${label}.${field}`);
    assert.match(item.id, /^CVE-\d{4}-\d+$/);
    assert.equal(item.severity, "CRITICAL");
    assert.equal(item.osFamily, "debian");
    assert.ok(Array.isArray(item.images) && item.images.length > 0);
    assert.ok(item.images.every((component) => components.includes(component)), `${label}.images contains an unknown component`);
    assert.equal(new Set(item.images).size, item.images.length);
    assert.ok(Array.isArray(item.evidence) && item.evidence.length > 0);
    for (const evidence of item.evidence)
      assert.doesNotThrow(() => new URL(evidence), `${label}.evidence is invalid`);
    for (const field of ["created", "reviewDate", "expires"])
      validDate(item[field], `${label}.${field}`);
    assert.ok(item.created <= item.reviewDate, `${label} review predates creation`);
    assert.ok(item.reviewDate <= item.expires, `${label} expires before review`);
    assert.ok(item.expires >= today, `${label} expired on ${item.expires}`);
    const key = exceptionKey(item);
    assert.ok(!seenCritical.has(key), `${label} duplicates another exception`);
    seenCritical.add(key);
  }

  const high = input.highBaseline;
  assert.ok(high && typeof high === "object", "missing highBaseline");
  for (const field of ["osFamily", "debianRelease", "architecture", "owner", "created", "reviewDate", "expires", "limitation"])
    requireText(high[field], `highBaseline.${field}`);
  for (const field of ["created", "reviewDate", "expires"])
    validDate(high[field], `highBaseline.${field}`);
  assert.ok(high.created <= high.reviewDate, "highBaseline review predates creation");
  assert.ok(high.reviewDate <= high.expires, "highBaseline expires before review");
  assert.ok(high.expires >= today, `highBaseline expired on ${high.expires}`);
  assert.ok(Array.isArray(high.allImages));
  assert.ok(Array.isArray(high.backendAndTools));
  const highKeys = [...high.allImages, ...high.backendAndTools];
  assert.equal(new Set(highKeys).size, highKeys.length, "duplicate HIGH baseline key");
  for (const [index, key] of highKeys.entries()) {
    requireText(key, `highBaseline key ${index}`);
    assert.equal(key.split("|").length, 5, `invalid HIGH baseline key: ${key}`);
  }
  return input;
}

function findingsFrom(report) {
  const findings = [];
  for (const result of report.Results ?? []) {
    for (const vulnerability of result.Vulnerabilities ?? []) {
      if (!["HIGH", "CRITICAL"].includes(vulnerability.Severity)) continue;
      findings.push({
        severity: vulnerability.Severity,
        id: vulnerability.VulnerabilityID,
        package: vulnerability.PkgName,
        installedVersion: vulnerability.InstalledVersion,
        fixedVersion: vulnerability.FixedVersion ?? "",
        status: vulnerability.Status ?? "unknown",
        title: vulnerability.Title ?? "",
        type: result.Type,
        target: result.Target,
      });
    }
  }
  return findings;
}

function reportEnvironment(report) {
  return {
    imageId: report.Metadata?.ImageID,
    osFamily: report.Metadata?.OS?.Family,
    debianRelease: report.Metadata?.OS?.Name,
    architecture: report.Metadata?.ImageConfig?.architecture,
  };
}

export function validateTrivyReportIdentity(report, image, component) {
  const environment = reportEnvironment(report);
  assert.equal(environment.imageId, image.id, `${component}: Trivy image ID mismatch`);
  assert.equal(environment.architecture, image.architecture, `${component}: Trivy architecture mismatch`);
  return environment;
}

function expectedHighKeys(component, baseline) {
  return new Set([
    ...baseline.highBaseline.allImages,
    ...(["backend", "backend-tools"].includes(component) ? baseline.highBaseline.backendAndTools : []),
  ]);
}

export function evaluateContainerReport({ component, report, baseline }) {
  assert.ok(components.includes(component), `unknown component ${component}`);
  const environment = reportEnvironment(report);
  const errors = [];
  const warnings = [];
  const findings = findingsFrom(report);

  for (const finding of findings.filter((item) => item.severity === "CRITICAL")) {
    const match = baseline.criticalExceptions.find(
      (item) => item.id === finding.id && item.package === finding.package &&
        item.installedVersion === finding.installedVersion && item.type === finding.type &&
        item.status === finding.status && item.osFamily === environment.osFamily &&
        item.debianRelease === environment.debianRelease &&
        item.architecture === environment.architecture && item.images.includes(component),
    );
    const summary = `${finding.id} ${finding.package}@${finding.installedVersion} (${finding.type}/${finding.status})`;
    if (!match) errors.push(`UNAPPROVED CRITICAL: ${summary}`);
    else warnings.push(`ACCEPTED CRITICAL UNTIL ${match.expires}: ${summary}`);
  }

  const expected = expectedHighKeys(component, baseline);
  const observed = new Set(findings.filter((item) => item.severity === "HIGH").map(vulnerabilityKey));
  if (environment.osFamily !== baseline.highBaseline.osFamily ||
      environment.debianRelease !== baseline.highBaseline.debianRelease ||
      environment.architecture !== baseline.highBaseline.architecture)
    errors.push(`HIGH baseline environment mismatch: ${environment.osFamily} ${environment.debianRelease} ${environment.architecture}`);
  for (const key of observed) if (!expected.has(key)) errors.push(`NEW HIGH: ${key}`);
  for (const key of expected) if (!observed.has(key)) warnings.push(`HIGH BASELINE NOT OBSERVED: ${key}; review and remove it`);
  return { errors, warnings, findings };
}

function printFindings(component, result) {
  console.log(`\n===== ${component}: complete HIGH/CRITICAL summary =====`);
  for (const finding of result.findings)
    console.log([
      finding.severity, finding.id, `${finding.package}@${finding.installedVersion}`,
      finding.fixedVersion ? `fixed=${finding.fixedVersion}` : "fixed=none",
      `status=${finding.status}`, `type=${finding.type}`, finding.title,
    ].join(" | "));
  for (const warning of result.warnings) console.warn(`WARN ${warning}`);
  for (const error of result.errors) console.error(`BLOCK ${error}`);
  assert.equal(result.errors.length, 0, `${component}: container vulnerability policy rejected findings`);
}

function identityProperties(document) {
  return document?.metadata?.component?.properties ?? [];
}

export function bindSbomIdentity(document, component, image) {
  assert.equal(document?.bomFormat, "CycloneDX", "unexpected SBOM format");
  document.metadata ??= {};
  document.metadata.component ??= { type: "container", name: component, version: image.id };
  const reserved = new Set(["cyber-portfolio:component", "cyber-portfolio:image-id", "cyber-portfolio:source-reference"]);
  document.metadata.component.properties = [
    ...identityProperties(document).filter((item) => !reserved.has(item.name)),
    { name: "cyber-portfolio:component", value: component },
    { name: "cyber-portfolio:image-id", value: image.id },
    { name: "cyber-portfolio:source-reference", value: image.reference },
  ];
  return document;
}

export function validateSbomDocument(value, component, image) {
  assert.equal(value?.bomFormat, "CycloneDX", `${component}: unexpected SBOM format`);
  requireText(value.specVersion, `${component}: CycloneDX version`);
  assert.ok(Array.isArray(value.components), `${component}: missing SBOM components`);
  assert.ok(value.components.length > 0, `${component}: empty SBOM`);
  const properties = new Map(identityProperties(value).map((item) => [item.name, item.value]));
  assert.equal(properties.get("cyber-portfolio:component"), component, `${component}: SBOM component identity mismatch`);
  assert.equal(properties.get("cyber-portfolio:image-id"), image.id, `${component}: SBOM image identity mismatch`);
  assert.equal(properties.get("cyber-portfolio:source-reference"), image.reference, `${component}: SBOM source identity mismatch`);
}

export function validateRequiredEvidence(
  present = existsSync,
  sbomRoot = sbomDirectory,
  trivyRoot = trivyDirectory,
) {
  for (const component of components) {
    assert.ok(present(join(sbomRoot, `${component}.cdx.json`)), `${component}: missing SBOM`);
    assert.ok(present(join(trivyRoot, `${component}.json`)), `${component}: missing Trivy report`);
  }
  return true;
}

function imageId(image) {
  return command("docker", ["image", "inspect", "--format", "{{.Id}}", image], { capture: true });
}

export function validateLoadedImageIdentities(manifest, lookup = imageId) {
  validateImageManifest(manifest);
  for (const component of components)
    assert.equal(lookup(manifest.images[component].reference), manifest.images[component].id, `${component}: loaded publication image ID mismatch`);
  return true;
}

function scanReport(trivy, reference, reportPath) {
  command(trivy, ["image", "--scanners", "vuln", "--format", "json", "--output", reportPath, reference]);
  assert.ok(existsSync(reportPath), `missing Trivy report: ${reportPath}`);
  return loadJson(reportPath);
}

function generateSbom(syft, syftContainer, imageIdValue, sbomPath) {
  if (syftContainer) {
    const document = command("docker", [
      "run", "--rm", "--volume", "/var/run/docker.sock:/var/run/docker.sock:ro",
      syftContainer, "scan", imageIdValue, "--output", "cyclonedx-json",
    ], { capture: true });
    writeFileSync(sbomPath, `${document}\n`);
  } else command(syft, ["scan", imageIdValue, "--output", `cyclonedx-json=${sbomPath}`]);
}

export function runVerifiedContainerSecurity() {
  assert.ok(existsSync(manifestPath), `Missing image manifest: ${manifestPath}`);
  const manifest = validateImageManifest(loadJson(manifestPath));
  const baseline = validateContainerBaseline(loadJson(baselinePath));
  const trivy = process.env.TRIVY_COMMAND || "trivy";
  const syft = process.env.SYFT_COMMAND || "syft";
  const syftContainer = process.env.SYFT_CONTAINER_IMAGE;
  command(trivy, ["--version"]);
  if (syftContainer) command("docker", ["run", "--rm", syftContainer, "version"]);
  else command(syft, ["version"]);
  validateLoadedImageIdentities(manifest);

  console.log("\n===== Dockerfile/IaC static security (visible, non-blocking baseline) =====");
  command(trivy, ["config", "--severity", "MEDIUM,HIGH,CRITICAL", "--exit-code", "0", "."]);
  mkdirSync(sbomDirectory, { recursive: true });
  mkdirSync(trivyDirectory, { recursive: true });
  for (const component of components) {
    const image = manifest.images[component];
    const reportPath = join(trivyDirectory, `${component}.json`);
    const report = scanReport(trivy, image.id, reportPath);
    validateTrivyReportIdentity(report, image, component);
    printFindings(component, evaluateContainerReport({ component, report, baseline }));

    const sbomPath = join(sbomDirectory, `${component}.cdx.json`);
    generateSbom(syft, syftContainer, image.id, sbomPath);
    const sbom = bindSbomIdentity(loadJson(sbomPath), component, image);
    writeFileSync(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`);
    validateSbomDocument(sbom, component, image);
    assert.equal(imageId(image.reference), image.id, `${component}: image identity changed during security validation`);
  }
  validateRequiredEvidence();

  if (process.env.CI_EXPORT_IMAGES === "true") {
    command("docker", ["image", "save", "--output", archivePath, ...components.map((component) => manifest.images[component].reference)]);
    assert.ok(existsSync(archivePath), "verified image archive was not created");
    validateLoadedImageIdentities(manifest);
    console.log("Exported the security-validated image IDs for publication.");
  }
  console.log("\nPASS three exact image IDs scanned once, policy-approved and bound to CycloneDX SBOMs.");
}

export function runPublishedContainerSecurity() {
  const prefix = process.env.PUBLISHED_IMAGE_PREFIX;
  requireText(prefix, "PUBLISHED_IMAGE_PREFIX");
  const trivy = process.env.TRIVY_COMMAND || "trivy";
  const baseline = validateContainerBaseline(loadJson(baselinePath));
  const directory = join(trivyDirectory, "published");
  mkdirSync(directory, { recursive: true });
  command(trivy, ["--version"]);
  for (const component of components) {
    const report = scanReport(trivy, `${prefix}-${component}:main`, join(directory, `${component}.json`));
    printFindings(component, evaluateContainerReport({ component, report, baseline }));
  }
  console.log("PASS published main images satisfy the shared container policy.");
}

function runCli() {
  const mode = process.argv[2] ?? "verified";
  if (mode === "verified") runVerifiedContainerSecurity();
  else if (mode === "published") runPublishedContainerSecurity();
  else if (mode === "verify-loaded") {
    validateLoadedImageIdentities(loadJson(resolve(process.argv[3] ?? manifestPath)));
    console.log("PASS loaded image IDs match the immutable manifest.");
  } else throw new Error("Use verified, published or verify-loaded mode");
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) {
  try { runCli(); }
  catch (error) {
    console.error(`BLOCK container security: ${error.message}`);
    process.exitCode = 1;
  }
}
