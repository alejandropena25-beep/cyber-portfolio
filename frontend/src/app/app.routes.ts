import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Inicio | Cyber Portfolio',
    loadComponent: () => import('./pages/home').then((m) => m.Home),
  },
  {
    path: 'projects',
    title: 'Proyectos | Cyber Portfolio',
    loadComponent: () => import('./pages/projects').then((m) => m.Projects),
  },
  {
    path: 'projects/:slug',
    title: 'Proyecto | Cyber Portfolio',
    loadComponent: () => import('./pages/project-detail').then((m) => m.ProjectDetail),
  },
  {
    path: 'about',
    title: 'Sobre mí | Cyber Portfolio',
    loadComponent: () => import('./pages/about').then((m) => m.About),
  },
  {
    path: 'contact',
    title: 'Contacto | Cyber Portfolio',
    loadComponent: () => import('./pages/contact').then((m) => m.Contact),
  },
  {
    path: '**',
    title: 'Página no encontrada | Cyber Portfolio',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
  },
];
