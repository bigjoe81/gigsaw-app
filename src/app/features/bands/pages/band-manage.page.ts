
import { Component, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  IonSelect,
  IonTextarea,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonNote,
  IonIcon,
  IonReorder,
  IonReorderGroup,
  IonSkeletonText,
  IonSpinner,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import type { ItemReorderCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personCircleOutline, optionsOutline, imagesOutline, peopleOutline, addCircleOutline, cloudUpload, copyOutline, downloadOutline, imageOutline, logoWhatsapp, mailOutline, notificationsOutline, removeCircleOutline, shareOutline, trashOutline } from 'ionicons/icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { BandContextService } from '../../../core/services/band-context.service';
import { Band, BandGenre, BandInputChannel, BandMember, BandPressPhoto, BandStagePlotItem, PendingBandInvitation, UpdateBandRequest } from '../models/band.models';
import { BandPressKitService } from '../services/band-press-kit.service';
import { BandService } from '../services/band.service';
import { GenreService } from '../services/genre.service';
import { BandMediaPackService } from '../services/band-media-pack.service';
import { BandTechRiderService } from '../services/band-tech-rider.service';
import { GigsawBadgeComponent, GigsawListComponent, GigsawListItemComponent, GigsawTypeaheadComponent, GigsawTypeaheadItem } from '../../../shared/ui/gigsaw';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GigsawBadgeComponent,
    GigsawListComponent,
    GigsawListItemComponent,
    GigsawTypeaheadComponent,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonInput,
  IonSelect,
  IonTextarea,
  IonItem,
    IonIcon,
    IonLabel,
    IonMenuButton,
    IonNote,
    IonReorder,
    IonReorderGroup,
    IonSkeletonText,
    IonSpinner,
    IonSelectOption,
    IonTitle,
    IonToolbar
],
  templateUrl: './band-manage.page.html',
  styleUrl: './band-manage.page.scss',

})
export class BandManagePage implements OnInit, OnDestroy {
  readonly settingsSection = signal<'overview' | 'profile' | 'tech' | 'media' | 'team' | 'invites' | 'notifications'>('overview');
  readonly techSection = signal<'channels' | 'stage' | 'notes'>('channels');
  readonly selectedStageItem = signal<number | null>(null);
  readonly genreQuery = signal('');

  get genreTypeaheadItems(): GigsawTypeaheadItem[] {
    const selected = new Set(this.profileForm.controls.genres.value);
    return this.availableGenres
      .filter((genre): genre is BandGenre & { id: number; name: string } => Number.isInteger(genre.id) && !!genre.name)
      .filter((genre) => !selected.has(genre.id))
      .map((genre) => ({ id: genre.id, label: genre.name, data: genre }));
  }
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

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly savingMemberInstruments = signal<number | null>(null);
  inviting = false;
  savingProfile = false;
  savingTech = false;
  uploadingPressPhotos = false;
  inviteError = '';
  profileError = '';
  techError = '';
  selectedLogoFile: File | null = null;
  selectedPressPhotos: File[] = [];
  lastInvitation?: PendingBandInvitation;
  readonly canShareOnWhatsApp = this.isMobileDevice();
  private bandId!: number;
  private dragCleanup?: () => void;
  private readonly zone = inject(NgZone);

  ngOnDestroy(): void {
    this.dragCleanup?.();
  }
  private readonly memberInstrumentDrafts = new Map<number, string>();

  get isAdmin(): boolean {
    return this.band?.currentUserRole === 'ADMIN';
  }

  get bandInviteLink(): string {
    return this.buildInvitationUrl();
  }

  get inputChannels(): FormArray {
    return this.techForm.get('inputChannels') as FormArray;
  }

  get stagePlotLayout(): FormArray {
    return this.techForm.get('stagePlotLayout') as FormArray;
  }

  get selectedGenres(): BandGenre[] {
    const selected = new Set(this.profileForm.controls.genres.value);
    return this.availableGenres.filter((genre) => genre.id !== undefined && selected.has(genre.id));
  }

  openOnboarding(): void {
    void this.router.navigate(['/inizia'], { queryParams: { ripeti: 1 } });
  }

