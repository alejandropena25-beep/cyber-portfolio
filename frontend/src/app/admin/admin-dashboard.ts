import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  template: `<section class="admin-panel">
    <h2>Resumen</h2>
    <p>
      Gestiona el contenido público sin exponer las rutas administrativas en la navegación pública.
    </p>
    <div class="admin-actions">
      <a class="card" routerLink="/admin/projects"
        ><h3>Proyectos</h3>
        <p>Crear, editar, ordenar y publicar proyectos.</p></a
      ><a class="card" routerLink="/admin/profile"
        ><h3>Perfil</h3>
        <p>Actualizar experiencia, formación y habilidades.</p></a
      >
    </div>
  </section>`,
})
export class AdminDashboard {}
