import type {
  ProjectCategory,
  ProjectSection,
  RoadmapStage,
  SkillGroup,
} from "../generated/prisma/client";

export interface AdminProjectSectionItem {
  readonly section: ProjectSection;
  readonly title: string | null;
  readonly content: string;
  readonly sortOrder: number;
}

export interface AdminProjectRoadmapItem {
  readonly stage: RoadmapStage;
  readonly content: string;
  readonly sortOrder: number;
}

export interface AdminProject {
  readonly id: number;
  readonly slug: string;
  readonly cardTitle: string;
  readonly pageTitle: string;
  readonly summary: string;
  readonly objective: string;
  readonly category: ProjectCategory;
  readonly type: string;
  readonly status: string;
  readonly repositoryUrl: string | null;
  readonly architectureDescription: string | null;
  readonly published: boolean;
  readonly sortOrder: number;
  readonly technologies: readonly string[];
  readonly sections: readonly AdminProjectSectionItem[];
  readonly roadmap: readonly AdminProjectRoadmapItem[];
}

export interface AdminProfile {
  readonly name: string;
  readonly headline: string;
  readonly introduction: string;
  readonly professionalFocus: string;
  readonly githubUrl: string;
  readonly languages: readonly string[];
  readonly orientation: readonly string[];
  readonly experience: readonly {
    readonly company: string;
    readonly clientContext: string | null;
    readonly area: string;
    readonly description: string;
    readonly activities: readonly string[];
    readonly technologies: readonly string[];
  }[];
  readonly education: readonly {
    readonly program: string;
    readonly institution: string | null;
    readonly status: string;
  }[];
  readonly skills: readonly {
    readonly name: string;
    readonly group: SkillGroup;
  }[];
}

export type AdminProjectInput = Omit<AdminProject, "id">;
