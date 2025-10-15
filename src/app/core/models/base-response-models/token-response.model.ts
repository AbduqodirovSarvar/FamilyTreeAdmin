export interface TokenResponseModel {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiration?: string;
  refreshTokenExpiration?: string;
  tokenType?: string;
  userId?: string;
}
