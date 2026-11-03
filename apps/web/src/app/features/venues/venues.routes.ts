import { Routes } from '@angular/router';
import { ResourceConfig } from '../../shared/models/resource-form.models';
import { VenueFormPage } from './pages/venue-form.page';
import { VenueListPage } from './pages/venue-list.page';
import { VenueService } from './services/venue.service';

const resource: ResourceConfig = {
  key: 'venues', singular: 'venue', plural: 'Venue', titleKey: 'name', service: VenueService,
  fields: [
    { key: 'name', label: 'Nome', type: 'text', required: true },
    { key: 'address', label: 'Indirizzo', type: 'text', required: true },
    { key: 'city', label: 'Città', type: 'text', required: true },
    { key: 'latitude', label: 'Latitudine', type: 'number' },
    { key: 'longitude', label: 'Longitudine', type: 'number' },
  ],
};

export const VENUE_ROUTES: Routes = [
  { path: '', component: VenueListPage, data: { resource } },
  { path: 'locale/nuovo', component: VenueFormPage, data: { resource } },
  { path: 'locale/:id/modifica', component: VenueFormPage, data: { resource } },
  { path: 'sala/nuova', component: VenueFormPage },
  { path: 'sala/:id/modifica', component: VenueFormPage },
  { path: 'venue/new', redirectTo: 'locale/nuovo', pathMatch: 'full' },
  { path: 'venue/:id/edit', redirectTo: 'locale/:id/modifica', pathMatch: 'full' },
  { path: 'room/new', redirectTo: 'sala/nuova', pathMatch: 'full' },
  { path: 'room/:id/edit', redirectTo: 'sala/:id/modifica', pathMatch: 'full' },
];
