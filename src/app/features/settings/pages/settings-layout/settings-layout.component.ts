import { ChangeDetectionStrategy, Component } from '@angular/core';

interface SettingsTab {
  labelKey: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-settings-layout',
  standalone: false,
  templateUrl: './settings-layout.component.html',
  styleUrls: ['./settings-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsLayoutComponent {
  readonly tabs: SettingsTab[] = [
    { labelKey: 'nav.profile',    icon: 'person',  route: 'profile' },
    { labelKey: 'nav.password',   icon: 'lock',    route: 'password' },
    { labelKey: 'nav.appearance', icon: 'palette', route: 'appearance' }
  ];
}
