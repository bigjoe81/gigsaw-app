import { Routes } from '@angular/router';
import { GigDetailPage } from './pages/gig-detail.page';
import { GigFormPage } from './pages/gig-form.page';
import { GigListPage } from './pages/gig-list.page';

export const GIG_ROUTES: Routes = [
  { path: '', component: GigListPage },
  { path: 'nuovo', component: GigFormPage },
  { path: 'new', redirectTo: 'nuovo', pathMatch: 'full' },
  { path: ':id/edit', redirectTo: ':id/modifica', pathMatch: 'full' },
  { path: ':id/modifica', component: GigFormPage },
  { path: ':id', component: GigDetailPage },
];
