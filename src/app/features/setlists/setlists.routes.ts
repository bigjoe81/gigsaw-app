import { Routes } from '@angular/router';
import { SetlistDetailPage } from './pages/setlist-detail.page';
import { SetlistFormPage } from './pages/setlist-form.page';
import { SetlistListPage } from './pages/setlist-list.page';
import { SetlistTemplateDetailPage } from './pages/setlist-template-detail.page';
import { SetlistTemplateFormPage } from './pages/setlist-template-form.page';
import { SetlistTemplateListPage } from './pages/setlist-template-list.page';

export const SETLIST_ROUTES: Routes = [
  { path: '', component: SetlistListPage },
  { path: 'nuova', component: SetlistFormPage },
  { path: 'modelli', component: SetlistTemplateListPage },
  { path: 'modelli/nuovo', component: SetlistTemplateFormPage },
  { path: 'modelli/:templateId/modifica', component: SetlistTemplateFormPage },
  { path: 'modelli/:templateId', component: SetlistTemplateDetailPage },
  { path: 'new', redirectTo: 'nuova', pathMatch: 'full' },
  { path: 'templates', redirectTo: 'modelli', pathMatch: 'full' },
  { path: 'templates/new', redirectTo: 'modelli/nuovo', pathMatch: 'full' },
  { path: 'templates/:templateId/edit', redirectTo: 'modelli/:templateId/modifica', pathMatch: 'full' },
  { path: 'templates/:templateId', redirectTo: 'modelli/:templateId', pathMatch: 'full' },
  { path: ':id/edit', redirectTo: ':id/modifica', pathMatch: 'full' },
  { path: ':id/modifica', component: SetlistFormPage },
  { path: ':id', component: SetlistDetailPage },
];
