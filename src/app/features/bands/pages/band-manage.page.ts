
import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonIcon,
  IonReorder,
  IonReorderGroup,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import type { ItemReorderCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, cloudUpload, downloadOutline, imageOutline, removeCircleOutline, shareOutline, trashOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/auth/auth.service';
import { BandContextService } from '../../../core/services/band-context.service';
import { Band, BandGenre, BandInputChannel, BandMember, BandPressPhoto, BandStagePlotItem, UpdateBandRequest } from '../models/band.models';
import { BandPressKitService } from '../services/band-press-kit.service';
import { BandService } from '../services/band.service';
import { GenreService } from '../services/genre.service';
import { BandMediaPackService } from '../services/band-media-pack.service';
import { BandTechRiderService } from '../services/band-tech-rider.service';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonIcon,
    IonLabel,
    IonList,
    IonNote,
    IonSelect,
    IonSelectOption,
    IonReorder,
    IonReorderGroup,
    IonSkeletonText,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar
],
  templateUrl: './band-manage.page.html',
  styles: ['.action-row{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0 8px;}.profile-logo{width:96px;height:96px;border-radius:20px;object-fit:cover;display:block;margin:0 auto 16px;box-shadow:0 10px 24px rgba(0,0,0,.12);}.press-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin-top:16px;}.press-photo-card{display:grid;gap:8px;}.press-photo-thumb{width:100%;aspect-ratio:1;border-radius:16px;object-fit:cover;background:var(--ion-color-light);}.channel-row{display:grid;gap:10px;padding:12px 0;border-bottom:1px solid var(--ion-color-light);}.stage-plot-grid{display:grid;gap:12px;margin-top:16px;}.stage-preview-shell{display:grid;gap:10px;}.stage-preview-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:.8rem;color:var(--ion-color-medium);letter-spacing:.05em;text-transform:uppercase;}.stage-preview{position:relative;min-height:280px;border-radius:22px;background:radial-gradient(circle at top,rgba(var(--ion-color-primary-rgb),0.14),transparent 35%),linear-gradient(180deg,rgba(10,23,35,.96) 0%,rgba(19,38,54,.95) 58%,rgba(11,18,27,.98) 100%);border:1px solid rgba(140,190,222,.28);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),0 18px 42px rgba(4,9,15,.26);}.stage-preview::before{content:\"\";position:absolute;inset:18px;background:repeating-linear-gradient(90deg,rgba(120,168,194,.12) 0 1px,transparent 1px 20%),repeating-linear-gradient(180deg,rgba(120,168,194,.12) 0 1px,transparent 1px 20%);border-radius:18px;}.stage-preview::after{content:\"AUDIENCE / FOH\";position:absolute;left:24px;right:24px;bottom:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.18);font-size:.74rem;letter-spacing:.14em;color:rgba(235,245,255,.7);text-align:center;}.stage-frame-label{position:absolute;font-size:.72rem;letter-spacing:.16em;color:rgba(231,242,251,.58);text-transform:uppercase;pointer-events:none;}.stage-frame-label.top{top:10px;left:50%;transform:translateX(-50%);}.stage-frame-label.left{left:6px;top:50%;transform:translateY(-50%) rotate(-90deg);}.stage-frame-label.right{right:6px;top:50%;transform:translateY(-50%) rotate(90deg);}.stage-grid-note{font-size:.78rem;color:var(--ion-color-medium);}.stage-plot-item{position:absolute;transform:translate(-50%,-50%);display:grid;gap:4px;align-items:center;justify-items:center;padding:10px 12px;border-radius:16px;border:1px solid rgba(255,255,255,.16);background:rgba(18,29,40,.9);color:#f3f7fa;font-size:.78rem;line-height:1.2;min-width:92px;max-width:120px;text-align:center;box-shadow:0 12px 26px rgba(0,0,0,.28);cursor:grab;touch-action:none;user-select:none;}.stage-plot-item:active{cursor:grabbing;}.stage-plot-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:12px;background:rgba(255,255,255,.08);font-size:1.05rem;font-weight:700;letter-spacing:.05em;}.stage-plot-badge{font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(236,244,250,.72);}.stage-plot-name{font-weight:600;}.stage-plot-role{font-size:.7rem;color:rgba(236,244,250,.8);}.stage-plot-item[data-kind=\"drums\"]{background:rgba(139,31,31,.9);}.stage-plot-item[data-kind=\"drums\"] .stage-plot-icon{background:rgba(255,234,234,.14);}.stage-plot-item[data-kind=\"vocal\"]{background:rgba(17,103,84,.92);}.stage-plot-item[data-kind=\"bass\"]{background:rgba(18,82,128,.92);}.stage-plot-item[data-kind=\"guitar\"]{background:rgba(140,82,20,.92);}.stage-plot-item[data-kind=\"keys\"]{background:rgba(79,45,130,.92);}.stage-plot-item[data-kind=\"other\"]{background:rgba(48,61,76,.92);}'],
})
export class BandManagePage implements OnInit {
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

