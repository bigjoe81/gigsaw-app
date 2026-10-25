import { ChangeDetectionStrategy } from '@angular/core';
import { NativeUiModule } from '../../../shared/ui/native-ui';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RehearsalSession, Song } from '../../../core/models/band-resources.models';
import { SongService } from '../../songs/services/song.service';
import { SongTakesComponent } from '../../songs/components/song-takes.component';
import { ResourceDetailPage } from '../../../shared/ui/resource-detail.page';

@Component({ changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NativeUiModule, RouterLink, SongTakesComponent],
  templateUrl: './rehearsal-session-detail.page.html',
  styleUrl: './rehearsal-session-detail.page.scss',
})
export class RehearsalSessionDetailPage extends ResourceDetailPage implements OnInit {
  private readonly songsApi = inject(SongService);
  private readonly bandSongs = signal<Song[]>([]);

  override ngOnInit(): void {
    super.ngOnInit();
    this.songsApi.list().subscribe({ next: (songs) => this.bandSongs.set(songs), error: () => {} });
  }

  sessionSongs(session: RehearsalSession): Song[] {
    if (session.songs?.length) return session.songs;
    const ids = session.songIds ?? [];
    return ids.map((id) => this.bandSongs().find((song) => song.id === id)).filter((song): song is Song => !!song);
  }

  get session(): RehearsalSession | undefined { return this.item() as RehearsalSession | undefined; }
  date(value: string): string {
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? 'Data da definire' : new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
  day(value: string): string { return value.slice(8, 10); }
  month(value: string): string {
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('it-IT', { month: 'short' }).format(date);
  }
  time(session: RehearsalSession): string {
    return [session.startTime, session.endTime].filter(Boolean).map(value => value!.slice(0, 5)).join(' – ') || 'Orario da definire';
  }
  status(value: string): string {
    return ({ scheduled: 'Programmata', confirmed: 'Confermata', completed: 'Completata', cancelled: 'Annullata' } as Record<string, string>)[value.toLowerCase()] ?? value;
  }
  duration(session: RehearsalSession): string {
    if (!session.startTime || !session.endTime) return '';
    const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
    const duration = minutes(session.endTime) - minutes(session.startTime);
    if (duration <= 0) return '';
    return [Math.floor(duration / 60) ? `${Math.floor(duration / 60)} h` : '', duration % 60 ? `${duration % 60} min` : ''].filter(Boolean).join(' ');
  }
}
