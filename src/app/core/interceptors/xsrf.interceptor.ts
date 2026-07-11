import { DOCUMENT } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export const xsrfInterceptor: HttpInterceptorFn = (req, next) => {
  const document = inject(DOCUMENT);
  const xsrfToken = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  if (!isApiRequest || !xsrfToken) {
    return next(req);
  }

  return next(
    req.clone({
      withCredentials: true,
      setHeaders: {
        'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
      },
    }),
  );
};
