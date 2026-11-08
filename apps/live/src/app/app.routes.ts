import type { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home.page').then((m) => m.HomePage),
  },
  {
    path: 'setlist',
    loadComponent: () => import('./stage.page').then((m) => m.StagePage),
  },
  {
    path: 'stage',
    loadComponent: () => import('./stage.page').then((m) => m.StagePage),
  },
  {
    path: 'rehearsal',
    loadComponent: () =>
      import('./rehearsal.page').then((m) => m.RehearsalPage),
  },
  {
    path: 'materials',
    loadComponent: () =>
      import('./materials.page').then((m) => m.MaterialsPage),
  },
  {
    path: 'kits',
    loadComponent: () => import('./kits.page').then((m) => m.KitsPage),
  },
  { path: '**', redirectTo: '' },
];
