import { ChangeDetectionStrategy, Component, Inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { FamilyService } from '../../services/family.service';
import { FamilyModel } from '../../models/family.model';

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
    public dialogRef: MatDialogRef<FamilyFormComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: FamilyFormDialogData
  ) {
    this.mode = data.mode;
    this.form = this.fb.group({
      name: [data.family?.name ?? '', [Validators.required, Validators.maxLength(150)]],
      familyName: [data.family?.familyName ?? '', [Validators.required, Validators.maxLength(150)]],
      description: [data.family?.description ?? '']
    });
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

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

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
