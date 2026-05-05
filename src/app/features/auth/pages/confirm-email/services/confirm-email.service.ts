import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { BaseResponseModel } from '../../../../../core/models/base-response-models/base-response.model';

@Injectable()
export class ConfirmEmailService extends BaseApiService {
  // Re-expose the constructor as public — the base class makes it protected.
  constructor(http: HttpClient) {
    super(http);
  }

  /** Exchanges the raw token from the welcome email for a confirmed flag on the server. */
  confirm(token: string): Observable<BaseResponseModel<boolean>> {
    return this.post<BaseResponseModel<boolean>>('api/Auth/confirm-email', { token });
  }

  /** Used by the "didn't get the link" form and Settings → Resend button. */
  resend(email: string): Observable<BaseResponseModel<boolean>> {
    return this.post<BaseResponseModel<boolean>>('api/Auth/resend-confirmation', { email });
  }
}
