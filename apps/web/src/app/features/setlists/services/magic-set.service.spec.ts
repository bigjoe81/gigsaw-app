import { Song } from '../../../core/models/band-resources.models';
import { MagicConstraints, MagicProposal } from '../models/setlist-workspace.models';
import { MagicSetService } from './magic-set.service';

describe('MagicSetService constraints', () => {
  const song = (id: number, linkGroup?: string): Song => ({ id, title: `Song ${id}`, bpm: 80 + id * 10, duration: 180, status: 'active', linkGroup });
  const constraints = (overrides: Partial<MagicConstraints> = {}): MagicConstraints => ({
    totalSeconds: 1800, setCount: 2, setSeconds: 900, breakSeconds: 0,
    requiredSongIds: [], excludedSongIds: [], encoreSongIds: [], weWantMoreSongIds: [],
    consecutiveGroups: [], separatedPairs: [], mandatoryMedleys: [], balanceSingers: false,
    energyCurve: 'balanced', alternateGenres: false, separateSameKeys: false, maxDraftSongs: 2, preferLiveReady: true,
    ...overrides,
  });
  const service = new MagicSetService();
  const ids = (p: MagicProposal): number[] => p.sets.reduce<number[]>((all, set) => all.concat(set.items.map(i => i.song!.id)), []);

  it('reserves first and last main songs before applying the song limit', () => {
    const p = service.generate([song(1), song(2), song(3), song(4), song(5)], constraints({ openingSongId: 1, closingSongId: 2, maxSongs: 3 }), '');
    expect(p.blockingErrors).toEqual([]);
    expect(ids(p).length).toBe(3);
    expect(p.sets[0].items[0].song!.id).toBe(1);
    const last = p.sets[1].items;
    expect(last[last.length - 1].song!.id).toBe(2);
  });

  it('places Bis and We want more after the main closing song without duplicates', () => {
    const p = service.generate([song(1), song(2), song(3), song(4)], constraints({ openingSongId: 1, closingSongId: 2, encoreSongIds: [3], weWantMoreSongIds: [4] }), '');
    expect(p.blockingErrors).toEqual([]);
    expect(p.sets.map(s => s.name)).toEqual(['Set 1', 'Set 2', 'Bis', 'We want more']);
    expect(ids(p)).toEqual([1, 2, 3, 4]);
  });

  it('keeps linked songs together despite different BPM and set distribution', () => {
    const p = service.generate([song(1, 'A'), song(2), song(3, 'A'), song(4)], constraints(), '');
    const set = p.sets.find(s => s.items.some(i => i.song!.id === 1))!;
    const first = set.items.findIndex(i => i.song!.id === 1);
    expect(set.items[first + 1].song!.id).toBe(3);
    expect(set.items[first].medleyId).toBeTruthy();
    expect(set.items[first + 1].medleyId).toBe(set.items[first].medleyId);
    expect(set.items[first].segue).toBeTrue();
    expect(set.items[first + 1].segue).toBeFalse();
    expect(new Set(ids(p)).size).toBe(ids(p).length);
  });

  it('expands a bis selection to the entire linked group', () => {
    const p = service.generate([song(1, 'A'), song(2), song(3, 'A')], constraints({ encoreSongIds: [3] }), '');
    expect(p.blockingErrors).toEqual([]);
    expect(p.sets[p.sets.length - 1].items.map(i => i.song!.id)).toEqual([1, 3]);
  });

  it('skips an optional medley whole when it exceeds the maximum', () => {
    const p = service.generate([song(1), song(2, 'A'), song(3, 'A')], constraints({ maxSongs: 1 }), '');
    expect(ids(p)).toEqual([1]);
  });

  it('reports required medleys exceeding the maximum instead of truncating them', () => {
    const p = service.generate([song(1, 'A'), song(2, 'A')], constraints({ openingSongId: 1, maxSongs: 1 }), '');
    expect(ids(p)).toEqual([1, 2]);
    expect(p.blockingErrors!.some(e => e.includes('massimo'))).toBeTrue();
  });

  it('excludes entire groups and reports conflicts with required members', () => {
    const songs = [song(1, 'A'), song(2, 'A'), song(3)];
    expect(ids(service.generate(songs, constraints({ excludedSongIds: [2] }), ''))).toEqual([3]);
    const p = service.generate(songs, constraints({ openingSongId: 1, excludedSongIds: [2] }), '');
    expect(p.blockingErrors!.some(e => e.includes('escluso'))).toBeTrue();
  });

  it('rejects contradictory section assignments for a medley', () => {
    const p = service.generate([song(1, 'A'), song(2, 'A')], constraints({ encoreSongIds: [1], weWantMoreSongIds: [2] }), '');
    expect(p.blockingErrors!.some(e => e.includes('incompatibili'))).toBeTrue();
    expect(new Set(ids(p)).size).toBe(ids(p).length);
  });

  it('preserves locked items and their set when regenerating', () => {
    const c = constraints();
    const p = service.generate([song(1), song(2), song(3), song(4)], c, '');
    p.sets[1].items.forEach(i => i.locked = true);
    const lockedIds = p.sets[1].items.map(i => i.id);
    const next = service.generate([song(1), song(2), song(3), song(4)], c, '', p);
    expect(next.sets[1].items.filter(i => i.locked).map(i => i.id)).toEqual(lockedIds);
    expect(new Set(ids(next)).size).toBe(ids(next).length);
  });

  it('handles invalid set counts and missing required songs without crashing', () => {
    const p = service.generate([song(1)], constraints({ setCount: 0, openingSongId: 99 }), '');
    expect(p.blockingErrors!.some(e => e.includes('numero di set'))).toBeTrue();
    expect(p.blockingErrors!.some(e => e.includes('#99'))).toBeTrue();
  });
});
