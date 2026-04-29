import {Injectable} from '@angular/core';
import {
  HttpContextToken,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import {catchError, Observable, Subject, switchMap, take, throwError} from 'rxjs';
import {BaseAuthService} from '../services/global-entity-services/base-auth.service';
import {BaseRouterService} from '../services/base-router.service';

/**
 * Set this on a request's HttpContext to bypass the auth interceptor entirely.
 * Used by the refresh-token call so we don't attach a stale Bearer or trigger
 * a recursive 401 handler when the refresh endpoint itself fails.
 */
export const SKIP_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing: boolean = false;
  /** Fresh Subject is created per refresh cycle so subscribers cannot leak across cycles. */
  private refreshTokenSubject: Subject<string> = new Subject<string>();

  constructor(private authService: BaseAuthService, private routerService: BaseRouterService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.context.get(SKIP_AUTH_INTERCEPTOR)) {
      return next.handle(req);
    }

    const token: string | null = this.authService.getAccessToken();
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next.handle(req).pipe(
      catchError(error => {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject = new Subject<string>();
      return this.authService.getAccessTokenWithRefleshToken().pipe(
        switchMap((tokenResponse: string | null): Observable<HttpEvent<any>> => {
          this.isRefreshing = false;
          if (!tokenResponse) {
            return this.failRefresh(new Error('Session expired — please log in again.'));
          }
          this.refreshTokenSubject.next(tokenResponse);
          this.refreshTokenSubject.complete();
          return next.handle(this.addToken(req, tokenResponse));
        }),
        catchError(err => {
          this.isRefreshing = false;
          return this.failRefresh(err);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      take(1),
      switchMap((token: string) => next.handle(this.addToken(req, token)))
    );
  }

  /**
   * Refresh failed — purge auth state, signal failure to every queued request,
   * and send the user to the sign-in page exactly once.
   */
  private failRefresh(err: unknown): Observable<never> {
    this.authService.clearTokens();
    this.refreshTokenSubject.error(err);
    this.routerService.navigateToSignInPage();
    return throwError(() => err);
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
}
