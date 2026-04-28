import { BaseAudiTableEntityModel } from '../../../core/models/base-response-models/base-audi-table-entity.model';

export interface UploadedFileShortModel {
  id?: string;
  name?: string;
  url?: string;
}

export interface FamilyModel extends BaseAudiTableEntityModel {
  name: string;
  familyName: string;
  description?: string | null;
  imageId?: string | null;
  image?: UploadedFileShortModel | null;
  ownerId?: string | null;
}

export interface CreateFamilyRequest {
  name: string;
  familyName: string;
  description?: string | null;
  image?: File | null;
}

export interface UpdateFamilyRequest {
  id: string;
  name?: string | null;
  familyName?: string | null;
  description?: string | null;
  ownerId?: string | null;
  image?: File | null;
}
