import { Injectable } from '@angular/core';
import { Commitment } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';

@Injectable({ providedIn: 'root' })
export class CommitmentService extends BandScopedCrudService<Commitment> {
  protected readonly resource = 'commitments';
}
