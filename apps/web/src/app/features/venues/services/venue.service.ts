import { Injectable } from '@angular/core';
import { Venue } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';

@Injectable({ providedIn: 'root' })
export class VenueService extends BandScopedCrudService<Venue> {
  protected readonly resource = 'venues';
}
