import type { Prisma } from "../generated/prisma/client";
import type { PublicProfile } from "./profile.model";
export const profileRelations = {
  experience: { orderBy: { sortOrder: "asc" } },
  education: { orderBy: { sortOrder: "asc" } },
  skills: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProfileInclude;
export function publicProfile(
  record: Prisma.ProfileGetPayload<{ include: typeof profileRelations }>,
): PublicProfile {
  return {
    name: record.name,
    headline: record.headline,
    introduction: record.introduction,
    professionalFocus: record.professionalFocus,
    experience: record.experience.map((item) => ({
      organization: item.company,
      ...(item.clientContext !== null ? { context: item.clientContext } : {}),
      area: item.area,
      description: item.description,
      ...(item.activities.length ? { activities: item.activities } : {}),
      ...(item.technologies.length ? { technologies: item.technologies } : {}),
    })),
    education: record.education.map((item) => ({
      title: item.program,
      ...(item.institution !== null ? { institution: item.institution } : {}),
      status: item.status,
    })),
    languages: record.languages,
    professionalTechnologies: record.skills
      .filter((item) => item.group === "PROFESSIONAL")
      .map((item) => item.name),
    trainingAndLabTechnologies: record.skills
      .filter((item) => item.group === "TRAINING_AND_LAB")
      .map((item) => item.name),
    orientation: record.orientation,
    links: { github: record.githubUrl },
  };
}
