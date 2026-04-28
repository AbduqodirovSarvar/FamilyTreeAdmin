import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AccountService } from '../../services/account.service';
import { UserModel } from '../../../user/models/user.model';
import { ImageUrlService } from '../../../../core/services/image-url.service';

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

  constructor(
    private readonly fb: FormBuilder,
    private readonly accountService: AccountService,
    private readonly snackBar: MatSnackBar,
    private readonly imageUrl: ImageUrlService
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