  private readonly route = inject(ActivatedRoute);
  private readonly bandContext = inject(BandContextService);
  private readonly bandService = inject(BandService);
  private readonly genreService = inject(GenreService);
  private readonly pressKitService = inject(BandPressKitService);
  private readonly mediaPackService = inject(BandMediaPackService);
  private readonly techRiderService = inject(BandTechRiderService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastController);

  readonly inviteForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['BAND_MEMBER'],
  });

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    genres: [[] as number[]],
    bioShort: [''],
    bio: [''],
    city: [''],
    country: [''],
    email: ['', Validators.email],
    phone: [''],
    website: [''],
    instagramUrl: [''],
    facebookUrl: [''],
    youtubeUrl: [''],
    spotifyUrl: [''],
    tiktokUrl: [''],
  });

  readonly techForm = this.fb.nonNullable.group({
    soundEngineerNotes: [''],
    stagePlotNotes: [''],
    monitorMixNotes: [''],
    backlineNotes: [''],
    hospitalityNotes: [''],
    inputChannels: this.fb.array([]),
    stagePlotLayout: this.fb.array([]),
  });

  band?: Band;
  availableGenres: BandGenre[] = [];
  loading = true;
  inviting = false;
  savingProfile = false;
  savingTech = false;
  uploadingPressPhotos = false;
  error = '';
  inviteError = '';
  profileError = '';
  techError = '';
  selectedLogoFile: File | null = null;
  selectedPressPhotos: File[] = [];
  private bandId!: number;
  private dragCleanup?: () => void;

  get isAdmin(): boolean {
    return this.band?.currentUserRole === 'ADMIN';
  }

  get inputChannels(): FormArray {
    return this.techForm.get('inputChannels') as FormArray;
  }

  get stagePlotLayout(): FormArray {
    return this.techForm.get('stagePlotLayout') as FormArray;
  }

  constructor() {
    addIcons({ addCircleOutline, cloudUpload, downloadOutline, imageOutline, removeCircleOutline, shareOutline, trashOutline });
  }

  ngOnInit(): void {
    const bandId = this.getBandId();
    if (!bandId) {
      this.error = 'Band non trovata.';
      this.loading = false;
      return;
    }

    this.bandId = bandId;
    this.genreService.list().subscribe({
      next: (genres) => {
        this.availableGenres = genres;
      },
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.bandService.get(this.bandId).subscribe({
      next: (band) => {
        this.band = band;
        this.patchProfileForm(band);
        this.patchTechForm(band);
        this.loading = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.error = error.error?.message || 'Impossibile caricare la band.';
        this.loading = false;
      },
    });
  }

  private getBandId(): number | undefined {
    const currentBandId = this.bandContext.getCurrentBand();
    if (Number.isInteger(currentBandId) && currentBandId! > 0) {
      return currentBandId!;
    }

    const segments = [
      this.route.snapshot,
      this.route.parent?.snapshot,
      this.route.parent?.parent?.snapshot,
      this.route.parent?.parent?.parent?.snapshot,
    ];

    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
    }

    return undefined;
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
  }

  patchProfileForm(band: Band): void {
    this.profileForm.patchValue({
      name: band.name ?? '',
      genres: (band.genres ?? []).map((genre) => genre.id).filter((id): id is number => Number.isInteger(id)),
      bioShort: band.bioShort ?? '',
      bio: band.bio ?? '',
      city: band.city ?? '',
      country: band.country ?? '',
      email: band.email ?? '',
      phone: band.phone ?? '',
      website: band.website ?? '',
      instagramUrl: band.instagramUrl ?? '',
      facebookUrl: band.facebookUrl ?? '',
      youtubeUrl: band.youtubeUrl ?? '',
      spotifyUrl: band.spotifyUrl ?? '',
      tiktokUrl: band.tiktokUrl ?? '',
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.selectedLogoFile = input?.files?.[0] ?? null;
  }

  saveProfile(): void {
    if (!this.band || this.profileForm.invalid || this.savingProfile) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile = true;
    this.profileError = '';
    const values = this.profileForm.getRawValue();
    const payload: UpdateBandRequest = {
      name: values.name.trim(),
      genres: values.genres,
      logo: this.selectedLogoFile,
      bioShort: this.emptyToNull(values.bioShort),
      bio: this.emptyToNull(values.bio),
      city: this.emptyToNull(values.city),
      country: this.emptyToNull(values.country),
      email: this.emptyToNull(values.email),
      phone: this.emptyToNull(values.phone),
      website: this.emptyToNull(values.website),
      instagramUrl: this.emptyToNull(values.instagramUrl),
      facebookUrl: this.emptyToNull(values.facebookUrl),
      youtubeUrl: this.emptyToNull(values.youtubeUrl),
      spotifyUrl: this.emptyToNull(values.spotifyUrl),
      tiktokUrl: this.emptyToNull(values.tiktokUrl),
    };

    this.bandService.update(this.bandId, payload).subscribe({
      next: async (band) => {
        this.band = band;
        this.patchProfileForm(band);
        this.selectedLogoFile = null;
        this.savingProfile = false;
        (await this.toast.create({ message: 'Profilo band salvato.', duration: 1800, color: 'success' })).present();
      },
      error: async (error: { error?: { message?: string } }) => {
        this.savingProfile = false;
        this.profileError = error.error?.message || 'Salvataggio profilo non riuscito.';
        (await this.toast.create({ message: this.profileError, duration: 2200, color: 'danger' })).present();
      },
    });
  }

  onPressPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.selectedPressPhotos = Array.from(input?.files ?? []);
  }

  uploadPressPhotos(): void {
    if (!this.band || !this.selectedPressPhotos.length || this.uploadingPressPhotos) {
      return;
    }

    this.uploadingPressPhotos = true;
    this.bandService.uploadPressPhotos(this.bandId, this.selectedPressPhotos).subscribe({
      next: async (band) => {
        this.band = band;
        this.selectedPressPhotos = [];
        this.uploadingPressPhotos = false;
        (await this.toast.create({ message: 'Foto promo caricate.', duration: 1800, color: 'success' })).present();
      },
      error: async (error: { error?: { message?: string } }) => {
        this.uploadingPressPhotos = false;
        (await this.toast.create({ message: error.error?.message || 'Upload foto promo non riuscito.', duration: 2200, color: 'danger' })).present();
      },
    });
  }

  removePressPhoto(photo: BandPressPhoto): void {
    if (!this.band) return;

    this.bandService.deletePressPhoto(this.bandId, photo.id).subscribe({
      next: async () => {
        this.band = {
          ...this.band!,
          pressPhotos: (this.band?.pressPhotos ?? []).filter((item) => item.id !== photo.id),
        };
        (await this.toast.create({ message: 'Foto promo rimossa.', duration: 1600, color: 'success' })).present();
      },
      error: async (error: { error?: { message?: string } }) => {
        (await this.toast.create({ message: error.error?.message || 'Rimozione foto non riuscita.', duration: 2200, color: 'danger' })).present();
      },
    });
  }

  async exportPressKit(): Promise<void> {
    if (!this.band) return;
    await this.pressKitService.openPdf(this.bandId, `${this.band.name} press kit`);
  }

  async sharePressKit(): Promise<void> {
    if (!this.band) return;
    await this.pressKitService.sharePdf(this.bandId, `${this.band.name} press kit`);
  }

  async exportMediaPack(): Promise<void> {
    if (!this.band) return;
    await this.mediaPackService.downloadZip(this.bandId, `${this.band.name} media pack`);
  }

  async shareMediaPack(): Promise<void> {
    if (!this.band) return;
    await this.mediaPackService.shareZip(this.bandId, `${this.band.name} media pack`);
  }

  addInputChannel(): void {
    this.inputChannels.push(this.createInputChannelGroup({
      channel: this.inputChannels.length + 1,
      name: '',
      source: '',
      notes: '',
    }));
  }

  removeInputChannel(index: number): void {
    this.inputChannels.removeAt(index);
  }

  reorderInputChannels(event: ItemReorderCustomEvent): void {
    const controls = [...this.inputChannels.controls];
    const moved = controls.splice(event.detail.from, 1)[0];
    controls.splice(event.detail.to, 0, moved);
    this.inputChannels.clear();
    controls.forEach((control) => this.inputChannels.push(control));
    event.detail.complete();
  }

  addStagePlotItem(): void {
    this.stagePlotLayout.push(this.createStagePlotItemGroup({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      label: '',
      instrument: '',
      x: 50,
      y: 50,
    }));
  }

  removeStagePlotItem(index: number): void {
    this.stagePlotLayout.removeAt(index);
  }

  async applyTechPreset(presetId: string): Promise<void> {
    const preset = this.buildTechPreset(presetId);
    if (!preset) return;

    this.replaceInputChannels(preset.inputChannels);

    this.stagePlotLayout.clear();
    preset.stagePlotLayout.forEach((item) => this.stagePlotLayout.push(this.createStagePlotItemGroup(item)));

    this.techForm.patchValue({
      stagePlotNotes: preset.stagePlotNotes,
      monitorMixNotes: preset.monitorMixNotes,
      backlineNotes: preset.backlineNotes,
    });

    (await this.toast.create({
      message: `Preset tecnica applicato: ${preset.label}.`,
      duration: 1800,
      color: 'success',
    })).present();
  }

  async applyInputChannelPreset(presetId: string): Promise<void> {
    const preset = this.buildInputChannelPreset(presetId);
    if (!preset) return;

    this.replaceInputChannels(preset.inputChannels);

    if (preset.monitorMixNotes || preset.backlineNotes) {
      this.techForm.patchValue({
        monitorMixNotes: preset.monitorMixNotes,
        backlineNotes: preset.backlineNotes,
      });
    }

    (await this.toast.create({
      message: `Preset canali applicato: ${preset.label}.`,
      duration: 1800,
      color: 'success',
    })).present();
  }

  async applyStagePlotPreset(presetId: string): Promise<void> {
    const preset = this.buildStagePlotPreset(presetId);
    if (!preset) return;

    this.stagePlotLayout.clear();
    preset.stagePlotLayout.forEach((item) => this.stagePlotLayout.push(this.createStagePlotItemGroup(item)));

    if (preset.stagePlotNotes) {
      this.techForm.patchValue({
        stagePlotNotes: preset.stagePlotNotes,
      });
    }

    (await this.toast.create({
      message: `Preset stage plot applicato: ${preset.label}.`,
      duration: 1800,
      color: 'success',
    })).present();
  }

  async mergeDrumMikingPreset(presetId: string): Promise<void> {
    const preset = this.buildInputChannelPreset(presetId);
    if (!preset) return;

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

    (await this.toast.create({
      message: `Preset drum unito: ${preset.label}.`,
      duration: 1800,
      color: 'success',
    })).present();
  }

  startStagePlotDrag(index: number, event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    const container = target?.parentElement;
    if (!target || !container) return;

    event.preventDefault();
    target.setPointerCapture?.(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
      const group = this.stagePlotLayout.at(index);
      group.patchValue({
        x: this.snapToGrid(x, 5, 8, 92),
        y: this.snapToGrid(y, 5, 14, 82),
      });
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this.dragCleanup = undefined;
    };

    this.dragCleanup?.();
    this.dragCleanup = up;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
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

    this.bandService.update(this.bandId, payload).subscribe({
      next: async (band) => {
        this.band = band;
        this.patchTechForm(band);
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

  async copyJoinCode(): Promise<void> {
    const code = this.band?.joinCode?.trim();
    if (!code) return;

    await navigator.clipboard?.writeText(code);
    (await this.toast.create({ message: 'Codice band copiato.', duration: 1600, color: 'success' })).present();
  }

  async shareJoinCode(): Promise<void> {
    const code = this.band?.joinCode?.trim();
    if (!code) return;

    const text = `Usa questo codice per entrare nella band "${this.band?.name}": ${code}`;
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ title: this.band?.name, text });
      return;
    }

    await navigator.clipboard?.writeText(text);
    (await this.toast.create({ message: 'Messaggio invito copiato.', duration: 1800, color: 'success' })).present();
  }

  invite(): void {
    if (this.inviteForm.invalid || this.inviting) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviting = true;
    this.inviteError = '';
    const payload = this.inviteForm.getRawValue();

    this.bandService.invite(this.bandId, payload).subscribe({
      next: async () => {
        this.inviting = false;
        this.inviteForm.patchValue({ name: '', email: '', role: 'BAND_MEMBER' });
        (await this.toast.create({ message: 'Invito creato.', duration: 1800, color: 'success' })).present();
        this.load();
      },
      error: async (error: { error?: { message?: string } }) => {
        this.inviting = false;
        this.inviteError = error.error?.message || 'Invio invito non riuscito.';
        (await this.toast.create({ message: this.inviteError, duration: 2200, color: 'danger' })).present();
      },
    });
  }

  canEditRole(member: BandMember): boolean {
    return member.id !== this.auth.currentUser()?.id;
  }

  changeRole(member: BandMember, event: Event): void {
    const role = (event as CustomEvent<{ value?: string }>).detail?.value;
    if (!role || role === member.role) return;

    this.bandService.updateMemberRole(this.bandId, member.id, role).subscribe({
      next: async () => {
        member.role = role;
        (await this.toast.create({ message: 'Ruolo aggiornato.', duration: 1600, color: 'success' })).present();
      },
      error: async (error: { error?: { message?: string } }) => {
        (await this.toast.create({ message: error.error?.message || 'Aggiornamento ruolo non riuscito.', duration: 2200, color: 'danger' })).present();
        this.load();
      },
    });
  }

  roleLabel(role?: string | null): string {
    if (role === 'ADMIN') return 'Admin';
    if (role === 'BAND_MEMBER') return 'Membro band';
    return role || '—';
  }

  genreLabel(band: Band): string {
    return band.genres?.map((genre) => genre.name).filter(Boolean).join(' · ') || '';
  }

  stagePlotKind(value?: string | null): 'drums' | 'vocal' | 'bass' | 'guitar' | 'keys' | 'other' {
    const normalized = (value ?? '').trim().toLowerCase();
    if (!normalized) return 'other';
    if (/(drum|batter|perc|kick|snare|tom|cassa)/.test(normalized)) return 'drums';
    if (/(vocal|voce|cant|lead vox|backing|mic)/.test(normalized)) return 'vocal';
    if (/(bass|basso)/.test(normalized)) return 'bass';
    if (/(guitar|chitar|gtr)/.test(normalized)) return 'guitar';
    if (/(keys|keyb|keyboard|piano|synth|tast)/.test(normalized)) return 'keys';
    return 'other';
  }

  stagePlotBadge(value?: string | null): string {
    return {
      drums: 'DRM',
      vocal: 'VOC',
      bass: 'BASS',
      guitar: 'GTR',
      keys: 'KEYS',
      other: 'AUX',
    }[this.stagePlotKind(value)];
  }

  stagePlotIcon(value?: string | null): string {
    return {
      drums: '◉',
      vocal: 'MIC',
      bass: 'B',
      guitar: 'G',
      keys: 'K',
      other: 'A',
    }[this.stagePlotKind(value)];
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private readInputChannels(): BandInputChannel[] {
    return (this.inputChannels.getRawValue() as BandInputChannel[]).map((channel, index) => ({
      channel: Number(channel.channel || index + 1),
      name: String(channel.name ?? '').trim(),
      source: this.emptyToNull(String(channel.source ?? '')),
      notes: this.emptyToNull(String(channel.notes ?? '')),
    })).filter((channel) => channel.name);
  }

  private replaceInputChannels(channels: BandInputChannel[]): void {
    this.inputChannels.clear();
    channels.forEach((channel, index) => {
      this.inputChannels.push(this.createInputChannelGroup({
        ...channel,
        channel: index + 1,
      }));
    });
  }

  private inputChannelKey(channel: Partial<BandInputChannel>): string {
    const name = String(channel.name ?? '').trim().toLowerCase();
    const source = String(channel.source ?? '').trim().toLowerCase();
    return `${name}::${source}`;
  }

  private buildTechPreset(presetId: string): {
    label: string;
    stagePlotNotes: string;
    monitorMixNotes: string;
    backlineNotes: string;
    inputChannels: BandInputChannel[];
    stagePlotLayout: BandStagePlotItem[];
  } | null {
    const stage = (label: string, instrument: string, x: number, y: number): BandStagePlotItem => ({
      id: crypto.randomUUID?.() ?? `${presetId}-${label}-${x}-${y}`,
      label,
      instrument,
      x,
      y,
    });

    switch (presetId) {
      case 'rock-quartet':
        return {
          label: 'Quartetto rock',
          stagePlotNotes: 'Batteria center upstage, voce lead front center, backline ai lati.',
          monitorMixNotes: 'Mix separati per lead vocal, chitarra e basso. Batterista con mix ritmico dedicato.',
          backlineNotes: '1 amp chitarra, 1 amp basso, drum kit standard 4 pezzi.',
          inputChannels: [
            { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
            { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
            { channel: 3, name: 'OH L', source: 'Mic', notes: '' },
            { channel: 4, name: 'OH R', source: 'Mic', notes: '' },
            { channel: 5, name: 'Bass', source: 'DI', notes: '' },
            { channel: 6, name: 'Guitar', source: 'Mic', notes: 'Amp guitar' },
            { channel: 7, name: 'Lead Vox', source: 'Wireless', notes: '' },
          ],
          stagePlotLayout: [
            stage('Drums', 'Batteria', 50, 28),
            stage('Bass', 'Basso', 24, 48),
            stage('Guitar', 'Chitarra', 76, 48),
            stage('Lead Vox', 'Voce', 50, 72),
          ],
        };
      case 'power-trio':
        return {
          label: 'Power trio',
          stagePlotNotes: 'Setup compatto con batteria centrale e due front line laterali.',
          monitorMixNotes: 'Due mix frontali e un mix batteria.',
          backlineNotes: '1 amp basso, 1 amp chitarra, drum kit standard.',
          inputChannels: [
            { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
            { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
            { channel: 3, name: 'OH', source: 'Mic', notes: '' },
            { channel: 4, name: 'Bass Vox', source: 'DI + Mic', notes: 'Split if needed' },
            { channel: 5, name: 'Guitar Vox', source: 'Mic + Mic', notes: 'Amp + vocal' },
          ],
          stagePlotLayout: [
            stage('Drums', 'Batteria', 50, 30),
            stage('Bass Vox', 'Basso', 28, 68),
            stage('Guitar Vox', 'Chitarra', 72, 68),
          ],
        };
      case 'pop-five':
        return {
          label: 'Pop 5 elementi',
          stagePlotNotes: 'Batteria upstage center, tastiere stage left, chitarra stage right, front line voce e basso.',
          monitorMixNotes: 'Lead vocal e tastiere con mix dedicato, sidefill opzionale.',
          backlineNotes: 'Stereo keys DI, guitar amp, bass amp, drum kit completo.',
          inputChannels: [
            { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
            { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
            { channel: 3, name: 'Tom', source: 'Mic', notes: '' },
            { channel: 4, name: 'OH L', source: 'Mic', notes: '' },
            { channel: 5, name: 'OH R', source: 'Mic', notes: '' },
            { channel: 6, name: 'Bass', source: 'DI', notes: '' },
            { channel: 7, name: 'Guitar', source: 'Mic', notes: '' },
            { channel: 8, name: 'Keys L', source: 'DI', notes: 'Stereo pair' },
            { channel: 9, name: 'Keys R', source: 'DI', notes: 'Stereo pair' },
            { channel: 10, name: 'Lead Vox', source: 'Wireless', notes: '' },
          ],
          stagePlotLayout: [
            stage('Drums', 'Batteria', 50, 26),
            stage('Keys', 'Tastiere', 18, 46),
            stage('Bass', 'Basso', 34, 68),
            stage('Guitar', 'Chitarra', 72, 52),
            stage('Lead Vox', 'Voce', 50, 76),
          ],
        };
      case 'acoustic-duo':
        return {
          label: 'Duo acustico',
          stagePlotNotes: 'Setup frontale minimale con due voci e strumentazione acustica.',
          monitorMixNotes: 'Un mix per lato, riverbero leggero sulle voci.',
          backlineNotes: '2 DI acustiche, 2 vocal mic stand.',
          inputChannels: [
            { channel: 1, name: 'Acoustic 1', source: 'DI', notes: '' },
            { channel: 2, name: 'Vox 1', source: 'Mic', notes: '' },
            { channel: 3, name: 'Acoustic 2', source: 'DI', notes: '' },
            { channel: 4, name: 'Vox 2', source: 'Mic', notes: '' },
          ],
          stagePlotLayout: [
            stage('Performer 1', 'Voce / Chitarra', 36, 64),
            stage('Performer 2', 'Voce / Tastiere', 64, 64),
          ],
        };
      default:
        return null;
    }
  }

  private buildInputChannelPreset(presetId: string): {
    label: string;
    monitorMixNotes: string;
    backlineNotes: string;
    inputChannels: BandInputChannel[];
  } | null {
    switch (presetId) {
      case 'rock-basic-inputs':
        return {
          label: 'Canali rock base',
          monitorMixNotes: 'Mix dedicati per voce lead, chitarra e basso.',
          backlineNotes: 'Backline standard rock con amp chitarra e basso.',
          inputChannels: [
            { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
            { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
            { channel: 3, name: 'OH', source: 'Mic', notes: '' },
            { channel: 4, name: 'Bass', source: 'DI', notes: '' },
            { channel: 5, name: 'Guitar', source: 'Mic', notes: '' },
            { channel: 6, name: 'Lead Vox', source: 'Mic', notes: '' },
          ],
        };
      case 'pop-extended-inputs':
        return {
          label: 'Canali pop estesi',
          monitorMixNotes: 'Lead vocal e tastiere con mix separati; sidefill opzionale.',
          backlineNotes: 'Richiesta stereo keys e possibilità di tracce/click su canali dedicati.',
          inputChannels: [
            { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
            { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
            { channel: 3, name: 'Tom', source: 'Mic', notes: '' },
            { channel: 4, name: 'OH L', source: 'Mic', notes: '' },
            { channel: 5, name: 'OH R', source: 'Mic', notes: '' },
            { channel: 6, name: 'Bass', source: 'DI', notes: '' },
            { channel: 7, name: 'Guitar', source: 'Mic', notes: '' },
            { channel: 8, name: 'Keys L', source: 'DI', notes: '' },
            { channel: 9, name: 'Keys R', source: 'DI', notes: '' },
            { channel: 10, name: 'Lead Vox', source: 'Wireless', notes: '' },
            { channel: 11, name: 'Backing Vox', source: 'Mic', notes: '' },
            { channel: 12, name: 'Track / Click', source: 'DI', notes: 'Optional split' },
          ],
        };
      case 'drums-minimal':
        return {
          label: 'Drum miking minimale',
          monitorMixNotes: 'Kit microfonato in configurazione essenziale.',
          backlineNotes: 'Kick, snare e overhead; eventuali tom non microfonati.',
          inputChannels: [
            { channel: 1, name: 'Kick', source: 'Mic', notes: '' },
            { channel: 2, name: 'Snare', source: 'Mic', notes: '' },
            { channel: 3, name: 'OH Mono', source: 'Mic', notes: '' },
          ],
        };
      case 'drums-full':
        return {
          label: 'Drum miking completo',
          monitorMixNotes: 'Kit microfonato completo con immagine stereo overhead.',
          backlineNotes: 'Kick in/out, snare top/bottom, tom separati, hi-hat e overhead stereo.',
          inputChannels: [
            { channel: 1, name: 'Kick In', source: 'Mic', notes: '' },
            { channel: 2, name: 'Kick Out', source: 'Mic', notes: '' },
            { channel: 3, name: 'Snare Top', source: 'Mic', notes: '' },
            { channel: 4, name: 'Snare Bottom', source: 'Mic', notes: 'Phase reverse if needed' },
            { channel: 5, name: 'Hi-Hat', source: 'Mic', notes: '' },
            { channel: 6, name: 'Rack Tom', source: 'Mic', notes: '' },
            { channel: 7, name: 'Floor Tom', source: 'Mic', notes: '' },
            { channel: 8, name: 'OH L', source: 'Mic', notes: '' },
            { channel: 9, name: 'OH R', source: 'Mic', notes: '' },
          ],
        };
      default:
        return null;
    }
  }

  private buildStagePlotPreset(presetId: string): {
    label: string;
    stagePlotNotes: string;
    stagePlotLayout: BandStagePlotItem[];
  } | null {
    const stage = (label: string, instrument: string, x: number, y: number): BandStagePlotItem => ({
      id: crypto.randomUUID?.() ?? `${presetId}-${label}-${x}-${y}`,
      label,
      instrument,
      x,
      y,
    });

    switch (presetId) {
      case 'stage-rock-quartet':
        return {
          label: 'Stage rock quartet',
          stagePlotNotes: 'Batteria center upstage, basso e chitarra laterali, lead vocal downstage center.',
          stagePlotLayout: [
            stage('Drums', 'Batteria', 50, 28),
            stage('Bass', 'Basso', 24, 48),
            stage('Guitar', 'Chitarra', 76, 48),
            stage('Lead Vox', 'Voce', 50, 72),
          ],
        };
      case 'stage-pop-five':
        return {
          label: 'Stage pop 5 elementi',
          stagePlotNotes: 'Setup pop con tastiere stage left, chitarra stage right e voce lead front center.',
          stagePlotLayout: [
            stage('Drums', 'Batteria', 50, 26),
            stage('Keys', 'Tastiere', 18, 46),
            stage('Bass', 'Basso', 34, 68),
            stage('Guitar', 'Chitarra', 72, 52),
            stage('Lead Vox', 'Voce', 50, 76),
          ],
        };
      case 'stage-acoustic-duo':
        return {
          label: 'Stage duo acustico',
          stagePlotNotes: 'Due performer frontali con setup minimale e pochi ingombri.',
          stagePlotLayout: [
            stage('Performer 1', 'Voce / Chitarra', 36, 64),
            stage('Performer 2', 'Voce / Tastiere', 64, 64),
          ],
        };
      default:
        return null;
    }
  }

  private snapToGrid(value: number, step: number, min: number, max: number): number {
    const snapped = Math.round(value / step) * step;
    return Math.max(min, Math.min(max, snapped));
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
      x: [this.snapToGrid(item?.x ?? 50, 5, 8, 92), [Validators.required]],
      y: [this.snapToGrid(item?.y ?? 50, 5, 14, 82), [Validators.required]],
    });
  }
}
