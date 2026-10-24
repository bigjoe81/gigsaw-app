import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { xsrfInterceptor } from './app/core/interceptors/xsrf.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideHttpClient(withInterceptors([xsrfInterceptor, authInterceptor])),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
