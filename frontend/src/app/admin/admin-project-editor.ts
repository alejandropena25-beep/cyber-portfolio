import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminApiService } from './admin-api.service';
import type {
  AdminProject,
  AdminProjectInput,
  ProjectSectionValue,
  RoadmapStageValue,
} from './admin.models';

const lines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
@Component({
  selector: 'app-admin-project-editor',
  imports: [ReactiveFormsModule, RouterLink],
  template: `<section class="admin-panel">
    <a routerLink="/admin/projects">← Proyectos</a>
    <h2>{{ id ? 'Editar proyecto' : 'Nuevo proyecto' }}</h2>
    @if (loading()) {
      <p role="status">Cargando…</p>
    } @else {
      <form class="admin-form" [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <label>Título de tarjeta<input formControlName="cardTitle" /></label
          ><label>Título de página<input formControlName="pageTitle" /></label
          ><label>Slug<input formControlName="slug" /></label
          ><label
            >Categoría<select formControlName="category">
              <option value="CYBERSECURITY">Cybersecurity</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="DEVOPS">DevOps</option>
            </select></label
          ><label>Tipo<input formControlName="type" /></label
          ><label>Estado<input formControlName="status" /></label
          ><label>Orden<input type="number" min="0" formControlName="sortOrder" /></label
          ><label class="checkbox"
            ><input type="checkbox" formControlName="published" /> Publicado</label
          >
        </div>
        <label>Resumen<textarea formControlName="summary"></textarea></label
        ><label>Objetivo<textarea formControlName="objective"></textarea></label
        ><label>Repositorio URL<input formControlName="repositoryUrl" /></label
        ><label
          >Descripción de arquitectura<textarea
            formControlName="architectureDescription"
          ></textarea>
        </label>
        <p class="form-help">
          Introduce un elemento por línea. En problemas usa “Título | Descripción”.
        </p>
        <label>Tecnologías<textarea formControlName="technologies"></textarea></label
        ><label>Arquitectura<textarea formControlName="architecture"></textarea></label
        ><label>Trabajo realizado<textarea formControlName="workPerformed"></textarea></label
        ><label>Resultados<textarea formControlName="results"></textarea></label
        ><label>Problemas<textarea formControlName="problems"></textarea></label
        ><label>Aprendizajes<textarea formControlName="lessons"></textarea></label
        ><label>Documentación<textarea formControlName="documentation"></textarea></label
        ><label>Roadmap implementado<textarea formControlName="implemented"></textarea></label
        ><label>Roadmap en curso<textarea formControlName="inProgress"></textarea></label
        ><label>Roadmap planificado<textarea formControlName="planned"></textarea></label>
        @if (message()) {
          <p class="form-success" role="status">{{ message() }}</p>
        }
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
        <button class="button" type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Guardando…' : 'Guardar proyecto' }}
        </button>
      </form>
    }
  </section>`,
})
export class AdminProjectEditor {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || 0;
  readonly loading = signal(!!this.id);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = new FormGroup({
    slug: this.required(),
    cardTitle: this.required(),
    pageTitle: this.required(),
    summary: this.required(),
    objective: this.required(),
    category: new FormControl<'CYBERSECURITY' | 'DEVELOPMENT' | 'DEVOPS'>('CYBERSECURITY', {
      nonNullable: true,
    }),
    type: this.required(),
    status: this.required(),
    repositoryUrl: new FormControl('', { nonNullable: true }),
    architectureDescription: new FormControl('', { nonNullable: true }),
    published: new FormControl(false, { nonNullable: true }),
    sortOrder: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    technologies: new FormControl('', { nonNullable: true }),
    architecture: new FormControl('', { nonNullable: true }),
    workPerformed: new FormControl('', { nonNullable: true }),
    results: new FormControl('', { nonNullable: true }),
    problems: new FormControl('', { nonNullable: true }),
    lessons: new FormControl('', { nonNullable: true }),
    documentation: new FormControl('', { nonNullable: true }),
    implemented: new FormControl('', { nonNullable: true }),
    inProgress: new FormControl('', { nonNullable: true }),
    planned: new FormControl('', { nonNullable: true }),
  });
  constructor() {
    if (this.id)
      this.api
        .project(this.id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (p) => this.populate(p),
          error: () => this.error.set('No se pudo cargar el proyecto.'),
        });
  }
  private required() {
    return new FormControl('', { nonNullable: true, validators: [Validators.required] });
  }
  private populate(p: AdminProject) {
    const section = (name: ProjectSectionValue) =>
      p.sections
        .filter((i) => i.section === name)
        .map((i) => (i.section === 'PROBLEM' ? `${i.title ?? ''} | ${i.content}` : i.content))
        .join('\n');
    const road = (stage: RoadmapStageValue) =>
      p.roadmap
        .filter((i) => i.stage === stage)
        .map((i) => i.content)
        .join('\n');
    this.form.patchValue({
      ...p,
      repositoryUrl: p.repositoryUrl ?? '',
      architectureDescription: p.architectureDescription ?? '',
      technologies: p.technologies.join('\n'),
      architecture: section('ARCHITECTURE'),
      workPerformed: section('WORK_PERFORMED'),
      results: section('RESULT'),
      problems: section('PROBLEM'),
      lessons: section('LESSON'),
      documentation: section('DOCUMENTATION'),
      implemented: road('IMPLEMENTED'),
      inProgress: road('IN_PROGRESS'),
      planned: road('PLANNED'),
    });
    this.form.markAsPristine();
  }
  private input(): AdminProjectInput {
    const v = this.form.getRawValue();
    const section = (field: keyof typeof v, name: ProjectSectionValue) =>
      lines(String(v[field])).map((content, sortOrder) =>
        name === 'PROBLEM'
          ? {
              section: name,
              title: content.split('|', 1)[0]?.trim() || null,
              content: content.includes('|')
                ? content.slice(content.indexOf('|') + 1).trim()
                : content,
              sortOrder,
            }
          : { section: name, title: null, content, sortOrder },
      );
    const road = (field: keyof typeof v, stage: RoadmapStageValue) =>
      lines(String(v[field])).map((content, sortOrder) => ({ stage, content, sortOrder }));
    return {
      slug: v.slug,
      cardTitle: v.cardTitle,
      pageTitle: v.pageTitle,
      summary: v.summary,
      objective: v.objective,
      category: v.category,
      type: v.type,
      status: v.status,
      repositoryUrl: v.repositoryUrl || null,
      architectureDescription: v.architectureDescription || null,
      published: v.published,
      sortOrder: v.sortOrder,
      technologies: lines(v.technologies),
      sections: [
        ...section('architecture', 'ARCHITECTURE'),
        ...section('workPerformed', 'WORK_PERFORMED'),
        ...section('results', 'RESULT'),
        ...section('problems', 'PROBLEM'),
        ...section('lessons', 'LESSON'),
        ...section('documentation', 'DOCUMENTATION'),
      ],
      roadmap: [
        ...road('implemented', 'IMPLEMENTED'),
        ...road('inProgress', 'IN_PROGRESS'),
        ...road('planned', 'PLANNED'),
      ],
    };
  }
  save() {
    if (
      this.form.invalid ||
      (this.form.dirty && !confirm('¿Guardar los cambios de este proyecto?'))
    )
      return;
    this.saving.set(true);
    this.error.set('');
    const action = this.id
      ? this.api.updateProject(this.id, this.input())
      : this.api.createProject(this.input());
    action.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (project) => {
        this.message.set('Proyecto guardado.');
        this.form.markAsPristine();
        if (!this.id) void this.router.navigate(['/admin/projects', project.id, 'edit']);
      },
      error: () => this.error.set('No se pudo guardar. Revisa los campos y vuelve a intentarlo.'),
    });
  }
}
