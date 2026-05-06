import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { Platform } from '@angular/cdk/platform';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AppDateAdapter, APP_DATE_FORMATS } from './core/utils/app-date-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    // Datepicker uses our adapter — fixed `dd.MM.yyyy` format regardless of
    // the browser locale. Replaces `provideNativeDateAdapter()`.
    { provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
    { provide: DateAdapter, useClass: AppDateAdapter, deps: [MAT_DATE_LOCALE, Platform] },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    // Default config for every MatDialog.open() — `maxWidth: 95vw` keeps
    // dialogs from overflowing phone viewports even when the dialog
    // component sets a fixed `min-width` in its own .scss. Per-call
    // `dialog.open(..., { width: '...' })` still takes precedence so
    // intentionally narrow dialogs stay narrow.
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { maxWidth: '95vw', maxHeight: '95vh', autoFocus: 'first-tabbable' }
    },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};
