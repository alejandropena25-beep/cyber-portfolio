import type {
  PrismaClient,
  Prisma,
  ProjectCategory,
} from "../src/generated/prisma/client";
import { projects } from "./seed-data/projects";
import { publicProfile } from "./seed-data/profile";

const categories: { [key: string]: ProjectCategory } = {
  Cybersecurity: "CYBERSECURITY",
  Development: "DEVELOPMENT",
  DevOps: "DEVOPS",
};
const sectionFields = {
  architecture: "ARCHITECTURE",
  workPerformed: "WORK_PERFORMED",
  confirmedResults: "RESULT",
  lessons: "LESSON",
  documentationStatus: "DOCUMENTATION",
} as const;
const stages = {
  implemented: "IMPLEMENTED",
  inProgress: "IN_PROGRESS",
  planned: "PLANNED",
} as const;

export async function seedContent(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      for (const [sortOrder, project] of projects.entries()) {
        const data = {
          slug: project.slug,
          cardTitle: project.cardTitle,
          pageTitle: project.title,
          summary: project.summary,
          objective: project.objective,
          category: categories[project.category]!,
          type: project.type,
          status: project.status,
          repositoryUrl: project.repository ?? null,
          architectureDescription: project.architectureDescription ?? null,
          published: true,
          sortOrder,
        };
        const record = await tx.project.upsert({
          where: { slug: project.slug },
          create: data,
          update: data,
        });
        await tx.projectTechnology.deleteMany({
          where: { projectId: record.id },
        });
        await tx.projectSectionItem.deleteMany({
          where: { projectId: record.id },
        });
        await tx.projectRoadmapItem.deleteMany({
          where: { projectId: record.id },
        });
        for (const [order, name] of project.technologies.entries()) {
          const slug = name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          const technology = await tx.technology.upsert({
            where: { slug },
            create: { name, slug },
            update: { name },
          });
          await tx.projectTechnology.create({
            data: {
              projectId: record.id,
              technologyId: technology.id,
              sortOrder: order,
            },
          });
        }
        const sections: Prisma.ProjectSectionItemCreateManyInput[] = [];
        for (const [field, section] of Object.entries(sectionFields)) {
          project[field as keyof typeof sectionFields]?.forEach(
            (content, order) =>
              sections.push({
                projectId: record.id,
                section,
                content,
                sortOrder: order,
              }),
          );
        }
        project.problems?.forEach((problem, order) =>
          sections.push({
            projectId: record.id,
            section: "PROBLEM",
            title: problem.title,
            content: problem.description,
            sortOrder: order,
          }),
        );
        if (sections.length)
          await tx.projectSectionItem.createMany({ data: sections });
        for (const [field, stage] of Object.entries(stages)) {
          const items = project.roadmap?.[field as keyof typeof stages];
          if (items?.length)
            await tx.projectRoadmapItem.createMany({
              data: items.map((content, order) => ({
                projectId: record.id,
                stage,
                content,
                sortOrder: order,
              })),
            });
        }
      }
      const p = publicProfile;
      const data = {
        name: p.name,
        headline: p.headline,
        introduction: p.introduction,
        professionalFocus: p.professionalFocus,
        githubUrl: p.links.github,
        languages: [...p.languages],
        orientation: [...p.orientation],
      };
      await tx.profile.upsert({
        where: { id: 1 },
        create: { id: 1, ...data },
        update: data,
      });
      await tx.experience.deleteMany({ where: { profileId: 1 } });
      await tx.education.deleteMany({ where: { profileId: 1 } });
      await tx.skill.deleteMany({ where: { profileId: 1 } });
      await tx.experience.createMany({
        data: p.experience.map((item, sortOrder) => ({
          profileId: 1,
          company: item.organization,
          clientContext: item.context ?? null,
          area: item.area,
          description: item.description,
          activities: [...(item.activities ?? [])],
          technologies: [...(item.technologies ?? [])],
          sortOrder,
        })),
      });
      await tx.education.createMany({
        data: p.education.map((item, sortOrder) => ({
          profileId: 1,
          program: item.title,
          institution: item.institution ?? null,
          status: item.status,
          sortOrder,
        })),
      });
      await tx.skill.createMany({
        data: [
          ...p.professionalTechnologies.map((name, sortOrder) => ({
            profileId: 1,
            name,
            sortOrder,
            group: "PROFESSIONAL" as const,
          })),
          ...p.trainingAndLabTechnologies.map((name, sortOrder) => ({
            profileId: 1,
            name,
            sortOrder,
            group: "TRAINING_AND_LAB" as const,
          })),
        ],
      });
    },
    { timeout: 30000 },
  );
}
