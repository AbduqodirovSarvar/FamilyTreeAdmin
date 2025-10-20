export interface BaseResponseModel<TModel> {
  accessToken(accessToken: any): unknown;
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
