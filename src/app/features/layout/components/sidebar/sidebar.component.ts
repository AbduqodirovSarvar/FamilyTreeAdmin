import { ChangeDetectionStrategy, Component } from '@angular/core';

interface NavItem {
  labelKey: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  readonly navItems: NavItem[] = [
    { labelKey: 'nav.dashboard',  icon: 'home',             route: '/dashboard' },
    { labelKey: 'nav.families',   icon: 'groups',           route: '/family' },
    { labelKey: 'nav.members',    icon: 'family_restroom',  route: '/member' },
    { labelKey: 'nav.preview',    icon: 'account_tree',     route: '/preview' },
    { labelKey: 'nav.users',      icon: 'manage_accounts',  route: '/user' },
    { labelKey: 'nav.documents',  icon: 'description',      route: '/documents' },
    { labelKey: 'nav.settings',   icon: 'settings',         route: '/settings' }
  ];
}
