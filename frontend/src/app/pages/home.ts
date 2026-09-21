import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PortfolioApiService } from '../data/portfolio-api.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    @if (profile(); as profile) {
      <section class="hero" aria-labelledby="home-title">
        <p class="eyebrow">{{ profile.name }} · Ciberseguridad y desarrollo web</p>
        <h1 id="home-title">
          Desarrollo software con una mirada orientada a <span class="accent">la seguridad.</span>
        </h1>
        <p class="lead">{{ profile.introduction }}</p>
        <p class="hero-support">{{ profile.professionalFocus }}</p>
        <div class="actions">
          <a class="button" routerLink="/projects"
            >Ver proyectos <span aria-hidden="true">↗</span></a
          >
          <a class="button secondary" routerLink="/about">Sobre mí</a>
          <a
            class="button secondary"
            [href]="profile.links.github"
            target="_blank"
            rel="noopener noreferrer"
            >Ver GitHub <span aria-hidden="true">↗</span></a
          >
        </div>
      </section>
    } @else {
      <p class="loading" role="status">Cargando perfil…</p>
    }

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

    <section class="section flagship" aria-labelledby="flagship-title">
      <div class="flagship-copy">
        <p class="eyebrow">Proyecto propio · DevSecOps completado</p>
        <h2 id="flagship-title">Este portfolio también es un proyecto.</h2>
        <p>La interfaz Angular SSR forma parte de una aplicación con API NestJS, PostgreSQL y Prisma. Docker Compose reproduce el sistema; GitHub Actions prueba, analiza y publica imágenes verificadas en GHCR.</p>
        <a class="button" routerLink="/projects/secure-portfolio-infrastructure">Explorar el caso de estudio <span aria-hidden="true">→</span></a>
      </div>
      <div class="flagship-proof" aria-label="Hitos implementados">
        <p class="proof-title">Implementado y validado en Phase 8</p>
        <ol>
          <li><span>01</span><strong>Aplicación</strong><small>Angular SSR · NestJS · PostgreSQL · Prisma</small></li>
          <li><span>02</span><strong>Entrega</strong><small>Docker Compose · GitHub Actions · GHCR</small></li>
          <li><span>03</span><strong>Seguridad</strong><small>Gitleaks · Dependency Review · CodeQL · Trivy · CycloneDX</small></li>
        </ol>
        <p class="proof-next"><strong>Siguiente hito:</strong> Kubernetes · planificado, aún sin implementar</p>
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
      @if (projects().length > 0) {
        <div class="project-grid">
          @for (project of projects(); track project.slug) {
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
      } @else {
        <p class="loading" role="status">Cargando proyectos…</p>
      }
    </section>
  `,
})
export class Home {
  private readonly portfolioApi = inject(PortfolioApiService);

  protected readonly profile = toSignal(this.portfolioApi.getProfile());
  protected readonly projects = toSignal(this.portfolioApi.getProjects(), {
    initialValue: [],
  });
}
