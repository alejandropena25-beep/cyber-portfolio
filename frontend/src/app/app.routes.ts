import { Routes } from '@angular/router';
import { adminGuard } from './admin/admin.guard';

export const routes: Routes = [
  {
    path: 'admin/login',
    title: 'Acceso administrativo',
    data: { robots: 'noindex,nofollow' },
    loadComponent: () => import('./admin/admin-login').then((module) => module.AdminLogin),
  },
  {
    path: 'admin',
    data: { robots: 'noindex,nofollow' },
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-shell').then((module) => module.AdminShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./admin/admin-dashboard').then((module) => module.AdminDashboard),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./admin/admin-projects').then((module) => module.AdminProjects),
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import('./admin/admin-project-editor').then((module) => module.AdminProjectEditor),
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () =>
          import('./admin/admin-project-editor').then((module) => module.AdminProjectEditor),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./admin/admin-profile').then((module) => module.AdminProfileEditor),
      },
    ],
  },
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
