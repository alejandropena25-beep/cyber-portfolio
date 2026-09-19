import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `<footer class="site-footer">
    <div class="container footer-content">
      <p>Cyber Portfolio / Desarrollo · Seguridad · DevOps</p>
      <a routerLink="/contact">Contacto ↗</a>
    </div>
  </footer>`,
})
export class Footer {}
