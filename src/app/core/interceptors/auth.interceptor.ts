import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const isApiRequest = environment.apiUrl
    ? request.url.startsWith(environment.apiUrl)
    : request.url.startsWith(environment.apiPath);
  const isPublicAuthEndpoint = /\/(login|register|verify-otp|resend-otp|forgot-password|reset-password|google\/exchange-code)$/.test(request.url);
  const isRefreshEndpoint = /\/refresh-token$/.test(request.url);
  const isCsrfEndpoint = /\/sanctum\/csrf-cookie$/.test(request.url);
  const authToken = isRefreshEndpoint ? auth.refreshToken : auth.token;
  let headers = request.headers;

  if (authToken && isApiRequest && !isPublicAuthEndpoint && !isCsrfEndpoint) {
    headers = headers.set('Authorization', `Bearer ${authToken}`);
  }

  return next(request.clone({ headers })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isApiRequest || error.status !== 401 || isPublicAuthEndpoint || isRefreshEndpoint || isCsrfEndpoint) {
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
