import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Subscription, debounceTime, finalize, forkJoin, Subject, timeout } from 'rxjs';
import { Song } from '../../../core/models/band-resources.models';
import { GigService } from '../../gigs/services/gig.service';
import { SongService } from '../../songs/services/song.service';
import { MagicConstraints, MagicProposal, SetlistItem, SetlistSnapshot, SetlistWorkspace, WorkspaceSet } from '../models/setlist-workspace.models';
import { MagicSetService } from '../services/magic-set.service';
import { cloneWorkspace, createMedley, LocalSetlistRepository, moveItem, setDuration, SetlistHistoryService, splitMedley, uid } from '../services/setlist-workspace.service';
import { SetlistValidationService } from '../services/setlist-validation.service';
import { SetlistService } from '../services/setlist.service';

@Component({ standalone: true, imports: [CommonModule, FormsModule, IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar], templateUrl: './setlist-form.page.html', styleUrls: ['./setlist-form.page.scss'] })
export class SetlistFormPage implements OnInit, OnDestroy {
  mode: 'manual' | 'magic' = 'manual'; mobileTab: 'repertoire' | 'setlist' | 'inspector' = 'setlist'; readonly loading = signal(true); readonly repertoireLoading = signal(true); readonly loadError = signal(''); readonly repertoireError = signal(''); saveState: 'dirty' | 'saving' | 'saved' = 'saved';
  songs: Song[] = []; search = ''; genre = ''; key = ''; status = ''; sort = 'title'; selected?: SetlistItem; selectedIds = new Set<string>(); proposal?: MagicProposal; snapshot?: SetlistSnapshot; compare = false;
  workspace: SetlistWorkspace = { id: 'new', title: 'Nuova scaletta', sets: [{ id: uid('set'), name: 'Set 1', targetSeconds: 2700, items: [] }], updatedAt: new Date().toISOString() };
  constraints: MagicConstraints = { totalSeconds: 5400, setCount: 2, setSeconds: 2700, breakSeconds: 900, requiredSongIds: [], excludedSongIds: [], encoreSongIds: [], consecutiveGroups: [], separatedPairs: [], mandatoryMedleys: [], balanceSingers: true, energyCurve: 'wave', alternateGenres: true, separateSameKeys: true, maxDraftSongs: 2, preferLiveReady: true };
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
          this.workspace.sets[0].items = (setlist.songs ?? []).map(s => this.songItem(s));
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
  get filteredSongs() { const q = this.search.toLowerCase(); return this.songs.filter(s => (!q || [s.title, s.performedBy, s.key, ...(s.tags ?? [])].join(' ').toLowerCase().includes(q)) && (!this.key || s.key === this.key) && (!this.status || s.status === this.status)).sort((a,b) => this.sort === 'duration' ? (a.duration ?? 0)-(b.duration ?? 0) : a.title.localeCompare(b.title)); }
  get issues() { return this.validator.validate(this.workspace, this.constraints); } get duration() { return this.workspace.sets.reduce((n,s) => n + setDuration(s), 0); } get songCount() { return this.workspace.sets.reduce((n, s) => n + s.items.filter(i => i.type === 'song').length, 0); }
  format(n: number) { return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`; } setDuration(set: WorkspaceSet, type?: SetlistItem['type']) { return setDuration(set,type); }
  touch() { this.saveState='dirty'; this.changes.next(); }
  mutate(fn: () => void) { this.undoStack.push(cloneWorkspace(this.workspace)); this.redoStack=[]; fn(); this.workspace.updatedAt = new Date().toISOString(); this.saveState='dirty'; this.changes.next(); }
  addSong(song: Song, set = this.workspace.sets[0]) { this.mutate(() => set.items.push(this.songItem(song))); }
  addKind(set: WorkspaceSet, type: 'pause'|'speech'|'stage-note') { this.mutate(() => set.items.push({ id: uid(type), type, title: type==='pause'?'Pausa':type==='speech'?'Intervento parlato':'Nota di palco', durationSeconds: type==='pause'?600:60 })); }
  addSet(encore=false) { this.mutate(() => this.workspace.sets.push({ id:uid('set'), name:encore?'Bis':`Set ${this.workspace.sets.length+1}`, encore, targetSeconds:encore?600:2700, items:[] })); }
  remove(item: SetlistItem, set: WorkspaceSet) { this.mutate(() => set.items.splice(set.items.indexOf(item),1)); this.selected=undefined; }
  move(item: SetlistItem, set: WorkspaceSet, direction: number) { const index=set.items.indexOf(item); const target=Math.max(0,Math.min(set.items.length-1,index+direction)); this.mutate(() => this.workspace=moveItem(this.workspace,item.id,set.id,target)); }
  moveTo(item: SetlistItem, target: WorkspaceSet) { this.mutate(() => this.workspace=moveItem(this.workspace,item.id,target.id,target.items.length)); }
  duplicate(item: SetlistItem, set: WorkspaceSet) { this.mutate(() => set.items.splice(set.items.indexOf(item)+1,0,{...structuredClone(item),id:uid(item.type)})); }
  toggleSelect(item:SetlistItem) { this.selectedIds.has(item.id)?this.selectedIds.delete(item.id):this.selectedIds.add(item.id); }
  medley(set:WorkspaceSet) { const ids=set.items.filter(i=>this.selectedIds.has(i.id)).map(i=>i.id); if(ids.length>1)this.mutate(()=>Object.assign(set,createMedley(set,ids))); }
  split(set:WorkspaceSet,item:SetlistItem){if(item.medleyId)this.mutate(()=>Object.assign(set,splitMedley(set,item.medleyId!)));}
  generate() { this.proposal=this.magic.generate(this.songs,this.constraints,'',this.proposal); }
  regenerateSet(index:number){ const next=this.magic.generate(this.songs,this.constraints,'',this.proposal); if(this.proposal)this.proposal.sets[index]=next.sets[index]; }
  applyProposal(){if(!this.proposal)return; const applied=this.history.apply(this.workspace,this.proposal); this.snapshot=applied.snapshot; this.mutate(()=>this.workspace=applied.workspace); this.mode='manual';}
  restore(){if(this.snapshot)this.mutate(()=>this.workspace=this.history.restore(this.snapshot!));}
  undo(){const prior=this.undoStack.pop();if(prior){this.redoStack.push(cloneWorkspace(this.workspace));this.workspace=prior;this.changes.next();}}
  redo(){const next=this.redoStack.pop();if(next){this.undoStack.push(cloneWorkspace(this.workspace));this.workspace=next;this.changes.next();}}
  saveNow(){
    if (this.saveState === 'saving') return;
    this.repository.save(this.workspace);
    this.saveState='saving';
    const songItems = this.workspace.sets
      .reduce<SetlistItem[]>((items, set) => items.concat(set.items), [])
      .filter(item => item.type === 'song' && item.song?.id);
    const payload = {
      title: this.workspace.title.trim() || 'Nuova scaletta',
      songEntries: songItems.map(item => ({ songId: item.song!.id, notes: item.sharedNotes || null })),
    };
    const request = this.routeId === 'new' ? this.api.create(payload) : this.api.update(+this.routeId, payload);
    request.pipe(finalize(() => { if (this.saveState === 'saving') this.saveState = 'dirty'; })).subscribe({
      next: async (setlist) => {
        const previousId = this.routeId;
        this.routeId = String(setlist.id);
        this.workspace.id = this.routeId;
        this.repository.remove(previousId);
        this.repository.save(this.workspace);
        this.saveState = 'saved';
        await (await this.toast.create({ message: 'Scaletta salvata.', duration: 1800, color: 'success' })).present();
        if (previousId === 'new') void this.router.navigate(['..', setlist.id], { relativeTo: this.route });
      },
      error: async (error: Error) => {
        this.saveState = 'dirty';
        await (await this.toast.create({ message: error.message || 'Salvataggio non riuscito.', duration: 2400, color: 'danger' })).present();
      },
    });
  }
  trackDrag(item:SetlistItem,event:DragEvent){event.dataTransfer?.setData('text/plain',item.id);}
  drop(set:WorkspaceSet,event:DragEvent){event.preventDefault();const id=event.dataTransfer?.getData('text/plain');if(id)this.mutate(()=>this.workspace=moveItem(this.workspace,id,set.id,set.items.length));}
  private songItem(song:Song):SetlistItem{return {id:uid('song'),type:'song',song,title:song.title,durationSeconds:song.duration??240,concertKey:song.key??undefined};}
}
