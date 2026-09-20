import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApiService } from './admin-api.service';
@Component({
  selector: 'app-admin-projects',
  imports: [RouterLink],
  template: `<section class="admin-panel">
    <div class="admin-panel-heading">
      <h2>Proyectos</h2>
      <a class="button" routerLink="/admin/projects/new">Nuevo proyecto</a>
    </div>
    @if (projects(); as projects) {
      <div class="admin-list">
        @for (project of projects; track project.id) {
          <article class="card">
            <div>
              <h3>{{ project.cardTitle }}</h3>
              <p>{{ project.slug }}</p>
            </div>
            <span class="status" [class.status-complete]="project.published">{{
              project.published ? 'Publicado' : 'Borrador'
            }}</span
            ><a [routerLink]="['/admin/projects', project.id, 'edit']">Editar</a>
          </article>
        }
      </div>
    } @else {
      <p role="status">Cargando proyectos…</p>
    }
  </section>`,
})
export class AdminProjects {
  private readonly api = inject(AdminApiService);
  readonly projects = toSignal(this.api.projects());
}
