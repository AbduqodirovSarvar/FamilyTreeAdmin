import { Injectable } from '@angular/core';
import {
  HttpContextToken,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { catchError, finalize, map, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { BaseAuthService } from '../services/global-entity-services/base-auth.service';
import { BaseRouterService } from '../services/base-router.service';
import { PermissionsService } from '../services/permissions.service';
import { AdminService } from '../services/admin.service';
import { AccountService } from '../../features/settings/services/account.service';

/**
 * Set this on a request's HttpContext to bypass the auth interceptor entirely.
 * Used by the refresh-token call so we don't attach a stale Bearer or trigger
 * a recursive 401 handler when the refresh endpoint itself fails.
 */
export const SKIP_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  /**
   * The in-flight token refresh, shared by every request that hits a 401
   * during the same window.
   *
   * `shareReplay({ refCount: false })` is load-bearing: it keeps the refresh
   * HTTP call running to completion even if the request that first triggered
   * it gets cancelled (component destroyed, router navigation, a search
   * `switchMap`, …). The previous implementation drove the refresh off that
   * first request's subscription and tracked an `isRefreshing` boolean — when
   * the request was cancelled mid-refresh, the callbacks that reset the flag
   * never ran, so `isRefreshing` stuck `true` and every later 401 queued
   * forever behind a refresh that would never resolve.
   */
  private refresh$: Observable<string> | null = null;

  constructor(
    private authService: BaseAuthService,
    private routerService: BaseRouterService,
    private permissionsService: PermissionsService,
    private accountService: AccountService,
    private adminService: AdminService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.context.get(SKIP_AUTH_INTERCEPTOR)) {
      return next.handle(req);
    }

    const token: string | null = this.authService.getAccessToken();
    const authReq: HttpRequest<any> = token ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError(error => {
        if (error?.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh the token, then replay the original request once with the new
   * Bearer. A 401 on that retry means even a fresh token is rejected — the
   * session is genuinely dead, so we log out. The retried request goes
   * straight through `next.handle`, so it is not re-intercepted and cannot
   * loop back into the refresh machinery.
   */
  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.getRefreshedToken().pipe(
      switchMap(token =>
        next.handle(this.addToken(req, token)).pipe(
          catchError(err => {
            if (err?.status === 401) this.failRefresh();
            return throwError(() => err);
          })
        )
      )
    );
  }

  /**
   * Returns the shared refresh observable, kicking off a new refresh only
   * when one isn't already running. `finalize` clears the handle once the
   * refresh settles so the next 401 window starts a fresh cycle.
   */
  private getRefreshedToken(): Observable<string> {
    if (!this.refresh$) {
      this.refresh$ = this.authService.getAccessTokenWithRefleshToken().pipe(
        map(token => {
          if (!token) throw new Error('Session expired — please log in again.');
          return token;
        }),
        catchError(err => {
          // Refresh itself failed (no/invalid refresh token, network, 4xx).
          this.failRefresh();
          return throwError(() => err);
        }),
        finalize(() => { this.refresh$ = null; }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.refresh$;
  }

  /**
   * Refresh is unrecoverable — purge auth state and send the user to the
   * sign-in page. Idempotent: safe to call once per queued request.
   */
  private failRefresh(): void {
    this.authService.clearTokens();
    // Drop the cached permission set + profile with the tokens — next sign-in re-loads them.
    this.permissionsService.clear();
    this.accountService.clear();
    this.adminService.clear();
    this.routerService.navigateToSignInPage();
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
}
