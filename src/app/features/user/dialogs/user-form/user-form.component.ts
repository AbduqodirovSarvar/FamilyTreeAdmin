import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/user.model';
import { FamilyService } from '../../../family/services/family.service';
import { FamilyModel } from '../../../family/models/family.model';
import { Permission, PermissionName } from '../../../../core/enums/permission.enum';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { RolePermissionService } from '../../../../core/services/role-permission.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

export interface UserFormDialogData {
  user: UserModel;
}


/** Layout the 24 permissions in entity-grouped rows so the toggle grid
 *  reads cleanly. Order intentionally mirrors the backend Permission enum.
 *  Both group titles and row labels are translation keys, resolved through
 *  the `translate` pipe in the template. */
interface PermissionRowKey { name: PermissionName; labelKey: string; }
interface PermissionGroupKey { titleKey: string; rows: PermissionRowKey[]; }

const PERMISSION_GROUPS: PermissionGroupKey[] = [
  { titleKey: 'permissions.family.title', rows: [
    { name: Permission.GET_FAMILY,             labelKey: 'permissions.action.view'   },
    { name: Permission.CREATE_FAMILY,          labelKey: 'permissions.action.create' },
    { name: Permission.UPDATE_FAMILY,          labelKey: 'permissions.action.update' },
    { name: Permission.DELETE_FAMILY,          labelKey: 'permissions.action.delete' }
  ]},
  { titleKey: 'permissions.member.title', rows: [
    { name: Permission.GET_MEMBER,             labelKey: 'permissions.action.view'   },
    { name: Permission.CREATE_MEMBER,          labelKey: 'permissions.action.create' },
    { name: Permission.UPDATE_MEMBER,          labelKey: 'permissions.action.update' },
    { name: Permission.DELETE_MEMBER,          labelKey: 'permissions.action.delete' }
  ]},
  { titleKey: 'permissions.user.title', rows: [
    { name: Permission.GET_USER,               labelKey: 'permissions.action.view'   },
    { name: Permission.CREATE_USER,            labelKey: 'permissions.action.create' },
    { name: Permission.UPDATE_USER,            labelKey: 'permissions.action.update' },
    { name: Permission.DELETE_USER,            labelKey: 'permissions.action.delete' }
  ]},
  { titleKey: 'permissions.role.title', rows: [
    { name: Permission.GET_ROLE,               labelKey: 'permissions.action.view'   },
    { name: Permission.CREATE_ROLE,            labelKey: 'permissions.action.create' },
    { name: Permission.UPDATE_ROLE,            labelKey: 'permissions.action.update' },
    { name: Permission.DELETE_ROLE,            labelKey: 'permissions.action.delete' }
  ]},
  { titleKey: 'permissions.file.title', rows: [
    { name: Permission.GET_FILE,               labelKey: 'permissions.action.view'   },
    { name: Permission.CREATE_FILE,            labelKey: 'permissions.action.create' },
    { name: Permission.UPDATE_FILE,            labelKey: 'permissions.action.update' },
    { name: Permission.DELETE_FILE,            labelKey: 'permissions.action.delete' }
  ]},
  { titleKey: 'permissions.rolePermission.title', rows: [
    { name: Permission.GET_ROLE_PERMISSION,    labelKey: 'permissions.action.view'   },
    { name: Permission.CREATE_ROLE_PERMISSION, labelKey: 'permissions.action.create' },
    { name: Permission.UPDATE_ROLE_PERMISSION, labelKey: 'permissions.action.update' },
    { name: Permission.DELETE_ROLE_PERMISSION, labelKey: 'permissions.action.delete' }
  ]}
];

