
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonIcon, IonInput, IonLabel, IonNote, IonPopover, IonSpinner, IonTextarea, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { RehearsalSession, Song } from '../../../core/models/band-resources.models';
import { DaisyStepsComponent } from '../../../shared/ui/daisyui';
import { SongService } from '../../songs/services/song.service';
import { RehearsalSessionService } from '../services/rehearsal-session.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DaisyStepsComponent, IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonDatetime, IonDatetimeButton, IonHeader, IonIcon, IonInput, IonLabel, IonNote, IonPopover, IonSpinner, IonTextarea, IonTitle, IonToolbar],
  templateUrl: './rehearsal-session-form.page.html', styleUrls: ['./rehearsal-session-form.page.scss'],
})
export class RehearsalSessionFormPage implements OnInit {
  form = this.fb.nonNullable.group({ title: ['', Validators.required], date: [this.today(), Validators.required], startTime: '', endTime: '', rehearsalRoomId: '', notes: '' });
  editing = false;
  saving = false;
  loading = true;
  error = '';
  step = 1;
  songs: Song[] = [];
  selectedSongIds: number[] = [];
  private id?: number;
  private bandId?: number;

  constructor(private readonly fb: FormBuilder, private readonly rehearsalSessions: RehearsalSessionService, private readonly songService: SongService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toast: ToastController) {}

  ngOnInit(): void {
    this.bandId = this.getBandId();
    this.id = Number(this.route.snapshot.paramMap.get('id')) || undefined;
    this.editing = !!this.id;
    forkJoin({
      songs: this.songService.list(),
      session: this.id ? this.rehearsalSessions.get(this.id) : of(undefined),
    }).subscribe({
      next: ({ songs, session }) => {
        this.songs = songs.filter((song) => song.status !== 'archived');
        if (session) {
          this.form.patchValue({ title: session.title, date: session.date ?? '', startTime: session.startTime ?? '', endTime: session.endTime ?? '', rehearsalRoomId: session.rehearsalRoomId != null ? String(session.rehearsalRoomId) : '', notes: session.notes ?? '' });
          this.selectedSongIds = session.songIds ?? session.songs?.map((song) => song.id) ?? [];
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossibile caricare i dati della prova.';
        this.loading = false;
      },
    });
  }

  continueToSongs(): void {
    this.form.controls.title.markAsTouched();
    this.form.controls.date.markAsTouched();
    if (this.form.controls.title.invalid || this.form.controls.date.invalid) return;
    this.step = 2;
  }

  toggleSong(songId: number, checked: boolean): void {
    this.selectedSongIds = checked
      ? Array.from(new Set([...this.selectedSongIds, songId]))
      : this.selectedSongIds.filter((id) => id !== songId);
  }

  save(): void {
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload: Partial<RehearsalSession> = {
      ...this.form.getRawValue(),
      date: this.normalizeDate(this.form.controls.date.value),
      rehearsalRoomId: this.toNumber(this.form.getRawValue().rehearsalRoomId),
      songIds: this.selectedSongIds,
    };
    const request = this.editing ? this.rehearsalSessions.update(this.id!, payload) : this.rehearsalSessions.create(payload);
    request.subscribe({ next: async () => { (await this.toast.create({ message: 'Prova salvata.', duration: 1800, color: 'success' })).present(); void this.router.navigateByUrl(this.bandId ? `/band/${this.bandId}/prove` : '/bands'); }, error: (error: Error) => { this.error = error.message || 'Salvataggio non riuscito.'; this.saving = false; } });
  }

  private toNumber(value: string): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  onDateChange(event: CustomEvent<{ value?: string | string[] | null }>): void {
    const dateControl = this.form.controls.date;
    dateControl.setValue(this.normalizeDate(event.detail.value), { emitEvent: false });
    dateControl.markAsTouched();
  }

  private normalizeDate(value: string | string[] | null | undefined): string {
    if (Array.isArray(value)) {
      return this.normalizeDate(value[0]);
    }

    return value ? String(value).slice(0, 10) : '';
  }

  private today(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getBandId(): number | undefined {
    const segments = [this.route.snapshot, this.route.parent?.snapshot, this.route.parent?.parent?.snapshot, this.route.parent?.parent?.parent?.snapshot];
    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
    }

    return undefined;
  }
}
