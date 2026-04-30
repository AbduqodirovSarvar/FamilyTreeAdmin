import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { RoleService } from '../../services/role.service';
import { RoleModel } from '../../models/role.model';
import { RoleFormComponent, RoleFormDialogData } from '../../dialogs/role-form/role-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Permission } from '../../../../core/enums/permission.enum';
import { PermissionsService } from '../../../../core/services/permissions.service';

@Component({
  selector: 'app-role-list',
  standalone: false,
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleListComponent implements OnInit {
  readonly displayedColumns: string[] = ['name', 'designedName', 'description', 'actions'];

  readonly roles: WritableSignal<RoleModel[]> = signal([]);
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly totalCount: WritableSignal<number> = signal(0);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly pageSize: WritableSignal<number> = signal(10);
  readonly searchText: WritableSignal<string> = signal('');

  private readonly permissions = inject(PermissionsService);
  readonly canCreate = computed(() => this.permissions.has(Permission.CREATE_ROLE));
  readonly canUpdate = computed(() => this.permissions.has(Permission.UPDATE_ROLE));
  readonly canDelete = computed(() => this.permissions.has(Permission.DELETE_ROLE));

  constructor(
    private readonly roleService: RoleService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.roleService.list({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      searchText: this.searchText() || undefined
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          this.roles.set(response?.data ?? []);
          this.totalCount.set(response?.totalCount ?? 0);
        },
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Failed to load roles';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  openCreate(): void {
    const ref = this.dialog.open<RoleFormComponent, RoleFormDialogData, boolean>(RoleFormComponent, {
      data: { mode: 'create' },
      autoFocus: true
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  openEdit(role: RoleModel): void {
    const ref = this.dialog.open<RoleFormComponent, RoleFormDialogData, boolean>(RoleFormComponent, {
      data: { mode: 'edit', role },
      autoFocus: true
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  confirmDelete(role: RoleModel): void {
    const label = role.name || role.designedName || 'this role';
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Delete role',
        message: `Delete "${label}"? Users assigned to this role will lose its permissions.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.delete(role.id);
    });
  }

  private delete(id: string): void {
    this.roleService.removeRole(id).subscribe({
      next: response => {
        if (response?.success) {
          this.snackBar.open('Role deleted', 'OK', { duration: 2500 });
          this.load();
        } else {
          this.snackBar.open(response?.message ?? 'Delete failed', 'OK', { duration: 4000 });
        }
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? 'Delete failed';
        this.snackBar.open(message, 'OK', { duration: 4000 });
      }
    });
  }
}
