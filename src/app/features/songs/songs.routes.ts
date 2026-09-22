import { Routes } from '@angular/router';
import { SongDetailPage } from './pages/song-detail.page';
import { SongFormPage } from './pages/song-form.page';
import { SongLinkGroupsPage } from './pages/song-link-groups.page';
import { SongListPage } from './pages/song-list.page';

export const SONG_ROUTES: Routes = [
  { path: '', component: SongListPage },
  { path: 'nuovo', component: SongFormPage },
  { path: 'gruppi-collegati', component: SongLinkGroupsPage },
  { path: 'new', redirectTo: 'nuovo', pathMatch: 'full' },
  { path: 'link-groups', redirectTo: 'gruppi-collegati', pathMatch: 'full' },
  { path: ':id/edit', redirectTo: ':id/modifica', pathMatch: 'full' },
  { path: ':id/modifica', component: SongFormPage },
  { path: ':id', component: SongDetailPage },
];
