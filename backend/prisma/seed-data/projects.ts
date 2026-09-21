import { Project } from "../../src/projects/project.model";

export const projects: readonly Project[] = [
  {
    slug: "bunkerweb-waf",
    cardTitle: "BunkerWeb WAF",
    title: "Protección de WordPress con BunkerWeb WAF",
    category: "Cybersecurity",
    type: "Laboratorio académico de ciberseguridad",
    status: "Completed — documentation being refined",
    summary:
      "Despliegue académico de un Web Application Firewall con BunkerWeb para proteger una instalación de WordPress ejecutada sobre Ubuntu Server y Docker.",
    objective:
      "Desplegar y estudiar BunkerWeb como WAF y reverse proxy delante de una aplicación WordPress, y preparar un entorno en el que validar controles frente a tráfico web potencialmente malicioso.",
    technologies: [
      "Ubuntu Server",
      "BunkerWeb 1.5.x",
      "BunkerWeb UI",
      "WordPress 6.4",
      "PHP 8.2",
      "Apache",
      "MariaDB 10.11",
      "Docker",
      "Docker Compose",
      "Redes Docker",
      "Volúmenes Docker",
      "Reverse proxy",
      "ModSecurity / capacidades WAF de BunkerWeb",
    ],
    architecture: [
      "Cliente",
      "BunkerWeb WAF / reverse proxy",
      "WordPress",
      "MariaDB",
    ],
    architectureDescription:
      "El laboratorio se ejecutó sobre Ubuntu Server. Los servicios se desplegaron con Docker Compose, utilizando redes Docker para su comunicación y volúmenes para conservar los datos necesarios.",
    workPerformed: [
      "Preparación del servidor Ubuntu.",
      "Instalación y uso de Docker y Docker Compose.",
      "Definición del despliegue de BunkerWeb, WordPress y MariaDB.",
      "Configuración de redes y volúmenes Docker.",
      "Configuración del encaminamiento mediante reverse proxy.",
      "Configuración de la protección WAF delante de WordPress.",
      "Diagnóstico de problemas del despliegue.",
    ],
    confirmedResults: [
      "Se preparó el servidor Ubuntu para el laboratorio.",
      "Se definió un despliegue con BunkerWeb, WordPress y MariaDB.",
      "Se trabajó con redes y volúmenes Docker.",
      "BunkerWeb se situó como reverse proxy y capa WAF delante de WordPress.",
      "Se diagnosticaron problemas de configuración y estado de los servicios durante distintas iteraciones.",
    ],
    problems: [
      {
        title: "Estado de BunkerWeb UI",
        description:
          "Durante una iteración, BunkerWeb UI apareció como unhealthy y entró en un ciclo de reinicios. La causa y la solución definitiva siguen pendientes de documentar.",
      },
      {
        title: "Configuración de Docker Compose",
        description:
          "Algunas modificaciones introdujeron problemas en la estructura YAML de Docker Compose. No se atribuye todavía una causa concreta más allá de la configuración observada.",
      },
    ],
    documentationStatus: [
      "Se está revisando la documentación original para confirmar qué pruebas de SQL injection, XSS, path traversal y ataques relacionados con WordPress llegaron a ejecutarse.",
      "No se atribuyen bloqueos exitosos, tasas de detección ni vulnerabilidades explotadas hasta completar esa revisión.",
      "Las capturas y los diagramas se incorporarán únicamente después de ser revisados y sanitizados.",
    ],
  },
  {
    slug: "soc-snort-elk",
    cardTitle: "SOC / Snort / ELK",
    title: "Mini-SOC con Snort y Elastic/Kibana",
    category: "Cybersecurity",
    type: "Laboratorio académico de Blue Team y monitorización",
    status: "Completed — documentation being refined",
    summary:
      "Laboratorio académico orientado a centralizar eventos de red, IDS y servidor para su consulta y análisis con Snort y Elastic/Kibana.",
    objective:
      "Construir un entorno de monitorización y detección en el que los eventos de red y del servidor pudieran centralizarse para facilitar su consulta, análisis y correlación.",
    technologies: [
      "GNS3",
      "Ubuntu Server",
      "Snort",
      "Apache",
      "MySQL",
      "PHP",
      "WordPress",
      "iptables",
      "Elastic / ELK",
      "Elastic Cloud",
      "Kibana",
    ],
    architecture: [
      "Cliente",
      "Red de laboratorio GNS3",
      "Snort IDS",
      "Ubuntu Server",
      "Elastic Cloud / Elastic Stack",
      "Kibana",
    ],
    architectureDescription:
      "El servidor Ubuntu incluía Apache, MySQL, PHP, WordPress e iptables. Los eventos y registros se enviaban hacia Elastic para su consulta y análisis mediante Kibana.",
    workPerformed: [
      "Construcción de una topología de laboratorio en GNS3 con un cliente, Snort IDS y un servidor Ubuntu.",
      "Trabajo con servicios web, base de datos, aplicación y firewall en el servidor.",
      "Envío de eventos y registros hacia Elastic Cloud / Elastic Stack.",
      "Consulta y análisis de la información mediante Kibana.",
      "Trabajo conceptual con información de red, IDS, firewall y aplicación.",
    ],
    confirmedResults: [
      "Se construyó la arquitectura del mini-SOC.",
      "Se utilizó Snort como IDS dentro de la topología.",
      "Se trabajó con registros procedentes de diferentes capas del entorno.",
      "Los eventos y logs se enviaban hacia Elastic para su consulta y análisis con Kibana.",
    ],
    lessons: [
      "Centralización de eventos procedentes de distintas fuentes.",
      "Relación entre monitorización de red, IDS y registros del servidor.",
      "Consulta y correlación de información en Elastic/Kibana.",
    ],
    documentationStatus: [
      "Se está revisando la documentación antes de publicar reglas específicas, dashboards concretos o detecciones exitosas determinadas.",
      "Escaneos, peticiones web sospechosas y eventos de IDS, firewall y aplicación se presentan como ámbitos conceptuales, no como detecciones confirmadas.",
      "Las capturas y los diagramas se incorporarán únicamente después de ser revisados y sanitizados.",
    ],
  },
  {
    slug: "mobile-security-mobsf-mstg",
    cardTitle: "Mobile Security con MobSF / MSTG",
    title: "Análisis de InsecureBankv2 con MobSF y OWASP MSTG",
    category: "Cybersecurity",
    type: "Laboratorio académico de seguridad móvil",
    status: "Completed — documentation being refined",
    summary:
      "Análisis académico de la aplicación Android InsecureBankv2 mediante MobSF y una estructura de trabajo basada en OWASP MSTG.",
    objective:
      "Trabajar con distintas categorías de OWASP MSTG sobre aplicaciones móviles. La práctica contemplaba pruebas para Android e iOS, con pruebas dinámicas previstas únicamente para Android.",
    technologies: [
      "InsecureBankv2.apk",
      "Kali Linux 2025.2",
      "VirtualBox",
      "Android Emulator",
      "Android 11 / API 30",
      "Google APIs x86_64",
      "ADB",
      "MobSF",
      "OWASP MSTG",
    ],
    workPerformed: [
      "Carga de InsecureBankv2 en MobSF mediante Upload & Analyze.",
      "Ejecución de un análisis estático automatizado.",
      "Revisión de las observaciones generadas por MobSF sobre el paquete Android.",
    ],
    confirmedResults: [
      "MobSF mostró 4 de 10 activities como exportadas.",
      "MobSF mostró 1 de 2 receivers como exportado.",
      "MobSF mostró 1 de 1 provider como exportado.",
      "MobSF indicó que la aplicación utilizaba firma APK v1.",
      "MobSF indicó la ausencia de firma APK v2, v3 y v4.",
    ],
    documentationStatus: [
      "Los resultados confirmados son observaciones del informe automático de MobSF; no equivalen a vulnerabilidades explotadas o verificadas manualmente.",
      "Se está revisando qué comprobaciones manuales llegaron a realizarse.",
      "También está pendiente confirmar qué pruebas dinámicas y qué categorías concretas de OWASP MSTG se completaron.",
      "Las capturas y los informes se incorporarán únicamente después de ser revisados y sanitizados.",
    ],
  },
  {
    slug: "secure-portfolio-infrastructure",
    cardTitle: "Secure Portfolio Infrastructure",
    title: "Secure Portfolio Infrastructure",
    category: "DevOps",
    type: "Proyecto personal",
    status: "En curso",
    summary:
      "Este portfolio es una aplicación Angular SSR y NestJS con PostgreSQL. Su entrega pasa por pruebas, análisis de seguridad y verificación de imágenes antes de publicar en GHCR.",
    objective:
      "Construir una plataforma pública que permita explicar decisiones de desarrollo, autenticación, persistencia, contenedores y entrega segura con evidencia verificable.",
    technologies: [
      "Angular SSR", "NestJS", "PostgreSQL 18", "Prisma 7", "Docker Compose",
      "GitHub Actions", "Gitleaks", "Dependency Review", "CodeQL", "Trivy",
      "CycloneDX SBOM", "GHCR",
    ],
    architecture: [
      "Navegador", "Angular SSR", "API REST NestJS", "Prisma", "PostgreSQL 18",
    ],
    architectureDescription:
      "Angular sirve las rutas públicas con SSR y consume la API NestJS. Prisma accede a PostgreSQL por una red de datos aislada; la base no publica un puerto al host. Las sesiones de administración se guardan en la base.",
    workPerformed: [
      "Integración tipada entre Angular SSR, API NestJS y contenido persistido con Prisma en PostgreSQL.",
      "Autenticación administrativa con sesiones de base de datos, Argon2id, CSRF y validación estricta de Origin.",
      "Contenedores de aplicación sin privilegios, sistemas de archivos de solo lectura y red de datos aislada.",
      "CI con pruebas independientes, PostgreSQL desechable, smoke de Docker Compose, análisis de seguridad, SBOM y publicación de las imágenes verificadas.",
    ],
    confirmedResults: [
      "En el hito validado de Phase 8: backend e2e 17/17, frontend 18/18, seguridad de base de datos 18/18 y políticas de seguridad 47/47.",
      "Dos hallazgos HIGH de CodeQL se corrigieron en código, se probaron y quedaron cerrados tras un nuevo análisis.",
      "Tres imágenes de aplicación verificadas y tres documentos CycloneDX generados en la cadena de entrega.",
    ],
    lessons: [
      "La publicación debe usar los mismos identificadores de imagen que se probaron y analizaron, sin reconstruir en el job de entrega.",
      "Las excepciones de vulnerabilidad deben ser específicas, visibles y tener fecha de revisión.",
    ],
    repository: "https://github.com/alejandropena25-beep/cyber-portfolio",
    roadmap: {
      implemented: [
        "Aplicación Angular SSR + NestJS",
        "PostgreSQL 18 + Prisma 7",
        "Autenticación y administración",
        "Docker Compose y endurecimiento de contenedores",
        "CI/CD con GitHub Actions y GHCR",
        "DevSecOps: Gitleaks, Dependency Review, CodeQL, Trivy y CycloneDX",
      ],
      inProgress: [
        "Siguiente hito: Kubernetes (Phase 9; aún sin implementar)",
      ],
      planned: [
        "WAF / protección perimetral",
        "Wazuh SIEM",
        "Observabilidad con Prometheus / Grafana",
        "Respuesta automatizada y controlada",
        "Producción",
      ],
    },
  },
];
