import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const stateDir = join(root, ".ci-smoke");
const stateFile = join(stateDir, "state.json");
const envFile = join(stateDir, ".env");
const overrideFile = join(stateDir, "override.json");
const mode = process.argv[2] ?? "run";
assert.ok(["run", "cleanup"].includes(mode), "Use run or cleanup");
let project;
let config;
let cleanupStarted = false;

function redact(text) {
  return text
    .replaceAll(config?.POSTGRES_PASSWORD ?? "\0", "[redacted]")
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[database URL redacted]");
}

async function docker(args, { capture = false, input } = {}) {
  const env = {
    ...process.env,
    ...config,
    BUILDX_NO_DEFAULT_ATTESTATIONS: "1",
  };
  // Explicit files/project and generated values must win over local shell settings.
  for (const key of Object.keys(env))
    if (key.startsWith("COMPOSE_")) delete env[key];
  return new Promise((resolveCommand, reject) => {
    const child = spawn("docker", args, {
      cwd: root,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    for (const [stream, errorStream] of [
      [child.stdout, false],
      [child.stderr, true],
    ]) {
      const lines = createInterface({ input: stream });
      lines.on("line", (line) => {
        if (capture && !errorStream) output += `${line}\n`;
        else console.log(redact(line));
      });
    }
    child.on("error", () =>
      reject(new Error("Cannot start Docker; check Docker Desktop/Engine.")),
    );
    child.on("close", (code) =>
      code === 0
        ? resolveCommand(output.trim())
        : reject(new Error(`Docker ${args[0]} failed (exit ${code}).`)),
    );
    child.stdin.end(input);
  });
}

function compose(args, options) {
  return docker(
    [
      "compose",
      "--project-name",
      project,
      "--env-file",
      envFile,
      "-f",
      join(root, "compose.yaml"),
      "-f",
      overrideFile,
      ...args,
    ],
    options,
  );
}

function loadState() {
  ({ project } = JSON.parse(readFileSync(stateFile, "utf8")));
  assert.match(project, /^cyber-portfolio-ci-[a-f0-9]{16}$/);
  config = Object.fromEntries(
    readFileSync(envFile, "utf8")
      .trim()
      .split("\n")
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
  const target = new URL(config.DATABASE_URL);
  assert.equal(target.hostname, "database");
  assert.equal(target.port, "5432");
  assert.equal(target.pathname, "/cyber_portfolio");
}

async function verifyScope() {
  const rendered = JSON.parse(
    await compose(["config", "--format", "json"], { capture: true }),
  );
  assert.equal(rendered.name, project);
  assert.deepEqual(Object.keys(rendered.volumes), ["postgres_data"]);
  assert.equal(rendered.volumes.postgres_data.name, `${project}_postgres_data`);
  assert.ok(!rendered.volumes.postgres_data.external);
  assert.ok(
    !rendered.services.database.ports?.length,
    "Database must not publish a host port",
  );
  for (const service of Object.values(rendered.services)) {
    for (const mount of service.volumes ?? []) {
      assert.equal(mount.type, "volume");
      assert.equal(mount.source, "postgres_data");
    }
  }
  for (const network of Object.values(rendered.networks)) {
    assert.ok(!network.external);
    assert.ok(network.name.startsWith(`${project}_`));
  }
}

async function cleanup() {
  if (!existsSync(stateFile) || cleanupStarted) return;
  cleanupStarted = true;
  loadState();
  try {
    await verifyScope();
    await compose(["down", "--volumes", "--remove-orphans", "--timeout", "10"]);
    const volumes = await docker(
      [
        "volume",
        "ls",
        "--filter",
        `name=^${project}_postgres_data$`,
        "--format",
        "{{.Name}}",
      ],
      { capture: true },
    );
    assert.equal(volumes, "", "Smoke volume was not removed");
    console.log(`Cleaned isolated Compose project ${project}.`);
  } finally {
    // Fixed, script-owned workspace directory; never a user-supplied deletion path.
    rmSync(stateDir, { recursive: true, force: true });
  }
}

async function checkEndpoints() {
  const api = "http://127.0.0.1:13000/api";
  const frontend = "http://127.0.0.1:14200";
  async function get(url, type) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, `HTTP failure: ${url}`);
    assert.ok(response.headers.get("content-type")?.includes(type));
    return type === "application/json" ? response.json() : response.text();
  }
  assert.deepEqual(await get(`${api}/health`, "application/json"), {
    status: "ok",
  });
  const profile = await get(`${api}/profile`, "application/json");
  assert.equal(profile.name, "Alejandro Peña");
  assert.ok(profile.headline.includes("formación"));
  assert.ok(profile.introduction.includes("Ingeniería Informática"));
  const projects = await get(`${api}/projects`, "application/json");
  assert.equal(projects.length, 4);
  const details = await Promise.all(
    projects.map((project) =>
      get(`${api}/projects/${project.slug}`, "application/json"),
    ),
  );
  const text = JSON.stringify({ profile, projects, details });
  assert.ok(
    !/[\uFFFD\u00C3\u00C2]|[\p{L}]\?[\p{L}]/u.test(text),
    "Corrupted public API text",
  );
  for (const letter of "ñáéíóú")
    assert.ok(text.includes(letter), `Missing Unicode character ${letter}`);
  for (const [path, expected] of [
    ["/", "Ingeniería Informática"],
    ["/about", "Tecnologías Informáticas"],
    ["/projects", "Despliegue académico"],
    ["/projects/bunkerweb-waf", "Protección de WordPress con BunkerWeb WAF"],
  ]) {
    const html = await get(`${frontend}${path}`, "text/html");
    const visible = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    assert.ok(visible.includes(expected), `SSR content missing: ${path}`);
    assert.ok(
      !/[\uFFFD\u00C3\u00C2]|[\p{L}]\?[\p{L}]/u.test(visible),
      `Corrupted SSR: ${path}`,
    );
  }
  console.log(
    "HTTP smoke passed: health, profile, four project details, four SSR pages and UTF-8.",
  );
}

async function run() {
  assert.ok(
    !existsSync(stateDir),
    "Existing .ci-smoke state: run cleanup before another smoke test.",
  );
  project = `cyber-portfolio-ci-${randomBytes(8).toString("hex")}`;
  const password = randomBytes(24).toString("hex");
  config = {
    POSTGRES_DB: "cyber_portfolio",
    POSTGRES_USER: "portfolio_ci",
    POSTGRES_PASSWORD: password,
    DATABASE_URL: `postgresql://portfolio_ci:${password}@database:5432/cyber_portfolio`,
    BACKEND_PORT: "127.0.0.1:13000",
    FRONTEND_PORT: "127.0.0.1:14200",
    BROWSER_API_BASE_URL: "http://127.0.0.1:13000/api",
    FRONTEND_ORIGIN: "http://127.0.0.1:14200",
    SESSION_COOKIE_SECURE: "false",
    SESSION_TTL_HOURS: "8",
  };
  mkdirSync(stateDir, { mode: 0o700 });
  const images = Object.fromEntries(
    ["backend", "backend-tools", "frontend"].map((name) => [
      name,
      `${project}/${name}:verified`,
    ]),
  );
  writeFileSync(
    envFile,
    Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n") + "\n",
    { mode: 0o600 },
  );
  writeFileSync(
    overrideFile,
    JSON.stringify({
      services: {
        backend: { image: images.backend },
        frontend: { image: images.frontend },
        migrate: { image: images["backend-tools"] },
        seed: { image: images["backend-tools"] },
        "admin-create": { image: images["backend-tools"] },
      },
    }),
  );
  writeFileSync(stateFile, JSON.stringify({ project }));
  try {
    await verifyScope();
    assert.equal(
      await docker(
        [
          "volume",
          "ls",
          "--filter",
          `name=^${project}_postgres_data$`,
          "--format",
          "{{.Name}}",
        ],
        { capture: true },
      ),
      "",
    );
    console.log(`Building real Dockerfiles for disposable project ${project}.`);
    await compose(["build", "backend", "migrate", "frontend"]);
    await compose([
      "up",
      "-d",
      "--no-build",
      "--wait",
      "--wait-timeout",
      "180",
    ]);
    await compose(["ps", "-a"]);
    for (const service of [
      "database",
      "migrate",
      "seed",
      "backend",
      "frontend",
    ]) {
      const id = await compose(["ps", "-a", "-q", service], { capture: true });
      assert.ok(id, `Missing ${service} container`);
      const state = JSON.parse(
        await docker(["inspect", "--format", "{{json .State}}", id], {
          capture: true,
        }),
      );
      if (["migrate", "seed"].includes(service)) {
        assert.equal(state.Status, "exited");
        assert.equal(state.ExitCode, 0);
      } else assert.equal(state.Health?.Status, "healthy", `${service} health`);
    }
    const seedLog = await compose(["logs", "--no-color", "seed"], {
      capture: true,
    });
    assert.ok(
      seedLog.includes("Public content seeded."),
      "Fresh seed must run, not skip",
    );
    const sql = `SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL;
SELECT count(*) FROM "AdminUser";
SHOW server_encoding;
SHOW client_encoding;
SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname = current_database();`;
    const rows = await compose(
      [
        "exec",
        "-T",
        "database",
        "psql",
        "-U",
        config.POSTGRES_USER,
        "-d",
        config.POSTGRES_DB,
        "-X",
        "-A",
        "-t",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      { capture: true, input: sql },
    );
    assert.deepEqual(rows.split(/\r?\n/), ["2", "0", "UTF8", "UTF8", "UTF8"]);
    await checkEndpoints();
    const output = join(root, ".ci-images");
    mkdirSync(output, { recursive: true });
    const verifiedImages = {};
    for (const [component, reference] of Object.entries(images)) {
      const inspected = JSON.parse(
        await docker(
          ["image", "inspect", "--format", "{{json .}}", reference],
          { capture: true },
        ),
      );
      assert.match(inspected.Id, /^sha256:[a-f0-9]{64}$/);
      assert.equal(inspected.Os, "linux");
      verifiedImages[component] = {
        reference,
        id: inspected.Id,
        os: inspected.Os,
        architecture: inspected.Architecture,
      };
    }
    writeFileSync(
      join(output, "images.json"),
      `${JSON.stringify({ schemaVersion: 1, images: verifiedImages }, null, 2)}\n`,
    );
    console.log("Recorded immutable IDs for the three smoke-tested images.");
  } catch (error) {
    console.error(redact(error.message));
    for (const args of [
      ["ps", "-a"],
      ["logs", "--no-color", "--tail", "150"],
    ]) {
      try {
        await compose(args);
      } catch {
        console.error("Unable to collect Compose diagnostics.");
      }
    }
    throw new Error("Compose smoke failed; see redacted diagnostics above.");
  } finally {
    await cleanup();
  }
}

try {
  if (mode === "cleanup") await cleanup();
  else await run();
} catch (error) {
  console.error(redact(error.message));
  process.exitCode = 1;
}
