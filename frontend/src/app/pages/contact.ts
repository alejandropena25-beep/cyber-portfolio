import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-contact',
  imports: [RouterLink],
  template: `<p class="eyebrow">Contacto</p>
    <h1>Una conversación<br />puede ser el inicio.</h1>
    <p class="lead">Un espacio para conectar y compartir ideas sobre tecnología.</p>
    <section class="card section detail">
      <h2>Canales de contacto</h2>
      <p>
        Los enlaces profesionales y el correo de contacto se añadirán en la Fase 2, junto con el
        contenido personal del portfolio.
      </p>
      <p>Por ahora, esta página no recoge ni envía mensajes.</p>
      <a routerLink="/projects">Ver los proyectos de ejemplo →</a>
    </section>`,
})
export class Contact {}
