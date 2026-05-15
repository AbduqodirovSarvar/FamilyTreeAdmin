import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { BaseFormComponent } from "../../../../../core/components/base-page-components/base-form.component";
import { SignUpRequestModel } from "../models/sign-up-request.model";
import { FormBuilder } from "@angular/forms";
import { SignUpService } from "../services/sign-up.service";
import { UserService } from "../../../../user/services/user.service";
import { userNameAvailableValidator } from "../../../../../shared/validators/user-name-available.validator";

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
        private router: Router,
        private userService: UserService,
        private cdr: ChangeDetectorRef
    ) {
        super(fb, SignUpRequestModel, signUpService);

        // Debounced uniqueness check on the username field.
        this.formGroup.get('userName')?.addAsyncValidators(
            userNameAvailableValidator(name => this.userService.checkUserNameExists(name))
        );

        // OnPush: async-validator status changes aren't tied to a DOM event,
        // so the submit button / mat-error wouldn't refresh without an
        // explicit markForCheck when validation resolves.
        this.formGroup.statusChanges
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.cdr.markForCheck());
    }

    /**
     * After successful registration land the user on the sign-in page so they
     * can log in with the credentials they just created. The base
     * implementation only console-logged the response, leaving the user
     * stranded on the sign-up form.
     */
    override create(): void {
        if (this.formGroup.invalid || this.formGroup.pending) {
            this.formGroup.markAllAsTouched();
            return;
        }
        this.signUpService.create(this.formGroup.value).subscribe({
            next: () => this.router.navigate(['/auth/sign-in']),
            error: err => console.error('Sign-up failed', err)
        });
    }
}
