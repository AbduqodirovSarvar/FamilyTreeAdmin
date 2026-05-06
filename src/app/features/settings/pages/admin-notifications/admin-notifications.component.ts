import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AdminService } from '../../../../core/services/admin.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-notifications',
  standalone: false,
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminNotificationsComponent {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);

  /** Per-action loading flags so the two buttons spin independently — a
   *  slow DB backup shouldn't grey out the (much faster) stats button. */
  readonly sendingStats: WritableSignal<boolean> = signal(false);
  readonly sendingBackup: WritableSignal<boolean> = signal(false);

  sendStatistics(): void {
    if (this.sendingStats()) return;
    this.sendingStats.set(true);

    this.adminService.sendStatistics()
      .pipe(finalize(() => this.sendingStats.set(false)))
      .subscribe({
        next: response => {
          // Backend wraps results in BaseResponseModel; treat absent
          // `success` as success since 202 Accepted is the contract.
          if (response?.success !== false) {
            this.snackBar.open(
              this.i18n.translate('adminNotifications.statsSent'),
              this.i18n.translate('common.ok'),
              { duration: 3000 }
            );
          } else {
            this.snackBar.open(
              response?.message ?? this.i18n.translate('adminNotifications.statsFailed'),
              this.i18n.translate('common.ok'),
              { duration: 4000 }
            );
          }
        },
        error: err => {
          // 403 surface — non-admin clicked. The button is hidden behind
          // the admin tab today, but a stale isAdmin flag could let it
          // through; the snackbar message keeps the failure intelligible.
          const message = err?.error?.message
            ?? err?.message
            ?? this.i18n.translate('adminNotifications.statsFailed');
          this.snackBar.open(message, this.i18n.translate('common.ok'), { duration: 4000 });
        }
      });
  }

  sendDatabaseBackup(): void {
    if (this.sendingBackup()) return;

    // MatDialog confirm — same pattern the family/user/role list pages use
    // for delete actions. Better UX than window.confirm (themable, async,
    // doesn't block the JS thread) and accidental double-clicks still
    // can't queue two pg_dump runs because the dialog is modal.
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: this.i18n.translate('adminNotifications.backupTitle'),
          message: this.i18n.translate('adminNotifications.backupConfirm'),
          confirmText: this.i18n.translate('adminNotifications.sendNow'),
          cancelText: this.i18n.translate('common.cancel'),
          confirmColor: 'primary'
        }
      });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.runDatabaseBackup();
    });
  }

  private runDatabaseBackup(): void {
    this.sendingBackup.set(true);

    this.adminService.sendDatabaseBackup()
      .pipe(finalize(() => this.sendingBackup.set(false)))
      .subscribe({
        next: response => {
          if (response?.success !== false) {
            this.snackBar.open(
              this.i18n.translate('adminNotifications.backupSent'),
              this.i18n.translate('common.ok'),
              { duration: 4000 }
            );
          } else {
            this.snackBar.open(
              response?.message ?? this.i18n.translate('adminNotifications.backupFailed'),
              this.i18n.translate('common.ok'),
              { duration: 5000 }
            );
          }
        },
        error: err => {
          const message = err?.error?.message
            ?? err?.message
            ?? this.i18n.translate('adminNotifications.backupFailed');
          this.snackBar.open(message, this.i18n.translate('common.ok'), { duration: 5000 });
        }
      });
  }
}
