import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password.page').then((m) => m.ResetPasswordPage),
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
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  { path: '', redirectTo: '/bands', pathMatch: 'full' },
  { path: '**', redirectTo: '/bands' },
];
