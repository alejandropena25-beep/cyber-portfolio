export const projectCategories = [
  "Cybersecurity",
  "Development",
  "DevOps",
] as const;
export type ProjectCategory = (typeof projectCategories)[number];

export type ProjectStatus =
  "Completed — documentation being refined" | "En curso";

export interface ProjectProblem {
  readonly title: string;
  readonly description: string;
}

export interface ProjectRoadmap {
  readonly implemented: readonly string[];
  readonly inProgress: readonly string[];
  readonly planned: readonly string[];
}

export interface Project {
  readonly slug: string;
  readonly cardTitle: string;
  readonly title: string;
  readonly category: ProjectCategory;
  readonly type: string;
  readonly status: ProjectStatus;
  readonly summary: string;
  readonly objective: string;
  readonly technologies: readonly string[];
  readonly architecture?: readonly string[];
  readonly architectureDescription?: string;
  readonly workPerformed?: readonly string[];
  readonly confirmedResults?: readonly string[];
  readonly problems?: readonly ProjectProblem[];
  readonly lessons?: readonly string[];
  readonly documentationStatus?: readonly string[];
  readonly repository?: string;
  readonly roadmap?: ProjectRoadmap;
}

export type ProjectSummary = Pick<
  Project,
  | "slug"
  | "cardTitle"
  | "title"
  | "category"
  | "type"
  | "status"
  | "summary"
  | "technologies"
>;
