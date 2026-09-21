import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAudit, runAudit, validateBaseline } from "./security-audit.mjs";

const exception = {
  project: "backend",
  advisory: "GHSA-aaaa-bbbb-cccc",
  package: "example-package",
  version: "1.2.3",
  nodePath: "node_modules/example-package",
  severity: "high",
  status: "accepted-temporary",
  owner: "security owner",
  created: "2026-09-01",
  expires: "2026-10-20",
  rationale: "Synthetic reviewed finding used only to test policy behavior.",
  remediation: "Upgrade the synthetic package and remove this exception.",
};

function report(severity = "high") {
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      "example-package": {
        name: "example-package",
        severity,
        isDirect: false,
        via: [
          {
            source: 1,
            name: "example-package",
            dependency: "example-package",
            title: "Synthetic advisory",
            url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
            severity,
            range: "<2.0.0",
          },
        ],
        effects: [],
        range: "<2.0.0",
        nodes: ["node_modules/example-package"],
        fixAvailable: true,
      },
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: severity === "high" ? 1 : 0,
        critical: severity === "critical" ? 1 : 0,
        total: 1,
      },
    },
  };
}

const lockfile = {
  packages: {
    "node_modules/example-package": { version: "1.2.3" },
    "node_modules/wrapper-package": { version: "4.5.6" },
    "node_modules/unrelated-package": { version: "7.8.9" },
  },
};

test("an exact reviewed advisory warns without blocking", () => {
  const exceptions = validateBaseline(
    { schemaVersion: 1, exceptions: [exception] },
    "2026-09-20",
  );
  const result = evaluateAudit({
    project: "backend",
    report: report(),
    lockfile,
    exceptions,
  });
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings[0], /ACCEPTED UNTIL 2026-10-20/);
});

test("a new unapproved high advisory blocks", () => {
  const result = evaluateAudit({
    project: "backend",
    report: report(),
    lockfile,
    exceptions: [],
  });
  assert.match(result.errors[0], /UNAPPROVED HIGH/);
});

test("critical findings block even if an exception is supplied", () => {
  const result = evaluateAudit({
    project: "backend",
    report: report("critical"),
    lockfile,
    exceptions: [{ ...exception, severity: "critical" }],
  });
  assert.match(result.errors[0], /CRITICAL/);
});

test("expired exceptions make the policy invalid", () => {
  assert.throws(
    () =>
      validateBaseline(
        {
          schemaVersion: 1,
          exceptions: [{ ...exception, expires: "2026-09-19" }],
        },
        "2026-09-20",
      ),
    /expired/,
  );
});

test("malformed exceptions make the policy invalid", () => {
  const malformed = { ...exception };
  delete malformed.remediation;
  assert.throws(
    () => validateBaseline({ schemaVersion: 1, exceptions: [malformed] }),
    /remediation/,
  );
});

test("duplicate exceptions make the policy invalid", () => {
  assert.throws(
    () =>
      validateBaseline({
        schemaVersion: 1,
        exceptions: [exception, { ...exception }],
      }),
    /duplicates another exception/,
  );
});

