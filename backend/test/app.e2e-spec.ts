import { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { seedContent } from "../prisma/seed-content";
import { projects } from "../prisma/seed-data/projects";
import { publicProfile } from "../prisma/seed-data/profile";
import * as argon2 from "argon2";
import { createHash } from "node:crypto";

const testAdminEmail = "phase5-admin@example.invalid";
const testAdminPassword = "Correct-Test-Password-Only-42";

describe("Public portfolio API", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const target = new URL(
      process.env["DATABASE_URL"] ?? "postgresql://invalid/invalid",
    );
    if (
      process.env["NODE_ENV"] !== "test" ||
      process.env["DATABASE_URL"] !== process.env["TEST_DATABASE_URL"] ||
      !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
      target.pathname !== "/cyber_portfolio_test" ||
      [...target.searchParams].some(
        ([key, value]) => key !== "schema" || value !== "public",
      ) ||
      target.hash
    ) {
      throw new Error("Run npm test with a dedicated local TEST_DATABASE_URL.");
    }
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(nestApp);
    app = nestApp;
    await app.init();
    prisma = app.get(PrismaService);
    await seedContent(prisma);
    await prisma.adminUser.deleteMany({ where: { email: testAdminEmail } });
    await prisma.adminUser.create({
      data: {
        email: testAdminEmail,
        passwordHash: await argon2.hash(testAdminPassword, {
          type: argon2.argon2id,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        }),
      },
    });
  }, 30000);

  afterAll(async () => {
    await prisma?.adminUser.deleteMany({ where: { email: testAdminEmail } });
    await app?.close();
  });

  async function login() {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "http://localhost:4200")
      .send({ email: testAdminEmail, password: testAdminPassword })
      .expect(201);
    expect(response.headers["cache-control"]).toBe("private, no-store");
    const setCookies = response.headers["set-cookie"] as unknown as string[];
    const cookie = setCookies.map((value) => value.split(";", 1)[0]).join("; ");
    const csrf = /XSRF-TOKEN=([^;]+)/.exec(cookie)?.[1];
    if (!csrf) throw new Error("Login did not return a CSRF cookie.");
    return { response, cookie, csrf: decodeURIComponent(csrf) };
  }

  it("GET /api/health returns a minimal health response", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/health")
      .set("Origin", "http://localhost:4200")
      .expect(200)
      .expect({ status: "ok" });

    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:4200",
    );
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("GET /api/projects returns the four public project summaries", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/projects")
      .expect(200);

    expect(response.body).toHaveLength(4);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        slug: "bunkerweb-waf",
        cardTitle: "BunkerWeb WAF",
        category: "Cybersecurity",
      }),
    );
    expect(response.body[0]).not.toHaveProperty("confirmedResults");
  });

  it("GET /api/projects/:slug returns full public project content", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/projects/mobile-security-mobsf-mstg")
      .expect(200);

    expect(response.body.title).toBe(
      "Análisis de InsecureBankv2 con MobSF y OWASP MSTG",
    );
    expect(response.body.confirmedResults).toContain(
      "MobSF mostró 4 de 10 activities como exportadas.",
    );
  });

  it("GET /api/projects/:slug returns 404 for an unknown project", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/projects/unknown-project")
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: "Project not found",
      }),
    );
    expect(response.body).not.toHaveProperty("stack");
  });

  it("GET /api/profile returns only confirmed public profile information", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/profile")
      .expect(200);

    expect(response.body.name).toBe("Alejandro Peña");
    expect(response.body.experience[0]).toEqual(
      expect.objectContaining({
        organization: "Cibernos",
        context: "Prestando servicio para Ericsson",
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain(
      "Máster en Ciberseguridad",
    );
  });

  it("preserves every Phase 3 response field, optional section and ordering", async () => {
    const summaries = projects.map(
      ({
        slug,
        cardTitle,
        title,
        category,
        type,
        status,
        summary,
        technologies,
      }) => ({
        slug,
        cardTitle,
        title,
        category,
        type,
        status,
        summary,
        technologies,
      }),
    );
    await request(app.getHttpServer())
      .get("/api/projects")
      .expect(200)
      .expect(summaries);
    for (const project of projects) {
      await request(app.getHttpServer())
        .get(`/api/projects/${project.slug}`)
        .expect(200)
        .expect(JSON.parse(JSON.stringify(project)));
    }
    await request(app.getHttpServer())
      .get("/api/profile")
      .expect(200)
      .expect(JSON.parse(JSON.stringify(publicProfile)));
  });

  it("rejects malformed slugs with the existing 400 response", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/projects/Invalid_slug")
      .expect(400);
    expect(response.body.message).toBe("Invalid project slug");
  });

  it("reads database changes and hides unpublished projects from list and detail", async () => {
    const slug = projects[0]!.slug;
    try {
      await prisma.project.update({
        where: { slug },
        data: { summary: "Database-backed test content", sortOrder: 99 },
      });
      const list = await request(app.getHttpServer())
        .get("/api/projects")
        .expect(200);
      expect(list.body.at(-1).summary).toBe("Database-backed test content");
      await prisma.project.update({
        where: { slug },
        data: { published: false },
      });
      const hidden = await request(app.getHttpServer())
        .get("/api/projects")
        .expect(200);
      expect(
        hidden.body.map((item: { slug: string }) => item.slug),
      ).not.toContain(slug);
      await request(app.getHttpServer())
        .get(`/api/projects/${slug}`)
        .expect(404);
    } finally {
      await prisma.project.update({
        where: { slug },
        data: { summary: projects[0]!.summary, sortOrder: 0, published: true },
      });
    }
  });

  it("enforces relation uniqueness and reruns the seed without duplicate rows", async () => {
    const link = await prisma.projectTechnology.findFirstOrThrow();
    await expect(
      prisma.projectTechnology.create({ data: link }),
    ).rejects.toMatchObject({ code: "P2002" });
    const counts = async () =>
      Promise.all([
        prisma.project.count(),
        prisma.technology.count(),
        prisma.projectTechnology.count(),
        prisma.projectSectionItem.count(),
        prisma.projectRoadmapItem.count(),
        prisma.profile.count(),
        prisma.experience.count(),
        prisma.education.count(),
        prisma.skill.count(),
      ]);
    const before = await counts();
    await seedContent(prisma);
    expect(await counts()).toEqual(before);
  }, 30000);

  it("uses generic failures for invalid and unknown login credentials", async () => {
    const invalid = await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "http://localhost:4200")
      .send({ email: testAdminEmail, password: "wrong-password" })
      .expect(401);
    const unknown = await request(app.getHttpServer())
      .post("/api/auth/login")
      .set("Origin", "http://localhost:4200")
      .send({ email: "unknown@example.invalid", password: "wrong-password" })
      .expect(401);
    expect(invalid.body).toEqual(unknown.body);
    expect(invalid.body.message).toBe("Invalid credentials");
  });

  it("creates an HttpOnly session cookie and authenticates GET /api/auth/me", async () => {
    const { response, cookie } = await login();
    const headers = response.headers["set-cookie"] as unknown as string[];
    expect(
      headers.some((value) =>
        /portfolio_admin_session=.*HttpOnly.*SameSite=Strict/i.test(value),
      ),
    ).toBe(true);
    expect(response.body.user).toEqual({
      id: expect.any(Number),
      email: testAdminEmail,
      role: "ADMIN",
    });
    const me = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", cookie)
      .expect(200);
    expect(me.headers["cache-control"]).toBe("private, no-store");
    expect(me.body.user).toEqual(
      expect.objectContaining({ email: testAdminEmail, role: "ADMIN" }),
    );
    expect(JSON.stringify(me.body)).not.toContain("passwordHash");
  });

  it("rejects unauthenticated auth and admin requests", async () => {
    await request(app.getHttpServer()).get("/api/auth/me").expect(401);
    await request(app.getHttpServer()).get("/api/admin/projects").expect(401);
  });

  it("allows authenticated reads and rejects missing or invalid CSRF tokens", async () => {
    const { cookie, csrf } = await login();
    const list = await request(app.getHttpServer())
      .get("/api/admin/projects")
      .set("Cookie", cookie)
      .expect(200);
    expect(list.headers["cache-control"]).toBe("private, no-store");
    const project = list.body[0];
    await request(app.getHttpServer())
      .patch(`/api/admin/projects/${project.id}`)
      .set("Origin", "http://localhost:4200")
      .set("Cookie", cookie)
      .send(project)
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/admin/projects/${project.id}`)
      .set("Origin", "http://localhost:4200")
      .set("Cookie", cookie)
      .set("X-XSRF-TOKEN", `${csrf}-invalid`)
      .send(project)
      .expect(403);
  });

  it("updates a project transactionally and preserves public publication behavior", async () => {
    const { cookie, csrf } = await login();
    const list = await request(app.getHttpServer())
      .get("/api/admin/projects")
      .set("Cookie", cookie)
      .expect(200);
    const project = list.body[0];
    try {
      const changed = {
        ...project,
        summary: "Phase 5 administered summary",
        published: true,
      };
      await request(app.getHttpServer())
        .patch(`/api/admin/projects/${project.id}`)
        .set("Origin", "http://localhost:4200")
        .set("Cookie", cookie)
        .set("X-XSRF-TOKEN", csrf)
        .send(changed)
        .expect(200);
      const detail = await request(app.getHttpServer())
        .get(`/api/projects/${project.slug}`)
        .expect(200);
      expect(detail.body.summary).toBe("Phase 5 administered summary");
      await request(app.getHttpServer())
        .patch(`/api/admin/projects/${project.id}`)
        .set("Origin", "http://localhost:4200")
        .set("Cookie", cookie)
        .set("X-XSRF-TOKEN", csrf)
        .send({ ...changed, published: false })
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/projects/${project.slug}`)
        .expect(404);
    } finally {
      await seedContent(prisma);
    }
  }, 30000);

  it("updates the profile aggregate through the protected API", async () => {
    const { cookie, csrf } = await login();
    const current = await request(app.getHttpServer())
      .get("/api/admin/profile")
      .set("Cookie", cookie)
      .expect(200);
    try {
      await request(app.getHttpServer())
        .put("/api/admin/profile")
        .set("Origin", "http://localhost:4200")
        .set("Cookie", cookie)
        .set("X-XSRF-TOKEN", csrf)
        .send({ ...current.body, headline: "Phase 5 test headline" })
        .expect(200);
      const publicResponse = await request(app.getHttpServer())
        .get("/api/profile")
        .expect(200);
      expect(publicResponse.body.headline).toBe("Phase 5 test headline");
    } finally {
      await seedContent(prisma);
    }
  });

  it("does not authenticate expired sessions", async () => {
    const { cookie } = await login();
    const raw = /portfolio_admin_session=([^;]+)/.exec(cookie)?.[1];
    if (!raw) throw new Error("Missing session cookie");
    const tokenHash = createHash("sha256")
      .update(decodeURIComponent(raw))
      .digest("hex");
    await prisma.adminSession.update({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", cookie)
      .expect(401);
  });

  it("logout revokes the current session and is safe without a session", async () => {
    const { cookie, csrf } = await login();
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Origin", "http://localhost:4200")
      .set("Cookie", cookie)
      .set("X-XSRF-TOKEN", csrf)
      .expect(201);
    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", cookie)
      .expect(401);
    await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Origin", "http://localhost:4200")
      .expect(201);
  });
});
