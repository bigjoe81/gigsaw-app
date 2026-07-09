import { Injectable } from '@angular/core';
import { RecordingSession } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';

@Injectable({ providedIn: 'root' })
export class RecordingSessionService extends BandScopedCrudService<RecordingSession> {
  protected readonly resource = 'recording-sessions';
}
