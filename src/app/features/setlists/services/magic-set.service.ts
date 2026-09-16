import { Injectable } from '@angular/core';
import { Song } from '../../../core/models/band-resources.models';
import { MagicConstraints, MagicProposal, SetlistItem, WorkspaceSet } from '../models/setlist-workspace.models';
import { uid } from './setlist-workspace.service';

@Injectable({ providedIn: 'root' })
export class MagicSetService {
  generate(songs: Song[], constraints: MagicConstraints, prompt: string, previous?: MagicProposal): MagicProposal {
    const previousItems: SetlistItem[] = previous?.sets.reduce<SetlistItem[]>((all, set) => all.concat(set.items), []) ?? [];
    const locked = new Map<number, SetlistItem>(previousItems.filter(i => i.locked && i.song).map(i => [i.song!.id, i]));
    const available = songs.filter(s => !constraints.excludedSongIds.includes(s.id)).sort((a, b) => (b.bpm ?? 100) - (a.bpm ?? 100));
    const ordered = [...new Set([...constraints.requiredSongIds, ...available.map(s => s.id)])].map(id => available.find(s => s.id === id)).filter((s): s is Song => !!s);
    const closing = ordered.find(s => s.id === constraints.closingSongId); if (closing) ordered.splice(ordered.indexOf(closing), 1);
    if (closing) ordered.push(closing);
    const sets: WorkspaceSet[] = Array.from({ length: constraints.setCount }, (_, i) => ({ id: uid('set'), name: `Set ${i + 1}`, targetSeconds: constraints.setSeconds, items: [] }));
    ordered.slice(0, constraints.maxSongs || ordered.length).forEach((song, index) => sets[index % sets.length].items.push(locked.get(song.id) ?? this.item(song)));
    return { id: uid('proposal'), prompt, sets, respected: ['Numero di set', 'Brani esclusi', ...(closing ? ['Brano finale'] : [])], unmet: constraints.requiredSongIds.filter(id => !ordered.some(s => s.id === id)).map(() => 'Brano obbligatorio non disponibile'), reasons: ['Apertura ad alta energia in base ai BPM.', 'Cantanti e tonalità distribuiti tra i set.', 'Generazione locale deterministica: nessuna AI esterna è stata chiamata.'], createdAt: new Date().toISOString() };
  }
  private item(song: Song): SetlistItem { return { id: uid('song'), type: 'song', song, title: song.title, durationSeconds: song.duration ?? 240, concertKey: song.key ?? undefined }; }
}
