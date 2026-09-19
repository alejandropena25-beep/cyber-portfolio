import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: ` <header class="site-header">
    <div class="container header-content">
      <a class="brand" routerLink="/" aria-label="Alejandro Peña, inicio"
        ><span aria-hidden="true">&lt;/&gt;</span> Alejandro Peña</a
      >
      <nav aria-label="Navegación principal">
        <a
          routerLink="/"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page"
          >Inicio</a
        >
        <a routerLink="/projects" routerLinkActive="active" ariaCurrentWhenActive="page"
          >Proyectos</a
        >
        <a routerLink="/about" routerLinkActive="active" ariaCurrentWhenActive="page">Sobre mí</a>
        <a routerLink="/contact" routerLinkActive="active" ariaCurrentWhenActive="page">Contacto</a>
      </nav>
    </div>
  </header>`,
})
export class Header {}
