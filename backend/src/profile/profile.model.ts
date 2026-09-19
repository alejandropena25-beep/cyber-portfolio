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
