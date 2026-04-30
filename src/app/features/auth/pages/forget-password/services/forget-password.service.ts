import { Injectable } from "@angular/core";
import { AuthModule } from "../../../auth.module";
import { ForgetPasswordModel } from "../models/forget-password.model";
import { BaseResponseModel } from "../../../../../core/models/base-response-models/base-response.model";
import { Observable } from "rxjs";
import { BaseAuthService } from "../../../../../core/services/global-entity-services/base-auth.service";

@Injectable({ providedIn: AuthModule })
export class ForgetPasswordService extends BaseAuthService {
    /**
     * The API exposes confirmation-code dispatch as
     * `GET /api/Auth/reset/{email}` (see AuthController). The previous
     * implementation POSTed to /api/auth/sign-in, which is the login
     * endpoint — wrong verb, wrong path. Switched to GET with the email
     * URL-encoded so addresses with `+` or `%` survive the round trip.
     */
    override endpoint: string = 'api/auth/reset';

    getConfirmationCode(forgetPasswordModel: ForgetPasswordModel): Observable<BaseResponseModel<any>> {
        const email = encodeURIComponent(forgetPasswordModel.email ?? '');
        return this.get<BaseResponseModel<any>>(`${this.endpoint}/${email}`);
    }

    /**
     * BaseFormComponent.create() invokes this. The endpoint is a GET, so we
     * pull the email out of whatever the form hands us and route through
     * getConfirmationCode. Parameter is widened to match the base generic
     * signature.
     */
    override create(entity: any): Observable<BaseResponseModel<any>> {
        const email = entity instanceof FormData
            ? String(entity.get('email') ?? entity.get('Email') ?? '')
            : ((entity as Partial<ForgetPasswordModel>)?.email ?? '');
        return this.getConfirmationCode({ email });
    }
}