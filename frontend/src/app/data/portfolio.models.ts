export const categories = ['Cybersecurity', 'Development', 'DevOps'] as const;
export type ProjectCategory = (typeof categories)[number];

export type ProjectStatus = 'Completed — documentation being refined' | 'En curso';

export interface ProjectProblem {
  readonly title: string;
  readonly description: string;
}

export interface ProjectRoadmap {
  readonly implemented: readonly string[];
  readonly inProgress: readonly string[];
  readonly planned: readonly string[];
}

export interface ProjectSummary {
  readonly slug: string;
  readonly cardTitle: string;
  readonly title: string;
  readonly category: ProjectCategory;
  readonly type: string;
  readonly status: ProjectStatus;
  readonly summary: string;
  readonly technologies: readonly string[];
}

export interface Project extends ProjectSummary {
  readonly objective: string;
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

export interface ProfessionalExperience {
  readonly organization: string;
  readonly context?: string;
  readonly area: string;
  readonly description: string;
  readonly activities?: readonly string[];
  readonly technologies?: readonly string[];
}

export interface Education {
  readonly title: string;
  readonly institution?: string;
  readonly status: string;
}

export interface PublicProfile {
  readonly name: string;
  readonly headline: string;
  readonly introduction: string;
  readonly professionalFocus: string;
  readonly experience: readonly ProfessionalExperience[];
  readonly education: readonly Education[];
  readonly languages: readonly string[];
  readonly professionalTechnologies: readonly string[];
  readonly trainingAndLabTechnologies: readonly string[];
  readonly orientation: readonly string[];
  readonly links: {
    readonly github: string;
  };
}
