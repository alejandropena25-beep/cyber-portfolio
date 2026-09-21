import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  bindSbomIdentity,
  evaluateContainerReport,
  validateContainerBaseline,
  validateImageManifest,
  validateLoadedImageIdentities,
  validateRequiredEvidence,
  validateSbomDocument,
  validateTrivyReportIdentity,
} from "./container-security.mjs";

test("the committed container baseline is valid and contains exactly four critical exceptions", () => {
  const committed = JSON.parse(
    readFileSync("scripts/ci/container-vulnerability-baseline.json", "utf8"),
  );
  assert.doesNotThrow(() => validateContainerBaseline(committed, "2026-09-20"));
  assert.deepEqual(
    committed.criticalExceptions.map((item) => item.id).sort(),
    ["CVE-2023-45853", "CVE-2026-13221", "CVE-2026-42496", "CVE-2026-8376"],
  );
  assert.equal(committed.highBaseline.allImages.length, 56);
  assert.equal(committed.highBaseline.backendAndTools.length, 2);
});

const image = {
  reference: "test/backend:verified",
  id: `sha256:${"a".repeat(64)}`,
  os: "linux",
  architecture: "amd64",
};

const manifest = {
  schemaVersion: 1,
  images: {
    backend: image,
    "backend-tools": { ...image, reference: "test/backend-tools:verified", id: `sha256:${"b".repeat(64)}` },
    frontend: { ...image, reference: "test/frontend:verified", id: `sha256:${"c".repeat(64)}` },
  },
};

const criticalException = {
  id: "CVE-2026-1000",
  package: "example-os-package",
  installedVersion: "1.2.3-1",
  severity: "CRITICAL",
  type: "debian",
  status: "affected",
  osFamily: "debian",
  debianRelease: "12.15",
  architecture: "amd64",
  images: ["backend"],
  rationale: "Synthetic exact exception used to prove policy behavior.",
  evidence: ["https://security-tracker.debian.org/tracker/CVE-2026-1000"],
  runtimeRelevance: "Synthetic finding is unreachable in this test fixture.",
  owner: "security owner",
  created: "2026-09-20",
  reviewDate: "2026-09-20",
  expires: "2026-10-20",
  remediationTrigger: "Remove when a fixed package is available.",
};

const highKey = "CVE-2026-2000|example-high|2.0.0|node-pkg|fixed";
const baseline = {
  schemaVersion: 1,
  criticalExceptions: [criticalException],
  highBaseline: {
    osFamily: "debian",
    debianRelease: "12.15",
    architecture: "amd64",
    owner: "security owner",
    created: "2026-09-20",
    reviewDate: "2026-09-20",
    expires: "2026-10-20",
    limitation: "Synthetic exact HIGH fingerprint baseline.",
    allImages: [highKey],
    backendAndTools: [],
  },
};

function vulnerability({ severity, id, packageName, version, status }) {
  return {
    VulnerabilityID: id,
    PkgName: packageName,
    InstalledVersion: version,
    FixedVersion: "",
    Status: status,
    Severity: severity,
    Title: "Synthetic vulnerability",
  };
}

function report(extra = []) {
  return {
    Metadata: {
      ImageID: image.id,
      OS: { Family: "debian", Name: "12.15" },
      ImageConfig: { architecture: "amd64" },
    },
    Results: [
      {
        Target: "test (debian 12.15)",
        Type: "debian",
        Vulnerabilities: [
          vulnerability({
            severity: "CRITICAL",
            id: "CVE-2026-1000",
            packageName: "example-os-package",
            version: "1.2.3-1",
            status: "affected",
          }),
          ...extra.filter((item) => item.type === "debian").map((item) => item.value),
        ],
      },
      {
        Target: "package-lock.json",
        Type: "node-pkg",
        Vulnerabilities: [
          vulnerability({ severity: "HIGH", id: "CVE-2026-2000", packageName: "example-high", version: "2.0.0", status: "fixed" }),
          ...extra.filter((item) => item.type === "node-pkg").map((item) => item.value),
        ],
      },
    ],
  };
}

test("accepts only a structured manifest containing three immutable IDs", () => {
  assert.equal(validateImageManifest(manifest), manifest);
  assert.throws(
    () => validateImageManifest({ ...manifest, images: { ...manifest.images, unexpected: image } }),
    /exactly the three verified images/,
  );
});

