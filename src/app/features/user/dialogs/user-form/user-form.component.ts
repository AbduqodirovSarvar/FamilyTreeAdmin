import { ChangeDetectionStrategy, Component, Inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/user.model';
import { FamilyService } from '../../../family/services/family.service';
import { FamilyModel } from '../../../family/models/family.model';

export interface UserFormDialogData {
  user: UserModel;
}

@Component({
  selector: 'app-user-form',
  standalone: false,
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormComponent implements OnInit {
  readonly form: FormGroup;
  readonly submitting: WritableSignal<boolean> = signal(false);
  readonly selectedFile: WritableSignal<File | null> = signal(null);
  readonly families: WritableSignal<FamilyModel[]> = signal([]);

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly familyService: FamilyService,
    private readonly snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserFormComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: UserFormDialogData
  ) {
    const u = data.user;
    this.form = this.fb.group({
      firstName: [u.firstName ?? ''],
      lastName: [u.lastName ?? ''],
      userName: [u.userName ?? ''],
      email: [u.email ?? '', Validators.email],
      phone: [u.phone ?? ''],
      familyId: [u.familyId ?? null]
    });
  }

  ngOnInit(): void {
    this.familyService.list({ pageIndex: 0, pageSize: 200 }).subscribe({
      next: response => this.families.set(response?.data ?? []),
      error: () => this.families.set([])
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
    const v = this.form.value;
    const file = this.selectedFile();

    this.userService.updateUser({
      id: this.data.user.id,
      firstName: v.firstName || null,
      lastName: v.lastName || null,
      userName: v.userName || null,
      email: v.email || null,
      phone: v.phone || null,
      familyId: v.familyId || null,
      image: file
    })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: response => {
          if (response?.success) {
            this.snackBar.open('User updated', 'OK', { duration: 2500 });
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
