export enum Gender {
  MALE = 0,
  FEMALE = 1
}

/** Translate key for the option label, resolved via the `translate` pipe in templates. */
export const GENDER_OPTIONS: { value: Gender; key: string }[] = [
  { value: Gender.MALE, key: 'gender.male' },
  { value: Gender.FEMALE, key: 'gender.female' }
];
