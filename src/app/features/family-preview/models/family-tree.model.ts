import { Gender } from '../../../core/enums/gender.enum';

export interface TreeMemberModel {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  gender: Gender;
  birthDay: string;
  deathDay?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
}

export interface SpouseGroupModel {
  spouse: TreeMemberModel;
  children: TreeNodeModel[];
}

export interface TreeNodeModel {
  primary: TreeMemberModel;
  spouses: SpouseGroupModel[];
  commonChildren: TreeNodeModel[];
}

export interface FamilyTreeModel {
  familyId: string;
  name?: string | null;
  familyName?: string | null;
  totalMembers: number;
  roots: TreeNodeModel[];
}
