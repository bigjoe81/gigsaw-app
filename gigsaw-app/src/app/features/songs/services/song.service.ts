import { Injectable } from '@angular/core';
import { Song } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';

@Injectable({ providedIn: 'root' })
export class SongService extends BandScopedCrudService<Song> {
  protected readonly resource = 'songs';
}
