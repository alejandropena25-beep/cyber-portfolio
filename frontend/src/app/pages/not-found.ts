import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `<p class="eyebrow">Error 404</p>
    <h1>Página no encontrada.</h1>
    <p class="lead">La dirección o el proyecto que buscas no existe.</p>
    <a class="button" routerLink="/">Volver al inicio →</a>`,
})
export class NotFound {}
