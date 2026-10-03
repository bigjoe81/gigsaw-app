import { Injectable, inject } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { RehearsalSession } from '../../../core/models/band-resources.models';
import { BandScopedCrudService } from '../../../core/services/band-scoped-crud.service';
import { SongService } from '../../songs/services/song.service';

@Injectable({ providedIn: 'root' })
export class RehearsalSessionService extends BandScopedCrudService<RehearsalSession> {
  protected readonly resource = 'rehearsal-sessions';
  private readonly songService = inject(SongService);

  override get(id: number): Observable<RehearsalSession> {
    return super.get(id).pipe(switchMap((session) => {
      const songIds = session.songIds ?? session.songs?.map((song) => song.id) ?? [];
      const embeddedSongs = new Map(session.songs?.map((song) => [song.id, song]));
      const needsSongs = songIds.some((songId) => !embeddedSongs.get(songId)?.title);
      return (needsSongs ? this.songService.list() : of([])).pipe(map((songs) => {
        const repertoire = new Map(songs.map((song) => [song.id, song]));
        return {
          ...session,
          songs: songIds.map((songId) => {
            const embedded = embeddedSongs.get(songId);
            return embedded?.title ? embedded : repertoire.get(songId) ?? { id: songId, title: 'Brano non disponibile' };
          }),
        };
      }));
    }));
  }
}
