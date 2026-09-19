import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ProfileModule } from "./profile/profile.module";
import { ProjectsModule } from "./projects/projects.module";

@Module({
  imports: [HealthModule, ProfileModule, ProjectsModule],
})
export class AppModule {}