test("a string-valued transitive via edge resolves to the accepted advisory", () => {
  const transitive = report();
  transitive.vulnerabilities["wrapper-package"] = {
    name: "wrapper-package",
    severity: "high",
    isDirect: true,
    via: ["example-package"],
    effects: [],
    range: "*",
    nodes: ["node_modules/wrapper-package"],
    fixAvailable: true,
  };
  transitive.metadata.vulnerabilities.high = 2;
  transitive.metadata.vulnerabilities.total = 2;
  const result = evaluateAudit({
    project: "backend",
    report: transitive,
    lockfile,
    exceptions: validateBaseline(
      { schemaVersion: 1, exceptions: [exception] },
      "2026-09-20",
    ),
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.findings.length, 1);
});

test("an accepted advisory cannot hide an unrelated HIGH", () => {
  const mixed = report();
  mixed.vulnerabilities["unrelated-package"] = {
    name: "unrelated-package",
    severity: "high",
    isDirect: false,
    via: [
      {
        source: 2,
        name: "unrelated-package",
        dependency: "unrelated-package",
        title: "Unrelated advisory",
        url: "https://github.com/advisories/GHSA-dddd-eeee-ffff",
        severity: "high",
        range: "<8.0.0",
      },
    ],
    effects: [],
    range: "<8.0.0",
    nodes: ["node_modules/unrelated-package"],
    fixAvailable: true,
  };
  mixed.metadata.vulnerabilities.high = 2;
  mixed.metadata.vulnerabilities.total = 2;
  const result = evaluateAudit({
    project: "backend",
    report: mixed,
    lockfile,
    exceptions: validateBaseline(
      { schemaVersion: 1, exceptions: [exception] },
      "2026-09-20",
    ),
  });
  assert.match(result.errors.join("\n"), /GHSA-DDDD-EEEE-FFFF/);
});

test("a new transitive HIGH with a string via edge blocks", () => {
  const transitive = report();
  transitive.vulnerabilities["unrelated-package"] = {
    name: "unrelated-package",
    severity: "high",
    isDirect: true,
    via: ["new-transitive-package"],
    effects: [],
    range: "*",
    nodes: ["node_modules/unrelated-package"],
    fixAvailable: true,
  };
  transitive.vulnerabilities["new-transitive-package"] = {
    name: "new-transitive-package",
    severity: "high",
    isDirect: false,
    via: [{
      source: 2,
      name: "new-transitive-package",
      dependency: "new-transitive-package",
      title: "New transitive advisory",
      url: "https://github.com/advisories/GHSA-dddd-eeee-ffff",
      severity: "high",
      range: "<2.0.0",
    }],
    effects: ["unrelated-package"],
    range: "<2.0.0",
    nodes: ["node_modules/new-transitive-package"],
    fixAvailable: true,
  };
  transitive.metadata.vulnerabilities.high = 3;
  transitive.metadata.vulnerabilities.total = 3;
  const result = evaluateAudit({
    project: "backend",
    report: transitive,
    lockfile: {
      packages: {
        ...lockfile.packages,
        "node_modules/new-transitive-package": { version: "1.2.3" },
      },
    },
    exceptions: validateBaseline({ schemaVersion: 1, exceptions: [exception] }, "2026-09-20"),
  });
  assert.match(result.errors.join("\n"), /UNAPPROVED HIGH.*GHSA-DDDD-EEEE-FFFF/);
});

test("metadata count inconsistencies fail closed", () => {
  const inconsistent = report();
  inconsistent.metadata.vulnerabilities.high = 2;
  inconsistent.metadata.vulnerabilities.total = 2;
  assert.throws(
    () =>
      evaluateAudit({
        project: "backend",
        report: inconsistent,
        lockfile,
        exceptions: [],
      }),
    /metadata count/,
  );
});

test("a missing string-valued via target fails closed", () => {
  const broken = report();
  broken.vulnerabilities["example-package"].via = ["missing-package"];
  assert.throws(
    () =>
      evaluateAudit({
        project: "backend",
        report: broken,
        lockfile,
        exceptions: [],
      }),
    /references missing package/,
  );
});

function auditResponse(body, status = 1) {
  return { status, stdout: JSON.stringify(body), stderr: "" };
}

test("transient audit failure retries and the recovered findings are evaluated", () => {
  const attempts = [];
  const delays = [];
  const responses = [
    auditResponse({ error: { code: "ECONNRESET", summary: "read ECONNRESET" } }),
    auditResponse(report()),
  ];
  const recovered = runAudit("backend", {
    execute: () => {
      attempts.push(1);
      return responses.shift();
    },
    wait: (delay) => delays.push(delay),
  });
  assert.equal(attempts.length, 2);
  assert.deepEqual(delays, [250]);
  const result = evaluateAudit({ project: "backend", report: recovered, lockfile, exceptions: [] });
  assert.match(result.errors[0], /UNAPPROVED HIGH/);
});

test("persistent transient audit failure blocks after three attempts", () => {
  let attempts = 0;
  assert.throws(
    () => runAudit("backend", {
      execute: () => {
        attempts++;
        return auditResponse({ error: { code: "ETIMEDOUT" } });
      },
      wait: () => {},
    }),
    /ETIMEDOUT after 3 attempts/,
  );
  assert.equal(attempts, 3);
});

test("a transport error reported only on stderr also retries", () => {
  let attempts = 0;
  const valid = runAudit("backend", {
    execute: () => {
      attempts++;
      return attempts === 1
        ? { status: 1, stdout: "", stderr: "npm audit request failed: read ECONNRESET\n" }
        : auditResponse(report());
    },
    wait: () => {},
  });
  assert.equal(attempts, 2);
  assert.equal(valid.auditReportVersion, 2);
});

test("valid audit with a new high finding is evaluated without retry", () => {
  let attempts = 0;
  const valid = runAudit("backend", {
    execute: () => {
      attempts++;
      return auditResponse(report());
    },
    wait: () => assert.fail("A valid audit must not retry"),
  });
  assert.equal(attempts, 1);
  assert.match(
    evaluateAudit({ project: "backend", report: valid, lockfile, exceptions: [] }).errors[0],
    /UNAPPROVED HIGH/,
  );
});

test("malformed non-network audit output fails without retry", () => {
  let attempts = 0;
  assert.throws(
    () => runAudit("backend", {
      execute: () => {
        attempts++;
        return { status: 1, stdout: "{not json", stderr: "" };
      },
      wait: () => assert.fail("Malformed data must not retry"),
    }),
    SyntaxError,
  );
  assert.equal(attempts, 1);
});
