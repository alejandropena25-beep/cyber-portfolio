import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { projects } from './projects.data';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="hero" aria-labelledby="home-title">
      <p class="eyebrow">Alejandro Peña · Desarrollo web y ciberseguridad</p>
      <h1 id="home-title">
        Desarrollo software con una mirada orientada a la <span class="accent">seguridad.</span>
      </h1>
      <p class="lead">
        Soy desarrollador web con formación en Desarrollo de Aplicaciones Web y ciberseguridad.
        Actualmente curso Ingeniería Informática en la Universidad de Sevilla.
      </p>
      <p class="hero-support">
        La ciberseguridad es el foco principal de este portfolio, con el desarrollo como base
        profesional y DevOps / DevSecOps como área de evolución.
      </p>
      <div class="actions">
        <a class="button" routerLink="/projects">Ver proyectos <span aria-hidden="true">↗</span></a>
        <a class="button secondary" routerLink="/about">Sobre mí</a>
        <a
          class="button secondary"
          href="https://github.com/alejandropena25-beep/cyber-portfolio"
          target="_blank"
          rel="noopener noreferrer"
          >Ver GitHub <span aria-hidden="true">↗</span></a
        >
      </div>
    </section>

    <section class="section" aria-labelledby="areas-title">
      <p class="eyebrow">Perfil</p>
      <h2 id="areas-title">Tres áreas conectadas</h2>
      <div class="grid">
        <article class="card">
          <span class="index">01 / Foco principal</span>
          <h3>Cybersecurity</h3>
          <p>
            Laboratorios de seguridad web, monitorización, análisis de eventos y seguridad de
            aplicaciones móviles.
          </p>
        </article>
        <article class="card">
          <span class="index">02 / Base profesional</span>
          <h3>Development</h3>
          <p>
            Experiencia en desarrollo y mantenimiento web, junto con proyectos construidos con
            tecnologías frontend.
          </p>
        </article>
        <article class="card">
          <span class="index">03 / Evolución</span>
          <h3>DevOps / DevSecOps</h3>
          <p>
            Un área de evolución profesional centrada en automatización, infraestructura y seguridad
            durante el ciclo de vida del software.
          </p>
        </article>
      </div>
    </section>

    <section class="section" aria-labelledby="featured-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Trabajo seleccionado</p>
          <h2 id="featured-title">Proyectos destacados</h2>
        </div>
        <a routerLink="/projects">Ver todos los proyectos <span aria-hidden="true">→</span></a>
      </div>
      <div class="project-grid">
        @for (project of projects; track project.slug) {
          <article class="card project-card">
            <div class="project-meta">
              <span class="tag">{{ project.category }}</span>
              <span class="status">{{ project.status }}</span>
            </div>
            <h3>
              <a [routerLink]="['/projects', project.slug]">{{ project.cardTitle }}</a>
            </h3>
            <p>{{ project.summary }}</p>
            <span class="card-link" aria-hidden="true">Ver proyecto →</span>
          </article>
        }
      </div>
    </section>
  `,
})
export class Home {
  protected readonly projects = projects;
}
