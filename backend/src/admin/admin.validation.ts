import { BadRequestException } from "@nestjs/common";
import type { AdminProfile, AdminProjectInput } from "./admin.models";

const categories = new Set(["CYBERSECURITY", "DEVELOPMENT", "DEVOPS"]);
const sections = new Set([
  "ARCHITECTURE",
  "WORK_PERFORMED",
  "RESULT",
  "PROBLEM",
  "LESSON",
  "DOCUMENTATION",
]);
const stages = new Set(["IMPLEMENTED", "IN_PROGRESS", "PLANNED"]);
const skillGroups = new Set(["PROFESSIONAL", "TRAINING_AND_LAB"]);

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new BadRequestException("Invalid request body");
  return value as Record<string, unknown>;
}
function text(value: unknown, field: string, max = 10_000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new BadRequestException(`Invalid ${field}`);
  return value.trim();
}
function nullableText(
  value: unknown,
  field: string,
  max = 10_000,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  return text(value, field, max);
}
function integer(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new BadRequestException(`Invalid ${field}`);
  return value as number;
}
function list(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value) || value.length > 200)
    throw new BadRequestException(`Invalid ${field}`);
  return value;
}
function textList(value: unknown, field: string): string[] {
  return list(value, field).map((item, index) =>
    text(item, `${field}[${index}]`, 500),
  );
}

export function projectInput(value: unknown): AdminProjectInput {
  const body = object(value);
  const category = text(body["category"], "category", 30);
  if (!categories.has(category))
    throw new BadRequestException("Invalid category");
  const repositoryUrl = nullableText(
    body["repositoryUrl"],
    "repositoryUrl",
    2_048,
  );
  if (repositoryUrl) {
    try {
      new URL(repositoryUrl);
    } catch {
      throw new BadRequestException("Invalid repositoryUrl");
    }
  }
  const slug = text(body["slug"], "slug", 160);
  if (!/^[a-z0-9-]+$/.test(slug)) throw new BadRequestException("Invalid slug");
  const technologies = textList(body["technologies"], "technologies");
  if (
    technologies.some(
      (name) =>
        !name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
    )
  )
    throw new BadRequestException("Invalid technology name");
  if (
    new Set(technologies.map((item) => item.toLowerCase())).size !==
    technologies.length
  )
    throw new BadRequestException("Technologies must be unique");
  const sectionItems = list(body["sections"], "sections").map(
    (value, index) => {
      const item = object(value);
      const section = text(item["section"], `sections[${index}].section`, 30);
      if (!sections.has(section))
        throw new BadRequestException("Invalid project section");
      return {
        section: section as AdminProjectInput["sections"][number]["section"],
        title: nullableText(item["title"], `sections[${index}].title`, 300),
        content: text(item["content"], `sections[${index}].content`),
        sortOrder: integer(item["sortOrder"], `sections[${index}].sortOrder`),
      };
    },
  );
  const roadmap = list(body["roadmap"], "roadmap").map((value, index) => {
    const item = object(value);
    const stage = text(item["stage"], `roadmap[${index}].stage`, 30);
    if (!stages.has(stage))
      throw new BadRequestException("Invalid roadmap stage");
    return {
      stage: stage as AdminProjectInput["roadmap"][number]["stage"],
      content: text(item["content"], `roadmap[${index}].content`),
      sortOrder: integer(item["sortOrder"], `roadmap[${index}].sortOrder`),
    };
  });
  if (typeof body["published"] !== "boolean")
    throw new BadRequestException("Invalid published state");
  return {
    slug,
    cardTitle: text(body["cardTitle"], "cardTitle", 300),
    pageTitle: text(body["pageTitle"], "pageTitle", 300),
    summary: text(body["summary"], "summary"),
    objective: text(body["objective"], "objective"),
    category: category as AdminProjectInput["category"],
    type: text(body["type"], "type", 300),
    status: text(body["status"], "status", 300),
    repositoryUrl,
    architectureDescription: nullableText(
      body["architectureDescription"],
      "architectureDescription",
    ),
    published: body["published"],
    sortOrder: integer(body["sortOrder"], "sortOrder"),
    technologies,
    sections: sectionItems,
    roadmap,
  };
}

export function profileInput(value: unknown): AdminProfile {
  const body = object(value);
  const experience = list(body["experience"], "experience").map(
    (value, index) => {
      const item = object(value);
      return {
        company: text(item["company"], `experience[${index}].company`, 300),
        clientContext: nullableText(
          item["clientContext"],
          `experience[${index}].clientContext`,
          500,
        ),
        area: text(item["area"], `experience[${index}].area`, 500),
        description: text(
          item["description"],
          `experience[${index}].description`,
        ),
        activities: textList(
          item["activities"],
          `experience[${index}].activities`,
        ),
        technologies: textList(
          item["technologies"],
          `experience[${index}].technologies`,
        ),
      };
    },
  );
  const education = list(body["education"], "education").map((value, index) => {
    const item = object(value);
    return {
      program: text(item["program"], `education[${index}].program`, 500),
      institution: nullableText(
        item["institution"],
        `education[${index}].institution`,
        500,
      ),
      status: text(item["status"], `education[${index}].status`, 300),
    };
  });
  const skills = list(body["skills"], "skills").map((value, index) => {
    const item = object(value);
    const group = text(item["group"], `skills[${index}].group`, 30);
    if (!skillGroups.has(group))
      throw new BadRequestException("Invalid skill group");
    return {
      name: text(item["name"], `skills[${index}].name`, 300),
      group: group as AdminProfile["skills"][number]["group"],
    };
  });
  const githubUrl = text(body["githubUrl"], "githubUrl", 2_048);
  try {
    new URL(githubUrl);
  } catch {
    throw new BadRequestException("Invalid githubUrl");
  }
  return {
    name: text(body["name"], "name", 300),
    headline: text(body["headline"], "headline", 500),
    introduction: text(body["introduction"], "introduction"),
    professionalFocus: text(body["professionalFocus"], "professionalFocus"),
    githubUrl,
    languages: textList(body["languages"], "languages"),
    orientation: textList(body["orientation"], "orientation"),
    experience,
    education,
    skills,
  };
}
