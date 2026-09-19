import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { projects } from './pages/projects.data';

describe('Portfolio navigation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  async function render(url: string) {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the shared layout and professional home content', async () => {
    const fixture = await render('/');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('nav')?.textContent).toContain('Proyectos');
    expect(element.querySelector('main h1')?.textContent).toContain('seguridad');
    expect(element.textContent).toContain('Alejandro Peña');
    expect(element.querySelectorAll('.project-card')).toHaveLength(projects.length);
    expect(element.querySelector('footer')?.textContent).toContain('Alejandro Peña');
    expect(element.querySelector('nav a[aria-current="page"]')?.textContent).toContain('Inicio');
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

  it('renders a real project from its slug', async () => {
    const fixture = await render('/projects/bunkerweb-waf');
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe(
      'Protección de WordPress con BunkerWeb WAF',
    );
    expect(element.textContent).toContain('Resultados confirmados');
    expect(element.textContent).toContain('Documentación en revisión');
    expect(element.querySelector('a[href*="github.com"]')).toBeNull();
  });

  it('updates the detail when navigating between real projects', async () => {
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
      'Portfolio Content',
    );
    expect(element.querySelector('.roadmap-column.planned')?.textContent).toContain('NestJS');
    expect(element.querySelector('a[href*="github.com"]')).toBeTruthy();
  });

  it('filters real projects and supports an empty category', async () => {
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
