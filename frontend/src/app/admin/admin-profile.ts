import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminApiService } from './admin-api.service';
import type { AdminProfile } from './admin.models';

const lines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule],
  template: `<section class="admin-panel">
    <h2>Perfil</h2>
    @if (loading()) {
      <p role="status">Cargando perfil…</p>
    } @else {
      <form class="admin-form" [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <label>Nombre<input formControlName="name" /></label
          ><label>Titular<input formControlName="headline" /></label
          ><label>GitHub URL<input formControlName="githubUrl" /></label>
        </div>
        <label>Introducción<textarea formControlName="introduction"></textarea></label
        ><label>Enfoque profesional<textarea formControlName="professionalFocus"></textarea></label
        ><label>Idiomas — uno por línea<textarea formControlName="languages"></textarea></label
        ><label
          >Orientación — una por línea<textarea formControlName="orientation"></textarea></label
        ><label
          >Habilidades profesionales — una por línea<textarea
            formControlName="professionalSkills"
          ></textarea></label
        ><label
          >Habilidades de formación/laboratorio — una por línea<textarea
            formControlName="labSkills"
          ></textarea>
        </label>
        <p class="form-help">
          Experiencia y formación usan JSON estructurado para preservar todos sus campos y listas.
          El formulario valida el JSON antes de guardar.
        </p>
        <label
          >Experiencia (JSON)<textarea
            class="code-field"
            formControlName="experience"
          ></textarea></label
        ><label
          >Formación (JSON)<textarea class="code-field" formControlName="education"></textarea>
        </label>
        @if (message()) {
          <p class="form-success" role="status">{{ message() }}</p>
        }
        @if (error()) {
          <p class="form-error" role="alert">{{ error() }}</p>
        }
        <button class="button" type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Guardando…' : 'Guardar perfil' }}
        </button>
      </form>
    }
  </section>`,
})
export class AdminProfileEditor {
  private readonly api = inject(AdminApiService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = new FormGroup({
    name: this.required(),
    headline: this.required(),
    introduction: this.required(),
    professionalFocus: this.required(),
    githubUrl: this.required(),
    languages: new FormControl('', { nonNullable: true }),
    orientation: new FormControl('', { nonNullable: true }),
    professionalSkills: new FormControl('', { nonNullable: true }),
    labSkills: new FormControl('', { nonNullable: true }),
    experience: this.required(),
    education: this.required(),
  });
  constructor() {
    this.api
      .profile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => {
          this.form.setValue({
            name: p.name,
            headline: p.headline,
            introduction: p.introduction,
            professionalFocus: p.professionalFocus,
            githubUrl: p.githubUrl,
            languages: p.languages.join('\n'),
            orientation: p.orientation.join('\n'),
            professionalSkills: p.skills
              .filter((s) => s.group === 'PROFESSIONAL')
              .map((s) => s.name)
              .join('\n'),
            labSkills: p.skills
              .filter((s) => s.group === 'TRAINING_AND_LAB')
              .map((s) => s.name)
              .join('\n'),
            experience: JSON.stringify(p.experience, null, 2),
            education: JSON.stringify(p.education, null, 2),
          });
          this.form.markAsPristine();
        },
        error: () => this.error.set('No se pudo cargar el perfil.'),
      });
  }
  private required() {
    return new FormControl('', { nonNullable: true, validators: [Validators.required] });
  }
  save() {
    if (
      this.form.invalid ||
      (this.form.dirty && !confirm('¿Guardar los cambios del perfil público?'))
    )
      return;
    this.error.set('');
    this.message.set('');
    let experience: AdminProfile['experience'];
    let education: AdminProfile['education'];
    try {
      experience = JSON.parse(this.form.controls.experience.value) as AdminProfile['experience'];
      education = JSON.parse(this.form.controls.education.value) as AdminProfile['education'];
      if (!Array.isArray(experience) || !Array.isArray(education)) throw new Error();
    } catch {
      this.error.set('Experiencia y formación deben contener arrays JSON válidos.');
      return;
    }
    const v = this.form.getRawValue();
    const profile: AdminProfile = {
      name: v.name,
      headline: v.headline,
      introduction: v.introduction,
      professionalFocus: v.professionalFocus,
      githubUrl: v.githubUrl,
      languages: lines(v.languages),
      orientation: lines(v.orientation),
      experience,
      education,
      skills: [
        ...lines(v.professionalSkills).map((name) => ({ name, group: 'PROFESSIONAL' as const })),
        ...lines(v.labSkills).map((name) => ({ name, group: 'TRAINING_AND_LAB' as const })),
      ],
    };
    this.saving.set(true);
    this.api
      .updateProfile(profile)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.message.set('Perfil guardado.');
          this.form.markAsPristine();
        },
        error: () => this.error.set('No se pudo guardar. Revisa los campos y vuelve a intentarlo.'),
      });
  }
}
