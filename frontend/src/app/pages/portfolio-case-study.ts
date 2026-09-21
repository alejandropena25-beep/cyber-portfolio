import { Component } from '@angular/core';

@Component({
  selector: 'app-portfolio-case-study',
  templateUrl: './portfolio-case-study.html',
  styleUrl: './portfolio-case-study.scss',
})
export class PortfolioCaseStudy {
  protected readonly chapters = [
    { title: 'Aplicación', detail: 'Angular SSR sirve la experiencia pública; NestJS expone la API y Prisma persiste contenido en PostgreSQL.' },
    { title: 'Autenticación', detail: 'La administración usa sesiones en la base, Argon2id, CSRF, Origin estricto y una cookie HttpOnly SameSite=Strict.' },
    { title: 'Contenedores', detail: 'Docker Compose separa frontend, backend, tareas de mantenimiento y datos. Las aplicaciones corren sin root, con raíz de solo lectura y capacidades reducidas.' },
    { title: 'CI/CD', detail: 'GitHub Actions prueba backend y frontend por separado. PostgreSQL desechable, guardas de destino y un smoke de Compose comprueban la integración.' },
    { title: 'DevSecOps', detail: 'Gitleaks, política de dependencias, Dependency Review, CodeQL y Trivy producen controles revisables. Syft genera SBOM CycloneDX.' },
    { title: 'Entrega verificada', detail: 'El smoke registra los IDs de tres imágenes. Trivy y Syft usan esos IDs; el job de publicación carga y verifica las mismas imágenes antes de GHCR.' },
  ] as const;

  protected readonly evidence = [
    { value: '17 / 17', label: 'Backend e2e' },
    { value: '18 / 18', label: 'Frontend' },
    { value: '18 / 18', label: 'Seguridad de base de datos' },
    { value: '47 / 47', label: 'Pruebas de política de seguridad' },
    { value: '0', label: 'Hallazgos en el Gitleaks validado' },
    { value: '3 + 3', label: 'Imágenes verificadas y SBOM CycloneDX' },
  ] as const;
}
