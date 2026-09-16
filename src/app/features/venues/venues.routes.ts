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
  { path: 'venue/new', component: VenueFormPage, data: { resource } },
  { path: 'venue/:id/edit', component: VenueFormPage, data: { resource } },
  { path: 'room/new', component: VenueFormPage },
  { path: 'room/:id/edit', component: VenueFormPage },
];
