import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PortfolioApiService } from '../data/portfolio-api.service';

@Component({
  selector: 'app-contact',
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <p class="eyebrow">Contacto</p>
      <h1>Conecta conmigo.</h1>
      <p class="lead">
        Puedes consultar el código y la evolución de este portfolio en su repositorio público.
      </p>
    </header>
    <section class="card section callout">
      <p class="card-kicker">Canal público confirmado</p>
      <h2>GitHub</h2>
      <div class="actions">
        @if (profile(); as profile) {
          <a class="button" [href]="profile.links.github" target="_blank" rel="noopener noreferrer"
            >Ver repositorio en GitHub <span aria-hidden="true">↗</span></a
          >
        }
        <a class="button secondary" routerLink="/projects">Ver proyectos</a>
      </div>
    </section>
  `,
})
export class Contact {
  private readonly portfolioApi = inject(PortfolioApiService);
  protected readonly profile = toSignal(this.portfolioApi.getProfile());
}
