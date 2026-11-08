import { of } from 'rxjs';
import { RehearsalSession } from '../../../core/models/band-resources.models';
import { RehearsalSessionService } from '../services/rehearsal-session.service';
import { RehearsalSessionListPage } from './rehearsal-session-list.page';

describe('RehearsalSessionListPage', () => {
  it('ricarica le prove al ritorno dal form anche se la pagina è conservata da Ionic', () => {
    const session: RehearsalSession = {
      id: 1,
      title: 'Prova live',
      date: '2026-10-02',
      status: 'confirmed',
    };
    const api = jasmine.createSpyObj<RehearsalSessionService>(
      'RehearsalSessionService',
      ['list'],
    );
    api.list.and.returnValues(of([]), of([session]));
    const page = new RehearsalSessionListPage(api);

    page.ngOnInit();
    expect(page.sessions()).toEqual([]);

    page.ngOnInit();
    expect(api.list).toHaveBeenCalledTimes(2);
    expect(page.sessions()).toEqual([session]);
    expect(page.loading()).toBeFalse();
    expect(page.error()).toBe('');
  });
});

describe('Rehearsal workspace agenda', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 8, 12));
  });
  afterEach(() => jasmine.clock().uninstall());

  it('uses a Monday-first calendar, including leap days and year transitions', () => {
    const page = new RehearsalSessionListPage({} as RehearsalSessionService);
    page.month.set(new Date(2026, 10, 1));
    const november = page.calendarDays();
    expect(november.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(november[6]?.day).toBe(1);
    expect(november[17]?.date).toBe('2026-11-12');
    page.month.set(new Date(2028, 1, 1));
    expect(page.calendarDays().filter(Boolean).length).toBe(29);
    page.month.set(new Date(2026, 11, 1));
    page.changeMonth(1);
    expect(page.month().getFullYear()).toBe(2027);
    expect(page.month().getMonth()).toBe(0);
  });

  it('separates upcoming sessions from completed/cancelled sessions and filters by calendar date', () => {
    const page = new RehearsalSessionListPage({} as RehearsalSessionService);
    page.sessions.set([
      { id: 1, title: 'Old', date: '2026-11-01', status: 'confirmed' },
      { id: 2, title: 'Live prep', date: '2026-11-12', status: 'confirmed' },
      { id: 3, title: 'Cancelled', date: '2026-11-19', status: 'cancelled' },
      { id: 4, title: 'Completed', date: '2026-11-20', status: 'completed' },
    ]);
    expect(page.upcomingSessions().map((session) => session.id)).toEqual([2]);
    expect(page.pastSessions().map((session) => session.id)).toEqual([4, 3, 1]);
    page.selectDate('2026-11-12');
    expect(page.filteredSessions().map((session) => session.id)).toEqual([2]);
    page.query.set('no match');
    expect(page.filteredSessions()).toEqual([]);
    page.selectDate('2026-11-12');
    expect(page.selectedDate()).toBe('');
  });
});
