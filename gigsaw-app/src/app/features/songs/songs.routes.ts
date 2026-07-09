import { Routes } from '@angular/router';
import { SongDetailPage } from './pages/song-detail.page';
import { SongFormPage } from './pages/song-form.page';
import { SongLinkGroupsPage } from './pages/song-link-groups.page';
import { SongListPage } from './pages/song-list.page';

export const SONG_ROUTES: Routes = [
  { path: '', component: SongListPage },
  { path: 'new', component: SongFormPage },
  { path: 'link-groups', component: SongLinkGroupsPage },
  { path: ':id', component: SongDetailPage },
  { path: ':id/edit', component: SongFormPage },
];
