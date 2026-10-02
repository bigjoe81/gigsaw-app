import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonNote, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { RehearsalSession } from '../../../core/models/band-resources.models';
import { ResourceDetailPage } from '../../../shared/ui/resource-detail.page';

@Component({
  standalone: true,
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonNote, IonSkeletonText, IonTitle, IonToolbar],
  templateUrl: './rehearsal-session-detail.page.html',
  styleUrl: './rehearsal-session-detail.page.scss',
})
export class RehearsalSessionDetailPage extends ResourceDetailPage {
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