@Component({
  selector: 'app-user-form',
  standalone: false,
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormComponent implements OnInit {
  readonly form: FormGroup;
  readonly submitting: WritableSignal<boolean> = signal(false);
  readonly selectedFile: WritableSignal<File | null> = signal(null);
  readonly families: WritableSignal<FamilyModel[]> = signal([]);

  /** True while the role's existing permission rows are being fetched. */
  readonly loadingPermissions: WritableSignal<boolean> = signal(false);

  /**
   * Map of permission-name → row id in UserRolePermissions table. Presence
   * means "granted"; absence means "not granted". The id is what DELETE
   * needs to revoke without an extra round-trip.
   */
  readonly permissionRows: WritableSignal<Map<string, string>> = signal(new Map());

  /** Permissions currently being toggled — disables the checkbox during the request. */
  readonly togglingPerms: WritableSignal<ReadonlySet<string>> = signal(new Set());

  /** Hide the panel when there's no role. */
  readonly hasRole = computed(() => !!this.data.user.roleId);

  /** Show the panel only if the current admin can either grant or revoke. */
  readonly canManagePermissions = computed(() =>
    this.permissions.any(Permission.CREATE_ROLE_PERMISSION, Permission.DELETE_ROLE_PERMISSION)
  );

  readonly canGrant = computed(() => this.permissions.has(Permission.CREATE_ROLE_PERMISSION));
  readonly canRevoke = computed(() => this.permissions.has(Permission.DELETE_ROLE_PERMISSION));

  /**
   * Email-confirmation toggle is exposed only to callers with the full User
   * permission set (admins by default). The backend re-checks this in
   * UserService.UpdateAsync — frontend gating is just UX, not authorization.
   */
  readonly canToggleEmailConfirmed = computed(() =>
    this.permissions.has(Permission.GET_USER) &&
    this.permissions.has(Permission.CREATE_USER) &&
    this.permissions.has(Permission.UPDATE_USER) &&
    this.permissions.has(Permission.DELETE_USER)
  );

  /** Permission groups exposed for the template. */
  readonly groups = PERMISSION_GROUPS;

  private readonly permissions = inject(PermissionsService);
  private readonly rolePermissions = inject(RolePermissionService);

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly familyService: FamilyService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly i18n: I18nService,
    public dialogRef: MatDialogRef<UserFormComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: UserFormDialogData
  ) {
    const u = data.user;
    this.form = this.fb.group({
      firstName: [u.firstName ?? ''],
      lastName: [u.lastName ?? ''],
      userName: [u.userName ?? ''],
      email: [u.email ?? '', Validators.email],
      phone: [u.phone ?? ''],
      familyId: [u.familyId ?? null],
      emailConfirmed: [u.emailConfirmed ?? false]
    });
  }

  ngOnInit(): void {
    this.familyService.list({ pageIndex: 0, pageSize: 200 }).subscribe({
      next: response => this.families.set(response?.data ?? []),
      error: () => this.families.set([])
    });

    if (this.hasRole() && this.canManagePermissions()) {
      this.loadRolePermissions(this.data.user.roleId!);
    }
  }

  // ─── Permission management ──────────────────────────────────

  isGranted(name: PermissionName): boolean {
    return this.permissionRows().has(name);
  }

  isToggling(name: PermissionName): boolean {
    return this.togglingPerms().has(name);
  }

  /**
   * Toggle handler invoked by the checkbox change event. Fires the
   * appropriate grant/revoke request and updates the permission map.
   * On failure the map is unchanged and a snack-bar surfaces the reason.
   */
  togglePermission(name: PermissionName, shouldGrant: boolean): void {
    const roleId = this.data.user.roleId;
    if (!roleId) return;

    const currentlyGranted = this.isGranted(name);
    if (shouldGrant === currentlyGranted) return;

    if (shouldGrant && !this.canGrant()) {
      this.snackBar.open("Sizda huquq berish vakolati yo'q", 'OK', { duration: 3000 });
      return;
    }
    if (!shouldGrant && !this.canRevoke()) {
      this.snackBar.open("Sizda huquqni qaytarib olish vakolati yo'q", 'OK', { duration: 3000 });
      return;
    }

    this.markToggling(name, true);

    if (shouldGrant) {
      this.rolePermissions.grant(roleId, name).subscribe({
        next: row => {
          if (row?.id) {
            this.permissionRows.update(m => new Map(m).set(name, row.id));
          }
          this.markToggling(name, false);
        },
        error: err => {
          this.markToggling(name, false);
          this.snackBar.open(err?.error?.message ?? "Huquq berib bo'lmadi", 'OK', { duration: 4000 });
        }
      });
    } else {
      const rowId = this.permissionRows().get(name);
      if (!rowId) { this.markToggling(name, false); return; }

      this.rolePermissions.revoke(rowId).subscribe({
        next: () => {
          this.permissionRows.update(m => {
            const next = new Map(m);
            next.delete(name);
            return next;
          });
          this.markToggling(name, false);
        },
        error: err => {
          this.markToggling(name, false);
          this.snackBar.open(err?.error?.message ?? "Huquqni qaytarib olib bo'lmadi", 'OK', { duration: 4000 });
        }
      });
    }
  }

  private markToggling(name: PermissionName, on: boolean): void {
    this.togglingPerms.update(s => {
      const next = new Set(s);
      if (on) next.add(name); else next.delete(name);
      return next;
    });
  }

  private loadRolePermissions(roleId: string): void {
    this.loadingPermissions.set(true);
    this.rolePermissions.listForRole(roleId)
      .pipe(finalize(() => this.loadingPermissions.set(false)))
      .subscribe({
        next: rows => {
          const map = new Map<string, string>();
          for (const row of rows) {
            const name = row?.permission?.name;
            if (name && row.id) map.set(name, row.id);
          }
          this.permissionRows.set(map);
        },
        error: () => { /* leave map empty so all toggles render OFF — admin can re-grant. */ }
      });
  }

  // ─── User-form basics (unchanged) ───────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  /** Save-time confirmation. Promise<boolean> — true if the user clicked "Save". */
  private confirmSave(): Promise<boolean> {
    return new Promise(resolve => {
      const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
        ConfirmDialogComponent, {
          data: {
            title: this.i18n.translate('common.saveConfirmTitle'),
            message: this.i18n.translate('common.saveConfirmMessage'),
            confirmText: this.i18n.translate('common.save'),
            cancelText: this.i18n.translate('common.cancel'),
            confirmColor: 'primary'
          }
        }
      );
      ref.afterClosed().subscribe(ok => resolve(!!ok));
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;

    // Save-time confirmation — last chance to bail out before mutating the
    // backend. Same pattern is used in every form dialog so users always know
    // exactly when their changes go live.
    const ok = await this.confirmSave();
    if (!ok) return;

    this.submitting.set(true);
    const v = this.form.value;
    const file = this.selectedFile();

    // Only include `emailConfirmed` in the payload if the caller is allowed
    // to flip it AND the value actually changed. Sending it unconditionally
    // would either be rejected by the backend gate or silently overwrite
    // a flag the editor never intended to touch.
    const initialConfirmed = this.data.user.emailConfirmed ?? false;
    const includeEmailConfirmed = this.canToggleEmailConfirmed()
      && v.emailConfirmed !== initialConfirmed;

    this.userService.updateUser({
      id: this.data.user.id,
      firstName: v.firstName || null,
      lastName: v.lastName || null,
      userName: v.userName || null,
      email: v.email || null,
      phone: v.phone || null,
      familyId: v.familyId || null,
      image: file,
      emailConfirmed: includeEmailConfirmed ? v.emailConfirmed : undefined
    })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: response => {
          if (response?.success) {
            this.snackBar.open('User updated', 'OK', { duration: 2500 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(response?.message ?? 'Operation failed', 'OK', { duration: 4000 });
          }
        },
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Request failed';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }
}
