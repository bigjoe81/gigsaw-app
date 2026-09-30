import { Injectable } from '@angular/core';
import { Song } from '../../../core/models/band-resources.models';
import { MagicConstraints, MagicProposal, SetlistItem, WorkspaceSet } from '../models/setlist-workspace.models';
import { uid } from './setlist-workspace.service';

@Injectable({ providedIn: 'root' })
export class MagicSetService {
  generate(songs: Song[], c: MagicConstraints, prompt: string, previous?: MagicProposal): MagicProposal {
    const errors: string[] = [];
    const unmet: string[] = [];
    const count = Number(c.setCount);
    const validCount = Number.isInteger(count) && count > 0 && count <= 20;
    if (!validCount) errors.push('Il numero di set deve essere un intero tra 1 e 20.');
    const sets: WorkspaceSet[] = Array.from({ length: validCount ? count : 1 }, (_, i) => ({
      id: previous?.sets.filter(s => !s.encore)[i]?.id ?? uid('set'), name: `Set ${i + 1}`, targetSeconds: c.setSeconds, items: [],
    }));
    const mainSets = [...sets];
    const encore = c.encoreSongIds ?? [];
    const more = c.weWantMoreSongIds ?? [];
    const bisSet: WorkspaceSet = { id: uid('set'), name: 'Bis', encore: true, items: [] };
    const moreSet: WorkspaceSet = { id: uid('set'), name: 'We want more', encore: true, items: [] };
    const excluded = new Set(c.excludedSongIds ?? []);
    const byId = new Map(songs.map(s => [s.id, s]));
    const locked = new Map<number, { item: SetlistItem; set: WorkspaceSet }>();
    previous?.sets.forEach((set, index) => set.items.forEach(item => {
      if (item.locked && item.song) {
        const target = set.encore ? (set.name === 'We want more' ? moreSet : bisSet) : mainSets[index];
        if (!target) errors.push(`Il set del brano bloccato «${item.title}» non esiste più.`);
        else locked.set(item.song.id, { item, set: target });
      }
    }));

    // Merge overlapping groups before selection: a medley is never split by
    // the song limit, an exclusion, an encore boundary or a set boundary.
    let groups = songs.map(s => [s.id]);
    const links = new Map<string, number[]>();
    songs.forEach(s => { if (s.linkGroup) links.set(s.linkGroup, [...(links.get(s.linkGroup) ?? []), s.id]); });
    const explicitGroups = [...(c.mandatoryMedleys ?? []), ...(c.consecutiveGroups ?? [])];
    for (const ids of [...links.values(), ...explicitGroups]) {
      const matching = groups.filter(g => g.some(id => ids.includes(id)));
      const merged = [...new Set([...ids.filter(id => byId.has(id)), ...matching.reduce<number[]>((all, group) => all.concat(group), [])])];
      groups = groups.filter(g => !matching.includes(g));
      if (merged.length) groups.push(merged);
    }
    const required = new Set([
      ...(c.requiredSongIds ?? []), ...encore, ...more, ...locked.keys(),
      ...(c.mandatoryMedleys ?? []).reduce<number[]>((all, group) => all.concat(group), []),
      ...[c.openingSongId, c.closingSongId].filter((id): id is number => id != null),
    ]);
    required.forEach(id => {
      if (!byId.has(id)) errors.push(`Brano richiesto #${id} non disponibile.`);
    });
    const blocks = groups.map(ids => ids.map(id => byId.get(id)!));
    blocks.sort((a, b) => Number(b.some(s => required.has(s.id))) - Number(a.some(s => required.has(s.id)))
      || Math.max(...b.map(s => s.bpm ?? 100)) - Math.max(...a.map(s => s.bpm ?? 100))
      || a[0].id - b[0].id);
    const max = c.maxSongs == null ? Infinity : Number(c.maxSongs);
    if (!(max > 0) || (!Number.isInteger(max) && max !== Infinity)) errors.push('Il massimo brani deve essere un intero positivo.');
    let used = 0;
    let openingBlock: SetlistItem[] | undefined;
    let closingBlock: SetlistItem[] | undefined;
    for (const block of blocks) {
      const ids = block.map(s => s.id);
      const mandatory = ids.some(id => required.has(id));
      if (ids.some(id => excluded.has(id))) {
        if (mandatory) errors.push(`«${block[0].title}»: un brano richiesto o un membro del suo medley è escluso.`);
        continue;
      }
      if (!mandatory && used + block.length > max) continue;
      const targets = new Set<WorkspaceSet>();
      if (ids.some(id => encore.includes(id))) targets.add(bisSet);
      if (ids.some(id => more.includes(id))) targets.add(moreSet);
      if (ids.includes(c.openingSongId!)) targets.add(mainSets[0]);
      if (ids.includes(c.closingSongId!)) targets.add(mainSets[mainSets.length - 1]);
      ids.forEach(id => { const lock = locked.get(id); if (lock) targets.add(lock.set); });
      if (targets.size > 1) errors.push(`«${block[0].title}»: lo stesso brano o medley è assegnato a sezioni incompatibili.`);
      const target = [...targets][0] ?? [...mainSets].sort((a, b) => this.duration(a) - this.duration(b))[0];
      // Preserve repertoire order inside a medley, except explicitly pinned endpoints.
      const ordered = [...block];
      const opening = ordered.find(s => s.id === c.openingSongId);
      const closing = ordered.find(s => s.id === c.closingSongId);
      if (opening) { ordered.splice(ordered.indexOf(opening), 1); ordered.unshift(opening); }
      if (closing && closing !== opening) { ordered.splice(ordered.indexOf(closing), 1); ordered.push(closing); }
      const medleyId = block.length > 1 ? uid('medley') : undefined;
      const items = ordered.map((song, index) => ({
        ...(locked.has(song.id) ? structuredClone(locked.get(song.id)!.item) : this.item(song)),
        medleyId, segue: !!medleyId && index < ordered.length - 1,
      }));
      target.items.push(...items);
      if (opening && target === mainSets[0]) openingBlock = items;
      if (closing && target === mainSets[mainSets.length - 1]) closingBlock = items;
      used += items.length;
    }
    if (openingBlock) mainSets[0].items = [...openingBlock, ...mainSets[0].items.filter(i => !openingBlock!.includes(i))];
    if (closingBlock) {
      const last = mainSets[mainSets.length - 1];
      last.items = [...last.items.filter(i => !closingBlock!.includes(i)), ...closingBlock];
    }
    if (bisSet.items.length) sets.push(bisSet);
    if (moreSet.items.length) sets.push(moreSet);
    const mainItems = mainSets.reduce<SetlistItem[]>((all, set) => all.concat(set.items), []);
    if (c.openingSongId != null && mainItems[0]?.song?.id !== c.openingSongId) errors.push('Il primo brano è incompatibile con gli altri vincoli.');
    if (c.closingSongId != null && mainItems[mainItems.length - 1]?.song?.id !== c.closingSongId) errors.push('L’ultimo brano è incompatibile con gli altri vincoli.');
    if (used > max) errors.push(`I brani richiesti e i medley richiedono ${used} brani, oltre il massimo di ${max}.`);
    if (!used) errors.push('Nessun brano disponibile con questi vincoli.');
    mainSets.forEach(set => {
      if (c.setSeconds > 0 && Math.abs(this.duration(set) - c.setSeconds) > 300) unmet.push(`${set.name}: durata ${Math.round(this.duration(set) / 60)} min, obiettivo ${Math.round(c.setSeconds / 60)} min.`);
    });
    const respected = errors.length ? [] : ['Numero di set principali', 'Brani esclusi', 'Medley completi e consecutivi',
      ...(c.openingSongId != null ? ['Primo brano'] : []), ...(c.closingSongId != null ? ['Ultimo brano dei set principali'] : []),
      ...(encore.length ? ['Bis'] : []), ...(more.length ? ['We want more'] : []), ...(Number.isFinite(max) ? ['Massimo brani'] : [])];
    return { id: uid('proposal'), prompt, sets, respected, unmet: [...new Set([...errors, ...unmet])], blockingErrors: [...new Set(errors)],
      reasons: ['I medley sono selezionati e distribuiti come blocchi indivisibili.', 'Primo e ultimo brano delimitano i set principali; seguono Bis e We want more.', 'I blocchi liberi sono distribuiti in base alla durata dei set.'], createdAt: new Date().toISOString() };
  }
  private duration(set: WorkspaceSet): number { return set.items.reduce((n, i) => n + i.durationSeconds, 0); }
  private item(song: Song): SetlistItem { return { id: uid('song'), type: 'song', song, title: song.title, durationSeconds: song.duration ?? 240, concertKey: song.key ?? undefined }; }
}
