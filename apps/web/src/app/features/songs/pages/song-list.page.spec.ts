import { SongListPage } from './song-list.page';

describe('SongListPage workspace filters', () => {
  function page(): SongListPage {
    return new SongListPage(
      ...([{}, {}, {}, {}, {}, {}] as ConstructorParameters<
        typeof SongListPage
      >),
    );
  }

  it('combines artist search, status and tempo sorting without mutating the repertoire', () => {
    const list = page();
    list.songs.set([
      {
        id: 1,
        title: 'Slow Blues',
        performedBy: 'Crossroads',
        status: 'active',
        bpm: 80,
      },
      {
        id: 2,
        title: 'Fast Blues',
        performedBy: 'Crossroads',
        status: 'active',
        bpm: 160,
      },
      { id: 3, title: 'New Song', performedBy: 'Crossroads', status: 'draft' },
      {
        id: 4,
        title: 'Other',
        performedBy: 'Other Band',
        status: 'active',
        bpm: 100,
      },
    ]);
    list.query.set('  CROSSROADS ');
    list.statusFilter.set('active');
    list.sort.set('bpm');
    expect(list.filteredSongs().map((song) => song.id)).toEqual([1, 2]);
    expect(list.songs().map((song) => song.id)).toEqual([1, 2, 3, 4]);
  });

  it('selects and deselects only the filtered results, preserving hidden selections', () => {
    const list = page();
    list.songs.set([
      { id: 1, title: 'Active', status: 'active' },
      { id: 2, title: 'Draft', status: 'draft' },
    ]);
    list.toggleSong(2, true);
    list.statusFilter.set('active');
    list.toggleAll(true);
    expect(list.allSelected()).toBeTrue();
    expect([...list.selectedIds()]).toEqual([2, 1]);
    list.toggleAll(false);
    expect([...list.selectedIds()]).toEqual([2]);
    expect(list.someVisibleSelected()).toBeFalse();
  });
});
