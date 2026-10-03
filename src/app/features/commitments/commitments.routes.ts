import { Routes } from '@angular/router';
import { CommitmentListPage } from './pages/commitment-list.page';

export const COMMITMENT_ROUTES: Routes = [
  { path: '', component: CommitmentListPage },
  { path: 'nuovo', redirectTo: '', pathMatch: 'full' },
  { path: ':id/modifica', redirectTo: '', pathMatch: 'full' },
];
