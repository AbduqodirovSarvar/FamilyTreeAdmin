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

  public get<T>(url: string, params?: any): Observable<T> {
    const httpParams = new HttpParams({ fromObject: params || {} });
    return this.http.get<T>(`${this.baseUrl}/${url}`, { params: httpParams });
  }

  public getList<T>(url: string, query?: BaseGetListQueryModel): Observable<T> {
    let params = new HttpParams()
      .set('PageIndex', String(query?.pageIndex ?? 0))
      .set('PageSize', String(query?.pageSize ?? 20))
      .set('SortBy', query?.sortBy ?? 'CreatedAt')
      .set('SortDirection', query?.sortDirection ?? 'desc');

    if (query?.searchText) {
      params = params.set('SearchText', query.searchText);
    }

    if (query?.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        if (value === null || value === undefined || value === '') continue;
        params = params.set(`Filters[${key}]`, value);
      }
    }

    return this.http.get<T>(`${this.baseUrl}/${url}`, { params });
  }

  public post<T>(url: string, payload: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${url}`, payload);
  }

  public put<T>(url: string, payload: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${url}`, payload);
  }

  public patch<T>(url: string, payload: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${url}`, payload);
  }

  public delete<T>(url: string, body?: any): Observable<T> {
    return this.http.request<T>('delete', `${this.baseUrl}/${url}`, {
      body
    });
  }
}
