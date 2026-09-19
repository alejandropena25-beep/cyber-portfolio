import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: ` <section class="hero" aria-labelledby="home-title">
      <p class="eyebrow">Cyber Portfolio / En construcción</p>
      <h1 id="home-title">Construir.<br /><span class="accent">Proteger.</span><br />Mejorar.</h1>
      <p class="lead">
        Un espacio para explorar desarrollo, ciberseguridad y DevOps a través de proyectos y
        aprendizaje práctico.
      </p>
      <div class="actions">
        <a class="button" routerLink="/projects">Explorar proyectos ↗</a
        ><a class="button secondary" routerLink="/about">Sobre el portfolio</a>
      </div>
    </section>
    <section class="section" aria-labelledby="areas-title">
      <p class="eyebrow">Tres áreas, una visión</p>
      <h2 id="areas-title">Del código a la operación</h2>
      <div class="grid">
        <article class="card">
          <span class="index">01 /</span>
          <h3>Cybersecurity</h3>
          <p>Comprender riesgos y desarrollar una mirada orientada a la seguridad.</p>
        </article>
        <article class="card">
          <span class="index">02 /</span>
          <h3>Development</h3>
          <p>Crear interfaces claras y aplicaciones mantenibles.</p>
        </article>
        <article class="card">
          <span class="index">03 /</span>
          <h3>DevOps</h3>
          <p>Explorar cómo se construye, entrega y mantiene el software.</p>
        </article>
      </div>
    </section>`,
})
export class Home {}
