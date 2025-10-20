import 'reflect-metadata';
import { ValidatorFn } from "@angular/forms";

export interface FormFieldOptionsModel {
    defaultValue?: any;
    validators?: ValidatorFn[];
}

const FORM_FIELDS_KEY = Symbol('formFields');

export function FormField(options: FormFieldOptionsModel = {}) {
  return function (target: any, propertyKey: string) {
    const existingFields = Reflect.getMetadata(FORM_FIELDS_KEY, target) || {};
    existingFields[propertyKey] = options;
    Reflect.defineMetadata(FORM_FIELDS_KEY, existingFields, target);
  };
}

export function getFormFields(target: any): Record<string, FormFieldOptionsModel> {
  return Reflect.getMetadata(FORM_FIELDS_KEY, target) || {};
}