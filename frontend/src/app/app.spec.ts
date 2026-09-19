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

  it('renders the shared layout and home', async () => {
    const fixture = await render('/');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nav')?.textContent).toContain('Proyectos');
    expect(element.querySelector('main h1')?.textContent).toContain('Construir.');
    expect(element.querySelector('footer')?.textContent).toContain('Cyber Portfolio');
    expect(element.querySelector('nav a[aria-current="page"]')?.textContent).toContain('Inicio');
  });

  it.each([
    ['/projects', 'Ideas en práctica.'],
    ['/about', 'Aprender construyendo.'],
    ['/contact', 'Una conversación'],
    ['/missing-page', 'Página no encontrada.'],
    ['/projects/missing-project', 'Página no encontrada.'],
  ])('renders %s', async (url, heading) => {
    const fixture = await render(url);
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      heading,
    );
  });

  it('updates the project when navigating between slugs', async () => {
    const fixture = await render('/projects/security-notebook');
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toBe('Cuaderno de seguridad');
    await TestBed.inject(Router).navigateByUrl('/projects/portfolio-interface');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('h1')?.textContent).toBe('Interfaz del portfolio');
  });

  it('filters local projects and restores the complete list', async () => {
    const fixture = await render('/projects');
    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll<HTMLButtonElement>('.filters button'));
    buttons.find((button) => button.textContent?.includes('Cybersecurity'))!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelectorAll('.project-card')).toHaveLength(1);
    expect(element.querySelector('.project-card h2')?.textContent).toContain(
      'Cuaderno de seguridad',
    );
    buttons[0]!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelectorAll('.project-card')).toHaveLength(projects.length);
  });
});
