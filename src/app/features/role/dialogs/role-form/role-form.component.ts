import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { RoleService } from '../../services/role.service';
import { RoleModel } from '../../models/role.model';
import { Permission, PermissionName } from '../../../../core/enums/permission.enum';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { RolePermissionService } from '../../../../core/services/role-permission.service';

export interface RoleFormDialogData {
  mode: 'create' | 'edit';
  role?: RoleModel;
}

interface PermissionRow { name: PermissionName; label: string; }
interface PermissionGroup { title: string; rows: PermissionRow[]; }

const PERMISSION_GROUPS: PermissionGroup[] = [
  { title: 'Family',           rows: [
    { name: Permission.GET_FAMILY,             label: 'View'   },
    { name: Permission.CREATE_FAMILY,          label: 'Create' },
    { name: Permission.UPDATE_FAMILY,          label: 'Update' },
    { name: Permission.DELETE_FAMILY,          label: 'Delete' }
  ]},
  { title: 'Member',           rows: [
    { name: Permission.GET_MEMBER,             label: 'View'   },
    { name: Permission.CREATE_MEMBER,          label: 'Create' },
    { name: Permission.UPDATE_MEMBER,          label: 'Update' },
    { name: Permission.DELETE_MEMBER,          label: 'Delete' }
  ]},
  { title: 'User',             rows: [
    { name: Permission.GET_USER,               label: 'View'   },
    { name: Permission.CREATE_USER,            label: 'Create' },
    { name: Permission.UPDATE_USER,            label: 'Update' },
    { name: Permission.DELETE_USER,            label: 'Delete' }
  ]},
  { title: 'Role',             rows: [
    { name: Permission.GET_ROLE,               label: 'View'   },
    { name: Permission.CREATE_ROLE,            label: 'Create' },
    { name: Permission.UPDATE_ROLE,            label: 'Update' },
    { name: Permission.DELETE_ROLE,            label: 'Delete' }
  ]},
  { title: 'File',             rows: [
    { name: Permission.GET_FILE,               label: 'View'   },
    { name: Permission.CREATE_FILE,            label: 'Create' },
    { name: Permission.UPDATE_FILE,            label: 'Update' },
    { name: Permission.DELETE_FILE,            label: 'Delete' }
  ]},
  { title: 'Role permissions', rows: [
    { name: Permission.GET_ROLE_PERMISSION,    label: 'View'   },
    { name: Permission.CREATE_ROLE_PERMISSION, label: 'Create' },
    { name: Permission.UPDATE_ROLE_PERMISSION, label: 'Update' },
    { name: Permission.DELETE_ROLE_PERMISSION, label: 'Delete' }
  ]}
];

@Component({
  selector: 'app-role-form',
  standalone: false,
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleFormComponent implements OnInit {
  readonly form: FormGroup;
  readonly submitting: WritableSignal<boolean> = signal(false);

  /** Permissions panel state — shared shape with the user-edit dialog. */
  readonly loadingPermissions: WritableSignal<boolean> = signal(false);
  readonly permissionRows: WritableSignal<Map<string, string>> = signal(new Map());
  readonly togglingPerms: WritableSignal<ReadonlySet<string>> = signal(new Set());

  readonly mode = computed(() => this.data.mode);
  readonly isEdit = computed(() => this.data.mode === 'edit');
  readonly groups = PERMISSION_GROUPS;

  private readonly permissions = inject(PermissionsService);
  private readonly rolePermissions = inject(RolePermissionService);

  /** Permission gating for the panel itself. The role must already exist
   *  (only after Save → reopen) so we have an id to grant against. */
  readonly canManagePermissions = computed(() =>
    this.isEdit() && this.permissions.any(Permission.CREATE_ROLE_PERMISSION, Permission.DELETE_ROLE_PERMISSION)
  );
  readonly canGrant = computed(() => this.permissions.has(Permission.CREATE_ROLE_PERMISSION));
  readonly canRevoke = computed(() => this.permissions.has(Permission.DELETE_ROLE_PERMISSION));

  constructor(
    private readonly fb: FormBuilder,
    private readonly roleService: RoleService,
    private readonly snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RoleFormComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: RoleFormDialogData
  ) {
    const r = data.role;
    this.form = this.fb.group({
      name: [r?.name ?? '', Validators.required],
      designedName: [r?.designedName ?? ''],
      description: [r?.description ?? '']
    });
  }

  ngOnInit(): void {
    if (this.canManagePermissions() && this.data.role?.id) {
      this.loadRolePermissions(this.data.role.id);
    }
  }

  // ─── Permission management (mirrors user-form for consistency) ───

  isGranted(name: PermissionName): boolean { return this.permissionRows().has(name); }
  isToggling(name: PermissionName): boolean { return this.togglingPerms().has(name); }

  togglePermission(name: PermissionName, shouldGrant: boolean): void {
    const roleId = this.data.role?.id;
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
            const n = row?.permission?.name;
            if (n && row.id) map.set(n, row.id);
          }
          this.permissionRows.set(map);
        },
        error: () => { /* leave map empty */ }
      });
  }

  // ─── Submit ──────────────────────────────────────────────────

  cancel(): void { this.dialogRef.close(false); }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    const v = this.form.value;
    this.submitting.set(true);

    const op$ = this.isEdit()
      ? this.roleService.updateRole({
          id: this.data.role!.id,
          name: v.name || null,
          designedName: v.designedName || null,
          description: v.description || null
        })
      : this.roleService.createRole({
          name: v.name,
          designedName: v.designedName || null,
          description: v.description || null
        });

    op$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: response => {
          if (response?.success) {
            this.snackBar.open(this.isEdit() ? 'Role updated' : 'Role created', 'OK', { duration: 2500 });
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
