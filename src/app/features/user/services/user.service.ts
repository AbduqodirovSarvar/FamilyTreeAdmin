import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseEntityService } from '../../../core/services/global-entity-services/base-entity.service';
import { BaseResponseModel } from '../../../core/models/base-response-models/base-response.model';
import { UpdateUserRequest, UserModel } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseEntityService<BaseResponseModel<UserModel>> {
  protected override endpoint: string = 'api/User';

  list(query?: { pageIndex?: number; pageSize?: number; searchText?: string; familyId?: string }): Observable<BaseResponseModel<UserModel[]>> {
    const filters: Record<string, string> = {};
    if (query?.familyId) filters['FamilyId'] = query.familyId;
    return this.getList<BaseResponseModel<UserModel[]>>(`${this.endpoint}/list`, {
      pageIndex: query?.pageIndex,
      pageSize: query?.pageSize,
      searchText: query?.searchText,
      filters
    });
  }

  getOne(id: string): Observable<BaseResponseModel<UserModel>> {
    return this.get<BaseResponseModel<UserModel>>(this.endpoint, { id });
  }

  updateUser(payload: UpdateUserRequest): Observable<BaseResponseModel<UserModel>> {
    return this.put<BaseResponseModel<UserModel>>(this.endpoint, this.toFormData(payload as unknown as Record<string, unknown>));
  }

  removeUser(id: string): Observable<BaseResponseModel<boolean>> {
    return this.delete<BaseResponseModel<boolean>>(this.endpoint, { id });
  }

  /**
   * `undefined` = "field not provided" (no change, skip).
   * `null` = "explicit clear" (sent as empty string so the backend can null-out
   * the column). Without this distinction, clearing a nullable field silently
   * kept the previous value.
   */
  private toFormData(payload: Record<string, unknown>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      if (value === null) {
        formData.append(this.pascalCase(key), '');
        continue;
      }
      if (value instanceof File) {
        formData.append(this.pascalCase(key), value, value.name);
      } else {
        formData.append(this.pascalCase(key), String(value));
      }
    }
    return formData;
  }

  private pascalCase(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
}
