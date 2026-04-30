import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { HttpClient } from '@angular/common/http';
import { BaseResponseModel } from '../models/base-response-models/base-response.model';
import { PermissionName } from '../enums/permission.enum';

/**
 * One row in the `UserRolePermissions` table — pairs a role with a single
 * permission. The id is the row id (NOT the permission id) and is what we
 * pass to DELETE when revoking.
 */
export interface RolePermissionRow {
  id: string;
  userRoleId: string;
  permission: { id: number; name: string } | null;
}

/**
 * Manages the per-role permission grants by talking to the existing
 * `/api/UserRolePermission` controller. Permissions belong to roles, not
 * directly to users — granting GET_USER to a role unlocks that for every
 * user assigned to it. Callers (e.g. the user-edit dialog) are responsible
 * for surfacing this in the UI.
 */
@Injectable({ providedIn: 'root' })
export class RolePermissionService extends BaseApiService {
  private readonly endpoint = 'api/UserRolePermission';

  constructor(http: HttpClient) {
    super(http);
  }

  /** Returns every UserRolePermission row attached to the given role. */
  listForRole(userRoleId: string): Observable<RolePermissionRow[]> {
    return this.getList<BaseResponseModel<RolePermissionRow[]>>(
      `${this.endpoint}/list`,
      { pageIndex: 0, pageSize: 200, filters: { UserRoleId: userRoleId } }
    ).pipe(map(response => response.data ?? []));
  }

  /** Grants one permission to a role. Returns the freshly-inserted row. */
  grant(userRoleId: string, permission: PermissionName): Observable<RolePermissionRow | null> {
    const fd = new FormData();
    fd.append('UserRoleId', userRoleId);
    // ASP.NET Core's enum binder accepts both the int value and the name —
    // we send the name so the wire format matches what /me/permissions returns.
    fd.append('Permission', permission);
    return this.post<BaseResponseModel<RolePermissionRow>>(this.endpoint, fd)
      .pipe(map(response => response.data ?? null));
  }

  /** Revokes a row by its UserRolePermission row id (NOT the permission id). */
  revoke(rowId: string): Observable<boolean> {
    return this.delete<BaseResponseModel<boolean>>(this.endpoint, { id: rowId })
      .pipe(map(response => response?.success ?? false));
  }
}
