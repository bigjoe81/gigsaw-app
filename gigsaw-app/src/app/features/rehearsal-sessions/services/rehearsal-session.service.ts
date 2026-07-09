import { Injectable } from '@angular/core';
import { RehearsalSession } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';

@Injectable({ providedIn: 'root' })
export class RehearsalSessionService extends BandScopedCrudService<RehearsalSession> {
  protected readonly resource = 'rehearsal-sessions';
}
