import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Project, ProjectSummary } from "./project.model";
import {
  projectDetail,
  projectRelations,
  projectSummary,
} from "./project.mapper";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(): Promise<readonly ProjectSummary[]> {
    const records = await this.prisma.project.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { technologies: projectRelations.technologies },
    });
    return records.map(projectSummary);
  }
  async findOne(slug: string): Promise<Project> {
    const record = await this.prisma.project.findUnique({
      where: { slug, published: true },
      include: projectRelations,
    });
    if (!record) throw new NotFoundException("Project not found");
    return projectDetail(record);
  }
}
