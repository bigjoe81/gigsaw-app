import { Routes } from '@angular/router';

export const POSTER_TEMPLATE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/poster-template-list.page').then((m) => m.PosterTemplateListPage) },
  { path: 'nuova', loadComponent: () => import('./pages/poster-template-editor.page').then((m) => m.PosterTemplateEditorPage) },
  { path: 'new', redirectTo: 'nuova', pathMatch: 'full' },
  { path: ':templateId/edit', redirectTo: ':templateId/modifica', pathMatch: 'full' },
  { path: ':templateId/modifica', loadComponent: () => import('./pages/poster-template-editor.page').then((m) => m.PosterTemplateEditorPage) },
];
