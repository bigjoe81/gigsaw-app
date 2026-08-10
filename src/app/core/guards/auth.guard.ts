import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { BandContextService } from '../services/band-context.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const bandContext = inject(BandContextService);
  const bandId = Number(route.paramMap.get('bandId') ?? route.parent?.paramMap.get('bandId'));
  if (Number.isInteger(bandId) && bandId > 0) bandContext.setCurrentBand(bandId);

  if (auth.isAuthenticated) {
    return true;
  }

  const loginRedirect = router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

  return auth.restoreSession().pipe(
    map((user) => user ? true : loginRedirect),
  );
};
