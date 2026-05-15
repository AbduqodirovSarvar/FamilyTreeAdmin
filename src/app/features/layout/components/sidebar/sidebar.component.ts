import { ChangeDetectionStrategy, Component, computed, effect, inject, Signal, signal, WritableSignal } from '@angular/core';
import { Permission, PermissionName } from '../../../../core/enums/permission.enum';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { AccountService } from '../../../settings/services/account.service';
import { RoleService } from '../../../role/services/role.service';

interface NavItem {
  labelKey: string;
  icon: string;
  route: string;
  /** Hides the nav item unless the current user has this permission.
   *  Items without `requires` (dashboard, preview, settings) are always
   *  visible to authenticated users. */
  requires?: PermissionName;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  private readonly permissions = inject(PermissionsService);
  private readonly account = inject(AccountService);
  private readonly roleService = inject(RoleService);

  /**
   * Full nav set with each item's required permission. The mapping mirrors
   * the entity names PermissionService uses on the server, so showing an
   * item ↔ being able to call `GET /api/<Entity>/list` without a 500.
   */
  private readonly allItems: NavItem[] = [
    { labelKey: 'nav.dashboard',  icon: 'home',             route: '/dashboard' },
    { labelKey: 'nav.families',   icon: 'groups',           route: '/family',    requires: Permission.GET_FAMILY },
    { labelKey: 'nav.members',    icon: 'family_restroom',  route: '/member',    requires: Permission.GET_MEMBER },
    { labelKey: 'nav.preview',    icon: 'account_tree',     route: '/preview' },
    { labelKey: 'nav.users',      icon: 'manage_accounts',  route: '/user',      requires: Permission.GET_USER },
    { labelKey: 'nav.roles',      icon: 'admin_panel_settings', route: '/role',  requires: Permission.GET_ROLE },
    { labelKey: 'nav.documents',  icon: 'description',      route: '/documents', requires: Permission.GET_FILE },
    { labelKey: 'nav.settings',   icon: 'settings',         route: '/settings' }
  ];

  /** Filtered list — recomputes whenever the permission set changes. */
  readonly navItems: Signal<NavItem[]> = computed(() => {
    // Reading the signal keeps this computed reactive to permission changes.
    this.permissions.permissions();
    return this.allItems.filter(i => !i.requires || this.permissions.has(i.requires));
  });

  /** Signed-in user's profile — populated by the auth guard's loadMe(). */
  readonly currentUser = this.account.currentUser;

  /** "First Last" of the signed-in user, falling back to the username. */
  readonly fullName: Signal<string> = computed(() => {
    const u = this.currentUser();
    if (!u) return '';
    const name = [u.firstName, u.lastName]
      .map(p => (p ?? '').trim())
      .filter(Boolean)
      .join(' ');
    return name || u.userName || '';
  });

  /** Human-readable role name. The /me payload only carries `roleId`, so the
   *  name is resolved separately and left blank when the lookup isn't
   *  permitted (non-privileged users) — the footer then shows just the name. */
  readonly roleName: WritableSignal<string> = signal('');

  constructor() {
    effect(() => {
      const roleId = this.currentUser()?.roleId;
      if (!roleId) {
        this.roleName.set('');
        return;
      }
      this.roleService.getOne(roleId).subscribe({
        next: res => this.roleName.set(res?.data?.name ?? ''),
        error: () => this.roleName.set('')
      });
    });
  }
}
