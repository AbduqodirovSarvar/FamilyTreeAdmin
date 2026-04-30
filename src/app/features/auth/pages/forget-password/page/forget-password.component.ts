import { ChangeDetectorRef, Component } from "@angular/core";
import { Router } from "@angular/router";
import { BaseFormComponent } from "../../../../../core/components/base-page-components/base-form.component";
import { ForgetPasswordModel } from "../models/forget-password.model";
import { FormBuilder } from "@angular/forms";
import { ForgetPasswordService } from "../services/forget-password.service";

@Component({
    selector: 'forget-password',
    standalone: false,
    templateUrl: './forget-password.component.html',
    styleUrls: ['./forget-password.component.scss'],
})
export class ForgetPasswordComponent extends BaseFormComponent<ForgetPasswordModel> {

    loading = false;

    constructor(
        fb: FormBuilder,
        private forgetPasswordService: ForgetPasswordService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        super(fb, ForgetPasswordModel, forgetPasswordService);
    }

    /**
     * Once the API has dispatched the confirmation email, advance to
     * /auth/reset-sign-in carrying the email as a query param so the next
     * form can include it in the reset request without asking the user to
     * type it again. The base impl just console-logged the response.
     */
    override create(): void {
        if (this.formGroup.invalid || this.loading) {
            this.formGroup.markAllAsTouched();
            return;
        }
        this.loading = true;
        const email: string = this.formGroup.value.email;

        this.forgetPasswordService.create(this.formGroup.value).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/auth/reset-sign-in'], { queryParams: { email } });
            },
            error: err => {
                this.loading = false;
                this.cdr.markForCheck();
                console.error('Confirmation code request failed', err);
            }
        });
    }
}