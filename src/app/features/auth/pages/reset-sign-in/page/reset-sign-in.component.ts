import { ChangeDetectionStrategy, Component } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";

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
export class ResetSignInComponent {

    formGroup: FormGroup = new FormGroup({
        code: new FormControl('', [Validators.required, Validators.minLength(4)]),
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        confirmPassword: new FormControl('', [Validators.required]),
    }, { validators: passwordsMatch });

    hidePassword: boolean = true;
    hideConfirm: boolean = true;
    loading: boolean = false;

    submit(): void {
        if (this.formGroup.invalid) return;
        // TODO: wire to ResetSignInService once API contract is available.
    }
}
