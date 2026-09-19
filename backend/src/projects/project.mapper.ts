import type { Prisma, ProjectCategory } from "../generated/prisma/client";
import type { Project, ProjectSummary } from "./project.model";

export const projectRelations = {
  technologies: {
    orderBy: { sortOrder: "asc" },
    include: { technology: true },
  },
  sections: { orderBy: { sortOrder: "asc" } },
  roadmap: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProjectInclude;
type Record = Prisma.ProjectGetPayload<{ include: typeof projectRelations }>;
const categories: { [K in ProjectCategory]: Project["category"] } = {
  CYBERSECURITY: "Cybersecurity",
  DEVELOPMENT: "Development",
  DEVOPS: "DevOps",
};
export function projectSummary(
  record: Pick<
    Record,
    | "slug"
    | "cardTitle"
    | "pageTitle"
    | "category"
    | "type"
    | "status"
    | "summary"
    | "technologies"
  >,
): ProjectSummary {
  return {
    slug: record.slug,
    cardTitle: record.cardTitle,
    title: record.pageTitle,
    category: categories[record.category],
    type: record.type,
    status: record.status as Project["status"],
    summary: record.summary,
    technologies: record.technologies.map((item) => item.technology.name),
  };
}
export function projectDetail(record: Record): Project {
  const optionalSection = (
    field: string,
    section: Record["sections"][number]["section"],
  ) => {
    const values = record.sections
      .filter((item) => item.section === section)
      .map((item) => item.content);
    return values.length ? { [field]: values } : {};
  };
  const problems = record.sections.filter((item) => item.section === "PROBLEM");
  return {
    ...projectSummary(record),
    objective: record.objective,
    ...optionalSection("architecture", "ARCHITECTURE"),
    ...(record.architectureDescription !== null
      ? { architectureDescription: record.architectureDescription }
      : {}),
    ...optionalSection("workPerformed", "WORK_PERFORMED"),
    ...optionalSection("confirmedResults", "RESULT"),
    ...(problems.length
      ? {
          problems: problems.map((item) => ({
            title: item.title!,
            description: item.content,
          })),
        }
      : {}),
    ...optionalSection("lessons", "LESSON"),
    ...optionalSection("documentationStatus", "DOCUMENTATION"),
    ...(record.repositoryUrl !== null
      ? { repository: record.repositoryUrl }
      : {}),
    ...(record.roadmap.length
      ? {
          roadmap: {
            implemented: record.roadmap
              .filter((item) => item.stage === "IMPLEMENTED")
              .map((item) => item.content),
            inProgress: record.roadmap
              .filter((item) => item.stage === "IN_PROGRESS")
              .map((item) => item.content),
            planned: record.roadmap
              .filter((item) => item.stage === "PLANNED")
              .map((item) => item.content),
          },
        }
      : {}),
  };
}
