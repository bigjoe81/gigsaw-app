import { NEVER, throwError } from 'rxjs';
import { SetlistPdfService } from './setlist-pdf.service';
import { SetlistService } from './setlist.service';

describe('SetlistPdfService request failures', () => {
  it('ends a stalled PDF request instead of keeping the caller loading', async () => {
    jasmine.clock().install();
    try {
      const api = { pdf: jasmine.createSpy().and.returnValue(NEVER) };
      const service = new SetlistPdfService(api as unknown as SetlistService);
      const result = expectAsync(service.download(2)).toBeRejectedWithError(/20 secondi/);
      jasmine.clock().tick(20_001);
      await result;
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('propagates server errors to the UI', async () => {
    const api = { pdf: () => throwError(() => new Error('Server non disponibile')) };
    const service = new SetlistPdfService(api as unknown as SetlistService);
    await expectAsync(service.download(2)).toBeRejectedWithError('Server non disponibile');
  });
});
