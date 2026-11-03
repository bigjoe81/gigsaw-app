import { Routes } from '@angular/router';
import { CommitmentFormPage } from './pages/commitment-form.page';
import { CommitmentListPage } from './pages/commitment-list.page';

export const COMMITMENT_ROUTES: Routes = [
  { path: '', component: CommitmentListPage },
  { path: 'nuovo', component: CommitmentFormPage },
  { path: ':id/modifica', component: CommitmentFormPage },
];
