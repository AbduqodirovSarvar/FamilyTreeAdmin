export interface BaseResponseModel<TModel> {
  success: boolean;
  statusCode?: number;
  message?: string;
  errors?: string[];
  data?: TModel;
  pageIndex?: number | null;
  pageSize?: number | null;
  totalCount?: number | null;
  isPaginated?: boolean;
}
