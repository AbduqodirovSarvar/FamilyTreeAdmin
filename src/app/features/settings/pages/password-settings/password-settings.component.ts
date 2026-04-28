import { ChangeDetectionStrategy, Component, signal, WritableSignal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AccountService } from '../../services/account.service';

const matchValidator = (otherKey: string): ValidatorFn => (control: AbstractControl): ValidationErrors | null => {
  const parent = control.parent;
  if (!parent) return null;
  const other = parent.get(otherKey);
  if (!other) return null;
  return other.value === control.value ? null : { mismatch: true };
};

@Component({
  selector: 'app-password-settings',
  standalone: false,
  templateUrl: './password-settings.component.html',
  styleUrls: ['./password-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordSettingsComponent {
  readonly form: FormGroup;
  readonly saving: WritableSignal<boolean> = signal(false);
  readonly showOld: WritableSignal<boolean> = signal(false);
  readonly showNew: WritableSignal<boolean> = signal(false);
  readonly showConfirm: WritableSignal<boolean> = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly accountService: AccountService,
    private readonly snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, matchValidator('newPassword')]]
    });

    this.form.controls['newPassword'].valueChanges.subscribe(() => {
      this.form.controls['confirmPassword'].updateValueAndValidity({ emitEvent: false });
    });
  }

  toggle(field: 'old' | 'new' | 'confirm'): void {
    if (field === 'old') this.showOld.update(v => !v);
    if (field === 'new') this.showNew.update(v => !v);
    if (field === 'confirm') this.showConfirm.update(v => !v);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.accountService.changePassword(this.form.value).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: response => {
        if (response?.success) {
          this.snackBar.open('Password changed successfully', 'OK', { duration: 3000 });
          this.form.reset();
          Object.values(this.form.controls).forEach(c => c.setErrors(null));
        } else {
          this.snackBar.open(response?.message ?? 'Could not change password', 'OK', { duration: 4000 });
        }
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? 'Could not change password';
        this.snackBar.open(message, 'OK', { duration: 4000 });
      }
    });
  }
}
