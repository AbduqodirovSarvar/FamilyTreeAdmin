import { BaseAudiTableEntityModel } from '../../../core/models/base-response-models/base-audi-table-entity.model';
import { UploadedFileShortModel } from '../../../core/models/base-response-models/uploaded-file.model';

export interface UserModel extends BaseAudiTableEntityModel {
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  phone?: string | null;
  email?: string | null;
  familyId?: string | null;
  imageId?: string | null;
  image?: UploadedFileShortModel | null;
  roleId?: string | null;
}

export interface UpdateUserRequest {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  phone?: string | null;
  email?: string | null;
  familyId?: string | null;
  roleId?: string | null;
  image?: File | null;
}
