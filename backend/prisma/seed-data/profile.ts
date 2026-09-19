import { PublicProfile } from "../../src/profile/profile.model";

export const publicProfile: PublicProfile = {
  name: "Alejandro Peña",
  headline: "Desarrollador web con formación en ciberseguridad",
  introduction:
    "Soy desarrollador web con formación en Desarrollo de Aplicaciones Web y ciberseguridad. Actualmente curso Ingeniería Informática — Tecnologías Informáticas en la Universidad de Sevilla.",
  professionalFocus:
    "La ciberseguridad es el foco principal de mi evolución profesional, acompañada por desarrollo, infraestructura, automatización y DevOps / DevSecOps.",
  experience: [
    {
      organization: "Cibernos",
      context: "Prestando servicio para Ericsson",
      area: "Monitorización de infraestructura",
      description:
        "Trabajo relacionado con la monitorización de redes y servicios 5G, servidores y disponibilidad de servicios.",
      activities: [
        "Monitorización del entorno y seguimiento de disponibilidad.",
        "Gestión inicial de alarmas y detección de anomalías.",
        "Seguimiento de incidencias y escalado cuando correspondía.",
      ],
    },
    {
      organization: "Euroxanty",
      area: "Desarrollo y mantenimiento web",
      description:
        "Desarrollo y mantenimiento de sitios web, principalmente con WordPress y Elementor, junto con trabajo en HTML, CSS y JavaScript.",
      technologies: ["WordPress", "Elementor", "HTML", "CSS", "JavaScript"],
    },
  ],
  education: [
    {
      title: "Ingeniería Informática — Tecnologías Informáticas",
      institution: "Universidad de Sevilla",
      status: "Actualmente en curso",
    },
    {
      title:
        "Curso de Especialización en Ciberseguridad en Entornos de las Tecnologías de la Información",
      status: "Completado",
    },
    {
      title: "Desarrollo de Aplicaciones Web (DAW)",
      institution: "EUSA Sevilla",
      status: "Completado",
    },
  ],
  languages: ["Inglés B2"],
  professionalTechnologies: [
    "WordPress",
    "Elementor",
    "HTML",
    "CSS",
    "JavaScript",
  ],
  trainingAndLabTechnologies: [
    "Linux",
    "Windows",
    "Docker",
    "GNS3",
    "OpenStack",
    "Snort",
    "Elastic / ELK",
    "Wireshark",
    "Nmap",
    "BunkerWeb",
    "MobSF",
    "OWASP MSTG",
    "Autopsy",
  ],
  orientation: [
    "Ciberseguridad",
    "Infraestructura",
    "Automatización",
    "Desarrollo",
    "DevOps / DevSecOps",
  ],
  links: {
    github: "https://github.com/alejandropena25-beep/cyber-portfolio",
  },
};
