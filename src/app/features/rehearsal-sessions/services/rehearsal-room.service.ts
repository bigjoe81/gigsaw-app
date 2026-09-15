import { Injectable } from '@angular/core';
import { RehearsalRoom } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';

@Injectable({ providedIn: 'root' })
export class RehearsalRoomService extends BandScopedCrudService<RehearsalRoom> {
  protected readonly resource = 'rehearsal-rooms';
}
