import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const workflowDirectory = resolve(".github/workflows");
const workflowPaths = readdirSync(workflowDirectory)
  .filter((name) => /\.ya?ml$/i.test(name))
  .sort()
  .map((name) => join(workflowDirectory, name));
const workflows = new Map(
  workflowPaths.map((path) => [path, readFileSync(path, "utf8")]),
);
const ci = workflows.get(join(workflowDirectory, "ci.yml"));
const scheduled = workflows.get(
  join(workflowDirectory, "security-scheduled.yml"),
);

function localActionExists(workflowPath, reference) {
  const actionPath = resolve(reference);
  return ["action.yml", "action.yaml", "Dockerfile"].some((name) =>
    existsSync(join(actionPath, name)),
  );
}

export function validateActionReferences(entries, localExists = localActionExists) {
  const references = [];
  for (const [workflowPath, source] of entries) {
    for (const [index, line] of source.split(/\r?\n/).entries()) {
      const match = line.match(/^\s*(?:-\s*)?uses:\s*([^\s#]+)/);
      if (!match) continue;
      const reference = match[1].replace(/^['"]|['"]$/g, "");
      references.push({ workflowPath, line: index + 1, reference });
      if (reference.startsWith("./")) {
        assert.ok(
          localExists(workflowPath, reference),
          `${workflowPath}:${index + 1}: missing repository-local action ${reference}`,
        );
      } else if (reference.startsWith("docker://")) {
        assert.match(
          reference,
          /^docker:\/\/[^\s@]+@sha256:[a-f0-9]{64}$/,
          `${workflowPath}:${index + 1}: Docker action must use an image digest`,
        );
      } else {
        const separator = reference.lastIndexOf("@");
        assert.ok(separator > 0, `${workflowPath}:${index + 1}: action is unpinned`);
        assert.match(
          reference.slice(separator + 1),
          /^[a-f0-9]{40}$/,
          `${workflowPath}:${index + 1}: action must use a full commit SHA`,
        );
      }
    }
  }
  assert.ok(references.length > 0, "no workflow action references found");
  return references;
}

test("every uses entry in every workflow is immutable", () => {
  assert.ok(workflows.size >= 2);
  const references = validateActionReferences(workflows);
  console.log(
    `Validated ${references.length} uses references across ${workflows.size} workflows.`,
  );
});

test("an unpinned list-style action reference fails", () => {
  assert.throws(
    () =>
      validateActionReferences(
        new Map([["synthetic.yml", "steps:\n  - uses: owner/action@v4\n"]]),
      ),
    /full commit SHA/,
  );
});

test("digest-pinned Docker and existing repository-local actions are supported", () => {
  const digest = "a".repeat(64);
  const references = validateActionReferences(
    new Map([
      [
        "synthetic.yml",
        `steps:\n  - uses: docker://example/tool@sha256:${digest}\n  - uses: ./.github/actions/local\n`,
      ],
    ]),
    () => true,
  );
  assert.equal(references.length, 2);
});

test("publication requires every main-push execution gate and verifies loaded IDs", () => {
  const publish = ci.slice(ci.indexOf("  publish-images:"));
  const needs = publish.slice(
    publish.indexOf("    needs:"),
    publish.indexOf("    if:"),
  );
  for (const job of [
    "quality",
    "secret-scan",
    "dependency-security",
    "codeql",
    "backend-ci",
    "frontend-ci",
    "docker-smoke",
  ]) assert.ok(needs.includes(job), `publish-images does not require ${job}`);
  assert.match(
    publish,
    /if: github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/,
  );
  assert.match(publish, /container-security\.mjs verify-loaded/);
});

test("pull requests validate dependencies but cannot publish", () => {
  assert.match(ci, /dependency-review:[\s\S]*if: github\.event_name == 'pull_request'/);
  assert.doesNotMatch(ci, /pull_request_target/);
  const publish = ci.slice(ci.indexOf("  publish-images:"));
  assert.match(publish, /github\.event_name == 'push'/);
});

test("scheduled security uses the shared policy and never publishes or deploys", () => {
  assert.match(scheduled, /^\s*schedule:/m);
  assert.match(scheduled, /container-security\.mjs published/);
  assert.doesNotMatch(scheduled, /docker push|packages:\s*write|kubectl|helm/i);
  assert.doesNotMatch(scheduled, /--ignore-unfixed/);
});

test("normal CI contains no broad unfixed vulnerability bypass", () => {
  assert.doesNotMatch(ci, /--ignore-unfixed/);
});

test("CodeQL write permission remains job-scoped", () => {
  for (const source of [ci, scheduled]) {
    assert.match(source, /^permissions:\n  contents: read$/m);
    assert.equal(
      [...source.matchAll(/^\s{6}security-events: write$/gm)].length,
      1,
      "each workflow must grant security-events: write only to its CodeQL job",
    );
    const codeql = source.slice(source.indexOf("  codeql:"));
    assert.match(
      codeql,
      /^\s{4}permissions:\n\s{6}contents: read\n\s{6}security-events: write$/m,
    );
  }
});

test("Gitleaks cannot publish raw finding artifacts, comments or summaries", () => {
  for (const source of [ci, scheduled]) {
    const gitleaks = source.slice(source.indexOf("uses: gitleaks/gitleaks-action@"));
    for (const setting of [
      "GITLEAKS_ENABLE_COMMENTS",
      "GITLEAKS_ENABLE_UPLOAD_ARTIFACT",
      "GITLEAKS_ENABLE_SUMMARY",
    ]) assert.match(gitleaks, new RegExp(`${setting}: [\"']false[\"']`));
  }
  const secretScan = ci.slice(ci.indexOf("  secret-scan:"), ci.indexOf("  dependency-security:"));
  assert.match(secretScan, /fetch-depth: 0/);
  assert.match(secretScan, /pull-requests: read/);
  assert.match(secretScan, /GITLEAKS_VERSION: "8\.24\.3"/);
  assert.match(secretScan, /run: gitleaks git --redact --no-banner --no-color \./);
});
