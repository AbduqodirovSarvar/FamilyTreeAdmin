import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs';
import { BaseResponseModel } from '../../core/models/base-response-models/base-response.model';

/**
 * Debounced async validator that flags `{ userNameTaken: true }` when a user
 * with the entered `userName` already exists.
 *
 * It waits 400ms after the last keystroke before hitting the backend: Angular
 * re-runs the async validator on every value change and cancels the previous
 * run, so the `timer` effectively debounces typing. The backend matches names
 * case-insensitively.
 *
 * @param check   Calls the existence endpoint for a given userName.
 * @param getOriginalUserName  For edit forms — the user's current userName is
 *        always treated as valid (keeping your own name isn't a conflict).
 *        Defaults to empty for create forms.
 *
 * Network errors resolve to "valid" so a transient outage can't lock the form.
 */
export function userNameAvailableValidator(
  check: (userName: string) => Observable<BaseResponseModel<boolean>>,
  getOriginalUserName: () => string = () => ''
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = String(control.value ?? '').trim();
    if (!value) return of(null);

    const original = getOriginalUserName().trim().toLowerCase();
    if (value.toLowerCase() === original) return of(null);

    return timer(400).pipe(
      switchMap(() => check(value)),
      map(res => (res?.data ? { userNameTaken: true } : null)),
      catchError(() => of(null))
    );
  };
}
