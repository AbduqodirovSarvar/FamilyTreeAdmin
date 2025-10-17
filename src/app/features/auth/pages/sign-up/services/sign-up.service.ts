import {Injectable} from '@angular/core';
import {AuthModule} from '../../../auth.module';
import {BaseAuthService} from '../../../../../core/services/global-entity-services/base-auth.service';
import {Observable} from 'rxjs';
import {BaseResponseModel} from '../../../../../core/models/base-response-models/base-response.model';
import {SignUpRequestModel} from '../models/sign-up-request.model';

@Injectable({ providedIn: AuthModule })
export class SignUpService extends BaseAuthService {

  /**
   * Sign up
   * @param signUpModel
   */
  signUp(signUpModel: SignUpRequestModel): Observable<BaseResponseModel<any>> {
    return this.post<BaseResponseModel<any>>('auth/signup', signUpModel);
  }
}
