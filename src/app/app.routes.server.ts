import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Parameterised routes need explicit `getPrerenderParams` to be prerendered.
  // For an admin app these are dynamic by nature — render them on the client.
  {
    path: 'preview/:familyId',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
