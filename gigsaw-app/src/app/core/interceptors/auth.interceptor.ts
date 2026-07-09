import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const isApiRequest = request.url.startsWith(environment.apiUrl);
  const isLoginEndpoint = /\/login$/.test(request.url);
  const isRefreshEndpoint = /\/refresh-token$/.test(request.url);
  const isCsrfEndpoint = /\/sanctum\/csrf-cookie$/.test(request.url);
  const authToken = isRefreshEndpoint ? auth.refreshToken : auth.token;
  let headers = request.headers;

  if (authToken && isApiRequest && !isLoginEndpoint && !isCsrfEndpoint) {
    headers = headers.set('Authorization', `Bearer ${authToken}`);
  }

  return next(request.clone({ headers })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isApiRequest || error.status !== 401 || isLoginEndpoint || isRefreshEndpoint || isCsrfEndpoint) {
        return throwError(() => error);
      }

      if (!auth.refreshToken) {
        auth.handleUnauthorized();
        return throwError(() => error);
      }

      return auth.refreshAccessToken().pipe(
        switchMap((token) => next(request.clone({
          headers: request.headers.set('Authorization', `Bearer ${token}`),
        }))),
        catchError((refreshError) => {
          auth.handleUnauthorized();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
