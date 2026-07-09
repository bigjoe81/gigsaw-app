import { Routes } from '@angular/router';
import { ResourceConfig } from '../../shared/models/resource-form.models';
import { ResourceDetailPage } from '../../shared/ui/resource-detail.page';
import { ResourceListPage } from '../../shared/ui/resource-list.page';
import { VenueFormPage } from './pages/venue-form.page';
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
  { path: '', component: ResourceListPage, data: { resource } },
  { path: 'new', component: VenueFormPage, data: { resource } },
  { path: ':id', component: ResourceDetailPage, data: { resource } },
  { path: ':id/edit', component: VenueFormPage, data: { resource } },
];
