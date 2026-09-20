import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ProfileModule } from "./profile/profile.module";
import { ProjectsModule } from "./projects/projects.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    HealthModule,
    ProfileModule,
    ProjectsModule,
    AuthModule,
    AdminModule,
  ],
})
export class AppModule {}
