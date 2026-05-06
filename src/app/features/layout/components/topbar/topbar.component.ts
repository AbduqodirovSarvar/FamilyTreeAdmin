import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Inject,
  inject,
  OnInit,
  Output,
  PLATFORM_ID,
  Signal,
  signal,
  WritableSignal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { StorageKeys } from '../../../../core/enums/storage-keys.enum';
import { ThemeService } from '../../../../core/services/theme.service';
import { I18nService, Lang } from '../../../../core/i18n/i18n.service';
import { ImageUrlService } from '../../../../core/services/image-url.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { AdminService } from '../../../../core/services/admin.service';
import { AccountService } from '../../../settings/services/account.service';

interface Crumb {
  /** Translation key, when null the raw `text` is used. */
  key: string | null;
  text: string;
  url?: string;
}

/** Map URL segments to translation keys for breadcrumb labels. */
const ROUTE_KEYS: Record<string, string> = {
  '': 'nav.boshqaruv',
  'dashboard': 'nav.dashboard',
  'family': 'nav.families',
  'member': 'nav.members',
  'preview': 'nav.preview',
  'user': 'nav.users',
  'documents': 'nav.documents',
  'settings': 'nav.settings',
  'profile': 'nav.profile',
  'password': 'nav.password',
  'appearance': 'nav.appearance'
};

@Component({
  selector: 'app-topbar',
  standalone: false,
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopbarComponent implements OnInit {
  @Output() toggleSidenav: EventEmitter<void> = new EventEmitter<void>();

  private readonly url: WritableSignal<string> = signal('/');
  readonly crumbs: Signal<Crumb[]> = computed(() => this.buildCrumbs(this.url()));

  readonly userName: WritableSignal<string> = signal('');
  readonly userAvatarUrl: WritableSignal<string | null> = signal(null);

  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly imageUrl = inject(ImageUrlService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly adminService = inject(AdminService);
  readonly theme = inject(ThemeService);
  readonly i18n = inject(I18nService);
  private readonly isBrowser: boolean;

  readonly currentLangShort: Signal<string> = computed(() => {
    const current = this.i18n.lang();
    return this.i18n.availableLangs.find(l => l.value === current)?.short ?? 'UZ';
  });

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.url.set(this.router.url);
    this.router.events.pipe(filter(e => e instanceof ActivationEnd)).subscribe(() => {
      this.url.set(this.router.url);
    });

    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    if (!this.isBrowser) return;
    this.accountService.getMe().subscribe({
      next: response => {
        const u = response?.data;
        if (!u) return;
        const first = (u.firstName ?? '').trim();
        this.userName.set(first || u.userName || '');
        this.userAvatarUrl.set(this.imageUrl.resolve(u));
      },
      error: () => { /* silent — keep defaults */ }
    });
  }

  private buildCrumbs(url: string): Crumb[] {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ key: ROUTE_KEYS[''], text: '', url: '/dashboard' }];
    let acc = '';
    for (const seg of segments) {
      acc += '/' + seg;
      const k = ROUTE_KEYS[seg];
      crumbs.push({ key: k ?? null, text: k ? '' : seg, url: acc });
    }
    return crumbs;
  }

  toggleTheme(): void {
    const current = this.theme.resolvedMode();
    this.theme.setMode(current === 'dark' ? 'light' : 'dark');
  }

  setLang(lang: Lang): void { this.i18n.setLang(lang); }

  onMenuClick(): void { this.toggleSidenav.emit(); }
  goToSettings(): void { this.router.navigate(['/settings']); }
  goToProfile(): void { this.router.navigate(['/settings/profile']); }
  goToPassword(): void { this.router.navigate(['/settings/password']); }
  goToAppearance(): void { this.router.navigate(['/settings/appearance']); }

  signOut(): void {
    if (this.isBrowser) {
      localStorage.removeItem(StorageKeys.AccessToken);
      localStorage.removeItem(StorageKeys.RefreshToken);
    }
    // Wipe the cached permission set + profile so the next user sees their
    // own sidebar/buttons instead of the previous account's filtered view.
    this.permissionsService.clear();
    this.accountService.clear();
    this.adminService.clear();
    this.router.navigate(['/auth/sign-in']);
  }
}
