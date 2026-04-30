import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ResetSignInService } from "../services/reset-sign-in.service";

const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const pwd = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pwd && confirm && pwd !== confirm ? { mismatch: true } : null;
};

@Component({
    selector: "app-reset-sign-in",
    standalone: false,
    templateUrl: "./reset-sign-in.component.html",
    styleUrls: ["./reset-sign-in.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetSignInComponent implements OnInit {

    formGroup: FormGroup = new FormGroup({
        code: new FormControl('', [Validators.required, Validators.minLength(4)]),
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        confirmPassword: new FormControl('', [Validators.required]),
    }, { validators: passwordsMatch });

    /** Carried forward from the forget-password page via ?email=… */
    private email: string = '';

    hidePassword: boolean = true;
    hideConfirm: boolean = true;
    loading: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private resetService: ResetSignInService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        // No email means the user landed here directly without going through
        // forget-password — bounce them back so they can request a code.
        const email = this.route.snapshot.queryParamMap.get('email');
        if (!email) {
            this.router.navigate(['/auth/forget-password']);
            return;
        }
        this.email = email;
    }

    submit(): void {
        if (this.formGroup.invalid || this.loading) {
            this.formGroup.markAllAsTouched();
            return;
        }
        this.loading = true;
        const v = this.formGroup.value;

        this.resetService.reset({
            email: this.email,
            confirmationCode: v.code,
            password: v.password,
            confirmPassword: v.confirmPassword
        }).subscribe({
            next: () => this.router.navigate(['/auth/sign-in']),
            error: err => {
                this.loading = false;
                this.cdr.markForCheck();
                console.error('Password reset failed', err);
            }
        });
    }
}
