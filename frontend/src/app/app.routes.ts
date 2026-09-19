import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Alejandro Peña | Desarrollo web y ciberseguridad',
    data: {
      description:
        'Portfolio profesional de Alejandro Peña: desarrollo web, laboratorios de ciberseguridad y evolución hacia DevOps y DevSecOps.',
    },
    loadComponent: () => import('./pages/home').then((module) => module.Home),
  },
  {
    path: 'projects',
    title: 'Proyectos | Alejandro Peña',
    data: {
      description:
        'Proyectos de Alejandro Peña sobre seguridad web, monitorización, seguridad móvil e infraestructura del portfolio.',
    },
    loadComponent: () => import('./pages/projects').then((module) => module.Projects),
  },
  {
    path: 'projects/:slug',
    title: 'Proyecto | Alejandro Peña',
    data: {
      description: 'Detalle de un proyecto técnico del portfolio de Alejandro Peña.',
    },
    loadComponent: () => import('./pages/project-detail').then((module) => module.ProjectDetail),
  },
  {
    path: 'about',
    title: 'Sobre mí | Alejandro Peña',
    data: {
      description:
        'Perfil, experiencia profesional, formación y orientación hacia la ciberseguridad de Alejandro Peña.',
    },
    loadComponent: () => import('./pages/about').then((module) => module.About),
  },
  {
    path: 'contact',
    title: 'Contacto | Alejandro Peña',
    data: {
      description: 'Repositorio público y vías de contacto confirmadas de Alejandro Peña.',
    },
    loadComponent: () => import('./pages/contact').then((module) => module.Contact),
  },
  {
    path: '**',
    title: 'Página no encontrada | Alejandro Peña',
    data: { description: 'La página solicitada no existe en el portfolio de Alejandro Peña.' },
    loadComponent: () => import('./pages/not-found').then((module) => module.NotFound),
  },
];
