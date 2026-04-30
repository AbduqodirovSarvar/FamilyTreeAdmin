import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AuthModule } from "../../../auth.module";
import { BaseAuthService } from "../../../../../core/services/global-entity-services/base-auth.service";
import { BaseResponseModel } from "../../../../../core/models/base-response-models/base-response.model";

export interface ResetSignInRequest {
    email: string;
    confirmationCode: string;
    password: string;
    confirmPassword: string;
}

@Injectable({ providedIn: AuthModule })
export class ResetSignInService extends BaseAuthService {
    /**
     * `POST /api/Auth/reset` with a JSON body of ResetSignInCommand —
     * `[FromBody]` on the server, so we send camelCase keys directly.
     */
    override endpoint: string = 'api/auth/reset';

    reset(payload: ResetSignInRequest): Observable<BaseResponseModel<boolean>> {
        return this.post<BaseResponseModel<boolean>>(this.endpoint, payload);
    }
}
