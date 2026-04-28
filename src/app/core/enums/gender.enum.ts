export enum Gender {
  MALE = 0,
  FEMALE = 1
}

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: Gender.MALE, label: 'Male' },
  { value: Gender.FEMALE, label: 'Female' }
];
