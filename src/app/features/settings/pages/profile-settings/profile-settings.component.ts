import { ChangeDetectionStrategy, Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { UserModel } from '../../../user/models/user.model';
import { ImageUrlService } from '../../../../core/services/image-url.service';
import { ConfirmEmailService } from '../../../auth/pages/confirm-email/services/confirm-email.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-profile-settings',
  standalone: false,
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileSettingsComponent implements OnInit {
  readonly form: FormGroup;
  readonly loading: WritableSignal<boolean> = signal(false);
  readonly saving: WritableSignal<boolean> = signal(false);
  readonly user: WritableSignal<UserModel | null> = signal(null);
  readonly selectedFile: WritableSignal<File | null> = signal(null);
  readonly resendingConfirmation: WritableSignal<boolean> = signal(false);
  readonly resentAt: WritableSignal<number | null> = signal(null);
  readonly leavingFamily: WritableSignal<boolean> = signal(false);

  private readonly dialog = inject(MatDialog);

  constructor(
    private readonly fb: FormBuilder,
    private readonly accountService: AccountService,
    private readonly snackBar: MatSnackBar,
    private readonly imageUrl: ImageUrlService,
    private readonly confirmEmailService: ConfirmEmailService,
    private readonly i18n: I18nService
  ) {
    this.form = this.fb.group({
      firstName: [''],
      lastName: [''],
      userName: [''],
      email: ['', [Validators.email]],
      phone: ['']
    });
  }

  avatarSrc(): string | null {
    const file = this.selectedFile();
    if (file) return URL.createObjectURL(file);
    return this.imageUrl.resolve(this.user());
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.accountService.getMe()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          const u = response?.data ?? null;
          this.user.set(u);
          if (u) {
            this.form.patchValue({
              firstName: u.firstName ?? '',
              lastName: u.lastName ?? '',
              userName: u.userName ?? '',
              email: u.email ?? '',
              phone: u.phone ?? ''
            });
          }
        },
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Failed to load profile';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  initials(): string {
    const u = this.user();
    if (!u) return '?';
    const f = (u.firstName ?? '').trim();
    const l = (u.lastName ?? '').trim();
    return ((f[0] ?? '') + (l[0] ?? '')).toUpperCase() || (u.userName?.[0] ?? '?').toUpperCase();
  }

  /**
   * Triggers a fresh confirmation email for the signed-in user. Disabled
   * (and hidden) once the email is confirmed; throttled with `resentAt` so
   * accidental double-clicks don't spam the SMTP provider.
   */
  resendConfirmation(): void {
    const u = this.user();
    if (!u?.email || u.emailConfirmed || this.resendingConfirmation()) return;
    this.resendingConfirmation.set(true);
    this.confirmEmailService.resend(u.email)
      .pipe(finalize(() => this.resendingConfirmation.set(false)))
      .subscribe({
        next: response => {
          if (response?.success) {
            this.resentAt.set(Date.now());
            this.snackBar.open(
              this.i18n.translate('profile.confirmationResent'),
              this.i18n.translate('common.ok'),
              { duration: 3500 }
            );
          } else {
            this.snackBar.open(
              response?.message ?? this.i18n.translate('profile.resendFailed'),
              this.i18n.translate('common.ok'),
              { duration: 4000 }
            );
          }
        },
        error: err => {
          const message = err?.error?.message ?? err?.message ?? this.i18n.translate('profile.resendFailed');
          this.snackBar.open(message, this.i18n.translate('common.ok'), { duration: 4000 });
        }
      });
  }

  /**
   * Detaches the user from their attached family. Owners are refused
   * server-side — the backend message ("oila egasi oiladan chiqa olmaydi…")
   * is surfaced verbatim so we don't have to mirror the rule in the UI.
   * On success we refresh AccountService.currentUser so other places
   * (e.g. family-list ownership checks) see the cleared familyId.
   */
  leaveFamily(): void {
    const u = this.user();
    if (!u?.familyId || this.leavingFamily()) return;

    // MatDialog confirm — same pattern as the family/user delete dialogs
    // (see family-list.component). Themable, async, doesn't block the
    // JS thread. `warn` color underlines the destructive nature of
    // leaving a family.
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: this.i18n.translate('profile.leaveFamily'),
          message: this.i18n.translate('profile.leaveFamilyConfirm'),
          confirmText: this.i18n.translate('profile.leaveFamily'),
          cancelText: this.i18n.translate('common.cancel'),
          confirmColor: 'warn'
        }
      });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.runLeaveFamily();
    });
  }

  private runLeaveFamily(): void {
    this.leavingFamily.set(true);
    this.accountService.leaveFamily()
      .pipe(finalize(() => this.leavingFamily.set(false)))
      .subscribe({
        next: response => {
          if (response?.success) {
            this.snackBar.open(
              response?.message ?? this.i18n.translate('profile.leaveFamilySuccess'),
              this.i18n.translate('common.ok'),
              { duration: 3500 }
            );
            this.user.set(response.data ?? null);
            this.accountService.loadMe().subscribe();
          } else {
            this.snackBar.open(
              response?.message ?? this.i18n.translate('profile.leaveFamilyFailed'),
              this.i18n.translate('common.ok'),
              { duration: 4000 }
            );
          }
        },
        error: err => {
          const message = err?.error?.message ?? err?.message ?? this.i18n.translate('profile.leaveFamilyFailed');
          this.snackBar.open(message, this.i18n.translate('common.ok'), { duration: 4000 });
        }
      });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.value;
    this.accountService.updateProfile({
      firstName: v.firstName,
      lastName: v.lastName,
      userName: v.userName,
      email: v.email,
      phone: v.phone,
      image: this.selectedFile()
    }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: response => {
        if (response?.success) {
          this.snackBar.open('Profile updated', 'OK', { duration: 2500 });
          this.user.set(response.data ?? null);
          this.selectedFile.set(null);
        } else {
          this.snackBar.open(response?.message ?? 'Update failed', 'OK', { duration: 4000 });
        }
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? 'Update failed';
        this.snackBar.open(message, 'OK', { duration: 4000 });
      }
    });
  }
}
