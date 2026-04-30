import { Injectable, signal, WritableSignal, computed, Signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, shareReplay, map } from 'rxjs';
import { BaseUrlService } from './base-url.service';
import { BaseStorageService } from './base-storage.service';
import { BaseResponseModel } from '../models/base-response-models/base-response.model';
import { PermissionName } from '../enums/permission.enum';

/** Storage key for the cached permission set. Avoids a network round-trip on
 * every page reload — the cached set is treated as a hint and refreshed
 * lazily by the next `load()` call. */
const PERMISSIONS_STORAGE_KEY = 'ft.permissions';

/**
 * Holds the current user's permission set in a signal so any template that
 * reads it through {@link has}/{@link any} re-renders when the set changes
 * (after sign-in, after sign-out, after a refresh).
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService extends BaseUrlService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(BaseStorageService);

  /** In-flight request shared between concurrent callers — prevents
   * duplicate `/me/permissions` hits during app boot. */
  private pending: Observable<ReadonlySet<string>> | null = null;

  private readonly _permissions: WritableSignal<ReadonlySet<string>> = signal(this.readCache());
  readonly permissions: Signal<ReadonlySet<string>> = this._permissions.asReadonly();

  /** True when the user's permissions have been resolved at least once. */
  readonly loaded: Signal<boolean> = computed(() => this._permissions().size > 0);

  has(name: PermissionName): boolean {
    return this._permissions().has(name);
  }

  /** True if the user has ANY of the listed permissions. */
  any(...names: PermissionName[]): boolean {
    const set = this._permissions();
    return names.some(n => set.has(n));
  }

  /** True if the user has ALL of the listed permissions. */
  all(...names: PermissionName[]): boolean {
    const set = this._permissions();
    return names.every(n => set.has(n));
  }

  /**
   * Fetch and cache the current user's permissions. Concurrent callers share
   * the same in-flight request. Errors are swallowed so a failed permission
   * fetch never blocks app boot — the user simply sees nothing they aren't
   * authorised for.
   */
  load(): Observable<ReadonlySet<string>> {
    if (this.pending) return this.pending;

    this.pending = this.http
      .get<BaseResponseModel<string[]>>(`${this.baseUrl}/api/auth/me/permissions`)
      .pipe(
        map(res => new Set(res.data ?? [])),
        tap(set => {
          this._permissions.set(set);
          this.writeCache(set);
        }),
        catchError(() => {
          // Don't trap the boot path — keep whatever was cached and let the
          // user sign in again later if needed.
          return of(this._permissions());
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    // Reset the in-flight handle once the observable completes/errors so a
    // subsequent forced `load()` doesn't hand out a stale terminated subject.
    this.pending.subscribe({
      complete: () => (this.pending = null),
      error: () => (this.pending = null)
    });

    return this.pending;
  }

  /** Wipe permissions on sign-out so the next user starts from a clean slate. */
  clear(): void {
    this._permissions.set(new Set<string>());
    this.pending = null;
    try { this.storage.removeItem(PERMISSIONS_STORAGE_KEY); } catch { /* ignore */ }
  }

  // ─── localStorage cache ──────────────────────────────────────
  // We persist the permission list across reloads so the sidebar doesn't
  // flicker between "everything visible" and "filtered" while the
  // /me/permissions request is in flight.

  private readCache(): ReadonlySet<string> {
    try {
      const raw = this.storage.getItem<string[]>(PERMISSIONS_STORAGE_KEY);
      if (Array.isArray(raw)) return new Set(raw);
    } catch { /* ignore */ }
    return new Set<string>();
  }

  private writeCache(set: ReadonlySet<string>): void {
    try { this.storage.setItem(PERMISSIONS_STORAGE_KEY, Array.from(set)); } catch { /* ignore */ }
  }
}
