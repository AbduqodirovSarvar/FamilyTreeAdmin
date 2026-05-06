import { Injectable, signal, WritableSignal, Signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, shareReplay, map } from 'rxjs';
import { BaseUrlService } from './base-url.service';
import { BaseStorageService } from './base-storage.service';
import { BaseResponseModel } from '../models/base-response-models/base-response.model';

/** localStorage key for the cached isAdmin flag — keeps the admin tab from
 * flickering between "hidden" and "visible" while /api/Admin/check is in
 * flight on a fresh page load. The cached value is always a hint;
 * the next `check()` call refreshes it from the server. */
const ADMIN_FLAG_STORAGE_KEY = 'ft.is_admin';

interface AdminCheckResponse {
  isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService extends BaseUrlService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(BaseStorageService);

  private readonly _isAdmin: WritableSignal<boolean> = signal(this.readCache());
  readonly isAdmin: Signal<boolean> = this._isAdmin.asReadonly();

  /** Single in-flight admin-check shared across concurrent callers. Same
   * pattern as PermissionsService — prevents duplicate boot-time hits. */
  private pending: Observable<boolean> | null = null;

  /**
   * Fetches and caches the current user's admin status. Same fire-and-forget
   * semantics as PermissionsService.load — failures keep whatever was
   * cached so a transient network blip doesn't yank UI mid-render.
   */
  check(): Observable<boolean> {
    if (this.pending) return this.pending;

    this.pending = this.http
      .get<AdminCheckResponse>(`${this.baseUrl}/api/Admin/check`)
      .pipe(
        map(res => Boolean(res?.isAdmin)),
        tap(value => {
          this._isAdmin.set(value);
          this.writeCache(value);
        }),
        catchError(() => of(this._isAdmin())),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    this.pending.subscribe({
      complete: () => (this.pending = null),
      error: () => (this.pending = null)
    });

    return this.pending;
  }

  /** Wipe on sign-out so the next user starts as non-admin until re-checked. */
  clear(): void {
    this._isAdmin.set(false);
    this.pending = null;
    try { this.storage.removeItem(ADMIN_FLAG_STORAGE_KEY); } catch { /* ignore */ }
  }

  // ─── Admin actions (only callable when isAdmin is true; backend re-checks anyway) ──

  /** Triggers the same statistics summary the daily background service sends.
   *  Backend returns 202 Accepted on success, 403 if the caller isn't admin. */
  sendStatistics(): Observable<BaseResponseModel<unknown>> {
    return this.http.post<BaseResponseModel<unknown>>(
      `${this.baseUrl}/api/Admin/notifications/send-stats`,
      {}
    );
  }

  /** Runs pg_dump and uploads the dump to the dbarxiv Telegram topic.
   *  Synchronous on the server — can take tens of seconds for a multi-MB DB. */
  sendDatabaseBackup(): Observable<BaseResponseModel<unknown>> {
    return this.http.post<BaseResponseModel<unknown>>(
      `${this.baseUrl}/api/Admin/notifications/send-db-backup`,
      {}
    );
  }

  // ─── localStorage cache ──────────────────────────────────────

  private readCache(): boolean {
    try {
      const raw = this.storage.getItem<boolean>(ADMIN_FLAG_STORAGE_KEY);
      return raw === true;
    } catch { /* ignore */ }
    return false;
  }

  private writeCache(value: boolean): void {
    try { this.storage.setItem(ADMIN_FLAG_STORAGE_KEY, value); } catch { /* ignore */ }
  }
}
