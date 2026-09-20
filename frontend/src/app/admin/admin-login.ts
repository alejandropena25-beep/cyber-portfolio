import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule],
  template: `<section class="admin-login card">
    <p class="eyebrow">Administración</p>
    <h1>Acceso privado</h1>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label
        >Correo electrónico<input type="email" formControlName="email" autocomplete="username"
      /></label>
      <label
        >Contraseña<input
          type="password"
          formControlName="password"
          autocomplete="current-password"
      /></label>
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
      <button class="button" type="submit" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Accediendo…' : 'Acceder' }}
      </button>
    </form>
  </section>`,
})
export class AdminLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  constructor() {
    inject(Title).setTitle('Acceso administrativo');
  }
  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth
      .login(email, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/admin'),
        error: () =>
          this.error.set(
            'No se pudo iniciar sesión. Revisa las credenciales e inténtalo de nuevo.',
          ),
      });
  }
}
