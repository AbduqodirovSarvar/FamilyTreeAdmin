import { Inject, Injectable, PLATFORM_ID, signal, Signal, WritableSignal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BaseStorageService } from '../services/base-storage.service';
import { TRANSLATIONS } from './translations';

export type Lang = 'uz' | 'uz-Cyrl' | 'ru' | 'en';

const LANG_KEY = 'app_lang';
const DEFAULT_LANG: Lang = 'uz';

export interface LangOption {
  value: Lang;
  label: string;
  short: string;
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _lang: WritableSignal<Lang> = signal<Lang>(DEFAULT_LANG);
  readonly lang: Signal<Lang> = this._lang.asReadonly();

  readonly availableLangs: ReadonlyArray<LangOption> = [
    { value: 'uz',      label: "O'zbekcha", short: 'UZ' },
    { value: 'uz-Cyrl', label: 'Ўзбекча',    short: 'ЎЗ' },
    { value: 'ru',      label: 'Русский',    short: 'РУ' },
    { value: 'en',      label: 'English',    short: 'EN' }
  ];

  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private readonly storage: BaseStorageService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const saved = this.storage.getItem<Lang>(LANG_KEY);
      if (saved && this.availableLangs.some(l => l.value === saved)) {
        this._lang.set(saved);
      }
      this.applyHtmlLang(this._lang());
    }
  }

  setLang(lang: Lang): void {
    if (!this.availableLangs.some(l => l.value === lang)) return;
    this._lang.set(lang);
    this.storage.setItem(LANG_KEY, lang);
    this.applyHtmlLang(lang);
  }

  /**
   * Translate a dotted key like `auth.signInTitle`. Falls back through
   * uz → en → key when a translation is missing.
   */
  translate(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    const dict = TRANSLATIONS[this._lang()];
    let value = this.lookup(dict, key);
    if (typeof value !== 'string') value = this.lookup(TRANSLATIONS.uz, key);
    if (typeof value !== 'string') value = this.lookup(TRANSLATIONS.en, key);
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (_, k) => {
      const v = params[k];
      return v == null ? '' : String(v);
    });
  }

  private lookup(obj: unknown, key: string): string | undefined {
    let current: any = obj;
    for (const part of key.split('.')) {
      if (current == null) return undefined;
      current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
  }

  private applyHtmlLang(lang: Lang): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }
}
