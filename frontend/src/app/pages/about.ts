import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PortfolioApiService } from '../data/portfolio-api.service';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
    @if (profile(); as profile) {
      <header class="page-header">
        <p class="eyebrow">Sobre mí</p>
        <h1>Desarrollo, sistemas y seguridad como partes de un mismo proceso.</h1>
        <p class="lead">{{ profile.introduction }}</p>
        <p>{{ profile.professionalFocus }}</p>
      </header>

      <section class="section" aria-labelledby="experience-title">
        <p class="eyebrow">Trayectoria</p>
        <h2 id="experience-title">Experiencia profesional</h2>
        <div class="experience-list">
          @for (experience of profile.experience; track experience.organization) {
            <article class="card">
              <p class="card-kicker">{{ experience.area }}</p>
              <h3>
                {{ experience.organization }}
                @if (experience.context) {
                  <span class="context">· {{ experience.context }}</span>
                }
              </h3>
              <p>{{ experience.description }}</p>
              @if (experience.activities?.length) {
                <ul class="plain-list">
                  @for (activity of experience.activities; track activity) {
                    <li>{{ activity }}</li>
                  }
                </ul>
              }
              @if (experience.technologies?.length) {
                <ul class="chip-list" aria-label="Tecnologías utilizadas profesionalmente">
                  @for (technology of experience.technologies; track technology) {
                    <li>{{ technology }}</li>
                  }
                </ul>
              }
            </article>
          }
        </div>
      </section>

      <section class="section" aria-labelledby="education-title">
        <p class="eyebrow">Formación</p>
        <h2 id="education-title">Formación académica</h2>
        <div class="timeline">
          @for (education of profile.education; track education.title) {
            <article class="timeline-item">
              <span
                class="status"
                [class.status-progress]="education.status === 'Actualmente en curso'"
                [class.status-complete]="education.status === 'Completado'"
                >{{ education.status }}</span
              >
              <h3>{{ education.title }}</h3>
              @if (education.institution) {
                <p>{{ education.institution }}</p>
              }
            </article>
          }
          @for (language of profile.languages; track language) {
            <article class="timeline-item">
              <span class="status">Nivel confirmado</span>
              <h3>{{ language }}</h3>
            </article>
          }
        </div>
      </section>

      <section class="section" aria-labelledby="skills-title">
        <p class="eyebrow">Competencias</p>
        <h2 id="skills-title">Tecnologías y herramientas</h2>
        <div class="skills-grid">
          <article class="card">
            <p class="card-kicker">Experiencia profesional</p>
            <h3>Desarrollo web</h3>
            <ul class="chip-list">
              @for (technology of profile.professionalTechnologies; track technology) {
                <li>{{ technology }}</li>
              }
            </ul>
          </article>
          <article class="card">
            <p class="card-kicker">Formación y laboratorios</p>
            <h3>Sistemas y seguridad</h3>
            <ul class="chip-list">
              @for (technology of profile.trainingAndLabTechnologies; track technology) {
                <li>{{ technology }}</li>
              }
            </ul>
            <p class="scope-note">
              Estas herramientas se han utilizado en distintos contextos de formación y laboratorio;
              no representan experiencia profesional con todas ellas.
            </p>
          </article>
        </div>
      </section>

      <section class="card section callout" aria-labelledby="direction-title">
        <p class="eyebrow">Orientación profesional</p>
        <h2 id="direction-title">Seguridad como siguiente paso</h2>
        <ul class="chip-list" aria-label="Áreas de orientación profesional">
          @for (area of profile.orientation; track area) {
            <li>{{ area }}</li>
          }
        </ul>
        <p>
          Este portfolio forma parte de ese recorrido: además de presentar proyectos, evolucionará
          progresivamente hacia una plataforma Full Stack con contenerización, automatización,
          protección, monitorización y detección.
        </p>
        <a routerLink="/projects">Explorar los proyectos <span aria-hidden="true">→</span></a>
      </section>
    } @else {
      <p class="loading" role="status">Cargando perfil profesional…</p>
    }
  `,
})
export class About {
  private readonly portfolioApi = inject(PortfolioApiService);
  protected readonly profile = toSignal(this.portfolioApi.getProfile());
}
