import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { MemberService } from '../../services/member.service';
import { MemberModel } from '../../models/member.model';
import { MemberFormComponent, MemberFormDialogData } from '../../dialogs/member-form/member-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FamilyService } from '../../../family/services/family.service';
import { FamilyModel } from '../../../family/models/family.model';
import { Gender } from '../../../../core/enums/gender.enum';
import { ImageUrlService } from '../../../../core/services/image-url.service';
import { Permission } from '../../../../core/enums/permission.enum';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { AccountService } from '../../../settings/services/account.service';

@Component({
  selector: 'app-member-list',
  standalone: false,
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberListComponent implements OnInit {
  readonly displayedColumns: string[] = ['name', 'relation', 'birthYear', 'status', 'actions'];

  readonly members: WritableSignal<MemberModel[]> = signal([]);
  readonly families: WritableSignal<FamilyModel[]> = signal([]);
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly totalCount: WritableSignal<number> = signal(0);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly pageSize: WritableSignal<number> = signal(10);
  readonly searchText: WritableSignal<string> = signal('');
  readonly familyFilter: WritableSignal<string | null> = signal(null);
  readonly recentCount: WritableSignal<number> = signal(0);
  readonly generations: WritableSignal<number> = signal(0);

  birthYear(m: MemberModel): string {
    return m.birthDay ? new Date(m.birthDay).getFullYear().toString() : '—';
  }

  readonly Gender = Gender;

  /** Action gating — see family-list for the same pattern. */
  private readonly permissions = inject(PermissionsService);
  private readonly account = inject(AccountService);
  readonly canCreate = computed(() => this.permissions.has(Permission.CREATE_MEMBER));
  readonly canUpdate = computed(() => this.permissions.has(Permission.UPDATE_MEMBER));
  readonly canDelete = computed(() => this.permissions.has(Permission.DELETE_MEMBER));

  /**
   * Set of family ids the current user owns. Drives the per-row gating
   * on edit/delete and decides whether to enable the "Add member" button.
   * Recomputes when either families list or current user changes.
   * (Non-admins receive only their own families from the API anyway, so
   * this set effectively == every loaded family for them; admins may see
   * other families and need the explicit filter.)
   */
  readonly myFamilyIds = computed(() => {
    const me = this.account.currentUserId();
    if (!me) return new Set<string>();
    return new Set(
      this.families()
        .filter(f => f.ownerId === me)
        .map(f => f.id)
    );
  });

  readonly hasAnyOwnedFamily = computed(() => this.myFamilyIds().size > 0);

  /** Per-row helpers — same shape as family-list. */
  isOwnedFamily(member: MemberModel): boolean {
    return !!member.familyId && this.myFamilyIds().has(member.familyId);
  }
  canEdit(member: MemberModel): boolean {
    return this.canUpdate() && this.isOwnedFamily(member);
  }
  canRemove(member: MemberModel): boolean {
    return this.canDelete() && this.isOwnedFamily(member);
  }

  constructor(
    private readonly memberService: MemberService,
    private readonly familyService: FamilyService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly imageUrl: ImageUrlService
  ) {}

  avatarUrl(member: MemberModel): string | null {
    return this.imageUrl.resolve(member);
  }

  ngOnInit(): void {
    this.loadFamilies();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.memberService.list({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      searchText: this.searchText() || undefined,
      familyId: this.familyFilter() || undefined
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          const data = response?.data ?? [];
          this.members.set(data);
          this.totalCount.set(response?.totalCount ?? 0);

          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          this.recentCount.set(data.filter(m => m.createdAt && new Date(m.createdAt).getTime() >= sevenDaysAgo).length);
          this.generations.set(this.estimateGenerations(data));
        },
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'A\'zolarni yuklashda xato';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }

  private estimateGenerations(list: MemberModel[]): number {
    if (!list.length) return 0;
    const ids = new Set(list.map(m => m.id));
    let max = 0;
    for (const m of list) {
      let depth = 1;
      let current: MemberModel | undefined = m;
      const guard = new Set<string>();
      while (current && (current.fatherId || current.motherId)) {
        let parentId: string | null = null;
        if (current.fatherId && ids.has(current.fatherId)) {
          parentId = current.fatherId;
        } else if (current.motherId && ids.has(current.motherId)) {
          parentId = current.motherId;
        }
        if (!parentId || guard.has(parentId)) break;
        guard.add(parentId);
        current = list.find(x => x.id === parentId);
        if (!current) break;
        depth++;
      }
      if (depth > max) max = depth;
    }
    return max;
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

  openCreate(): void {
    const ref = this.dialog.open<MemberFormComponent, MemberFormDialogData, boolean>(MemberFormComponent, {
      data: { mode: 'create', defaultFamilyId: this.familyFilter() },
      autoFocus: true
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  openEdit(member: MemberModel): void {
    const ref = this.dialog.open<MemberFormComponent, MemberFormDialogData, boolean>(MemberFormComponent, {
      data: { mode: 'edit', member },
      autoFocus: true
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  confirmDelete(member: MemberModel): void {
    const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || 'this member';
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Delete member',
        message: `Delete "${fullName}"? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.delete(member.id);
    });
  }

  private delete(id: string): void {
    this.memberService.removeMember(id).subscribe({
      next: response => {
        if (response?.success) {
          this.snackBar.open('Member deleted', 'OK', { duration: 2500 });
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

  familyName(id: string): string {
    return this.families().find(f => f.id === id)?.name ?? '—';
  }
}
