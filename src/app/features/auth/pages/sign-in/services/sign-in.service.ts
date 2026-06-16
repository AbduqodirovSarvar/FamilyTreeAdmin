import {Injectable} from '@angular/core';
import {AuthModule} from '../../../auth.module';
import {BaseAuthService} from '../../../../../core/services/global-entity-services/base-auth.service';
import {Observable} from 'rxjs';
import {SignInRequest} from '../models/sign-in-request.model';
import {GoogleSignInRequest} from '../models/google-sign-in-request.model';
import {BaseResponseModel} from '../../../../../core/models/base-response-models/base-response.model';
import {TokenResponseModel} from '../../../../../core/models/base-response-models/token-response.model';

@Injectable({ providedIn: AuthModule })
export class SignInService extends BaseAuthService {

  /**
   * Sign in
   * @param signInModel
   */
  signIn(signInModel: SignInRequest): Observable<BaseResponseModel<TokenResponseModel>> {
    return this.post<BaseResponseModel<TokenResponseModel>>('api/auth/sign-in', signInModel);
  }

  /**
   * Sign in / register with a Google ID token. The backend creates the account
   * on first contact and issues our own JWT pair — identical response shape to
   * {@link signIn}, so the caller reuses the same success handler.
   * @param request
   */
  googleSignIn(request: GoogleSignInRequest): Observable<BaseResponseModel<TokenResponseModel>> {
    return this.post<BaseResponseModel<TokenResponseModel>>('api/auth/google', request);
  }
}
