import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categories, ProjectCategory, projects } from './projects.data';
@Component({
  selector: 'app-projects',
  imports: [RouterLink],
  template: ` <p class="eyebrow">Explorar / Proyectos</p>
    <h1>Ideas en práctica.</h1>
    <p class="lead">Desarrollo, seguridad y operación en un mismo espacio.</p>
    <p class="notice">
      Datos de ejemplo para esta primera fase. El contenido definitivo llegará en la Fase 2.
    </p>
    <div class="filters" role="group" aria-label="Filtrar proyectos por categoría">
      <button type="button" [attr.aria-pressed]="selected() === null" (click)="selected.set(null)">
        Todos
      </button>
      @for (category of categories; track category) {
        <button
          type="button"
          [attr.aria-pressed]="selected() === category"
          (click)="selected.set(category)"
        >
          {{ category }}
        </button>
      }
    </div>
    <p class="result-count" role="status">{{ visibleProjects().length }} proyectos</p>
    <div class="grid">
      @for (project of visibleProjects(); track project.slug) {
        <article class="card project-card">
          <span class="tag">{{ project.category }}</span>
          <h2>
            <a [routerLink]="['/projects', project.slug]">{{ project.title }}</a>
          </h2>
          <p>{{ project.summary }}</p>
          <span class="example-label">Proyecto de ejemplo</span>
        </article>
      }
    </div>`,
})
export class Projects {
  protected readonly categories = categories;
  protected readonly selected = signal<ProjectCategory | null>(null);
  protected readonly visibleProjects = computed(() =>
    projects.filter((project) => this.selected() === null || project.category === this.selected()),
  );
}
