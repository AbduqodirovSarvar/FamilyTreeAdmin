import { ChangeDetectorRef, effect, inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);

  private cachedKey?: string;
  private cachedLang?: string;
  private cachedValue = '';

  constructor() {
    // Recompute and trigger CD whenever the active language changes.
    effect(() => {
      this.i18n.lang();
      this.cachedKey = undefined;
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    const lang = this.i18n.lang();
    if (!params && this.cachedKey === key && this.cachedLang === lang) {
      return this.cachedValue;
    }
    this.cachedKey = key;
    this.cachedLang = lang;
    this.cachedValue = this.i18n.translate(key, params);
    return this.cachedValue;
  }
}
