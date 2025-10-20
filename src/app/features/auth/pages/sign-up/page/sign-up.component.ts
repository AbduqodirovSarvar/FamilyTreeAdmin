import { ChangeDetectionStrategy, Component } from "@angular/core";
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
    
    constructor(fb: FormBuilder, private signUpService: SignUpService) {
        super(fb, SignUpRequestModel, signUpService);
    }

    /**
     * onFileSelected
     * @param event
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.formGroup.patchValue({ image: file });
            this.formGroup.get('image')?.updateValueAndValidity();
        }
    }
    
}