import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `<footer class="site-footer">
    <div class="container footer-content">
      <p>© Alejandro Peña · Desarrollo web y ciberseguridad</p>
      <a routerLink="/contact">Contacto ↗</a>
    </div>
  </footer>`,
})
export class Footer {}
