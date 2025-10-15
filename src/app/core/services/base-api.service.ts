import {Injectable} from '@angular/core';
import {BaseUrlService} from './base-url.service';
import {Observable} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BaseGetListQueryModel} from '../models/base-query-models/base-get-list-query.model';

@Injectable({ providedIn: 'root' })
export abstract class BaseApiService extends BaseUrlService {

  /**
   *
   * @param http
   */
  protected constructor(protected http: HttpClient) {
    super();
  }

  protected get<T>(url: string, params?: any): Observable<T> {
    const httpParams = new HttpParams({ fromObject: params || {} });
    return this.http.get<T>(`${this.baseUrl}/${url}`, { params: httpParams });
  }

  protected getList<T>(url: string, query?: BaseGetListQueryModel): Observable<T> {
    const params = new HttpParams({
      fromObject: {
        pageIndex: query?.pageIndex ?? 0,
        pageSize: query?.pageSize ?? 20,
        searchText: query?.searchText ?? '',
        sortBy: query?.sortBy ?? 'CreatedAt',
        sortDirection: query?.sortDirection ?? 'desc',
        ...query?.filters
      }
    });

    return this.http.get<T>(`${this.baseUrl}/${url}`, { params });
  }

  protected post<T>(url: string, payload: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${url}`, payload);
  }

  protected put<T>(url: string, payload: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${url}`, payload);
  }

  protected patch<T>(url: string, payload: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${url}`, payload);
  }

  protected delete<T>(url: string, body?: any): Observable<T> {
    return this.http.request<T>('delete', `${this.baseUrl}/${url}`, {
      body
    });
  }
}
