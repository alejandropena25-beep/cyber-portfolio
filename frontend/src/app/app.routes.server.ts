import { RenderMode, ServerRoute } from '@angular/ssr';
import { environment } from '../environments/environment';

interface ProjectSlug {
  readonly slug: string;
}

export const serverRoutes: ServerRoute[] = [
  { path: 'admin/**', renderMode: RenderMode.Client },
  {
    path: 'projects/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const response = await fetch(`${environment.serverApiBaseUrl}/projects`);

      if (!response.ok) {
        throw new Error(`Unable to load project slugs: API returned ${response.status}`);
      }

      const projects = (await response.json()) as readonly ProjectSlug[];
      return projects.map(({ slug }) => ({ slug }));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
