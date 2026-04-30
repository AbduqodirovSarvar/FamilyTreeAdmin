import { BaseAudiTableEntityModel } from '../../../core/models/base-response-models/base-audi-table-entity.model';

export interface RoleModel extends BaseAudiTableEntityModel {
  name?: string | null;
  description?: string | null;
  designedName?: string | null;
  familyId?: string | null;
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  designedName?: string | null;
  familyId?: string | null;
}

export interface UpdateRoleRequest {
  id: string;
  name?: string | null;
  description?: string | null;
  designedName?: string | null;
  familyId?: string | null;
}
