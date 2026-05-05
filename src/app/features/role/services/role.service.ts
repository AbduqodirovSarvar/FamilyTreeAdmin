import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseEntityService } from '../../../core/services/global-entity-services/base-entity.service';
import { BaseResponseModel } from '../../../core/models/base-response-models/base-response.model';
import { CreateRoleRequest, RoleModel, UpdateRoleRequest } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService extends BaseEntityService<BaseResponseModel<RoleModel>> {
  protected override endpoint: string = 'api/UserRole';

  list(query?: { pageIndex?: number; pageSize?: number; searchText?: string }): Observable<BaseResponseModel<RoleModel[]>> {
    return this.getList<BaseResponseModel<RoleModel[]>>(`${this.endpoint}/list`, query);
  }

  getOne(id: string): Observable<BaseResponseModel<RoleModel>> {
    return this.get<BaseResponseModel<RoleModel>>(this.endpoint, { id });
  }

  /** POST /api/UserRole — controller binds [FromForm], so we serialise to multipart. */
  createRole(payload: CreateRoleRequest): Observable<BaseResponseModel<RoleModel>> {
    return this.post<BaseResponseModel<RoleModel>>(this.endpoint, this.toFormData(payload as unknown as Record<string, unknown>));
  }

  updateRole(payload: UpdateRoleRequest): Observable<BaseResponseModel<RoleModel>> {
    return this.put<BaseResponseModel<RoleModel>>(this.endpoint, this.toFormData(payload as unknown as Record<string, unknown>));
  }

  removeRole(id: string): Observable<BaseResponseModel<boolean>> {
    return this.delete<BaseResponseModel<boolean>>(this.endpoint, { id });
  }

  /** `null` clears nullable fields; `undefined` leaves them unchanged. */
  private toFormData(payload: Record<string, unknown>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined) continue;
      fd.append(this.pascalCase(key), value === null ? '' : String(value));
    }
    return fd;
  }

  private pascalCase(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
}
