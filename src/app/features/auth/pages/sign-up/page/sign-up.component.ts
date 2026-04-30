import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Router } from "@angular/router";
import { BaseFormComponent } from "../../../../../core/components/base-page-components/base-form.component";
import { SignUpRequestModel } from "../models/sign-up-request.model";
import { FormBuilder } from "@angular/forms";
import { SignUpService } from "../services/sign-up.service";

@Component({
    selector: 'sign-up',
    standalone: false,
    templateUrl: './sign-up.component.html',
    styleUrls: ['./sign-up.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent extends BaseFormComponent<SignUpRequestModel> {

    hidePassword: boolean = true;
    hideConfirm: boolean = true;

    constructor(
        fb: FormBuilder,
        private signUpService: SignUpService,
        private router: Router
    ) {
        super(fb, SignUpRequestModel, signUpService);
    }

    /**
     * After successful registration land the user on the sign-in page so they
     * can log in with the credentials they just created. The base
     * implementation only console-logged the response, leaving the user
     * stranded on the sign-up form.
     */
    override create(): void {
        if (this.formGroup.invalid) {
            this.formGroup.markAllAsTouched();
            return;
        }
        this.signUpService.create(this.formGroup.value).subscribe({
            next: () => this.router.navigate(['/auth/sign-in']),
            error: err => console.error('Sign-up failed', err)
        });
    }
}
