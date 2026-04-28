import { BaseAudiTableEntityModel } from '../../../core/models/base-response-models/base-audi-table-entity.model';
import { UploadedFileShortModel } from '../../../core/models/base-response-models/uploaded-file.model';
import { Gender } from '../../../core/enums/gender.enum';

export interface MemberShortModel {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface MemberModel extends BaseAudiTableEntityModel {
  firstName?: string | null;
  lastName?: string | null;
  description?: string | null;
  birthDay: string;
  deathDay?: string | null;
  gender: Gender;
  familyId: string;
  imageId?: string | null;
  image?: UploadedFileShortModel | null;
  fatherId?: string | null;
  motherId?: string | null;
  spouseId?: string | null;
  father?: MemberShortModel | null;
  mother?: MemberShortModel | null;
  spouse?: MemberShortModel | null;
}

export interface CreateMemberRequest {
  firstName?: string | null;
  lastName?: string | null;
  description?: string | null;
  birthDay: string;
  deathDay?: string | null;
  gender: Gender;
  familyId: string;
  fatherId?: string | null;
  motherId?: string | null;
  spouseId?: string | null;
  image?: File | null;
}

export interface UpdateMemberRequest {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  description?: string | null;
  birthDay?: string | null;
  deathDay?: string | null;
  gender?: Gender | null;
  familyId?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  spouseId?: string | null;
  image?: File | null;
}
