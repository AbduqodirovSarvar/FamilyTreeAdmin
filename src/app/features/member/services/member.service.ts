import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseEntityService } from '../../../core/services/global-entity-services/base-entity.service';
import { BaseResponseModel } from '../../../core/models/base-response-models/base-response.model';
import { CreateMemberRequest, MemberModel, UpdateMemberRequest } from '../models/member.model';

@Injectable({ providedIn: 'root' })
export class MemberService extends BaseEntityService<BaseResponseModel<MemberModel>> {
  protected override endpoint: string = 'api/Member';

  list(query?: { pageIndex?: number; pageSize?: number; searchText?: string; familyId?: string }): Observable<BaseResponseModel<MemberModel[]>> {
    const filters: Record<string, string> = {};
    if (query?.familyId) filters['FamilyId'] = query.familyId;
    return this.getList<BaseResponseModel<MemberModel[]>>(`${this.endpoint}/list`, {
      pageIndex: query?.pageIndex,
      pageSize: query?.pageSize,
      searchText: query?.searchText,
      filters
    });
  }

  getOne(id: string): Observable<BaseResponseModel<MemberModel>> {
    return this.get<BaseResponseModel<MemberModel>>(this.endpoint, { id });
  }

  createMember(payload: CreateMemberRequest): Observable<BaseResponseModel<MemberModel>> {
    return this.post<BaseResponseModel<MemberModel>>(this.endpoint, this.toFormData(payload as unknown as Record<string, unknown>));
  }

  updateMember(payload: UpdateMemberRequest): Observable<BaseResponseModel<MemberModel>> {
    return this.put<BaseResponseModel<MemberModel>>(this.endpoint, this.toFormData(payload as unknown as Record<string, unknown>));
  }

  removeMember(id: string): Observable<BaseResponseModel<boolean>> {
    return this.delete<BaseResponseModel<boolean>>(this.endpoint, { id });
  }

  private toFormData(payload: Record<string, unknown>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined) continue;
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
