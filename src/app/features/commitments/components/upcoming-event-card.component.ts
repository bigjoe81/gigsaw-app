import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SymbolComponent } from '../../../shared/ui/native-ui';
import { GigsawButtonComponent } from '../../../shared/ui/gigsaw';
import type { UpcomingBandEvent } from '../models/upcoming-band-event.models';

@Component({
  selector: 'app-upcoming-event-card',
  standalone: true,
  imports: [SymbolComponent, GigsawButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex min-w-0 flex-col justify-between gap-6 rounded-2xl border border-solid border-[var(--gigsaw-border)] bg-[var(--gigsaw-input-background)] p-5 sm:p-6"
    >
      <div>
        <span
          class="inline-flex items-center gap-2 rounded-full bg-[var(--gigsaw-surface)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ui-color-primary)]"
        >
          <app-symbol [name]="event.type === 'rehearsal' ? 'mic-outline' : 'ticket-outline'" />
          {{ event.type === 'rehearsal' ? 'Prova' : 'Concerto' }}
        </span>
        <h3 class="mb-0 mt-5 text-2xl font-bold leading-tight">
          {{ event.type === 'rehearsal' ? 'Prepariamo la prova' : 'Prepariamo il concerto' }}
          <span class="text-[var(--ui-color-primary)]">del {{ dateLabel() }}</span>
        </h3>
        @if (bandName) {
          <p class="mb-0 mt-3 text-base leading-6 text-[var(--gigsaw-muted)]">
            con i <strong class="text-[var(--gigsaw-text)]">{{ bandName }}</strong>
          </p>
        }
        @if (showTitle() || event.location || event.time) {
          <div class="mt-5 grid gap-2 text-sm text-[var(--gigsaw-muted)]">
            @if (showTitle()) {
              <p class="m-0 flex items-center gap-2"><app-symbol name="musical-notes-outline" />{{ event.title }}</p>
            }
            @if (event.time) {
              <p class="m-0 flex items-center gap-2"><app-symbol name="time-outline" />{{ event.time.slice(0, 5) }}</p>
            }
            @if (event.location) {
              <p class="m-0 flex items-center gap-2"><app-symbol name="location-outline" />{{ event.location }}</p>
            }
          </div>
        }
      </div>

      <app-gigsaw-button tone="primary" buttonClass="w-full" (click)="prepare.emit(event)">
        {{ event.type === 'rehearsal' ? 'Prepariamo la prova' : 'Prepariamo il concerto' }}
        <app-symbol name="arrow-forward-outline" class="ml-2" />
      </app-gigsaw-button>
    </article>
  `,
})
export class UpcomingEventCardComponent {
  @Input({ required: true }) event!: UpcomingBandEvent;
  @Input() bandName = '';
  @Output() readonly prepare = new EventEmitter<UpcomingBandEvent>();

  showTitle(): boolean {
    const title = this.event.title.trim().toLocaleLowerCase('it-IT');
    const date = new Date(this.event.timestamp).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return !!title && !['prova', 'concerto', `prove del ${date}`, `prova del ${date}`].includes(title);
  }

  dateLabel(): string {
    return new Date(this.event.timestamp).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  }
}
