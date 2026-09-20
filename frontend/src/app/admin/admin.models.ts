export interface AdminIdentity {
  readonly id: number;
  readonly email: string;
  readonly role: 'ADMIN';
}
export interface AuthResponse {
  readonly user: AdminIdentity;
  readonly expiresAt?: string;
}
export type ProjectCategoryValue = 'CYBERSECURITY' | 'DEVELOPMENT' | 'DEVOPS';
export type ProjectSectionValue =
  'ARCHITECTURE' | 'WORK_PERFORMED' | 'RESULT' | 'PROBLEM' | 'LESSON' | 'DOCUMENTATION';
export type RoadmapStageValue = 'IMPLEMENTED' | 'IN_PROGRESS' | 'PLANNED';
export interface AdminProjectSection {
  section: ProjectSectionValue;
  title: string | null;
  content: string;
  sortOrder: number;
}
export interface AdminRoadmapItem {
  stage: RoadmapStageValue;
  content: string;
  sortOrder: number;
}
export interface AdminProject {
  id: number;
  slug: string;
  cardTitle: string;
  pageTitle: string;
  summary: string;
  objective: string;
  category: ProjectCategoryValue;
  type: string;
  status: string;
  repositoryUrl: string | null;
  architectureDescription: string | null;
  published: boolean;
  sortOrder: number;
  technologies: string[];
  sections: AdminProjectSection[];
  roadmap: AdminRoadmapItem[];
}
export type AdminProjectInput = Omit<AdminProject, 'id'>;
export interface AdminProfile {
  name: string;
  headline: string;
  introduction: string;
  professionalFocus: string;
  githubUrl: string;
  languages: string[];
  orientation: string[];
  experience: {
    company: string;
    clientContext: string | null;
    area: string;
    description: string;
    activities: string[];
    technologies: string[];
  }[];
  education: { program: string; institution: string | null; status: string }[];
  skills: { name: string; group: 'PROFESSIONAL' | 'TRAINING_AND_LAB' }[];
}
