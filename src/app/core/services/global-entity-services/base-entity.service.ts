import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { BaseApiService } from "../base-api.service";
import { BaseGetListQueryModel } from "../../models/base-query-models/base-get-list-query.model";

@Injectable({ providedIn: 'root' })
export abstract class BaseEntityService<T> extends BaseApiService {

     /**
     * Har bir child service bu endpoint'ni override qilishi shart!
     */
    protected abstract endpoint: string;

    /**
     * GET ALL (with pagination, filters, sorting)
     */
    public getAll(query?: BaseGetListQueryModel): Observable<T[]> {
        return this.getList<T[]>(this.endpoint, query);
    }

    /**
     * GET BY ID
     */
    public getById(id: string): Observable<T | null> {
        const params = new HttpParams().set('id', id);
        return this.get<T>(`${this.endpoint}`, params);
    }

    /**
     * CREATE ENTITY
     */
    public create(entity: Partial<T>): Observable<T> {
        return this.post<T>(`${this.baseUrl}/${this.endpoint}`, entity);
    }

    /**
     * UPDATE ENTITY
     */
    public update(entity: Partial<T>): Observable<T> {
        return this.put<T>(`${this.baseUrl}/${this.endpoint}`, entity);
    }

    /**
     * DELETE ENTITY
     */
    public deleteById(id: string): Observable<T> {
        return this.delete<T>(`${this.baseUrl}/${this.endpoint}`, { id });
    }
}
