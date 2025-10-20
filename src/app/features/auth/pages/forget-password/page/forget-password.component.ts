import { Component } from "@angular/core";
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
loading: any;

    constructor(fb: FormBuilder, private forgetPasswordService: ForgetPasswordService) {
        super(fb, ForgetPasswordModel, forgetPasswordService);
    }
}