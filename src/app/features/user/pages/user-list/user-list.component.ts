import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/user.model';
import { UserFormComponent, UserFormDialogData } from '../../dialogs/user-form/user-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FamilyService } from '../../../family/services/family.service';
import { FamilyModel } from '../../../family/models/family.model';
import { ImageUrlService } from '../../../../core/services/image-url.service';
import { Permission } from '../../../../core/enums/permission.enum';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit {
  readonly displayedColumns: string[] = ['name', 'userName', 'email', 'phone', 'family', 'actions'];

  readonly users: WritableSignal<UserModel[]> = signal([]);
  readonly families: WritableSignal<FamilyModel[]> = signal([]);
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly totalCount: WritableSignal<number> = signal(0);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly pageSize: WritableSignal<number> = signal(10);
  readonly searchText: WritableSignal<string> = signal('');
  readonly familyFilter: WritableSignal<string | null> = signal(null);

  /** Action gating — see family-list for the same pattern. */
  private readonly permissions = inject(PermissionsService);
  readonly canUpdate = computed(() => this.permissions.has(Permission.UPDATE_USER));
  readonly canDelete = computed(() => this.permissions.has(Permission.DELETE_USER));

  constructor(
    private readonly userService: UserService,
    private readonly familyService: FamilyService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly imageUrl: ImageUrlService,
    private readonly i18n: I18nService
  ) {}

  avatarUrl(user: UserModel): string | null {
    return this.imageUrl.resolve(user);
  }

  ngOnInit(): void {
    this.loadFamilies();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userService.list({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      searchText: this.searchText() || undefined,
      familyId: this.familyFilter() || undefined
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          this.users.set(response?.data ?? []);
          this.totalCount.set(response?.totalCount ?? 0);
        },
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Failed to load users';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }

  loadFamilies(): void {
    this.familyService.list({ pageIndex: 0, pageSize: 200 }).subscribe({
      next: response => this.families.set(response?.data ?? []),
      error: () => this.families.set([])
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

  onFamilyFilterChange(value: string | null): void {
    this.familyFilter.set(value);
    this.pageIndex.set(0);
    this.load();
  }

  openEdit(user: UserModel): void {
    const ref = this.dialog.open<UserFormComponent, UserFormDialogData, boolean>(UserFormComponent, {
      data: { user },
      autoFocus: true
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  confirmDelete(user: UserModel): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: this.i18n.translate('user.deleteConfirmTitle'),
        message: this.i18n.translate('user.deleteConfirmMessage', { name: this.displayName(user) }),
        confirmText: this.i18n.translate('common.delete'),
        cancelText: this.i18n.translate('common.cancel'),
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.delete(user.id);
    });
  }

  /** Best-effort label for the row — used in confirmation messages. */
  private displayName(user: UserModel): string {
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.userName || user.email || '—';
  }

  private delete(id: string): void {
    this.userService.removeUser(id).subscribe({
      next: response => {
        if (response?.success) {
          this.snackBar.open(this.i18n.translate('user.deletedToast'), this.i18n.translate('common.ok'), { duration: 2500 });
          this.load();
        } else {
          this.snackBar.open(response?.message ?? this.i18n.translate('user.deleteFailed'), this.i18n.translate('common.ok'), { duration: 4000 });
        }
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? this.i18n.translate('user.deleteFailed');
        this.snackBar.open(message, this.i18n.translate('common.ok'), { duration: 4000 });
      }
    });
  }

  familyName(id: string | null | undefined): string {
    if (!id) return '—';
    return this.families().find(f => f.id === id)?.name ?? '—';
  }
}
