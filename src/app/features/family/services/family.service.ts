import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseEntityService } from '../../../core/services/global-entity-services/base-entity.service';
import { BaseResponseModel } from '../../../core/models/base-response-models/base-response.model';
import { CreateFamilyRequest, FamilyModel, UpdateFamilyRequest } from '../models/family.model';
import { FamilyTreeModel } from '../../family-preview/models/family-tree.model';

@Injectable({ providedIn: 'root' })
export class FamilyService extends BaseEntityService<BaseResponseModel<FamilyModel>> {
  protected override endpoint: string = 'api/Family';

  list(query?: {
    pageIndex?: number;
    pageSize?: number;
    searchText?: string;
    /** When set, restrict the list to families owned by the given user. Used
     *  by the "My families" toggle on the list page so admins can pivot from
     *  the all-families view to their own subset. */
    ownerId?: string;
  }): Observable<BaseResponseModel<FamilyModel[]>> {
    const filters: Record<string, string> = {};
    if (query?.ownerId) filters['OwnerId'] = query.ownerId;
    return this.getList<BaseResponseModel<FamilyModel[]>>(`${this.endpoint}/list`, {
      pageIndex: query?.pageIndex,
      pageSize: query?.pageSize,
      searchText: query?.searchText,
      filters
    });
  }

  getOne(id: string): Observable<BaseResponseModel<FamilyModel>> {
    return this.get<BaseResponseModel<FamilyModel>>(this.endpoint, { id });
  }

  getTree(familyId: string): Observable<BaseResponseModel<FamilyTreeModel>> {
    return this.get<BaseResponseModel<FamilyTreeModel>>(`${this.endpoint}/tree/${familyId}`);
  }

  createFamily(payload: CreateFamilyRequest): Observable<BaseResponseModel<FamilyModel>> {
    return this.post<BaseResponseModel<FamilyModel>>(this.endpoint, this.toFormData(payload as unknown as Record<string, unknown>));
  }

  updateFamily(payload: UpdateFamilyRequest): Observable<BaseResponseModel<FamilyModel>> {
    return this.put<BaseResponseModel<FamilyModel>>(this.endpoint, this.toFormData(payload as unknown as Record<string, unknown>));
  }

  removeFamily(id: string): Observable<BaseResponseModel<boolean>> {
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
