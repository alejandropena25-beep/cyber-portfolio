import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<section class="admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Área privada</p>
        <h1>Administración</h1>
      </div>
      <button class="button secondary" type="button" (click)="logout()">Cerrar sesión</button>
    </header>
    <nav class="admin-nav" aria-label="Administración">
      <a routerLink="/admin" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active"
        >Resumen</a
      >
      <a routerLink="/admin/projects" routerLinkActive="active">Proyectos</a>
      <a routerLink="/admin/profile" routerLinkActive="active">Perfil</a>
    </nav>
    <router-outlet />
  </section>`,
})
export class AdminShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  logout() {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/admin/login'),
      error: () => void this.router.navigateByUrl('/admin/login'),
    });
  }
}
