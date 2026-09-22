import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { BandLayoutPage } from './layouts/band-layout.page';

export const routes: Routes = [
  {
    path: 'accedi',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registrati',
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'verifica-codice',
    loadComponent: () => import('./features/auth/verify-otp.page').then((m) => m.VerifyOtpPage),
  },
  {
    path: 'password-dimenticata',
    loadComponent: () => import('./features/auth/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reimposta-password',
    loadComponent: () => import('./features/auth/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'invito/:joinCode',
    loadComponent: () => import('./features/bands/pages/band-invitation.page').then((m) => m.BandInvitationPage),
  },
  {
    path: 'band/nuova',
    canActivate: [authGuard],
    loadComponent: () => import('./features/bands/pages/band-create.page').then((m) => m.BandCreatePage),
  },
  {
    path: 'band',
    canActivate: [authGuard],
    loadComponent: () => import('./features/bands/pages/band-selection.page').then((m) => m.BandSelectionPage),
  },
  {
    path: 'autenticazione/google/ritorno',
    loadComponent: () => import('./features/auth/google-callback.page').then((m) => m.GoogleCallbackPage),
  },
  {
    path: 'band/:bandId',
    canActivate: [authGuard],
    component: BandLayoutPage,
    children: [
      {
        path: 'panoramica',
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
        path: 'luoghi',
        loadChildren: () =>
          import('./features/venues/venues.routes').then((m) => m.VENUE_ROUTES),
      },
      {
        path: 'locations',
        redirectTo: 'luoghi',
        pathMatch: 'full',
      },
      {
        path: 'venues',
        redirectTo: 'luoghi',
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
        path: 'impostazioni',
        loadComponent: () =>
          import('./features/bands/pages/band-manage.page').then((m) => m.BandManagePage),
      },
      {
        path: 'band',
        redirectTo: 'impostazioni',
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'panoramica',
        pathMatch: 'full',
      },
    ],
  },
  { path: 'login', redirectTo: '/accedi', pathMatch: 'full' },
  { path: 'register', redirectTo: '/registrati', pathMatch: 'full' },
  { path: 'verify-otp', redirectTo: '/verifica-codice', pathMatch: 'full' },
  { path: 'forgot-password', redirectTo: '/password-dimenticata', pathMatch: 'full' },
  { path: 'reset-password', redirectTo: '/reimposta-password', pathMatch: 'full' },
  { path: 'invite/:joinCode', redirectTo: '/invito/:joinCode', pathMatch: 'full' },
  { path: 'bands/new', redirectTo: '/band/nuova', pathMatch: 'full' },
  { path: 'bands', redirectTo: '/band', pathMatch: 'full' },
  { path: 'auth/google/callback', redirectTo: '/autenticazione/google/ritorno', pathMatch: 'full' },
  { path: '', redirectTo: '/band', pathMatch: 'full' },
  { path: '**', redirectTo: '/band' },
];
