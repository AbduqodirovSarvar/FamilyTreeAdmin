import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ConfirmEmailService } from '../services/confirm-email.service';

type Status = 'pending' | 'success' | 'error';

@Component({
  selector: 'app-confirm-email',
  standalone: false,
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmEmailComponent implements OnInit {
  readonly status: WritableSignal<Status> = signal('pending');
  readonly errorMessage: WritableSignal<string | null> = signal(null);
  readonly resendForm: FormGroup;
  readonly resending: WritableSignal<boolean> = signal(false);
  readonly resendSent: WritableSignal<boolean> = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly service: ConfirmEmailService
  ) {
    this.resendForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('error');
      this.errorMessage.set('confirmEmail.missingToken');
      return;
    }
    this.confirm(token);
  }

  private confirm(token: string): void {
    this.service.confirm(token).subscribe({
      next: response => {
        if (response?.success) {
          this.status.set('success');
        } else {
          this.status.set('error');
          this.errorMessage.set(response?.message ?? 'confirmEmail.generic');
        }
      },
      error: err => {
        this.status.set('error');
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'confirmEmail.generic');
      }
    });
  }

  resend(): void {
    if (this.resendForm.invalid || this.resending()) return;
    this.resending.set(true);
    this.resendSent.set(false);
    const email = this.resendForm.value.email;
    this.service.resend(email)
      .pipe(finalize(() => this.resending.set(false)))
      .subscribe({
        next: response => {
          if (response?.success) {
            this.resendSent.set(true);
          } else {
            this.errorMessage.set(response?.message ?? 'confirmEmail.resendFailed');
          }
        },
        error: err => {
          this.errorMessage.set(err?.error?.message ?? err?.message ?? 'confirmEmail.resendFailed');
        }
      });
  }

  goSignIn(): void {
    this.router.navigate(['/auth/sign-in']);
  }
}
