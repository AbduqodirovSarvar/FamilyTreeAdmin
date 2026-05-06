export interface FamilyViewStatsPointModel {
  date: string;
  count: number;
}

export interface FamilyViewStatsModel {
  familyId: string;
  familyName: string;
  from: string;
  to: string;
  total: number;
  points: FamilyViewStatsPointModel[];
}
