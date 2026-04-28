import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { BaseResponseModel } from '../../../core/models/base-response-models/base-response.model';
import { UserModel } from '../../user/models/user.model';

export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: File | null;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getMe(): Observable<BaseResponseModel<UserModel>> {
    return this.get<BaseResponseModel<UserModel>>('api/Auth/me');
  }

  updateProfile(payload: UpdateProfileRequest): Observable<BaseResponseModel<UserModel>> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined || value === '') continue;
      const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
      if (value instanceof File) {
        formData.append(pascalKey, value, value.name);
      } else {
        formData.append(pascalKey, String(value));
      }
    }
    return this.put<BaseResponseModel<UserModel>>('api/Auth/profile', formData);
  }

  changePassword(payload: ChangePasswordRequest): Observable<BaseResponseModel<boolean>> {
    return this.post<BaseResponseModel<boolean>>('api/Auth/change-password', payload);
  }
}
