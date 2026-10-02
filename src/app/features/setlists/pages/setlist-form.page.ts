import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonFooter, IonSpinner, IonInput, IonCheckbox, IonTextarea, IonSelect, IonSelectOption, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Subscription, debounceTime, finalize, forkJoin, Subject, timeout } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { GigService } from '../../gigs/services/gig.service';
import { SongService } from '../../songs/services/song.service';
import { MagicConstraints, MagicProposal, SetlistItem, SetlistSnapshot, SetlistWorkspace, WorkspaceSet } from '../models/setlist-workspace.models';
import { MagicSetService } from '../services/magic-set.service';
import { cloneWorkspace, LocalSetlistRepository, moveItemBefore, setDuration, SetlistHistoryService, splitMedley, uid } from '../services/setlist-workspace.service';
import { SetlistValidationService } from '../services/setlist-validation.service';
import { SetlistService } from '../services/setlist.service';

@Component({ standalone: true, imports: [CommonModule, FormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonFooter, IonSpinner, IonInput, IonCheckbox, IonTextarea, IonSelect, IonSelectOption, IonTitle, IonToolbar], templateUrl: './setlist-form.page.html', styleUrls: ['./setlist-form.page.scss'] })
export class SetlistFormPage implements OnInit, OnDestroy {
  readonly savingToServer = signal(false);
  readonly savedToServer = signal(false);
  readonly serverSaveError = signal('');
  mode: 'manual' | 'magic' = 'manual'; mobileTab: 'repertoire' | 'setlist' | 'inspector' = 'setlist'; readonly loading = signal(true); readonly repertoireLoading = signal(true); readonly loadError = signal(''); readonly repertoireError = signal(''); saveState: 'dirty' | 'saving' | 'saved' = 'saved';
  songs: Song[] = []; search = ''; selected?: SetlistItem; proposal?: MagicProposal; snapshot?: SetlistSnapshot; compare = false;
  private readonly workspaceState = signal<SetlistWorkspace>({ id: 'new', title: 'Nuova scaletta', sets: [{ id: uid('set'), name: 'Set 1', targetSeconds: 2700, items: [] }], updatedAt: new Date().toISOString() });
  get workspace(): SetlistWorkspace { return this.workspaceState(); }
  set workspace(value: SetlistWorkspace) { this.workspaceState.set(value); }
  constraints: MagicConstraints = { totalSeconds: 5400, setCount: 2, setSeconds: 2700, breakSeconds: 900, requiredSongIds: [], excludedSongIds: [], encoreSongIds: [], weWantMoreSongIds: [], consecutiveGroups: [], separatedPairs: [], mandatoryMedleys: [], balanceSingers: true, energyCurve: 'wave', alternateGenres: true, separateSameKeys: true, maxDraftSongs: 2, preferLiveReady: true };
  private changes = new Subject<void>(); private sub = new Subscription(); private routeId = 'new'; private hasDraft = false; undoStack: SetlistWorkspace[] = []; redoStack: SetlistWorkspace[] = [];
  private songsApi = inject(SongService); private gigsApi = inject(GigService); private api = inject(SetlistService); private route = inject(ActivatedRoute); private router = inject(Router); private toast = inject(ToastController); private repository = inject(LocalSetlistRepository); private magic = inject(MagicSetService); private history = inject(SetlistHistoryService); validator = inject(SetlistValidationService);
  ngOnInit() {
    this.routeId = this.route.snapshot.paramMap.get('id') ?? 'new';
    this.workspace.id = this.routeId;
    const draft = this.repository.load(this.routeId);
    this.hasDraft = Boolean(draft);
    if (draft) this.workspace = draft;
    this.loadWorkspace();
    this.sub.add(this.changes.pipe(debounceTime(700)).subscribe(() => {
      this.saveState = 'saving';
      this.repository.save(this.workspace);
      setTimeout(() => this.saveState = 'saved', 250);
    }));
  }
  loadWorkspace() {
    this.loadError.set('');
    this.repertoireError.set('');
    this.repertoireLoading.set(true);

    // A new workspace is immediately usable: only its repertoire is required.
    // Do not make creation wait for unrelated gigs or an existing setlist.
    if (this.routeId === 'new') {
      this.loading.set(false);
      this.loadRepertoire();
      return;
    }

    this.loading.set(true);
    forkJoin({
      songs: this.songsApi.list(),
      gigs: this.gigsApi.list(),
      setlist: this.api.get(+this.routeId),
    }).pipe(
      timeout(15000),
      finalize(() => { this.loading.set(false); this.repertoireLoading.set(false); }),
    ).subscribe({
      next: ({ songs, gigs, setlist }) => {
        this.songs = songs;
        if (!this.hasDraft && setlist) {
          this.workspace.title = setlist.title;
          this.workspace.gigLabel = gigs.find(g => g.id === setlist.gigId)?.title;
          const songsById = new Map((setlist.songs ?? []).map(song => [song.id, song]));
          if (setlist.items?.length) {
            this.workspace.sets = setlist.items.map(section => ({
              id: uid('set'),
              name: section.name,
              encore: section.encore,
              items: section.items.map(item => item.type === 'song' && item.songId && songsById.get(item.songId)
                ? {
                    ...this.songItem(songsById.get(item.songId)!),
                    title: item.title,
                    durationSeconds: item.durationSeconds,
                    concertKey: item.concertKey ?? undefined,
                    medleyId: item.medleyId ?? undefined,
                    segue: item.segue,
                    sharedNotes: item.notes ?? undefined,
                  }
                : {
                    id: uid(item.type),
                    type: item.type,
                    title: item.title,
                    durationSeconds: item.durationSeconds,
                    sharedNotes: item.notes ?? undefined,
                  }),
            }));
          } else if (setlist.sections?.length) {
            this.workspace.sets[0].items = (setlist.songs ?? []).map(s => this.songItem(s));
          }
        }
      },
      error: (error: Error) => {
        this.loadError.set(error.name === 'TimeoutError'
          ? 'Il server sta impiegando troppo tempo a caricare il workspace.'
          : error.message || 'Impossibile caricare repertorio e scaletta.');
      },
    });
  }
  private loadRepertoire() {
    this.songsApi.list().pipe(
      timeout(15000),
      finalize(() => this.repertoireLoading.set(false)),
    ).subscribe({
      next: (songs) => this.songs = songs,
      error: (error: Error) => {
        this.repertoireError.set(error.name === 'TimeoutError'
          ? 'Il repertorio sta impiegando troppo tempo. Puoi comunque preparare la scaletta e riprovare.'
          : error.message || 'Impossibile caricare il repertorio.');
      },
    });
  }
  ngOnDestroy() { this.sub.unsubscribe(); }
  get filteredSongs() { const q = this.search.trim().toLowerCase(); return this.songs.filter(s => !q || [s.title, s.performedBy, s.key, ...(s.tags ?? [])].join(' ').toLowerCase().includes(q)).sort((a,b) => a.title.localeCompare(b.title)); }
  get issues() { return this.validator.validate(this.workspace, this.constraints); } get duration() { return this.workspace.sets.reduce((n,s) => n + setDuration(s), 0); } get songCount() { return this.workspace.sets.reduce((n, s) => n + s.items.filter(i => i.type === 'song').length, 0); }
  format(n: number) { return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`; } setDuration(set: WorkspaceSet, type?: SetlistItem['type']) { return setDuration(set,type); }
  touch() { this.workspace = { ...this.workspace }; this.savedToServer.set(false); this.serverSaveError.set(''); this.saveState='dirty'; this.changes.next(); }
  mutate(fn: () => void) { this.savedToServer.set(false); this.serverSaveError.set(''); this.undoStack.push(cloneWorkspace(this.workspace)); this.redoStack=[]; fn(); this.workspace = { ...this.workspace, updatedAt: new Date().toISOString() }; if (this.selected) this.selected = this.workspace.sets.reduce<SetlistItem[]>((all, set) => all.concat(set.items), []).find(item => item.id === this.selected!.id); this.saveState='dirty'; this.changes.next(); }
  addSong(song: Song, set = this.workspace.sets[0]) { this.mutate(() => set.items.push(this.songItem(song))); }
  addKind(set: WorkspaceSet, type: 'pause'|'speech'|'stage-note') { this.mutate(() => set.items.push({ id: uid(type), type, title: type==='pause'?'Pausa':type==='speech'?'Intervento parlato':'Nota di palco', durationSeconds: type==='pause'?600:60 })); }
  addSet(encore=false) { this.mutate(() => this.workspace.sets.push({ id:uid('set'), name:encore?'Bis':`Set ${this.workspace.sets.length+1}`, encore, targetSeconds:encore?600:2700, items:[] })); }
  remove(item: SetlistItem, set: WorkspaceSet) { this.mutate(() => set.items.splice(set.items.indexOf(item),1)); this.selected=undefined; }
  move(item: SetlistItem, set: WorkspaceSet, direction: number) {
    const block = set.items.filter(candidate => item.medleyId ? candidate.medleyId === item.medleyId : candidate.id === item.id);
    const first = set.items.findIndex(candidate => candidate.id === block[0]?.id);
    const last = set.items.findIndex(candidate => candidate.id === block[block.length - 1]?.id);
    if (first < 0 || (direction < 0 && first === 0) || (direction > 0 && last === set.items.length - 1)) return;
    let before = direction < 0 ? set.items[first - 1] : set.items[last + 2];
    if (direction > 0) {
      const neighbor = set.items[last + 1];
      const neighborLast = neighbor.medleyId ? Math.max(...set.items.map((candidate, index) => candidate.medleyId === neighbor.medleyId ? index : -1)) : last + 1;
      before = set.items[neighborLast + 1];
    }
    this.mutate(() => this.workspace = moveItemBefore(this.workspace, item.id, set.id, before?.id));
  }
  moveTo(item: SetlistItem, target: WorkspaceSet) { this.mutate(() => this.workspace = moveItemBefore(this.workspace, item.id, target.id)); }
  duplicate(item: SetlistItem, set: WorkspaceSet) { this.mutate(() => set.items.splice(set.items.indexOf(item)+1,0,{...structuredClone(item),id:uid(item.type)})); }
  split(set:WorkspaceSet,item:SetlistItem){if(item.medleyId)this.mutate(()=>Object.assign(set,splitMedley(set,item.medleyId!)));}
  generate() { this.proposal=this.magic.generate(this.songs,this.constraints,'',this.proposal); }
  regenerateSet(index: number) {
    if (!this.proposal) return;
    const previous = structuredClone(this.proposal);
    const originalLocks = new Set(previous.sets.reduce<SetlistItem[]>((all, set) => all.concat(set.items), []).filter(item => item.locked).map(item => item.id));
    previous.sets.forEach((set, i) => { if (i !== index) set.items.forEach(item => item.locked = true); });
    const next = this.magic.generate(this.songs, this.constraints, '', previous);
    next.sets.forEach(set => set.items.forEach(item => item.locked = originalLocks.has(item.id)));
    this.proposal = next;
  }
  applyProposal(){if(!this.proposal || this.proposal.blockingErrors?.length)return; const applied=this.history.apply(this.workspace,this.proposal); this.snapshot=applied.snapshot; this.mutate(()=>this.workspace=applied.workspace); this.mode='manual';}
  restore(){if(this.snapshot)this.mutate(()=>this.workspace=this.history.restore(this.snapshot!));}
  undo(){this.savedToServer.set(false); const prior=this.undoStack.pop();if(prior){this.redoStack.push(cloneWorkspace(this.workspace));this.workspace=prior;this.changes.next();}}
  redo(){this.savedToServer.set(false); const next=this.redoStack.pop();if(next){this.undoStack.push(cloneWorkspace(this.workspace));this.workspace=next;this.changes.next();}}
  saveCurrentSetlist() {
    if (this.savingToServer()) return;
    if (this.mode === 'magic') {
      if (!this.proposal || this.proposal.blockingErrors?.length) return;
      this.applyProposal();
    }
    this.saveNow();
  }
  saveNow(){
    if (this.savingToServer()) return;
    this.savingToServer.set(true);
    this.serverSaveError.set('');
    this.repository.save(this.workspace);
    this.saveState='saving';
    const songItems = this.workspace.sets
      .reduce<SetlistItem[]>((items, set) => items.concat(set.items), [])
      .filter(item => item.type === 'song' && item.song?.id);
    const payload = {
      title: this.workspace.title.trim() || 'Nuova scaletta',
      songEntries: songItems.map(item => ({ songId: item.song!.id, notes: item.sharedNotes || null })),
      sections: this.workspace.sets.map(set => ({
        name: set.name.trim() || 'Set', encore: !!set.encore,
        songIds: set.items.filter(item => item.type === 'song' && item.song?.id).map(item => item.song!.id),
      })),
      items: this.workspace.sets.map(set => ({
        name: set.name.trim() || 'Set',
        encore: !!set.encore,
        items: set.items.map(item => ({
          type: item.type,
          title: item.title,
          durationSeconds: item.durationSeconds,
          notes: item.sharedNotes || null,
          songId: item.song?.id ?? null,
          concertKey: item.concertKey ?? null,
          medleyId: item.medleyId ?? null,
          segue: !!item.segue,
        })),
      })),
      encoreSongIds: this.workspace.sets.filter(set => set.encore).reduce<number[]>((ids, set) => ids.concat(set.items.filter(item => item.type === 'song' && item.song?.id).map(item => item.song!.id)), []),
    };
    const request = this.routeId === 'new' ? this.api.create(payload) : this.api.update(+this.routeId, payload);
    request.pipe(timeout(20_000), finalize(() => { this.savingToServer.set(false); if (this.saveState === 'saving') this.saveState = 'dirty'; })).subscribe({
      next: async (setlist) => {
        const previousId = this.routeId;
        this.routeId = String(setlist.id);
        this.workspace.id = this.routeId;
        this.repository.remove(previousId);
        this.repository.save(this.workspace);
        this.saveState = 'saved';
        this.savedToServer.set(true);
        await (await this.toast.create({ message: 'Scaletta salvata.', duration: 1800, color: 'success' })).present();
        if (previousId === 'new') void this.router.navigate(['..', setlist.id], { relativeTo: this.route });
      },
      error: async (error: Error) => {
        this.saveState = 'dirty';
        this.savedToServer.set(false);
        this.serverSaveError.set(error.name === 'TimeoutError'
          ? 'Il server non ha risposto entro 20 secondi. La bozza è conservata: verifica la scaletta prima di riprovare.'
          : error.message || 'Salvataggio non riuscito. Riprova prima di scaricare il PDF.');
        await (await this.toast.create({ message: error.message || 'Salvataggio non riuscito.', duration: 2400, color: 'danger' })).present();
      },
    });
  }
  trackDrag(item:SetlistItem,event:DragEvent){if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',item.id);}}
  drop(set: WorkspaceSet, event: DragEvent, beforeId?: string) {
    event.preventDefault();
    event.stopPropagation();
    const id = event.dataTransfer?.getData('text/plain');
    if (id) this.mutate(() => this.workspace = moveItemBefore(this.workspace, id, set.id, beforeId));
  }
  private songItem(song:Song):SetlistItem{return {id:uid('song'),type:'song',song,title:song.title,durationSeconds:song.duration??240,concertKey:song.key??undefined,medleyId:song.linkGroup??undefined};}
}
