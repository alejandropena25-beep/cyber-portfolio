import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-contact',
  imports: [RouterLink],
  template: `<header class="page-header">
      <p class="eyebrow">Contacto</p>
      <h1>Conecta conmigo.</h1>
      <p class="lead">
        Puedes consultar el código y la evolución de este portfolio en su repositorio público.
      </p>
    </header>
    <section class="card section callout">
      <p class="card-kicker">Canal público confirmado</p>
      <h2>GitHub</h2>
      <p>LinkedIn y el currículum se incorporarán cuando sus enlaces públicos estén confirmados.</p>
      <div class="actions">
        <a
          class="button"
          href="https://github.com/alejandropena25-beep/cyber-portfolio"
          target="_blank"
          rel="noopener noreferrer"
          >Ver repositorio en GitHub <span aria-hidden="true">↗</span></a
        >
        <a class="button secondary" routerLink="/projects">Ver proyectos</a>
      </div>
    </section>`,
})
export class Contact {}
