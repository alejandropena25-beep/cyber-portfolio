import type { NestExpressApplication } from "@nestjs/platform-express";
import { authConfig } from "./auth/auth.config";

export function configureApp(app: NestExpressApplication): void {
  const config = authConfig();
  app.setGlobalPrefix("api");
  app.disable("x-powered-by");
  app.enableCors({
    origin: config.frontendOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "X-XSRF-TOKEN"],
  });
}
