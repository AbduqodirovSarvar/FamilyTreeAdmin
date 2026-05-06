import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { AdminService } from '../../../../core/services/admin.service';

interface SettingsTab {
  labelKey: string;
  icon: string;
  route: string;
  /** Optional gate — when present, the tab only renders if the predicate
   *  returns true. Used for the admin-only notifications tab. */
  visible?: () => boolean;
}

@Component({
  selector: 'app-settings-layout',
  standalone: false,
  templateUrl: './settings-layout.component.html',
  styleUrls: ['./settings-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsLayoutComponent {
  private readonly adminService = inject(AdminService);

  readonly tabs: SettingsTab[] = [
    { labelKey: 'nav.profile',    icon: 'person',           route: 'profile' },
    { labelKey: 'nav.password',   icon: 'lock',             route: 'password' },
    { labelKey: 'nav.appearance', icon: 'palette',          route: 'appearance' },
    {
      labelKey: 'nav.adminNotifications',
      icon: 'admin_panel_settings',
      route: 'admin-notifications',
      // Reading the signal in the predicate makes the tab show/hide
      // reactively when isAdmin flips (e.g. after sign-out → re-sign-in
      // as a different user without a full page reload).
      visible: () => this.adminService.isAdmin()
    }
  ];

  /** Filtered list the template iterates over — keeps the iteration body
   *  small and avoids inline conditionals per tab. */
  readonly visibleTabs: Signal<SettingsTab[]> = computed(() =>
    this.tabs.filter(tab => !tab.visible || tab.visible())
  );
}
