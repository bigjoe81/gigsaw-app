import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BandContextService } from '../services/band-context.service';

export const activeBandGuard: CanActivateFn = () => {
  const router = inject(Router);
  const bandContext = inject(BandContextService);

  return bandContext.getCurrentBand() ? true : router.createUrlTree(['/bands']);
};
