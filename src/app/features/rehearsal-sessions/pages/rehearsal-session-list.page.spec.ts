import { of } from 'rxjs';
import { RehearsalSession } from '../../../core/models/band-resources.models';
import { RehearsalSessionService } from '../services/rehearsal-session.service';
import { RehearsalSessionListPage } from './rehearsal-session-list.page';

describe('RehearsalSessionListPage', () => {
  it('ricarica le prove al ritorno dal form anche se la pagina è conservata da Ionic', () => {
    const session: RehearsalSession = { id: 1, title: 'Prova live', date: '2026-10-02', status: 'confirmed' };
    const api = jasmine.createSpyObj<RehearsalSessionService>('RehearsalSessionService', ['list']);
    api.list.and.returnValues(of([]), of([session]));
    const page = new RehearsalSessionListPage(api);

    page.ionViewWillEnter();
    expect(page.sessions()).toEqual([]);

    page.ionViewWillEnter();
    expect(api.list).toHaveBeenCalledTimes(2);
    expect(page.sessions()).toEqual([session]);
    expect(page.loading()).toBeFalse();
    expect(page.error()).toBe('');
  });
});
