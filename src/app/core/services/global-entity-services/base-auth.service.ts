import {Injectable, signal, WritableSignal} from '@angular/core';
import {BaseStorageService} from '../base-storage.service';
import {HttpClient} from '@angular/common/http';
import {BaseApiService} from '../base-api.service';
import {map, Observable, tap} from 'rxjs';
import {TokenResponseModel} from '../../models/base-response-models/token-response.model';

@Injectable({ providedIn: 'root' })
export class BaseAuthService extends BaseApiService {

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
   * Clear tokens from local storage
   */
  clearTokens(): void {
    this.clearAccessToken();
    this.clearRefreshToken();
  }

  /**
   * Clear access token from local storage
   */
  clearAccessToken(): void {
    this.storageService.removeItem(this.accessTokenKey);
    this.accessToken.set(null);
  }

  /**
   * Clear refresh token from local storage
   */
  clearRefreshToken(): void {
    this.storageService.removeItem(this.refreshTokenKey);
    this.refreshToken.set(null);
  }

  /**
   * Get access token with refresh token from server
   * @returns
   */
  public getAccessTokenWithRefleshToken(): Observable<string | null> {
    return this.get<TokenResponseModel>('/api/auth/token').pipe(
      tap((response: TokenResponseModel): void => {
        if(response.accessToken) this.setAccessToken(response.accessToken);
        if(response.refreshToken) this.setRefleshToken(response.refreshToken);
      }),
      map((response: TokenResponseModel): string | null => response?.accessToken ?? null)
    )
  }
}
