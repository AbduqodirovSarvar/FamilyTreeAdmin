import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { FamilyService } from '../../services/family.service';
import { FamilyModel } from '../../models/family.model';
import { FamilyFormComponent, FamilyFormDialogData } from '../../dialogs/family-form/family-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ImageUrlService } from '../../../../core/services/image-url.service';

@Component({
  selector: 'app-family-list',
  standalone: false,
  templateUrl: './family-list.component.html',
  styleUrls: ['./family-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FamilyListComponent implements OnInit {
  readonly displayedColumns: string[] = ['name', 'familyName', 'description', 'createdAt', 'actions'];

  readonly families: WritableSignal<FamilyModel[]> = signal([]);
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly totalCount: WritableSignal<number> = signal(0);
  readonly pageIndex: WritableSignal<number> = signal(0);
  readonly pageSize: WritableSignal<number> = signal(10);
  readonly searchText: WritableSignal<string> = signal('');

  constructor(
    private readonly familyService: FamilyService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly imageUrl: ImageUrlService
  ) {}

  avatarUrl(family: FamilyModel): string | null {
    return this.imageUrl.resolve(family);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.familyService.list({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      searchText: this.searchText() || undefined
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          this.families.set(response?.data ?? []);
          this.totalCount.set(response?.totalCount ?? 0);
        },
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Failed to load families';
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
    const ref = this.dialog.open<FamilyFormComponent, FamilyFormDialogData, boolean>(FamilyFormComponent, {
      data: { mode: 'create' },
      autoFocus: true
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  openEdit(family: FamilyModel): void {
    const ref = this.dialog.open<FamilyFormComponent, FamilyFormDialogData, boolean>(FamilyFormComponent, {
      data: { mode: 'edit', family },
      autoFocus: true
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  confirmDelete(family: FamilyModel): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Delete family',
        message: `Delete "${family.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.delete(family.id);
    });
  }

  private delete(id: string): void {
    this.familyService.removeFamily(id).subscribe({
      next: response => {
        if (response?.success) {
          this.snackBar.open('Family deleted', 'OK', { duration: 2500 });
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
