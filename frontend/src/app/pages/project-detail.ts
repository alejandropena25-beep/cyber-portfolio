import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { projects } from './projects.data';
import { NotFound } from './not-found';
@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, NotFound],
  template: ` @if (project(); as project) {
      <a class="back-link" routerLink="/projects">← Todos los proyectos</a>
      <article class="detail">
        <p class="eyebrow">{{ project.category }} / Ejemplo</p>
        <h1>{{ project.title }}</h1>
        <p class="lead">{{ project.summary }}</p>
        <section class="card section" aria-labelledby="description-title">
          <h2 id="description-title">Sobre el proyecto</h2>
          <p>{{ project.description }}</p>
        </section>
        <p class="notice">Ficha provisional. Contenido y evidencias pendientes de la Fase 2.</p>
      </article>
    } @else {
      <app-not-found />
    }`,
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly project = computed(() =>
    projects.find((project) => project.slug === this.params().get('slug')),
  );
}