  readonly sections = [
    { key: 'profile', path: 'profilo', title: 'Profilo', description: 'Identità, biografia e contatti della band.', icon: 'person-circle-outline', admin: true },
    { key: 'tech', path: 'scheda-tecnica', title: 'Scheda tecnica', description: 'Canali audio, disposizione palco e note per il live.', icon: 'options-outline', admin: true },
    { key: 'media', path: 'media', title: 'Media e press kit', description: 'Foto promozionali e materiali da condividere.', icon: 'images-outline', admin: true },
    { key: 'team', path: 'membri', title: 'Membri', description: 'Musicisti, strumenti e ruoli nella band.', icon: 'people-outline', admin: false },
    { key: 'invites', path: 'inviti', title: 'Inviti', description: 'Link di accesso, inviti personalizzati e richieste pendenti.', icon: 'mail-outline', admin: true },
    { key: 'notifications', path: 'notifiche', title: 'Notifiche email', description: 'Decidi quali aggiornamenti importanti inviare ai membri.', icon: 'notifications-outline', admin: true },
  ] as const;
  private readonly destroyRef = inject(DestroyRef);

  get visibleSections() {
    return this.sections.filter((section) => !section.admin || this.isAdmin);
  }

  get currentSection() {
    return this.sections.find((section) => section.key === this.settingsSection());
  }

  settingsUrl(path = ''): string {
    return `/band/${this.bandId}/impostazioni${path ? '/' + path : ''}`;
  }

  private syncSection(path: string | null): void {
    const section = this.sections.find((item) => item.path === path);
    if (path && (!section || (this.band && section.admin && !this.isAdmin))) {
      void this.router.navigateByUrl(this.settingsUrl(), { replaceUrl: true });
      return;
    }
    this.settingsSection.set(section?.key ?? 'overview');
  }

  constructor() {
    addIcons({ personCircleOutline, optionsOutline, imagesOutline, peopleOutline, addCircleOutline, cloudUpload, copyOutline, downloadOutline, imageOutline, logoWhatsapp, mailOutline, notificationsOutline, removeCircleOutline, shareOutline, trashOutline });
  }

