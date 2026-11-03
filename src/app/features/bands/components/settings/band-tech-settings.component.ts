import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  Output,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NativeUiModule, ToastService, ReorderEvent } from '../../../../shared/ui/native-ui';
import { GigsawFormControlsModule } from '../../../../shared/ui/gigsaw/gigsaw-form-controls.module';

import { Band, BandInputChannel, BandStagePlotItem, UpdateBandRequest } from '../../models/band.models';
import { BandService } from '../../services/band.service';
import { BandTechRiderService } from '../../services/band-tech-rider.service';
import {
  buildTechPreset,
  buildInputChannelPreset,
  buildStagePlotPreset,
  stagePlotKind,
  stagePlotIcon,
} from '../../utils/band-tech-presets';

@Component({
  selector: 'app-band-tech-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [NativeUiModule, GigsawFormControlsModule, ReactiveFormsModule],
  templateUrl: './band-tech-settings.component.html',
  styleUrl: './band-tech-settings.component.scss',
})
export class BandTechSettingsComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) band!: Band;
  @Output() readonly bandChange = new EventEmitter<Band>();
  private readonly bandService = inject(BandService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private get bandId(): number {
    return this.band.id;
  }
  private readonly fb = inject(FormBuilder);
  readonly techSection = signal<'channels' | 'stage' | 'notes'>('channels');
  readonly selectedStageItem = signal<number | null>(null);
  readonly quickChannels: ReadonlyArray<Pick<BandInputChannel, 'name' | 'source'>> = [
    { name: 'Voce', source: 'Mic' },
    { name: 'Chitarra', source: 'Mic' },
    { name: 'Basso', source: 'DI' },
    { name: 'Tastiere L', source: 'DI' },
    { name: 'Tastiere R', source: 'DI' },
    { name: 'Kick', source: 'Mic' },
    { name: 'Snare', source: 'Mic' },
  ];
  readonly stageItems = [
    { label: 'Voce', instrument: 'Voce' },
    { label: 'Chitarra', instrument: 'Chitarra' },
    { label: 'Basso', instrument: 'Basso' },
    { label: 'Tastiere', instrument: 'Tastiere' },
    { label: 'Batteria', instrument: 'Batteria' },
    { label: 'Monitor', instrument: 'Monitor' },
  ] as const;
  readonly techPresets = [
    { id: 'rock-quartet', label: 'Quartetto rock' },
    { id: 'power-trio', label: 'Power trio' },
    { id: 'pop-five', label: 'Pop 5 elementi' },
    { id: 'acoustic-duo', label: 'Duo acustico' },
  ] as const;
  readonly inputChannelPresets = [
    { id: 'rock-basic-inputs', label: 'Canali rock base' },
    { id: 'pop-extended-inputs', label: 'Canali pop estesi' },
    { id: 'drums-minimal', label: 'Drum miking minimale' },
    { id: 'drums-full', label: 'Drum miking completo' },
  ] as const;
  readonly drumMergePresets = [
    { id: 'drums-minimal', label: 'Merge drum minimale' },
    { id: 'drums-full', label: 'Merge drum completo' },
  ] as const;
  readonly stagePlotPresets = [
    { id: 'stage-rock-quartet', label: 'Stage rock quartet' },
    { id: 'stage-pop-five', label: 'Stage pop 5 elementi' },
    { id: 'stage-acoustic-duo', label: 'Stage duo acustico' },
  ] as const;
  readonly techForm = this.fb.nonNullable.group({
    soundEngineerNotes: [''],
    stagePlotNotes: [''],
    monitorMixNotes: [''],
    backlineNotes: [''],
    hospitalityNotes: [''],
    inputChannels: this.fb.array([]),
    stagePlotLayout: this.fb.array([]),
  });

  private readonly techRiderService = inject(BandTechRiderService);
  private readonly zone = inject(NgZone);
  private dragCleanup?: () => void;
  savingTech = false;
  techError = '';
  readonly stagePlotKind = stagePlotKind;
  readonly stagePlotIcon = stagePlotIcon;
  ngOnChanges(changes: SimpleChanges): void {
    const previous = changes['band']?.previousValue as Band | undefined;
    if (previous?.id !== this.band.id || !this.techForm.dirty) this.patchTechForm(this.band);
  }
  ngOnDestroy(): void {
    this.dragCleanup?.();
  }
  get inputChannels(): FormArray {
    return this.techForm.get('inputChannels') as FormArray;
  }

  get stagePlotLayout(): FormArray {
    return this.techForm.get('stagePlotLayout') as FormArray;
  }
  patchTechForm(band: Band): void {
    this.techForm.patchValue({
      soundEngineerNotes: band.soundEngineerNotes ?? '',
      stagePlotNotes: band.stagePlotNotes ?? '',
      monitorMixNotes: band.monitorMixNotes ?? '',
      backlineNotes: band.backlineNotes ?? '',
      hospitalityNotes: band.hospitalityNotes ?? '',
    });

    this.inputChannels.clear();
    for (const channel of band.inputChannels ?? []) {
      this.inputChannels.push(this.createInputChannelGroup(channel));
    }

    this.stagePlotLayout.clear();
    for (const item of band.stagePlotLayout ?? []) {
      this.stagePlotLayout.push(this.createStagePlotItemGroup(item));
    }
    this.selectedStageItem.set(null);
  }

  addInputChannel(channel?: Partial<BandInputChannel>): void {
    this.techForm.markAsDirty();
    this.inputChannels.push(
      this.createInputChannelGroup({
        channel: this.inputChannels.length + 1,
        name: channel?.name ?? '',
        source: channel?.source ?? '',
        notes: channel?.notes ?? '',
      }),
    );
  }

  removeInputChannel(index: number): void {
    this.techForm.markAsDirty();
    this.inputChannels.removeAt(index);
    this.renumberInputChannels();
  }

  reorderInputChannels(event: ReorderEvent): void {
    this.techForm.markAsDirty();
    const controls = [...this.inputChannels.controls];
    const moved = controls.splice(event.detail.from, 1)[0];
    controls.splice(event.detail.to, 0, moved);
    this.inputChannels.clear();
    controls.forEach((control) => this.inputChannels.push(control));
    this.renumberInputChannels();
    event.detail.complete();
  }

  addStagePlotItem(): void {
    this.techForm.markAsDirty();
    this.stagePlotLayout.push(
      this.createStagePlotItemGroup({
        id: crypto.randomUUID?.() ?? String(Date.now()),
        label: '',
        instrument: '',
        x: 50,
        y: 50,
      }),
    );
    this.selectedStageItem.set(this.stagePlotLayout.length - 1);
  }

  addStageItem(label: string, instrument: string): void {
    this.techForm.markAsDirty();
    const offset = (this.stagePlotLayout.length % 5) * 8;
    this.stagePlotLayout.push(
      this.createStagePlotItemGroup({
        id: crypto.randomUUID?.() ?? String(Date.now()),
        label,
        instrument,
        x: 34 + offset,
        y: 48 + (this.stagePlotLayout.length % 2) * 16,
      }),
    );
    this.selectedStageItem.set(this.stagePlotLayout.length - 1);
  }

  removeStagePlotItem(index: number): void {
    this.techForm.markAsDirty();
    this.stagePlotLayout.removeAt(index);
    this.selectedStageItem.set(null);
  }

  selectStageItem(index: number): void {
    this.selectedStageItem.set(index);
  }

  private renumberInputChannels(): void {
    this.inputChannels.controls.forEach((control, index) => control.get('channel')?.setValue(index + 1));
  }

  async applyTechPreset(presetId: string): Promise<void> {
    const preset = buildTechPreset(presetId);
    if (!preset) return;
    this.techForm.markAsDirty();

    this.replaceInputChannels(preset.inputChannels);

    this.stagePlotLayout.clear();
    preset.stagePlotLayout.forEach((item) => this.stagePlotLayout.push(this.createStagePlotItemGroup(item)));
    this.selectedStageItem.set(null);

    this.techForm.patchValue({
      stagePlotNotes: preset.stagePlotNotes,
      monitorMixNotes: preset.monitorMixNotes,
      backlineNotes: preset.backlineNotes,
    });

    (
      await this.toast.create({
        message: `Preset tecnica applicato: ${preset.label}.`,
        duration: 1800,
        color: 'success',
      })
    ).present();
  }

  async applyInputChannelPreset(presetId: string): Promise<void> {
    const preset = buildInputChannelPreset(presetId);
    if (!preset) return;
    this.techForm.markAsDirty();

    this.replaceInputChannels(preset.inputChannels);

    if (preset.monitorMixNotes || preset.backlineNotes) {
      this.techForm.patchValue({
        monitorMixNotes: preset.monitorMixNotes,
        backlineNotes: preset.backlineNotes,
      });
    }

    (
      await this.toast.create({
        message: `Preset canali applicato: ${preset.label}.`,
        duration: 1800,
        color: 'success',
      })
    ).present();
  }

  async applyStagePlotPreset(presetId: string): Promise<void> {
    const preset = buildStagePlotPreset(presetId);
    if (!preset) return;
    this.techForm.markAsDirty();

    this.stagePlotLayout.clear();
    preset.stagePlotLayout.forEach((item) => this.stagePlotLayout.push(this.createStagePlotItemGroup(item)));
    this.selectedStageItem.set(null);

    if (preset.stagePlotNotes) {
      this.techForm.patchValue({
        stagePlotNotes: preset.stagePlotNotes,
      });
    }

    (
      await this.toast.create({
        message: `Preset stage plot applicato: ${preset.label}.`,
        duration: 1800,
        color: 'success',
      })
    ).present();
  }

  async mergeDrumMikingPreset(presetId: string): Promise<void> {
    const preset = buildInputChannelPreset(presetId);
    if (!preset) return;
    this.techForm.markAsDirty();

    const currentChannels = this.readInputChannels();
    const existingKeys = new Set(currentChannels.map((channel) => this.inputChannelKey(channel)));
    const mergedChannels = [...currentChannels];

    for (const channel of preset.inputChannels) {
      const key = this.inputChannelKey(channel);
      if (!existingKeys.has(key)) {
        mergedChannels.push(channel);
        existingKeys.add(key);
      }
    }

    this.replaceInputChannels(mergedChannels);
    this.techForm.patchValue({
      monitorMixNotes: preset.monitorMixNotes,
      backlineNotes: preset.backlineNotes,
    });

    (
      await this.toast.create({
        message: `Preset drum unito: ${preset.label}.`,
        duration: 1800,
        color: 'success',
      })
    ).present();
  }

  startStagePlotDrag(index: number, event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) return;
    const target = event.currentTarget as HTMLElement | null;
    const container = target?.parentElement;
    const group = this.stagePlotLayout.at(index);
    if (!target || !container || !group) return;

    this.dragCleanup?.();
    event.preventDefault();
    const itemRect = target.getBoundingClientRect();
    const offsetX = event.clientX - (itemRect.left + itemRect.width / 2);
    const offsetY = event.clientY - (itemRect.top + itemRect.height / 2);
    const pointerId = event.pointerId;
    let position = { x: Number(group.get('x')?.value ?? 50), y: Number(group.get('y')?.value ?? 50) };
    let frame: number | undefined;
    let finished = false;

    const updatePosition = (pointer: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      const minX = Math.min(width / 2, itemRect.width / 2 + 8);
      const minY = Math.min(height / 2, itemRect.height / 2 + 24);
      const maxX = Math.max(minX, width - itemRect.width / 2 - 8);
      const maxY = Math.max(minY, height - itemRect.height / 2 - 36);
      const x = Math.max(minX, Math.min(maxX, pointer.clientX - rect.left - container.clientLeft - offsetX));
      const y = Math.max(minY, Math.min(maxY, pointer.clientY - rect.top - container.clientTop - offsetY));
      position = { x: (x / width) * 100, y: (y / height) * 100 };
    };
    const render = () => {
      frame = undefined;
      target.style.left = `${position.x}%`;
      target.style.top = `${position.y}%`;
    };
    const move = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      updatePosition(pointer);
      if (frame === undefined) frame = requestAnimationFrame(render);
    };
    const finish = (pointer?: PointerEvent) => {
      if (finished || (pointer && pointer.pointerId !== pointerId)) return;
      finished = true;
      if (pointer?.type === 'pointerup') updatePosition(pointer);
      if (frame !== undefined) cancelAnimationFrame(frame);
      render();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      target.removeEventListener('lostpointercapture', finish);
      if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
      target.classList.remove('dragging');
      this.dragCleanup = undefined;
      this.zone.run(() => {
        group.patchValue(position);
        group.markAsDirty();
      });
    };

    this.dragCleanup = finish;
    target.classList.add('dragging');
    target.setPointerCapture(pointerId);
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', finish);
      target.addEventListener('lostpointercapture', finish);
    });
  }

  saveTech(): void {
    if (!this.band || this.techForm.invalid || this.savingTech) {
      this.techForm.markAllAsTouched();
      return;
    }

    this.savingTech = true;
    this.techError = '';
    const values = this.techForm.getRawValue();
    const payload: UpdateBandRequest = {
      name: this.band.name,
      genres: (this.band.genres ?? []).map((genre) => genre.id).filter((id): id is number => Number.isInteger(id)),
      bioShort: this.band.bioShort ?? null,
      bio: this.band.bio ?? null,
      city: this.band.city ?? null,
      country: this.band.country ?? null,
      email: this.band.email ?? null,
      phone: this.band.phone ?? null,
      website: this.band.website ?? null,
      instagramUrl: this.band.instagramUrl ?? null,
      facebookUrl: this.band.facebookUrl ?? null,
      youtubeUrl: this.band.youtubeUrl ?? null,
      spotifyUrl: this.band.spotifyUrl ?? null,
      tiktokUrl: this.band.tiktokUrl ?? null,
      soundEngineerNotes: this.emptyToNull(values.soundEngineerNotes),
      stagePlotNotes: this.emptyToNull(values.stagePlotNotes),
      monitorMixNotes: this.emptyToNull(values.monitorMixNotes),
      backlineNotes: this.emptyToNull(values.backlineNotes),
      hospitalityNotes: this.emptyToNull(values.hospitalityNotes),
      inputChannels: (values.inputChannels as BandInputChannel[])
        .map((item: BandInputChannel) => ({
          channel: Number(item.channel),
          name: String(item.name ?? '').trim(),
          source: this.emptyToNull(String(item.source ?? '')),
          notes: this.emptyToNull(String(item.notes ?? '')),
        }))
        .filter((item: BandInputChannel) => item.name),
      stagePlotLayout: (values.stagePlotLayout as BandStagePlotItem[])
        .map((item: BandStagePlotItem) => ({
          id: item.id ?? null,
          label: String(item.label ?? '').trim(),
          instrument: this.emptyToNull(String(item.instrument ?? '')),
          x: Number(item.x),
          y: Number(item.y),
        }))
        .filter((item: BandStagePlotItem) => item.label),
    };

    this.bandService
      .update(this.bandId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (band) => {
          this.band = band;
          this.bandChange.emit(band);
          this.patchTechForm(band);
          this.techForm.markAsPristine();
          this.savingTech = false;
          (await this.toast.create({ message: 'Scheda tecnica salvata.', duration: 1800, color: 'success' })).present();
        },
        error: async (error: { error?: { message?: string } }) => {
          this.savingTech = false;
          this.techError = error.error?.message || 'Salvataggio scheda tecnica non riuscito.';
          (await this.toast.create({ message: this.techError, duration: 2200, color: 'danger' })).present();
        },
      });
  }

  async exportTechRider(): Promise<void> {
    if (!this.band) return;
    await this.techRiderService.openPdf(this.bandId, `${this.band.name} tech rider`);
  }

  async shareTechRider(): Promise<void> {
    if (!this.band) return;
    await this.techRiderService.sharePdf(this.bandId, `${this.band.name} tech rider`);
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private readInputChannels(): BandInputChannel[] {
    return (this.inputChannels.getRawValue() as BandInputChannel[])
      .map((channel, index) => ({
        channel: Number(channel.channel || index + 1),
        name: String(channel.name ?? '').trim(),
        source: this.emptyToNull(String(channel.source ?? '')),
        notes: this.emptyToNull(String(channel.notes ?? '')),
      }))
      .filter((channel) => channel.name);
  }

  private replaceInputChannels(channels: BandInputChannel[]): void {
    this.inputChannels.clear();
    channels.forEach((channel, index) => {
      this.inputChannels.push(
        this.createInputChannelGroup({
          ...channel,
          channel: index + 1,
        }),
      );
    });
  }

  private inputChannelKey(channel: Partial<BandInputChannel>): string {
    const name = String(channel.name ?? '')
      .trim()
      .toLowerCase();
    const source = String(channel.source ?? '')
      .trim()
      .toLowerCase();
    return `${name}::${source}`;
  }

  private clampStagePosition(value: number): number {
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
  }

  private createInputChannelGroup(channel?: Partial<BandInputChannel>) {
    return this.fb.nonNullable.group({
      channel: [channel?.channel ?? this.inputChannels.length + 1, [Validators.required]],
      name: [channel?.name ?? '', [Validators.required]],
      source: [channel?.source ?? ''],
      notes: [channel?.notes ?? ''],
    });
  }

  private createStagePlotItemGroup(item?: Partial<BandStagePlotItem>) {
    return this.fb.nonNullable.group({
      id: [item?.id ?? ''],
      label: [item?.label ?? '', [Validators.required]],
      instrument: [item?.instrument ?? ''],
      x: [this.clampStagePosition(item?.x ?? 50), [Validators.required]],
      y: [this.clampStagePosition(item?.y ?? 50), [Validators.required]],
    });
  }
}
