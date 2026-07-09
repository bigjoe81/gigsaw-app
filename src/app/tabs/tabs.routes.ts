import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'repertorio',
        loadChildren: () =>
          import('../features/songs/songs.routes').then((m) => m.SONG_ROUTES),
      },
      {
        path: 'prove',
        loadChildren: () =>
          import('../features/rehearsal-sessions/rehearsal-sessions.routes').then((m) => m.REHEARSAL_SESSION_ROUTES),
      },
      {
        path: 'concerti',
        loadChildren: () =>
          import('../features/gigs/gigs.routes').then((m) => m.GIG_ROUTES),
      },
      {
        path: 'scalette',
        loadChildren: () =>
          import('../features/setlists/setlists.routes').then((m) => m.SETLIST_ROUTES),
      },
      {
        path: 'band',
        loadComponent: () =>
          import('../features/bands/pages/band-manage.page').then((m) => m.BandManagePage),
      },
      {
        path: '',
        redirectTo: 'repertorio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'repertorio',
    pathMatch: 'full',
  },
];
