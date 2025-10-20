import { Validators } from "@angular/forms";
import { FormField } from "../../../../../core/models/base-form-field/form-field-options.model";

export class SignUpRequestModel {
  @FormField({ defaultValue: '', validators: [Validators.required] })
  firstName: string | undefined;

  @FormField({ defaultValue: '', validators: [Validators.required] })
  lastName: string | undefined;

  @FormField()
  userName?: string | null;

  @FormField({ validators: [Validators.pattern(/^(\+998|8)[0-9]{9,12}$/)] })
  phone?: string | null;

  @FormField({ defaultValue: '', validators: [Validators.required, Validators.email] })
  email: string | undefined;

  @FormField({ validators: [Validators.required, Validators.minLength(6)] })
  password: string | undefined;

  @FormField({ validators: [Validators.required] })
  confirmPassword: string | undefined;

  @FormField()
  familyId?: string | null;

  @FormField()
  image?: File | null;

  @FormField()
  roleId?: string | null;
}
