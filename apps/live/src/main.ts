import { Capacitor } from '@capacitor/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode, provideZoneChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !Capacitor.isNativePlatform(),
      registrationStrategy: 'registerImmediately',
    }),
  ],
}).catch(console.error);
