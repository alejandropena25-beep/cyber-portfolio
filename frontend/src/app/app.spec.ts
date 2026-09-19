import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { PortfolioApiService } from './data/portfolio-api.service';
import { Project, PublicProfile } from './data/portfolio.models';

const projects: readonly Project[] = [
  {
    slug: 'bunkerweb-waf',
    cardTitle: 'BunkerWeb WAF',
    title: 'Protección de WordPress con BunkerWeb WAF',
    category: 'Cybersecurity',
    type: 'Laboratorio académico de ciberseguridad',
    status: 'Completed — documentation being refined',
    summary: 'Despliegue académico de un WAF con BunkerWeb.',
    objective: 'Desplegar y estudiar un WAF.',
    technologies: ['BunkerWeb', 'Docker', 'WordPress'],
    confirmedResults: ['Se definió el despliegue del laboratorio.'],
    documentationStatus: ['Las pruebas concretas siguen en revisión.'],
  },
  {
    slug: 'soc-snort-elk',
    cardTitle: 'SOC / Snort / ELK',
    title: 'Mini-SOC con Snort y Elastic/Kibana',
    category: 'Cybersecurity',
    type: 'Laboratorio académico de Blue Team y monitorización',
    status: 'Completed — documentation being refined',
    summary: 'Laboratorio académico de monitorización.',
    objective: 'Centralizar eventos.',
    technologies: ['Snort', 'Elastic', 'Kibana'],
  },
  {
    slug: 'mobile-security-mobsf-mstg',
    cardTitle: 'Mobile Security con MobSF / MSTG',
    title: 'Análisis de InsecureBankv2 con MobSF y OWASP MSTG',
    category: 'Cybersecurity',
    type: 'Laboratorio académico de seguridad móvil',
    status: 'Completed — documentation being refined',
    summary: 'Análisis académico de una aplicación Android.',
    objective: 'Trabajar categorías de OWASP MSTG.',
    technologies: ['MobSF', 'OWASP MSTG'],
    confirmedResults: ['MobSF mostró 4 de 10 activities como exportadas.'],
  },
  {
    slug: 'secure-portfolio-infrastructure',
    cardTitle: 'Secure Portfolio Infrastructure',
    title: 'Secure Portfolio Infrastructure',
    category: 'DevOps',
    type: 'Proyecto personal',
    status: 'En curso',
    summary: 'Evolución técnica del portfolio.',
    objective: 'Construir una demostración técnica progresiva.',
    technologies: ['Angular 22', 'TypeScript'],
    repository: 'https://github.com/alejandropena25-beep/cyber-portfolio',
    roadmap: {
      implemented: ['Angular 22'],
      inProgress: ['Phase 3 — NestJS Backend'],
      planned: ['PostgreSQL'],
    },
  },
];

const profile: PublicProfile = {
  name: 'Alejandro Peña',
  headline: 'Desarrollador web con formación en ciberseguridad',
  introduction: 'Soy desarrollador web y actualmente curso Ingeniería Informática.',
  professionalFocus: 'La ciberseguridad es el foco principal de mi evolución profesional.',
  experience: [
    {
      organization: 'Cibernos',
      context: 'Prestando servicio para Ericsson',
      area: 'Monitorización de infraestructura',
      description: 'Monitorización de redes y servicios 5G.',
    },
    {
      organization: 'Euroxanty',
      area: 'Desarrollo y mantenimiento web',
      description: 'Desarrollo web con WordPress.',
      technologies: ['WordPress'],
    },
  ],
  education: [
    {
      title: 'Ingeniería Informática — Tecnologías Informáticas',
      institution: 'Universidad de Sevilla',
      status: 'Actualmente en curso',
    },
  ],
  languages: ['Inglés B2'],
  professionalTechnologies: ['WordPress'],
  trainingAndLabTechnologies: ['Linux', 'Snort'],
  orientation: ['Ciberseguridad', 'Desarrollo'],
  links: {
    github: 'https://github.com/alejandropena25-beep/cyber-portfolio',
  },
};

class FakePortfolioApiService {
  getProjects() {
    return of(projects);
  }

  getProject(slug: string) {
    return of(projects.find((project) => project.slug === slug) ?? null);
  }

  getProfile() {
    return of(profile);
  }
}

describe('Portfolio navigation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: PortfolioApiService, useClass: FakePortfolioApiService },
      ],
    }).compileComponents();
  });

  async function render(url: string) {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders API-backed profile and projects on the home page', async () => {
    const fixture = await render('/');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('nav')?.textContent).toContain('Proyectos');
    expect(element.querySelector('main h1')?.textContent).toContain('seguridad');
    expect(element.textContent).toContain('Alejandro Peña');
    expect(element.querySelectorAll('.project-card')).toHaveLength(projects.length);
    expect(element.querySelector('footer')?.textContent).toContain('Alejandro Peña');
  });

  it.each([
    ['/projects', 'Trabajo técnico'],
    ['/about', 'Desarrollo, sistemas y seguridad'],
    ['/contact', 'Conecta conmigo.'],
    ['/missing-page', 'Página no encontrada.'],
    ['/projects/missing-project', 'Página no encontrada.'],
  ])('renders %s', async (url, heading) => {
    const fixture = await render(url);
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      heading,
    );
  });

  it('renders an API-backed project from its slug', async () => {
    const fixture = await render('/projects/bunkerweb-waf');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe(
      'Protección de WordPress con BunkerWeb WAF',
    );
    expect(element.textContent).toContain('Resultados confirmados');
    expect(element.textContent).toContain('Documentación en revisión');
    expect(element.querySelector('a[href*="github.com"]')).toBeNull();
  });

  it('updates the detail when navigating between project slugs', async () => {
    const fixture = await render('/projects/soc-snort-elk');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe('Mini-SOC con Snort y Elastic/Kibana');

    await TestBed.inject(Router).navigateByUrl('/projects/mobile-security-mobsf-mstg');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('h1')?.textContent).toBe(
      'Análisis de InsecureBankv2 con MobSF y OWASP MSTG',
    );
    expect(element.textContent).toContain('observaciones del informe automático de MobSF');
  });

  it('separates implemented, in-progress and planned portfolio work', async () => {
    const fixture = await render('/projects/secure-portfolio-infrastructure');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.roadmap-column.implemented')?.textContent).toContain(
      'Angular 22',
    );
    expect(element.querySelector('.roadmap-column.progress')?.textContent).toContain(
      'NestJS Backend',
    );
    expect(element.querySelector('.roadmap-column.planned')?.textContent).toContain('PostgreSQL');
    expect(element.querySelector('a[href*="github.com"]')).toBeTruthy();
  });

  it('filters projects and supports an empty category', async () => {
    const fixture = await render('/projects');
    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll<HTMLButtonElement>('.filters button'));

    buttons.find((button) => button.textContent?.includes('Cybersecurity'))!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.project-card')).toHaveLength(3);

    buttons.find((button) => button.textContent?.includes('Development'))!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.project-card')).toHaveLength(0);
    expect(element.querySelector('.empty-state')?.textContent).toContain('Todavía no hay');

    buttons[0]!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.project-card')).toHaveLength(projects.length);
  });
});
