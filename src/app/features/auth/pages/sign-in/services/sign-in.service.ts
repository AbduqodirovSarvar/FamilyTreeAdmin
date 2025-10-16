import {Injectable} from '@angular/core';
import {AuthModule} from '../../../auth.module';
import {BaseAuthService} from '../../../../../core/services/global-entity-services/base-auth.service';
import {Observable} from 'rxjs';
import {SignInRequest} from '../models/sign-in-request.model';
import {BaseResponseModel} from '../../../../../core/models/base-response-models/base-response.model';
import {TokenResponseModel} from '../../../../../core/models/base-response-models/token-response.model';

@Injectable({ providedIn: AuthModule })
export class SignInService extends BaseAuthService {

  /**
   * Sign in
   * @param signInModel
   */
  signIn(signInModel: SignInRequest): Observable<BaseResponseModel<TokenResponseModel>> {
    return this.post<BaseResponseModel<TokenResponseModel>>('auth/signin', signInModel);
  }
}
