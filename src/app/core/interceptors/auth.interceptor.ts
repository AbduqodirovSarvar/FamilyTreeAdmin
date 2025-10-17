import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, catchError, filter, Observable, switchMap, take, throwError} from 'rxjs';
import {BaseAuthService} from '../services/global-entity-services/base-auth.service';
import {BaseRouterService} from '../services/base-router.service';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing: boolean = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: BaseAuthService, private routerService: BaseRouterService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
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

  private handle401Error(req: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      return this.authService.getAccessTokenWithRefleshToken().pipe(
        switchMap((tokenResponse: string | null): Observable<HttpEvent<any>> => {
          this.isRefreshing = false;
          if (!tokenResponse) {
            this.authService.clearTokens();
            return throwError(() => new Error('Session expired — please log in again.'));
          }
          this.refreshTokenSubject.next(tokenResponse);
          return next.handle(this.addToken(req, tokenResponse));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authService.clearTokens();
          this.routerService.navigateToSignInPage()
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token!)))
      );
    }
  }

  private addToken(req: HttpRequest<any>, token: string) {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
}
