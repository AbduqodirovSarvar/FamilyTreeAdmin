import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, map, Observable, of, switchMap, timer } from 'rxjs';
import { FamilyService } from '../../services/family.service';
import { FamilyModel } from '../../models/family.model';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

export interface FamilyFormDialogData {
  mode: 'create' | 'edit';
  family?: FamilyModel | null;
}

@Component({
  selector: 'app-family-form',
  standalone: false,
  templateUrl: './family-form.component.html',
  styleUrls: ['./family-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FamilyFormComponent {
  readonly form: FormGroup;
  readonly submitting: WritableSignal<boolean> = signal(false);
  readonly selectedFile: WritableSignal<File | null> = signal(null);
  readonly mode: 'create' | 'edit';

  constructor(
    private readonly fb: FormBuilder,
    private readonly familyService: FamilyService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly i18n: I18nService,
    private readonly cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<FamilyFormComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: FamilyFormDialogData
  ) {
    this.mode = data.mode;
    this.form = this.fb.group({
      name: [data.family?.name ?? '', [Validators.required, Validators.maxLength(150)]],
      familyName: [
        data.family?.familyName ?? '',
        [Validators.required, Validators.maxLength(150)],
        [this.familyNameAvailabilityValidator()]
      ],
      description: [data.family?.description ?? '']
    });

    // OnPush: async-validator status changes aren't tied to a DOM event, so
    // the Save button / mat-error wouldn't refresh without an explicit
    // markForCheck when validation transitions PENDING → VALID/INVALID.
    this.form.statusChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cdr.markForCheck());
  }

  /**
   * Debounced uniqueness check for `familyName`. Waits 400ms after the last
   * keystroke (Angular re-runs the async validator on every change and
   * cancels the previous run, so the timer effectively debounces input),
   * then asks the backend whether the name is taken.
   *
   * In edit mode, keeping the family's own name is always valid. Network
   * errors resolve to "valid" so a transient outage can't lock the form.
   */
  private familyNameAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = String(control.value ?? '').trim();
      if (!value) return of(null);

      const original = String(this.data.family?.familyName ?? '').trim().toLowerCase();
      if (this.mode === 'edit' && value.toLowerCase() === original) return of(null);

      return timer(400).pipe(
        switchMap(() => this.familyService.checkFamilyNameExists(value)),
        map(res => (res?.data ? { familyNameTaken: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  /** Save-time confirmation gate, mirrored across every form dialog. */
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
    if (this.form.invalid || this.form.pending || this.submitting()) return;

    const ok = await this.confirmSave();
    if (!ok) return;

    this.submitting.set(true);
    const value = this.form.value;
    const file = this.selectedFile();

    const request$ = this.mode === 'create'
      ? this.familyService.createFamily({
          name: value.name,
          familyName: value.familyName,
          description: value.description || null,
          image: file
        })
      : this.familyService.updateFamily({
          id: this.data.family!.id,
          name: value.name,
          familyName: value.familyName,
          description: value.description || null,
          image: file
        });

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: response => {
        if (response?.success) {
          this.snackBar.open(
            this.mode === 'create' ? 'Family created' : 'Family updated',
            'OK',
            { duration: 2500 }
          );
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
