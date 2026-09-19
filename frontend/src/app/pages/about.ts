import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <p class="eyebrow">Sobre mí</p>
      <h1>Desarrollo, sistemas y seguridad como partes de un mismo proceso.</h1>
      <p class="lead">
        Soy Alejandro Peña, desarrollador web con formación en Desarrollo de Aplicaciones Web y
        ciberseguridad. Actualmente curso Ingeniería Informática — Tecnologías Informáticas en la
        Universidad de Sevilla.
      </p>
      <p>
        Mi objetivo es seguir evolucionando hacia entornos técnicos donde pueda combinar desarrollo,
        seguridad, infraestructura y automatización. La ciberseguridad es el foco principal de este
        portfolio.
      </p>
    </header>

    <section class="section" aria-labelledby="experience-title">
      <p class="eyebrow">Trayectoria</p>
      <h2 id="experience-title">Experiencia profesional</h2>
      <div class="experience-list">
        <article class="card">
          <p class="card-kicker">Monitorización de infraestructura</p>
          <h3>Cibernos · Servicio para Ericsson</h3>
          <p>
            Trabajo relacionado con la monitorización de redes y servicios 5G, servidores y
            disponibilidad de servicios.
          </p>
          <ul class="plain-list">
            <li>Monitorización del entorno y seguimiento de disponibilidad.</li>
            <li>Gestión inicial de alarmas y detección de anomalías.</li>
            <li>Seguimiento de incidencias y escalado cuando correspondía.</li>
          </ul>
        </article>
        <article class="card">
          <p class="card-kicker">Desarrollo y mantenimiento web</p>
          <h3>Euroxanty</h3>
          <p>
            Desarrollo y mantenimiento de sitios web, principalmente con WordPress y Elementor,
            junto con trabajo en HTML, CSS y JavaScript.
          </p>
          <ul class="chip-list" aria-label="Tecnologías utilizadas profesionalmente">
            <li>WordPress</li>
            <li>Elementor</li>
            <li>HTML</li>
            <li>CSS</li>
            <li>JavaScript</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="section" aria-labelledby="education-title">
      <p class="eyebrow">Formación</p>
      <h2 id="education-title">Formación académica</h2>
      <div class="timeline">
        <article class="timeline-item">
          <span class="status status-progress">Actualmente en curso</span>
          <h3>Ingeniería Informática — Tecnologías Informáticas</h3>
          <p>Universidad de Sevilla</p>
        </article>
        <article class="timeline-item">
          <span class="status status-complete">Completado</span>
          <h3>
            Curso de Especialización en Ciberseguridad en Entornos de las Tecnologías de la
            Información
          </h3>
        </article>
        <article class="timeline-item">
          <span class="status status-complete">Completado</span>
          <h3>Desarrollo de Aplicaciones Web (DAW)</h3>
          <p>EUSA Sevilla</p>
        </article>
        <article class="timeline-item">
          <span class="status">Nivel B2</span>
          <h3>Inglés</h3>
        </article>
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
            <li>WordPress</li>
            <li>Elementor</li>
            <li>HTML</li>
            <li>CSS</li>
            <li>JavaScript</li>
          </ul>
        </article>
        <article class="card">
          <p class="card-kicker">Formación y laboratorios</p>
          <h3>Sistemas y seguridad</h3>
          <ul class="chip-list">
            <li>Linux</li>
            <li>Windows</li>
            <li>Docker</li>
            <li>GNS3</li>
            <li>OpenStack</li>
            <li>Snort</li>
            <li>Elastic / ELK</li>
            <li>Wireshark</li>
            <li>Nmap</li>
            <li>BunkerWeb</li>
            <li>MobSF</li>
            <li>OWASP MSTG</li>
            <li>Autopsy</li>
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
      <p>
        Me interesan especialmente la ciberseguridad, la infraestructura, la automatización y los
        proyectos donde el desarrollo se integra con prácticas de seguridad.
      </p>
      <p>
        Este portfolio forma parte de ese recorrido: además de presentar proyectos, evolucionará
        progresivamente hacia una plataforma Full Stack con contenerización, automatización,
        protección, monitorización y detección.
      </p>
      <a routerLink="/projects">Explorar los proyectos <span aria-hidden="true">→</span></a>
    </section>
  `,
})
export class About {}
