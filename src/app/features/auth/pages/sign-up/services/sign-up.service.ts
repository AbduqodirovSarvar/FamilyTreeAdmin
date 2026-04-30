import {Injectable} from '@angular/core';
import {AuthModule} from '../../../auth.module';
import {BaseAuthService} from '../../../../../core/services/global-entity-services/base-auth.service';
import {Observable} from 'rxjs';
import {BaseResponseModel} from '../../../../../core/models/base-response-models/base-response.model';
import {SignUpRequestModel} from '../models/sign-up-request.model';

@Injectable({ providedIn: AuthModule })
export class SignUpService extends BaseAuthService {

  /**
   * Endpoint — matches the AuthController route `[Route("api/[controller]")]`
   * with action `[HttpPost("sign-up")]`. The previous value `auth/signup`
   * dropped the `/api` prefix and used a path that doesn't exist, so every
   * sign-up returned 404.
   */
  override endpoint: string = 'api/auth/sign-up';

  /**
   * BaseFormComponent.create() routes through this. The server binds
   * SignUpCommand from `[FromForm]` (it carries `IFormFile? Image`), so we
   * must serialise to multipart/form-data with PascalCase keys — posting
   * the raw form value as JSON returns a 400 from model binding.
   *
   * The parameter is intentionally widened to match BaseEntityService's
   * generic signature; in practice BaseFormComponent always hands us a
   * SignUpRequestModel-shaped object (or a FormData).
   */
  override create(entity: any): Observable<BaseResponseModel<any>> {
    const payload: FormData = entity instanceof FormData ? entity : this.toFormData(entity);
    return this.post<BaseResponseModel<any>>(this.endpoint, payload);
  }

  /** Public alias kept for direct callers. */
  signUp(signUpModel: SignUpRequestModel): Observable<BaseResponseModel<any>> {
    return this.create(signUpModel);
  }

  private toFormData(model: Partial<SignUpRequestModel>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(model)) {
      if (value === null || value === undefined) continue;
      const pascal = key.charAt(0).toUpperCase() + key.slice(1);
      if (value instanceof File) {
        fd.append(pascal, value, value.name);
      } else {
        fd.append(pascal, String(value));
      }
    }
    return fd;
  }
}
