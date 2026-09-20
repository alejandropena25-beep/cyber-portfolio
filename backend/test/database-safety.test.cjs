const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

// Execute the real launcher with subprocesses stubbed: no network or DB access.
const source = readFileSync(`${__dirname}/run-e2e.cjs`, "utf8");
function launch(env) {
  const calls = [];
  const errors = [];
  const exit = {};
  let status = 0;
  try {
    runInNewContext(source, {
      URL,
      require(name) {
        if (name === "node:fs") return { existsSync: () => false };
        if (name === "node:child_process")
          return {
            spawnSync: (_executable, args, options) => {
              calls.push({ args: Array.from(args), env: { ...options.env } });
              return { status: 0 };
            },
          };
        throw new Error("Unexpected dependency");
      },
      process: {
        env: { ...env },
        execPath: process.execPath,
        exit(code) {
          status = code;
          throw exit;
        },
      },
      console: { error: (message) => errors.push(message) },
    });
  } catch (error) {
    if (error !== exit) throw error;
  }
  return { calls, errors, status };
}

const base =
  "postgresql://test:disposable-only@127.0.0.1:55432/cyber_portfolio_test";
const rejected = [
  undefined,
  "not-a-url",
  base.replace(":55432", ":5432"),
  base.replace(":55432", ""),
  base.replace(":55432", ":55433"),
  base.replace("127.0.0.1", "host.docker.internal"),
  base.replace("127.0.0.1", "database"),
  base.replace("127.0.0.1", "db.example.org"),
  base.replace("cyber_portfolio_test", "cyber_portfolio"),
  base.replace("postgresql:", "https:"),
  `${base}?schema=private`,
  `${base}?host=production`,
  `${base}?schema=public&options=unsafe`,
  `${base}#fragment`,
];
for (const [index, value] of rejected.entries()) {
  test(`rejects unsafe target ${index + 1} before any subprocess`, () => {
    const result = launch({ TEST_DATABASE_URL: value });
    assert.equal(result.status, 1);
    assert.equal(result.calls.length, 0);
    assert.equal(result.errors.length, 1);
    assert.ok(!result.errors[0].includes("disposable-only"));
  });
}
test("rejects an overlapping development database", () => {
  const result = launch({ TEST_DATABASE_URL: base, DATABASE_URL: base });
  assert.equal(result.status, 1);
  assert.equal(result.calls.length, 0);
});
for (const host of ["127.0.0.1", "localhost", "[::1]"]) {
  test(`accepts ${host}:55432 and forces the verified URL into every child`, () => {
    const url = base.replace("127.0.0.1", host) + "?schema=public";
    const result = launch({ TEST_DATABASE_URL: url });
    assert.equal(result.status, 0);
    assert.equal(result.calls.length, 3);
    assert.deepEqual(result.calls[1].args.slice(-2), ["migrate", "deploy"]);
    for (const call of result.calls) {
      assert.equal(call.env.DATABASE_URL, url);
      assert.equal(call.env.NODE_ENV, "test");
    }
  });
}
