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

    hidePassword: boolean = true;
    hideConfirm: boolean = true;

    constructor(fb: FormBuilder, private signUpService: SignUpService) {
        super(fb, SignUpRequestModel, signUpService);
    }
}
