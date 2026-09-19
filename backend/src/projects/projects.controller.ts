import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import type { Project, ProjectSummary } from "./project.model";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(): Promise<readonly ProjectSummary[]> {
    return this.projectsService.findAll();
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string): Promise<Project> {
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new BadRequestException("Invalid project slug");
    }

    return this.projectsService.findOne(slug);
  }
}
