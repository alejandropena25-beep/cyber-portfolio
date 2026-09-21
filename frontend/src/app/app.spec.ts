import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { PortfolioApiService } from './data/portfolio-api.service';
import { Project, PublicProfile } from './data/portfolio.models';
import { signal } from '@angular/core';
import { AuthService } from './admin/auth.service';
import { AdminApiService } from './admin/admin-api.service';
import type { AdminProfile, AdminProject } from './admin/admin.models';

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
    workPerformed: ['Se realizó el análisis del laboratorio.'],
    confirmedResults: ['MobSF mostró 4 de 10 activities como exportadas.'],
  },
  {
    slug: 'secure-portfolio-infrastructure',
    cardTitle: 'Secure Portfolio Infrastructure',
    title: 'Secure Portfolio Infrastructure',
    category: 'DevOps',
    type: 'Proyecto personal',
    status: 'En curso',
    summary: 'Aplicación Angular SSR y NestJS con PostgreSQL y entrega verificada.',
    objective: 'Construir una demostración técnica progresiva.',
    technologies: ['Angular SSR', 'NestJS', 'PostgreSQL 18', 'Prisma 7'],
    repository: 'https://github.com/alejandropena25-beep/cyber-portfolio',
    roadmap: {
      implemented: ['Angular SSR', 'PostgreSQL 18', 'DevSecOps'],
      inProgress: ['Kubernetes (aún sin implementar)'],
      planned: ['WAF / protección perimetral'],
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
    expect(element.querySelector('.flagship')?.textContent).toContain('Este portfolio también es un proyecto');
    expect(element.querySelector('.flagship a')?.getAttribute('href')).toBe('/projects/secure-portfolio-infrastructure');
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

  it.each(projects.map((project) => [project.slug]))(
    'keeps main sections in one column and numbers visible sections consecutively for %s',
    async (slug) => {
      const fixture = await render(`/projects/${slug}`);
      const element = fixture.nativeElement as HTMLElement;
      const layout = element.querySelector('.detail-layout');
      const content = element.querySelector('.detail-content');
      const sidebar = element.querySelector('.project-sidebar');
      const sections = Array.from(content!.querySelectorAll(':scope > .detail-section'));
      const numbers = sections.map((section) => section.querySelector('.section-number')?.textContent?.trim());

      expect(layout?.firstElementChild).toBe(content);
      expect(layout?.lastElementChild).toBe(sidebar);
      expect(numbers).toEqual(sections.map((_, index) => String(index + 1).padStart(2, '0')));
      expect(sections[0]?.querySelector('h2')?.textContent).toBe('Objetivo');
    },
  );

  it('separates implemented, in-progress and planned portfolio work', async () => {
    const fixture = await render('/projects/secure-portfolio-infrastructure');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.roadmap-column.implemented')?.textContent).toContain(
      'Angular SSR',
    );
    expect(element.querySelector('.roadmap-column.progress')?.textContent).toContain(
      'Kubernetes',
    );
    expect(element.querySelector('.roadmap-column.planned')?.textContent).toContain('WAF');
    expect(element.querySelector('app-portfolio-case-study')).toBeTruthy();
    expect(element.querySelector('.system-flow')?.textContent).toContain('PostgreSQL 18');
    expect(element.querySelector('.delivery-flow')?.textContent).toContain('Pull request');
    expect(element.querySelector('.delivery-flow')?.textContent).toContain('GHCR');
    expect(element.querySelector('.evidence-grid')?.textContent).toContain('47 / 47');
    expect(element.querySelectorAll('.decision-list details')).toHaveLength(4);
    expect(element.querySelector('a[href*="github.com"]')).toBeTruthy();
  });

  it('labels case-study evidence as a validated milestone and keeps future work separate', async () => {
    const fixture = await render('/projects/secure-portfolio-infrastructure');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#evidence-title')?.textContent).toBe('Pruebas y análisis');
    expect(element.querySelector('app-portfolio-case-study')?.textContent).toContain('no telemetría en directo');
    expect(element.querySelector('#remediation-title')?.textContent).toContain('Dos hallazgos HIGH');
    expect(element.querySelector('.roadmap-column.implemented')?.textContent).not.toContain('Kubernetes');
    expect(element.querySelector('.roadmap-column.progress')?.textContent).toContain('aún sin implementar');
    expect(element.querySelector('.decision-list summary')?.tagName).toBe('SUMMARY');
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

const adminProject: AdminProject = {
  id: 1,
  slug: 'test-project',
  cardTitle: 'Test project',
  pageTitle: 'Test project page',
  summary: 'Admin summary',
  objective: 'Admin objective',
  category: 'CYBERSECURITY',
  type: 'Laboratorio',
  status: 'Borrador',
  repositoryUrl: null,
  architectureDescription: null,
  published: false,
  sortOrder: 0,
  technologies: ['Angular'],
  sections: [],
  roadmap: [],
};

const adminProfile: AdminProfile = {
  name: 'Test Admin Profile',
  headline: 'Headline',
  introduction: 'Introduction',
  professionalFocus: 'Focus',
  githubUrl: 'https://example.invalid/profile',
  languages: ['English'],
  orientation: ['Security'],
  experience: [],
  education: [],
  skills: [],
};

class FakeAuthService {
  readonly user = signal<{ id: number; email: string; role: 'ADMIN' } | null>(null);
  authenticated = false;
  loginCalls = 0;
  login() {
    this.loginCalls += 1;
    const user = { id: 1, email: 'admin@example.invalid', role: 'ADMIN' as const };
    this.user.set(user);
    return of({ user });
  }
  checkSession() {
    if (this.authenticated) this.user.set({ id: 1, email: 'admin@example.invalid', role: 'ADMIN' });
    return of(this.authenticated);
  }
  logout() {
    this.user.set(null);
    return of(undefined);
  }
}

class FakeAdminApiService {
  updateCalls = 0;
  projectResponse: Observable<AdminProject> = of(adminProject);
  profileResponse: Observable<AdminProfile> = of(adminProfile);
  projects() {
    return of([adminProject]);
  }
  project() {
    return this.projectResponse;
  }
  createProject() {
    return of(adminProject);
  }
  updateProject() {
    this.updateCalls += 1;
    return of(adminProject);
  }
  profile() {
    return this.profileResponse;
  }
  updateProfile() {
    return of(adminProfile);
  }
}

describe('Administration UI', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: PortfolioApiService, useClass: FakePortfolioApiService },
        { provide: AuthService, useClass: FakeAuthService },
        { provide: AdminApiService, useClass: FakeAdminApiService },
      ],
    }).compileComponents();
  });

  async function renderAdmin(url: string) {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders and submits the login UI', async () => {
    const fixture = await renderAdmin('/admin/login');
    const element = fixture.nativeElement as HTMLElement;
    const inputs = element.querySelectorAll<HTMLInputElement>('input');
    inputs[0]!.value = 'admin@example.invalid';
    inputs[0]!.dispatchEvent(new Event('input'));
    inputs[1]!.value = 'test-password';
    inputs[1]!.dispatchEvent(new Event('input'));
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(TestBed.inject(AuthService) as unknown as FakeAuthService).toMatchObject({
      loginCalls: 1,
    });
  });

  it('redirects an unauthenticated admin route to login', async () => {
    await renderAdmin('/admin');
    expect(TestBed.inject(Router).url).toBe('/admin/login');
  });

  it('allows an authenticated administrator to reach the dashboard', async () => {
    const auth = TestBed.inject(AuthService) as unknown as FakeAuthService;
    auth.authenticated = true;
    const fixture = await renderAdmin('/admin');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Gestiona el contenido público',
    );
  });

  it('loads project data into the editing UI and saves an edit', async () => {
    const auth = TestBed.inject(AuthService) as unknown as FakeAuthService;
    auth.authenticated = true;
    const fixture = await renderAdmin('/admin/projects/1/edit');
    const element = fixture.nativeElement as HTMLElement;
    const summary = element.querySelector<HTMLTextAreaElement>(
      'textarea[formControlName="summary"]',
    )!;
    expect(summary.value).toBe('Admin summary');
    summary.value = 'Changed summary';
    summary.dispatchEvent(new Event('input'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    element.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    expect((TestBed.inject(AdminApiService) as unknown as FakeAdminApiService).updateCalls).toBe(1);
  });

  it('reactively replaces the profile loading state when an async response arrives', async () => {
    const auth = TestBed.inject(AuthService) as unknown as FakeAuthService;
    const api = TestBed.inject(AdminApiService) as unknown as FakeAdminApiService;
    const response = new Subject<AdminProfile>();
    auth.authenticated = true;
    api.profileResponse = response;
    const fixture = await renderAdmin('/admin/profile');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando');

    response.next(adminProfile);
    response.complete();
    await fixture.whenStable();

    expect(element.querySelector<HTMLInputElement>('input[formControlName="name"]')?.value).toBe(
      adminProfile.name,
    );
    expect(element.querySelector('[role="status"]')).toBeNull();
  });

  it('reactively replaces the project loading state when an async response arrives', async () => {
    const auth = TestBed.inject(AuthService) as unknown as FakeAuthService;
    const api = TestBed.inject(AdminApiService) as unknown as FakeAdminApiService;
    const response = new Subject<AdminProject>();
    auth.authenticated = true;
    api.projectResponse = response;
    const fixture = await renderAdmin('/admin/projects/1/edit');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando');

    response.next(adminProject);
    response.complete();
    await fixture.whenStable();

    expect(
      element.querySelector<HTMLInputElement>('input[formControlName="cardTitle"]')?.value,
    ).toBe(adminProject.cardTitle);
    expect(element.querySelector('[role="status"]')).toBeNull();
  });
});
