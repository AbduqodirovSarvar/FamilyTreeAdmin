import { Injectable } from "@angular/core";
import { AuthModule } from "../../../auth.module";
import { ForgetPasswordModel } from "../models/forget-password.model";
import { BaseResponseModel } from "../../../../../core/models/base-response-models/base-response.model";
import { Observable } from "rxjs";
import { BaseAuthService } from "../../../../../core/services/global-entity-services/base-auth.service";

@Injectable({ providedIn: AuthModule })
export class ForgetPasswordService extends BaseAuthService {
    /**
       * Forget password - get confirmation code
       * @param forgetPasswordModel
       */
      getConfirmationCode(forgetPasswordModel: ForgetPasswordModel): Observable<BaseResponseModel<any>> {
        return this.post<BaseResponseModel<any>>('api/auth/sign-in', forgetPasswordModel);
      }
}