  ngOnInit(): void {
    const bandId = this.getBandId();
    if (!bandId) {
      this.loadError.set('Band non trovata.');
      this.loading.set(false);
      return;
    }

    this.bandId = bandId;
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.syncSection(params.get('section'));
    });
    this.genreService.list().subscribe({
      next: (genres) => {
        this.availableGenres = genres;
      },
    });
    this.load();
  }

  load(): void {
    this.loading.set(!this.band);
    this.loadError.set('');
    this.bandService.get(this.bandId).pipe(
      timeout({ first: 15000 }),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (band) => {
        this.band = band;
        this.syncSection(this.route.snapshot.paramMap.get('section'));
        this.syncMemberInstrumentDrafts(band.members ?? []);
        this.patchProfileForm(band);
        this.patchTechForm(band);
      },
      error: (error: { error?: { message?: string } }) => {
        this.loadError.set(error.error?.message || 'Impossibile caricare le impostazioni della band. Riprova.');
      },
    });
  }

  private getBandId(): number | undefined {
    const segments = [
      this.route.snapshot,
      this.route.parent?.snapshot,
      this.route.parent?.parent?.snapshot,
      this.route.parent?.parent?.parent?.snapshot,
    ];

    for (const snapshot of segments) {
      const value = Number(snapshot?.paramMap.get('bandId'));
      if (Number.isInteger(value) && value > 0) {
        this.bandContext.setCurrentBand(value);
        return value;
      }
    }

    const currentBandId = this.bandContext.getCurrentBand();
    if (Number.isInteger(currentBandId) && currentBandId! > 0) {
      return currentBandId!;
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
    this.selectedStageItem.set(null);
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

  onLogoFilesSelected(files: File[]): void {
    this.selectedLogoFile = files[0] ?? null;
  }

  setGenreValues(value: string | string[]): void {
    const values = Array.isArray(value) ? value : [value];
    this.profileForm.controls.genres.setValue(values.map(Number).filter(Number.isInteger));
  }

  selectGenre(item: GigsawTypeaheadItem): void {
    const genreId = Number(item.id);
    if (!Number.isInteger(genreId) || this.profileForm.controls.genres.value.includes(genreId)) return;
    this.profileForm.controls.genres.setValue([...this.profileForm.controls.genres.value, genreId]);
    this.profileForm.controls.genres.markAsDirty();
    this.genreQuery.set('');
  }

  removeGenre(genreId: number | undefined): void {
    if (!Number.isInteger(genreId)) return;
    this.profileForm.controls.genres.setValue(this.profileForm.controls.genres.value.filter((id) => id !== genreId));
    this.profileForm.controls.genres.markAsDirty();
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

  onPressPhotoFilesSelected(files: File[]): void {
    this.selectedPressPhotos = files;
  }

  changeRoleValue(member: BandMember, role: string | string[]): void {
    const value = Array.isArray(role) ? role[0] : role;
    if (!value || value === member.role) return;
    this.updateRole(member, value);
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

  addInputChannel(channel?: Partial<BandInputChannel>): void {
    this.inputChannels.push(this.createInputChannelGroup({
      channel: this.inputChannels.length + 1,
      name: channel?.name ?? '',
      source: channel?.source ?? '',
      notes: channel?.notes ?? '',
    }));
  }

  removeInputChannel(index: number): void {
    this.inputChannels.removeAt(index);
    this.renumberInputChannels();
  }

  reorderInputChannels(event: ItemReorderCustomEvent): void {
    const controls = [...this.inputChannels.controls];
    const moved = controls.splice(event.detail.from, 1)[0];
    controls.splice(event.detail.to, 0, moved);
    this.inputChannels.clear();
    controls.forEach((control) => this.inputChannels.push(control));
    this.renumberInputChannels();
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
    this.selectedStageItem.set(this.stagePlotLayout.length - 1);
  }

  addStageItem(label: string, instrument: string): void {
    const offset = (this.stagePlotLayout.length % 5) * 8;
    this.stagePlotLayout.push(this.createStagePlotItemGroup({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      label,
      instrument,
      x: 34 + offset,
      y: 48 + (this.stagePlotLayout.length % 2) * 16,
    }));
    this.selectedStageItem.set(this.stagePlotLayout.length - 1);
  }

  removeStagePlotItem(index: number): void {
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
    const preset = this.buildTechPreset(presetId);
    if (!preset) return;

    this.replaceInputChannels(preset.inputChannels);

    this.stagePlotLayout.clear();
    preset.stagePlotLayout.forEach((item) => this.stagePlotLayout.push(this.createStagePlotItemGroup(item)));
    this.selectedStageItem.set(null);

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
    this.selectedStageItem.set(null);

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

  onSettingsFilesSelected(event: Event, kind: 'logo' | 'photos'): void {
    const picker = event.target as HTMLInputElement;
    const files = Array.from(picker.files ?? []);
    if (!files.length) return;
    if (kind === 'logo') this.onLogoFilesSelected(files);
    else this.onPressPhotoFilesSelected(files);
    picker.value = '';
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
      position = { x: x / width * 100, y: y / height * 100 };
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

  invite(): void {
    if (this.inviteForm.invalid || this.inviting) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviting = true;
    this.inviteError = '';
    const payload = this.inviteForm.getRawValue();

    this.bandService.invite(this.bandId, payload).subscribe({
      next: async (invitation) => {
        this.inviting = false;
        this.lastInvitation = {
          ...invitation,
          name: invitation.name || payload.name,
          email: invitation.email || payload.email,
          role: invitation.role || payload.role,
        };
        this.inviteForm.patchValue({ name: '', email: '', role: 'BAND_MEMBER' });
        (await this.toast.create({ message: 'Invito pronto da condividere.', duration: 1800, color: 'success' })).present();
        this.load();
      },
      error: async (error: { error?: { message?: string } }) => {
        this.inviting = false;
        this.inviteError = error.error?.message || 'Invio invito non riuscito.';
        (await this.toast.create({ message: this.inviteError, duration: 2200, color: 'danger' })).present();
      },
    });
  }

  shareInvitationOnWhatsApp(invitation: PendingBandInvitation): void {
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(this.invitationMessage(invitation))}`;
    const opened = window.open(shareUrl, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.assign(shareUrl);
  }

  shareInvitationByEmail(invitation: PendingBandInvitation): void {
    const subject = `Invito a partecipare a ${this.band?.name ?? 'GigSaw'}`;
    const body = this.invitationMessage(invitation);
    window.location.href = `mailto:${encodeURIComponent(invitation.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async copyInvitationLink(invitation: PendingBandInvitation): Promise<void> {
    const inviteUrl = this.invitationUrl(invitation);
    if (navigator.clipboard) await navigator.clipboard.writeText(inviteUrl);
    (await this.toast.create({ message: 'Link invito copiato.', duration: 1600, color: 'success' })).present();
  }

  async copyBandInviteLink(): Promise<void> {
    if (!this.bandInviteLink) return;
    if (navigator.clipboard) await navigator.clipboard.writeText(this.bandInviteLink);
    (await this.toast.create({ message: 'Link invito copiato.', duration: 1600, color: 'success' })).present();
  }

  shareBandInviteOnWhatsApp(): void {
    this.shareInvitationOnWhatsApp({ id: 0, name: '', email: '', role: 'BAND_MEMBER' });
  }

  scrollToPersonalInvite(): void {
    document.getElementById('personal-invite-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private invitationMessage(invitation: PendingBandInvitation): string {
    const greeting = invitation.name?.trim() ? `Ciao ${invitation.name.trim()}!` : 'Ciao!';
    const bandName = this.band?.name ?? 'la mia band';
    return `${greeting} Ti invito a partecipare alla band “${bandName}” su GigSaw. Apri il link e premi “Partecipa”:\n${this.invitationUrl(invitation)}`;
  }

  private invitationUrl(invitation: PendingBandInvitation): string {
    if (invitation.inviteUrl) return invitation.inviteUrl;

    return this.buildInvitationUrl(invitation.name);
  }

  private buildInvitationUrl(inviteeName?: string): string {
    const code = this.band?.joinCode?.trim();
    if (!code || typeof window === 'undefined') return '';

    const url = new URL(`/invito/${encodeURIComponent(code)}`, window.location.origin);
    if (this.band?.name) url.searchParams.set('band', this.band.name);
    if (inviteeName) url.searchParams.set('name', inviteeName);
    url.searchParams.set('bandId', String(this.bandId));
    return url.toString();
  }

  private isMobileDevice(): boolean {
    return typeof window !== 'undefined'
      && (window.matchMedia('(max-width: 767px)').matches || navigator.maxTouchPoints > 0);
  }

  canEditRole(member: BandMember): boolean {
    return member.id !== this.auth.currentUser()?.id;
  }

  changeRole(member: BandMember, event: Event): void {
    const role = (event as CustomEvent<{ value?: string }>).detail?.value;
    if (!role || role === member.role) return;

    this.updateRole(member, role);
  }

  private updateRole(member: BandMember, role: string): void {
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

  canEditInstruments(member: BandMember): boolean {
    return this.isAdmin || member.id === this.auth.currentUser()?.id;
  }

  memberInstrumentsDraft(member: BandMember): string {
    return this.memberInstrumentDrafts.get(member.id) ?? (member.instruments ?? []).join(', ');
  }

  updateMemberInstrumentsDraft(member: BandMember, event: Event): void {
    const value = (event as CustomEvent<{ value?: string | null }>).detail?.value ?? '';
    this.memberInstrumentDrafts.set(member.id, value);
  }

  updateMemberInstrumentsValue(member: BandMember, value: string): void {
    this.memberInstrumentDrafts.set(member.id, value);
  }

  saveMemberInstruments(member: BandMember): void {
    if (!this.canEditInstruments(member) || this.savingMemberInstruments() !== null) return;

    const instruments = this.parseInstruments(this.memberInstrumentsDraft(member));
    this.savingMemberInstruments.set(member.id);
    this.bandService.updateMemberInstruments(this.bandId, member.id, instruments).pipe(
      finalize(() => this.savingMemberInstruments.set(null)),
    ).subscribe({
      next: async (updatedMember) => {
        member.instruments = updatedMember.instruments;
        this.memberInstrumentDrafts.set(member.id, (updatedMember.instruments ?? []).join(', '));
        (await this.toast.create({ message: 'Strumenti aggiornati.', duration: 1600, color: 'success' })).present();
      },
      error: async (error: { error?: { message?: string } }) => {
        (await this.toast.create({ message: error.error?.message || 'Aggiornamento strumenti non riuscito.', duration: 2200, color: 'danger' })).present();
      },
    });
  }

  private syncMemberInstrumentDrafts(members: BandMember[]): void {
    this.memberInstrumentDrafts.clear();
    for (const member of members) {
      this.memberInstrumentDrafts.set(member.id, (member.instruments ?? []).join(', '));
    }
  }

  private parseInstruments(value: string): string[] {
    const seen = new Set<string>();
    return value
      .split(',')
      .map((instrument) => instrument.trim())
      .filter((instrument) => {
        const key = instrument.toLocaleLowerCase('it');
        if (!instrument || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 20);
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
