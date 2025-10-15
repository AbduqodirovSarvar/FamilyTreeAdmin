import {BaseEntityModel} from './base-entity.model';

export interface BaseAudiTableEntityModel extends BaseEntityModel {
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}
