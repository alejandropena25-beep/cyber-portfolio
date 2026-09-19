import { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";

describe("Public portfolio API", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nestApp = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(nestApp);
    app = nestApp;
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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
});
