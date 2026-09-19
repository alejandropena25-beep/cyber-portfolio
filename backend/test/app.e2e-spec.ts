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
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

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
});
