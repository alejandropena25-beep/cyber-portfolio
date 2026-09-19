import type { NestExpressApplication } from "@nestjs/platform-express";

export function configureApp(app: NestExpressApplication): void {
  app.setGlobalPrefix("api");
  app.disable("x-powered-by");
  app.enableCors({
    origin: "http://localhost:4200",
    methods: ["GET", "OPTIONS"],
  });
}
