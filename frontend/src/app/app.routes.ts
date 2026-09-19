import { ActivatedRouteSnapshot, ResolveFn, Routes } from '@angular/router';
import { projects } from './pages/projects.data';

const projectTitle = (route: ActivatedRouteSnapshot): string => {
  const project = projects.find(({ slug }) => slug === route.paramMap.get('slug'));
  return project
    ? `${project.cardTitle} | Alejandro Peña`
    : 'Proyecto no encontrado | Alejandro Peña';
};

const projectDescription: ResolveFn<string> = (route) => {
  const project = projects.find(({ slug }) => slug === route.paramMap.get('slug'));
  return project?.summary ?? 'El proyecto solicitado no existe en el portfolio de Alejandro Peña.';
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Alejandro Peña | Desarrollo web y ciberseguridad',
    data: {
      description:
        'Portfolio profesional de Alejandro Peña: desarrollo web, laboratorios de ciberseguridad y evolución hacia DevOps y DevSecOps.',
    },
    loadComponent: () => import('./pages/home').then((m) => m.Home),
  },
  {
    path: 'projects',
    title: 'Proyectos | Alejandro Peña',
    data: {
      description:
        'Proyectos de Alejandro Peña sobre seguridad web, monitorización, seguridad móvil e infraestructura del portfolio.',
    },
    loadComponent: () => import('./pages/projects').then((m) => m.Projects),
  },
  {
    path: 'projects/:slug',
    title: projectTitle,
    resolve: { description: projectDescription },
    loadComponent: () => import('./pages/project-detail').then((m) => m.ProjectDetail),
  },
  {
    path: 'about',
    title: 'Sobre mí | Alejandro Peña',
    data: {
      description:
        'Perfil, experiencia profesional, formación y orientación hacia la ciberseguridad de Alejandro Peña.',
    },
    loadComponent: () => import('./pages/about').then((m) => m.About),
  },
  {
    path: 'contact',
    title: 'Contacto | Alejandro Peña',
    data: {
      description: 'Repositorio público y vías de contacto confirmadas de Alejandro Peña.',
    },
    loadComponent: () => import('./pages/contact').then((m) => m.Contact),
  },
  {
    path: '**',
    title: 'Página no encontrada | Alejandro Peña',
    data: { description: 'La página solicitada no existe en el portfolio de Alejandro Peña.' },
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFound),
  },
];
