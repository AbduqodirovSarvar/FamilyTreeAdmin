import { Injectable, computed, signal, Signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, shareReplay, map } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { BaseResponseModel } from '../../../core/models/base-response-models/base-response.model';
import { UserModel } from '../../user/models/user.model';

export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: File | null;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService extends BaseApiService {
  /** Cached profile of the signed-in user. Populated by {@link loadMe}
   *  on sign-in / app boot; consumed by ownership checks (e.g. "did
   *  *I* create this family?"). */
  private readonly _currentUser: WritableSignal<UserModel | null> = signal(null);
  readonly currentUser: Signal<UserModel | null> = this._currentUser.asReadonly();
  readonly currentUserId: Signal<string | null> = computed(() => this._currentUser()?.id ?? null);

  /** Single in-flight /me request shared between concurrent callers. */
  private pending: Observable<UserModel | null> | null = null;

  constructor(http: HttpClient) {
    super(http);
  }

  /**
   * Fetch + cache /me. Errors are swallowed so a transient failure on
   * boot doesn't strand the app — the cached value (or null) stays
   * available and the next caller can retry.
   */
  loadMe(): Observable<UserModel | null> {
    if (this.pending) return this.pending;

    this.pending = this.get<BaseResponseModel<UserModel>>('api/Auth/me').pipe(
      map(response => response?.data ?? null),
      tap(user => this._currentUser.set(user)),
      catchError(() => of(this._currentUser())),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    // Reset the in-flight handle once the observable terminates so a fresh
    // load() can be issued later (e.g. after a forced refresh).
    this.pending.subscribe({
      complete: () => (this.pending = null),
      error: () => (this.pending = null)
    });

    return this.pending;
  }

  clear(): void {
    this._currentUser.set(null);
    this.pending = null;
  }

  // ─── Direct API calls ───────────────────────────────────────

  getMe(): Observable<BaseResponseModel<UserModel>> {
    return this.get<BaseResponseModel<UserModel>>('api/Auth/me');
  }

  updateProfile(payload: UpdateProfileRequest): Observable<BaseResponseModel<UserModel>> {
    // `undefined` = "field omitted, no change". `null` or empty string = "explicit clear"
    // — sent as empty value so the backend can null-out the column.
    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
      if (value === null || value === '') {
        formData.append(pascalKey, '');
        continue;
      }
      if (value instanceof File) {
        formData.append(pascalKey, value, value.name);
      } else {
        formData.append(pascalKey, String(value));
      }
    }
    return this.put<BaseResponseModel<UserModel>>('api/Auth/profile', formData);
  }

  changePassword(payload: ChangePasswordRequest): Observable<BaseResponseModel<boolean>> {
    return this.post<BaseResponseModel<boolean>>('api/Auth/change-password', payload);
  }
}
