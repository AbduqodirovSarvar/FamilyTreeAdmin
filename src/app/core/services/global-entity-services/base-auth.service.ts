import {Injectable, signal, WritableSignal} from '@angular/core';
import {BaseStorageService} from '../base-storage.service';
import {HttpClient, HttpContext} from '@angular/common/http';
import {BaseApiService} from '../base-api.service';
import {map, Observable, tap} from 'rxjs';
import {TokenResponseModel} from '../../models/base-response-models/token-response.model';
import { BaseEntityService } from './base-entity.service';
import { BaseResponseModel } from '../../models/base-response-models/base-response.model';
import { SKIP_AUTH_INTERCEPTOR } from '../../interceptors/auth.interceptor';

@Injectable({ providedIn: 'root' })
export class BaseAuthService extends BaseEntityService<BaseResponseModel<any>> {

  protected override endpoint: string = 'auth';

  /**
   * Access token
   * @private
   */
  private accessToken: WritableSignal<string | null> = signal(null);

  /**
   * Refresh token
   * @private
   */
  private refreshToken: WritableSignal<string | null> = signal(null);

  /**
   * Keys
   * @private
   */
  private readonly refreshTokenKey: string = 'reflesh_token';

  /**
   * Keys
   * @private
   */
  private readonly accessTokenKey: string = 'access_token';

  /**
   * Single source of truth for all auth-related localStorage keys.
   * On sign-out / refresh failure, every key in this list is purged.
   * Add new auth-scoped keys here so they are cleared automatically.
   * @private
   */
  private readonly authStorageKeys: readonly string[] = [
    this.accessTokenKey,
    this.refreshTokenKey,
  ];

  /**
   * Creates an instance of the class with the provided storage service and HTTP client.
   * @param storageService
   * @param httpClient
   */
  constructor(private readonly storageService: BaseStorageService,
              httpClient: HttpClient
  ) {
    super(httpClient)
  }

  /**
   * Set access token
   * @param token
   */
  public setAccessToken(token: string): void {
    this.storageService.setItem(this.accessTokenKey, token);
    this.accessToken.set(token);
  }

  /**
   * Set refresh token
   * @param token
   */
  public setRefleshToken(token: string): void {
    this.storageService.setItem(this.refreshTokenKey, token);
    this.refreshToken.set(token);
  }

  /**
   * Get access token from local storage
   * @returns
   */
  getAccessToken(): string | null {
    return this.accessToken() ?? this.storageService.getItem<string>(this.accessTokenKey);
  }

  /**
   * Get refresh token from local storage
   * @returns
   */
  getRefleshToken(): string | null {
    return this.refreshToken() ?? this.storageService.getItem<string>(this.refreshTokenKey);
  }

  /**
   * Clear every auth-related key from local storage and reset in-memory signals.
   */
  clearTokens(): void {
    for (const key of this.authStorageKeys) {
      this.storageService.removeItem(key);
    }
    this.accessToken.set(null);
    this.refreshToken.set(null);
  }

  /**
   * Get access token with refresh token from server.
   * Bypasses AuthInterceptor so the refresh request never triggers recursive
   * 401 handling and so a stale access token is not attached as Bearer.
   * @returns
   */
  public getAccessTokenWithRefleshToken(): Observable<string | null> {
    const context: HttpContext = new HttpContext().set(SKIP_AUTH_INTERCEPTOR, true);
    return this.http.get<BaseResponseModel<TokenResponseModel>>(
      `${this.baseUrl}/api/auth/token`,
      { context }
    ).pipe(
      tap((response: BaseResponseModel<TokenResponseModel>): void => {
        if(response.data?.accessToken) this.setAccessToken(response.data.accessToken);
        if(response.data?.refreshToken) this.setRefleshToken(response.data.refreshToken);
      }),
      map((response: BaseResponseModel<TokenResponseModel>): string | null => response?.data?.accessToken ?? null)
    )
  }
}
