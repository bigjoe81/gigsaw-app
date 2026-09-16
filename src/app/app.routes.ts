import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { BandLayoutPage } from './layouts/band-layout.page';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./features/auth/verify-otp.page').then((m) => m.VerifyOtpPage),
  },
  {
    path: 'bands',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/bands/pages/band-selection.page').then((m) => m.BandSelectionPage),
      },
      {
        path: 'new',
        loadComponent: () => import('./features/bands/pages/band-create.page').then((m) => m.BandCreatePage),
      },
    ],
  },
  {
    path: 'auth/google/callback',
    loadComponent: () => import('./features/auth/google-callback.page').then((m) => m.GoogleCallbackPage),
  },
  {
    path: 'band/:bandId',
    canActivate: [authGuard],
    component: BandLayoutPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'repertorio',
        loadChildren: () =>
          import('./features/songs/songs.routes').then((m) => m.SONG_ROUTES),
      },
      {
        path: 'prove',
        loadChildren: () =>
          import('./features/rehearsal-sessions/rehearsal-sessions.routes').then((m) => m.REHEARSAL_SESSION_ROUTES),
      },
      {
        path: 'concerti',
        loadChildren: () =>
          import('./features/gigs/gigs.routes').then((m) => m.GIG_ROUTES),
      },
      {
        path: 'locations',
        loadChildren: () =>
          import('./features/venues/venues.routes').then((m) => m.VENUE_ROUTES),
      },
      {
        path: 'venues',
        redirectTo: 'locations',
        pathMatch: 'full',
      },
      {
        path: 'scalette',
        loadChildren: () =>
          import('./features/setlists/setlists.routes').then((m) => m.SETLIST_ROUTES),
      },
      {
        path: 'locandine',
        loadChildren: () =>
          import('./features/poster-templates/poster-templates.routes').then((m) => m.POSTER_TEMPLATE_ROUTES),
      },
      {
        path: 'band',
        loadComponent: () =>
          import('./features/bands/pages/band-manage.page').then((m) => m.BandManagePage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  { path: '', redirectTo: '/bands', pathMatch: 'full' },
  { path: '**', redirectTo: '/bands' },
];
