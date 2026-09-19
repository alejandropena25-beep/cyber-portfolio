import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { PortfolioApiService } from '../data/portfolio-api.service';
import { NotFound } from './not-found';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, NotFound],
  template: `
    @if (project() === undefined) {
      <p class="loading" role="status">Cargando proyecto…</p>
    } @else if (project(); as project) {
      <a class="back-link" routerLink="/projects">← Todos los proyectos</a>

      <article class="project-detail">
        <header class="project-header">
          <div class="project-meta">
            <span class="tag">{{ project.category }}</span>
            <span class="status">{{ project.status }}</span>
          </div>
          <p class="eyebrow">{{ project.type }}</p>
          <h1>{{ project.title }}</h1>
          <p class="lead">{{ project.summary }}</p>
          @if (project.repository) {
            <a class="button" [href]="project.repository" target="_blank" rel="noopener noreferrer"
              >Ver repositorio en GitHub <span aria-hidden="true">↗</span></a
            >
          }
        </header>

        <div class="detail-layout">
          <div class="detail-content">
            <section class="detail-section" aria-labelledby="objective-title">
              <p class="section-number">01</p>
              <div>
                <h2 id="objective-title">Objetivo</h2>
                <p>{{ project.objective }}</p>
              </div>
            </section>

            @if (project.architecture?.length) {
              <section class="detail-section" aria-labelledby="architecture-title">
                <p class="section-number">02</p>
                <div>
                  <h2 id="architecture-title">Arquitectura</h2>
                  <ol class="architecture-flow">
                    @for (step of project.architecture; track step; let last = $last) {
                      <li>
                        <span>{{ step }}</span>
                        @if (!last) {
                          <span class="flow-arrow" aria-hidden="true">↓</span>
                        }
                      </li>
                    }
                  </ol>
                  @if (project.architectureDescription) {
                    <p>{{ project.architectureDescription }}</p>
                  }
                </div>
              </section>
            }

            @if (project.workPerformed?.length) {
              <section class="detail-section" aria-labelledby="work-title">
                <p class="section-number">03</p>
                <div>
                  <h2 id="work-title">Trabajo realizado</h2>
                  <ul class="check-list">
                    @for (item of project.workPerformed; track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </div>
              </section>
            }

            @if (project.confirmedResults?.length) {
              <section class="detail-section confirmed-section" aria-labelledby="results-title">
                <p class="section-number">04</p>
                <div>
                  <h2 id="results-title">Resultados confirmados</h2>
                  <ul class="check-list">
                    @for (result of project.confirmedResults; track result) {
                      <li>{{ result }}</li>
                    }
                  </ul>
                  @if (project.slug === 'mobile-security-mobsf-mstg') {
                    <p class="scope-note">
                      Son observaciones del informe automático de MobSF. No implican explotación ni
                      verificación manual de cada resultado.
                    </p>
                  }
                </div>
              </section>
            }

            @if (project.problems?.length) {
              <section class="detail-section" aria-labelledby="problems-title">
                <p class="section-number">05</p>
                <div>
                  <h2 id="problems-title">Problemas encontrados</h2>
                  <div class="stack">
                    @for (problem of project.problems; track problem.title) {
                      <article class="subcard">
                        <h3>{{ problem.title }}</h3>
                        <p>{{ problem.description }}</p>
                      </article>
                    }
                  </div>
                </div>
              </section>
            }

            @if (project.lessons?.length) {
              <section class="detail-section" aria-labelledby="lessons-title">
                <p class="section-number">06</p>
                <div>
                  <h2 id="lessons-title">Aprendizajes</h2>
                  <ul class="check-list">
                    @for (lesson of project.lessons; track lesson) {
                      <li>{{ lesson }}</li>
                    }
                  </ul>
                </div>
              </section>
            }

            @if (project.roadmap; as roadmap) {
              <section class="detail-section" aria-labelledby="roadmap-title">
                <p class="section-number">07</p>
                <div>
                  <h2 id="roadmap-title">Estado del proyecto</h2>
                  <p class="scope-note">
                    Cada tecnología aparece según su estado real dentro del repositorio.
                  </p>
                  <div class="roadmap-grid">
                    <section class="roadmap-column implemented" aria-labelledby="implemented-title">
                      <p class="roadmap-label">Implemented</p>
                      <h3 id="implemented-title">Implementado</h3>
                      <ul>
                        @for (item of roadmap.implemented; track item) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    </section>
                    <section class="roadmap-column progress" aria-labelledby="progress-title">
                      <p class="roadmap-label">In progress</p>
                      <h3 id="progress-title">En curso</h3>
                      <ul>
                        @for (item of roadmap.inProgress; track item) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    </section>
                    <section class="roadmap-column planned" aria-labelledby="planned-title">
                      <p class="roadmap-label">Planned</p>
                      <h3 id="planned-title">Planificado</h3>
                      <ul>
                        @for (item of roadmap.planned; track item) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    </section>
                  </div>
                </div>
              </section>
            }

            @if (project.documentationStatus?.length) {
              <section class="detail-section documentation-section" aria-labelledby="docs-title">
                <p class="section-number">08</p>
                <div>
                  <h2 id="docs-title">Documentación en revisión</h2>
                  <ul class="plain-list">
                    @for (item of project.documentationStatus; track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </div>
              </section>
            }
          </div>

          <aside class="project-sidebar" aria-labelledby="technologies-title">
            <h2 id="technologies-title">Tecnologías y entorno</h2>
            <ul class="chip-list">
              @for (technology of project.technologies; track technology) {
                <li>{{ technology }}</li>
              }
            </ul>
            <dl class="project-facts">
              <div>
                <dt>Tipo</dt>
                <dd>{{ project.type }}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{{ project.status }}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </article>
    } @else {
      <app-not-found />
    }
  `,
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly project = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      switchMap((slug) => this.portfolioApi.getProject(slug)),
    ),
  );

  constructor() {
    effect(() => {
      const project = this.project();

      if (project) {
        this.title.setTitle(`${project.cardTitle} | Alejandro Peña`);
        this.meta.updateTag({ name: 'description', content: project.summary });
      }
    });
  }
}
