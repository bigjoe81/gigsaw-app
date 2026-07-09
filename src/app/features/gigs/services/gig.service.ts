import { Injectable } from '@angular/core';
import { Gig } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';

@Injectable({ providedIn: 'root' })
export class GigService extends BandScopedCrudService<Gig> {
  protected readonly resource = 'gigs';
}
