import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { projectRelations } from "../projects/project.mapper";
import { profileRelations } from "../profile/profile.mapper";
import type {
  AdminProfile,
  AdminProject,
  AdminProjectInput,
} from "./admin.models";
import type { Prisma } from "../generated/prisma/client";

const technologySlug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private project(
    record: Prisma.ProjectGetPayload<{ include: typeof projectRelations }>,
  ): AdminProject {
    const value = record;
    return {
      id: value.id,
      slug: value.slug,
      cardTitle: value.cardTitle,
      pageTitle: value.pageTitle,
      summary: value.summary,
      objective: value.objective,
      category: value.category,
      type: value.type,
      status: value.status,
      repositoryUrl: value.repositoryUrl,
      architectureDescription: value.architectureDescription,
      published: value.published,
      sortOrder: value.sortOrder,
      technologies: value.technologies.map((item) => item.technology.name),
      sections: value.sections.map(
        ({ section, title, content, sortOrder }) => ({
          section,
          title,
          content,
          sortOrder,
        }),
      ),
      roadmap: value.roadmap.map(({ stage, content, sortOrder }) => ({
        stage,
        content,
        sortOrder,
      })),
    };
  }

  async projects(): Promise<readonly AdminProject[]> {
    const records = await this.prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: projectRelations,
    });
    return records.map((record) => this.project(record));
  }

  async projectById(id: number): Promise<AdminProject> {
    const record = await this.prisma.project.findUnique({
      where: { id },
      include: projectRelations,
    });
    if (!record) throw new NotFoundException("Project not found");
    return this.project(record);
  }

  async createProject(input: AdminProjectInput): Promise<AdminProject> {
    const created = await this.prisma.$transaction(async (tx) => {
      const record = await tx.project.create({
        data: {
          slug: input.slug,
          cardTitle: input.cardTitle,
          pageTitle: input.pageTitle,
          summary: input.summary,
          objective: input.objective,
          category: input.category,
          type: input.type,
          status: input.status,
          repositoryUrl: input.repositoryUrl,
          architectureDescription: input.architectureDescription,
          published: input.published,
          sortOrder: input.sortOrder,
        },
      });
      await this.replaceProjectRelations(tx, record.id, input);
      return record.id;
    });
    return this.projectById(created);
  }

  async updateProject(
    id: number,
    input: AdminProjectInput,
  ): Promise<AdminProject> {
    await this.projectById(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          slug: input.slug,
          cardTitle: input.cardTitle,
          pageTitle: input.pageTitle,
          summary: input.summary,
          objective: input.objective,
          category: input.category,
          type: input.type,
          status: input.status,
          repositoryUrl: input.repositoryUrl,
          architectureDescription: input.architectureDescription,
          published: input.published,
          sortOrder: input.sortOrder,
        },
      });
      await tx.projectTechnology.deleteMany({ where: { projectId: id } });
      await tx.projectSectionItem.deleteMany({ where: { projectId: id } });
      await tx.projectRoadmapItem.deleteMany({ where: { projectId: id } });
      await this.replaceProjectRelations(tx, id, input);
    });
    return this.projectById(id);
  }

  private async replaceProjectRelations(
    tx: Prisma.TransactionClient,
    projectId: number,
    input: AdminProjectInput,
  ): Promise<void> {
    for (const [sortOrder, name] of input.technologies.entries()) {
      const slug = technologySlug(name);
      const technology = await tx.technology.upsert({
        where: { slug },
        create: { name, slug },
        update: { name },
      });
      await tx.projectTechnology.create({
        data: { projectId, technologyId: technology.id, sortOrder },
      });
    }
    if (input.sections.length)
      await tx.projectSectionItem.createMany({
        data: input.sections.map((item) => ({ projectId, ...item })),
      });
    if (input.roadmap.length)
      await tx.projectRoadmapItem.createMany({
        data: input.roadmap.map((item) => ({ projectId, ...item })),
      });
  }

  async profile(): Promise<AdminProfile> {
    const record = await this.prisma.profile.findUnique({
      where: { id: 1 },
      include: profileRelations,
    });
    if (!record) throw new NotFoundException("Profile not found");
    return {
      name: record.name,
      headline: record.headline,
      introduction: record.introduction,
      professionalFocus: record.professionalFocus,
      githubUrl: record.githubUrl,
      languages: record.languages,
      orientation: record.orientation,
      experience: record.experience.map(
        ({
          company,
          clientContext,
          area,
          description,
          activities,
          technologies,
        }) => ({
          company,
          clientContext,
          area,
          description,
          activities,
          technologies,
        }),
      ),
      education: record.education.map(({ program, institution, status }) => ({
        program,
        institution,
        status,
      })),
      skills: record.skills.map(({ name, group }) => ({ name, group })),
    };
  }

  async updateProfile(input: AdminProfile): Promise<AdminProfile> {
    await this.prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: 1 },
        data: {
          name: input.name,
          headline: input.headline,
          introduction: input.introduction,
          professionalFocus: input.professionalFocus,
          githubUrl: input.githubUrl,
          languages: [...input.languages],
          orientation: [...input.orientation],
        },
      });
      await tx.experience.deleteMany({ where: { profileId: 1 } });
      await tx.education.deleteMany({ where: { profileId: 1 } });
      await tx.skill.deleteMany({ where: { profileId: 1 } });
      if (input.experience.length)
        await tx.experience.createMany({
          data: input.experience.map((item, sortOrder) => ({
            profileId: 1,
            ...item,
            activities: [...item.activities],
            technologies: [...item.technologies],
            sortOrder,
          })),
        });
      if (input.education.length)
        await tx.education.createMany({
          data: input.education.map((item, sortOrder) => ({
            profileId: 1,
            ...item,
            sortOrder,
          })),
        });
      if (input.skills.length)
        await tx.skill.createMany({
          data: input.skills.map((item, sortOrder) => ({
            profileId: 1,
            ...item,
            sortOrder,
          })),
        });
    });
    return this.profile();
  }
}
