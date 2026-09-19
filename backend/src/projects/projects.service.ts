import { Injectable, NotFoundException } from "@nestjs/common";
import { Project, ProjectSummary } from "./project.model";
import { projects } from "./projects.data";

@Injectable()
export class ProjectsService {
  findAll(): readonly ProjectSummary[] {
    return projects.map(
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
  }

  findOne(slug: string): Project {
    const project = projects.find((candidate) => candidate.slug === slug);

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }
}
