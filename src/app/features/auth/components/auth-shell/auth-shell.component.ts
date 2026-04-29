import { ChangeDetectionStrategy, Component, computed, inject, Input, Signal } from '@angular/core';
import { ThemeService } from '../../../../core/services/theme.service';
import { I18nService, Lang } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-auth-shell',
  standalone: false,
  templateUrl: './auth-shell.component.html',
  styleUrls: ['./auth-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShellComponent {
  @Input() icon: string = 'family_restroom';
  /** Tagline translation keys shown on the brand panel. */
  @Input() taglineKey: string = 'authShell.taglineDefault';
  @Input() captionKey: string = 'authShell.captionDefault';

  readonly theme: ThemeService = inject(ThemeService);
  readonly i18n: I18nService = inject(I18nService);

  readonly currentLangShort: Signal<string> = computed(() => {
    const current: Lang = this.i18n.lang();
    return this.i18n.availableLangs.find(l => l.value === current)?.short ?? 'UZ';
  });

  toggleTheme(): void {
    const current: 'light' | 'dark' = this.theme.resolvedMode();
    this.theme.setMode(current === 'dark' ? 'light' : 'dark');
  }

  setLang(lang: Lang): void {
    this.i18n.setLang(lang);
  }
}
