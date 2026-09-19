import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `<p class="eyebrow">Sobre mí / Presentación</p>
    <h1>Aprender construyendo.</h1>
    <p class="lead">
      Este portfolio reúne tres áreas de interés: desarrollo, ciberseguridad y DevOps.
    </p>
    <section class="card section detail">
      <h2>Un espacio en evolución</h2>
      <p>
        La base del sitio está en desarrollo. La biografía, experiencia y competencias se
        incorporarán en la Fase 2: Portfolio Content.
      </p>
      <p>Mientras tanto, puedes explorar la estructura de los proyectos y sus categorías.</p>
      <a routerLink="/projects">Explorar proyectos →</a>
    </section>`,
})
export class About {}
