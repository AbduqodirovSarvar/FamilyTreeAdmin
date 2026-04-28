import { computed, effect, Inject, Injectable, PLATFORM_ID, signal, Signal, WritableSignal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BaseStorageService } from './base-storage.service';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'app_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser: boolean;

  private readonly _mode: WritableSignal<ThemeMode> = signal<ThemeMode>('system');

  readonly mode: Signal<ThemeMode> = this._mode.asReadonly();

  readonly resolvedMode: Signal<'light' | 'dark'> = computed(() => {
    const m = this._mode();
    if (m !== 'system') return m;
    if (!this.isBrowser) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly storage: BaseStorageService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    const savedMode = this.storage.getItem<ThemeMode>(THEME_KEY);
    if (savedMode) this._mode.set(savedMode);

    effect(() => {
      if (!this.isBrowser) return;
      const resolved = this.resolvedMode();
      const root = document.documentElement;
      root.classList.toggle('theme-dark', resolved === 'dark');
      root.classList.toggle('theme-light', resolved === 'light');
    });
  }

  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    this.storage.setItem(THEME_KEY, mode);
  }
}