test("an exact accepted CRITICAL warns without blocking", () => {
  const result = evaluateContainerReport({ component: "backend", report: report(), baseline: validateContainerBaseline(baseline, "2026-09-20") });
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings[0], /ACCEPTED CRITICAL UNTIL/);
  assert.equal(result.findings.filter((item) => item.severity === "HIGH").length, 1);
  assert.ok(result.warnings.every((warning) => !warning.includes("HIGH")));
});

test("a new unfixed CRITICAL blocks", () => {
  const added = vulnerability({ severity: "CRITICAL", id: "CVE-2026-9999", packageName: "new-package", version: "9.9.9", status: "affected" });
  const result = evaluateContainerReport({ component: "backend", report: report([{ type: "debian", value: added }]), baseline });
  assert.match(result.errors.join("\n"), /UNAPPROVED CRITICAL.*CVE-2026-9999/);
});

for (const [field, value] of [
  ["id", "CVE-2026-9999"],
  ["package", "wrong-package"],
  ["installedVersion", "9.9.9"],
  ["type", "node-pkg"],
  ["status", "fixed"],
  ["debianRelease", "12.16"],
  ["architecture", "arm64"],
  ["images", ["frontend"]],
])
  test(`an accepted CVE with the wrong ${field} blocks`, () => {
    const changed = { ...criticalException, [field]: value };
    const reviewed = validateContainerBaseline({ ...baseline, criticalExceptions: [changed] }, "2026-09-20");
    const result = evaluateContainerReport({ component: "backend", report: report(), baseline: reviewed });
    assert.match(result.errors[0], /UNAPPROVED CRITICAL/);
  });

test("an expired container exception blocks before scanning", () => {
  assert.throws(
    () => validateContainerBaseline({ ...baseline, criticalExceptions: [{ ...criticalException, created: "2026-09-01", reviewDate: "2026-09-01", expires: "2026-09-19" }] }, "2026-09-20"),
    /expired/,
  );
});

test("an expired HIGH fingerprint baseline blocks before scanning", () => {
  assert.throws(
    () => validateContainerBaseline({
      ...baseline,
      highBaseline: {
        ...baseline.highBaseline,
        created: "2026-09-01",
        reviewDate: "2026-09-01",
        expires: "2026-09-19",
      },
    }, "2026-09-20"),
    /highBaseline expired/,
  );
});

test("a new HIGH fingerprint blocks", () => {
  const added = vulnerability({ severity: "HIGH", id: "CVE-2026-9998", packageName: "new-high", version: "1.0.0", status: "affected" });
  const result = evaluateContainerReport({ component: "backend", report: report([{ type: "node-pkg", value: added }]), baseline });
  assert.match(result.errors.join("\n"), /NEW HIGH.*CVE-2026-9998/);
});

test("Trivy and loaded publication image ID mismatches block", () => {
  assert.throws(() => validateTrivyReportIdentity({ ...report(), Metadata: { ...report().Metadata, ImageID: `sha256:${"d".repeat(64)}` } }, image, "backend"), /Trivy image ID mismatch/);
  assert.throws(
    () => validateLoadedImageIdentities(manifest, (reference) => reference.includes("backend:verified") ? `sha256:${"d".repeat(64)}` : manifest.images[reference.includes("backend-tools") ? "backend-tools" : "frontend"].id),
    /loaded publication image ID mismatch/,
  );
});

test("SBOM identity is bound and a mismatch or missing content blocks", () => {
  const source = { bomFormat: "CycloneDX", specVersion: "1.6", metadata: { component: { type: "container", name: "test" } }, components: [{ type: "library", name: "example" }] };
  const sbom = bindSbomIdentity(structuredClone(source), "backend", image);
  assert.doesNotThrow(() => validateSbomDocument(sbom, "backend", image));
  const wrong = structuredClone(sbom);
  wrong.metadata.component.properties.find((item) => item.name === "cyber-portfolio:image-id").value = `sha256:${"e".repeat(64)}`;
  assert.throws(() => validateSbomDocument(wrong, "backend", image), /SBOM image identity mismatch/);
  assert.throws(() => validateSbomDocument({ ...sbom, components: [] }, "backend", image), /empty SBOM/);
  assert.throws(() => validateSbomDocument({}, "backend", image), /unexpected SBOM format/);
});

test("a missing SBOM or Trivy report blocks the evidence set", () => {
  assert.throws(
    () => validateRequiredEvidence((path) => !path.endsWith("frontend.cdx.json"), "sboms", "trivy"),
    /frontend: missing SBOM/,
  );
  assert.throws(
    () => validateRequiredEvidence((path) => !path.endsWith("backend.json"), "sboms", "trivy"),
    /backend: missing Trivy report/,
  );
});
