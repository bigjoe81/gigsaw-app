import { Routes } from '@angular/router';

export const POSTER_TEMPLATE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/poster-template-list.page').then((m) => m.PosterTemplateListPage) },
  { path: 'new', loadComponent: () => import('./pages/poster-template-editor.page').then((m) => m.PosterTemplateEditorPage) },
  { path: ':templateId/edit', loadComponent: () => import('./pages/poster-template-editor.page').then((m) => m.PosterTemplateEditorPage) },
];
