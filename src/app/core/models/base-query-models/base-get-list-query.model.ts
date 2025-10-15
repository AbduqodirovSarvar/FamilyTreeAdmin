export interface BaseGetListQueryModel {
  pageIndex?: number;
  pageSize?: number;
  searchText?: string | null;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string>;
}
