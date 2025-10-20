import { Validators } from "@angular/forms";
import { FormField } from "../../../../../core/models/base-form-field/form-field-options.model";

export class ForgetPasswordModel {
    @FormField({ defaultValue: '', validators: [Validators.required, Validators.email] })
    email: string | undefined;
}