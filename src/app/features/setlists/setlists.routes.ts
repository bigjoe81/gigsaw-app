import { Routes } from '@angular/router';
import { SetlistDetailPage } from './pages/setlist-detail.page';
import { SetlistFormPage } from './pages/setlist-form.page';
import { SetlistListPage } from './pages/setlist-list.page';
import { SetlistTemplateDetailPage } from './pages/setlist-template-detail.page';
import { SetlistTemplateFormPage } from './pages/setlist-template-form.page';
import { SetlistTemplateListPage } from './pages/setlist-template-list.page';

export const SETLIST_ROUTES: Routes = [
  { path: '', component: SetlistListPage },
  { path: 'new', component: SetlistFormPage },
  { path: 'templates', component: SetlistTemplateListPage },
  { path: 'templates/new', component: SetlistTemplateFormPage },
  { path: 'templates/:templateId', component: SetlistTemplateDetailPage },
  { path: 'templates/:templateId/edit', component: SetlistTemplateFormPage },
  { path: ':id', component: SetlistDetailPage },
  { path: ':id/edit', component: SetlistFormPage },
];
