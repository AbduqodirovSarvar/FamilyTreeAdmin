import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { getFormFields } from "../../models/base-form-field/form-field-options.model";
import { BaseEntityService } from "../../services/global-entity-services/base-entity.service";

export abstract class BaseFormComponent<T> {
    formGroup: FormGroup;

    protected constructor(protected fb: FormBuilder, model: new () => T, protected service: BaseEntityService<any>) {
        this.formGroup = this.buildForm(model);
    }

    private buildForm(modelClass: new () => T): FormGroup {
        const model = new modelClass();
        const fields = getFormFields(model);
        const group: Record<string, FormControl> = {};
        Object.entries(fields).forEach(([key, options]) => {
        group[key] = new FormControl(options.defaultValue ?? null, options.validators ?? []);
        });
        return this.fb.group(group);
    }

    create(): void {
        if (this.formGroup.invalid) {
            this.formGroup.markAllAsTouched();
            return;
        }
        const formValue = this.formGroup.value as any;
        this.service.create(formValue).subscribe((date: T) => {
            console.log(date);
        });
    }

    update(): void {
        if (this.formGroup.invalid) {
            this.formGroup.markAllAsTouched();
            return;
        }
        const formValue = this.formGroup.value as any;
        this.service.update(formValue).subscribe((date: T) => {
            console.log(date);
        });
    }
}