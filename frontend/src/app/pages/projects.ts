import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categories, ProjectCategory, projects } from './projects.data';

@Component({
  selector: 'app-projects',
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <p class="eyebrow">Portfolio / Proyectos</p>
      <h1>Trabajo técnico, contexto y decisiones.</h1>
      <p class="lead">
        Laboratorios académicos y un proyecto personal centrados en ciberseguridad, monitorización,
        desarrollo e infraestructura.
      </p>
    </header>

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

    <p class="result-count" aria-live="polite">
      {{ visibleProjects().length }}
      {{ visibleProjects().length === 1 ? 'proyecto' : 'proyectos' }}
    </p>

    @if (visibleProjects().length > 0) {
      <div class="project-grid">
        @for (project of visibleProjects(); track project.slug) {
          <article class="card project-card">
            <div class="project-meta">
              <span class="tag">{{ project.category }}</span>
              <span class="status">{{ project.status }}</span>
            </div>
            <h2>
              <a [routerLink]="['/projects', project.slug]">{{ project.cardTitle }}</a>
            </h2>
            <p class="project-type">{{ project.type }}</p>
            <p>{{ project.summary }}</p>
            <ul class="chip-list compact" aria-label="Tecnologías principales">
              @for (technology of project.technologies.slice(0, 4); track technology) {
                <li>{{ technology }}</li>
              }
            </ul>
            <span class="card-link" aria-hidden="true">Ver proyecto →</span>
          </article>
        }
      </div>
    } @else {
      <p class="empty-state">
        Todavía no hay un proyecto publicado en esta categoría. El filtro se mantiene para futuros
        proyectos reales.
      </p>
    }
  `,
})
export class Projects {
  protected readonly categories = categories;
  protected readonly selected = signal<ProjectCategory | null>(null);
  protected readonly visibleProjects = computed(() =>
    projects.filter((project) => this.selected() === null || project.category === this.selected()),
  );
}
