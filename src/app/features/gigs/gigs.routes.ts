import { Routes } from '@angular/router';
import { GigDetailPage } from './pages/gig-detail.page';
import { GigFormPage } from './pages/gig-form.page';
import { GigListPage } from './pages/gig-list.page';

export const GIG_ROUTES: Routes = [
  { path: '', component: GigListPage },
  { path: 'new', component: GigFormPage },
  { path: ':id', component: GigDetailPage },
  { path: ':id/edit', component: GigFormPage },
];
