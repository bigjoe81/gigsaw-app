import { guidedCompletionUrl } from '../../guide/guided-navigation';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of, switchMap, throwError } from 'rxjs';
import {
  IonContent,
  IonIcon,
  IonInput,
  IonSelect,
  IonTextarea,
  IonSelectOption,
  ToastController,
} from '@ionic/angular/standalone';
import {
  RehearsalRoom,
  RehearsalSession,
  RehearsalStatus,
  Song,
} from '../../../core/models/band-resources.models';
import {
  GigsawButtonComponent,
  GigsawLoadingComponent,
  GigsawMessageComponent,
} from '../../../shared/ui/gigsaw';
import { FormPageHeaderComponent, FormPageHeaderSection } from '../../../shared/ui/form-page-header.component';
import { SongService } from '../../songs/services/song.service';
import { RehearsalRoomService } from '../services/rehearsal-room.service';
import { RehearsalSessionService } from '../services/rehearsal-session.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, GigsawButtonComponent, GigsawLoadingComponent, GigsawMessageComponent, FormPageHeaderComponent, IonContent, IonIcon, IonInput, IonSelect, IonTextarea, IonSelectOption],
  templateUrl: './rehearsal-session-form.page.html',
  styleUrls: ['./rehearsal-session-form.page.scss'],
})
export class RehearsalSessionFormPage implements OnInit {
  readonly rehearsalSections: FormPageHeaderSection[] = [{ id: 1, label: 'Dettagli' }, { id: 2, label: 'Brani da provare' }];
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.maxLength(255)],
    date: [this.today(), Validators.required],
    startTime: '',
    endTime: '',
    status: 'confirmed' as RehearsalStatus,
    rehearsalRoomId: ['', Validators.required],
    notes: '',
  });
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly step = signal(1);
  readonly songs = signal<Song[]>([]);
  readonly rehearsalRooms = signal<RehearsalRoom[]>([]);
  readonly selectedSongIds = signal<number[]>([]);
  private id?: number;
  private bandId?: number;

  constructor(
    private readonly fb: FormBuilder,
    private readonly rehearsalSessions: RehearsalSessionService,
    private readonly rehearsalRoomsApi: RehearsalRoomService,
    private readonly songService: SongService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing.set(!!this.id);
  }

  ionViewWillEnter(): void {
    this.loading.set(true);
    this.error.set('');
    this.step.set(1);
    this.selectedSongIds.set([]);
    forkJoin({
      rooms: this.rehearsalRoomsApi.list(),
      songs: this.songService.list(),
      session: this.id ? this.rehearsalSessions.get(this.id) : of(undefined),
    }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ rooms, songs, session }) => {
        this.rehearsalRooms.set(rooms);
        this.songs.set(songs.filter((song) => song.status !== 'archived').map((song) => ({ ...song, id: Number(song.id) })));
        if (session) {
          const roomId = session.rehearsalRoomId ?? session.rehearsalRoom?.id;
          const availableRoom = rooms.find((room) => Number(room.id) === Number(roomId));
          this.form.patchValue({
            title: session.title ?? '',
            date: this.normalizeDate(session.date),
            startTime: this.normalizeTime(session.startTime),
            endTime: this.normalizeTime(session.endTime),
            status: session.status ?? 'confirmed',
            rehearsalRoomId: availableRoom ? String(availableRoom.id) : '',
            notes: session.notes ?? '',
          });
          this.selectedSongIds.set((session.songIds ?? session.songs?.map((song) => song.id) ?? []).map(Number));
          if (!availableRoom) this.error.set('La sala associata alla prova non è più disponibile. Seleziona una sala prove valida prima di salvare.');
        }
      },
      error: (error: unknown) => {
        this.error.set(this.apiErrorMessage(error, 'Impossibile caricare i dati della prova.'));
      },
    });
  }

  onHeaderSectionChange(section: number): void {
    if (section === this.step()) return;
    if (section === 1) {
      this.step.set(1);
      return;
    }
    this.continueToSongs();
  }

  continueToSongs(): void {
    this.error.set('');
    this.form.controls.title.markAsTouched();
    this.form.controls.date.markAsTouched();
    this.form.controls.rehearsalRoomId.markAsTouched();
    if (this.form.controls.title.invalid || this.form.controls.date.invalid || this.form.controls.rehearsalRoomId.invalid) {
      this.error.set('Controlla il titolo (massimo 255 caratteri) e completa data e sala prove prima di continuare.');
      return;
    }
    if (!this.timeRangeValid()) return;
    if (!this.roomValid()) return;
    this.step.set(2);
  }

  toggleSong(songId: number, checked: boolean): void {
    songId = Number(songId);
    this.selectedSongIds.update((selectedIds) => checked
      ? Array.from(new Set([...selectedIds.map(Number), songId]))
      : selectedIds.map(Number).filter((id) => id !== songId));
  }

  save(): void {
    this.error.set('');
    if (!this.roomValid()) return;
    if (this.form.invalid || this.saving() || !this.timeRangeValid()) {
      this.form.markAllAsTouched();
      if (!this.error()) this.error.set('Completa i campi obbligatori prima di salvare.');
      return;
    }

    this.saving.set(true);
    const values = this.form.getRawValue();
    const payload: Partial<RehearsalSession> = {
      title: values.title.trim(),
      date: this.normalizeDate(values.date),
      startTime: values.startTime || null,
      endTime: values.endTime || null,
      status: values.status,
      rehearsalRoomId: Number(values.rehearsalRoomId),
      notes: values.notes.trim() || null,
      songIds: [...this.selectedSongIds()],
    };
    const request = this.editing()
      ? this.rehearsalSessions.update(this.id!, payload)
      : this.rehearsalSessions.create(payload);

    request.pipe(
      switchMap((saved) => this.rehearsalSessions.get(saved.id)),
      switchMap((saved) => {
        const expected = new Set(payload.songIds);
        const actual = new Set((saved.songIds ?? saved.songs?.map((song) => song.id) ?? []).map(Number));
        return expected.size === actual.size && [...expected].every((id) => actual.has(id))
          ? of(saved)
          : throwError(() => new Error('Il server non ha salvato la selezione dei brani. Riprova il salvataggio.'));
      }),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: async () => {
        (await this.toast.create({ message: 'Prova salvata.', duration: 1800, color: 'success' })).present();
        void this.router.navigateByUrl(guidedCompletionUrl(this.router.url, this.bandId, 'prova') ?? (this.bandId ? `/band/${this.bandId}/prove` : '/band'));
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 422 && error.error?.errors?.rehearsal_room_id) {
          this.form.controls.rehearsalRoomId.setValue('');
          this.form.controls.rehearsalRoomId.markAsTouched();
          this.error.set('La sala selezionata non è più disponibile. Seleziona una sala prove valida e salva di nuovo. I brani selezionati sono stati mantenuti.');
          this.step.set(1);
          this.rehearsalRoomsApi.list().subscribe({ next: (rooms) => this.rehearsalRooms.set(rooms), error: () => {} });
          return;
        }
        this.error.set(this.apiErrorMessage(error, 'Salvataggio non riuscito.'));
      },
    });
  }

  roomLabel(room: RehearsalRoom): string {
    return [room.name, room.city].filter(Boolean).join(' · ');
  }

  private roomValid(): boolean {
    const roomId = Number(this.form.controls.rehearsalRoomId.value);
    if (roomId > 0 && this.rehearsalRooms().some((room) => Number(room.id) === roomId)) return true;
    this.form.controls.rehearsalRoomId.markAsTouched();
    this.error.set('Seleziona una sala prove valida prima di salvare.');
    this.step.set(1);
    return false;
  }

  private timeRangeValid(): boolean {
    const { startTime, endTime } = this.form.getRawValue();
    if (startTime && endTime && endTime <= startTime) {
      this.error.set('L’orario di fine deve essere successivo all’orario di inizio.');
      return false;
    }
    return true;
  }

  private normalizeDate(value: string | string[] | null | undefined): string {
    if (Array.isArray(value)) return this.normalizeDate(value[0]);
    return value ? String(value).slice(0, 10) : '';
  }

  private normalizeTime(value: string | null | undefined): string {
    return value ? value.slice(0, 5) : '';
  }

  private today(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private apiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const validationErrors = error.error?.errors as Record<string, string[]> | undefined;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).find((messages) => messages.length)?.[0]
        : undefined;
      return firstValidationError || error.error?.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
  }

  private getBandId(): number | undefined {
    const segments = [this.route.snapshot, this.route.parent?.snapshot, this.route.parent?.parent?.snapshot, this.route.parent?.parent?.parent?.snapshot];
    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) return value;
    }
    return undefined;
  }
}
