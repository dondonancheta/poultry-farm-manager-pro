import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PagedResponse<T> {
  data:         T[];
  total:        number;
  current_page: number;
  per_page:     number;
  last_page:    number;
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  protected http    = inject(HttpClient);
  protected baseUrl = environment.apiUrl || 'http://localhost:8000/api';

  get<T>(path: string, params?: QueryParams): Observable<T> {
    if (!environment.apiUrl?.trim()) return of(null as T);
    return this.http.get<T>(`${this.baseUrl}/${path}`, { params: this.buildParams(params) })
      .pipe(catchError(() => of(null as T)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    if (!environment.apiUrl?.trim()) return of(null as T);
    return this.http.post<T>(`${this.baseUrl}/${path}`, body)
      .pipe(catchError(() => of(null as T)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    if (!environment.apiUrl?.trim()) return of(null as T);
    return this.http.put<T>(`${this.baseUrl}/${path}`, body)
      .pipe(catchError(() => of(null as T)));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    if (!environment.apiUrl?.trim()) return of(null as T);
    return this.http.patch<T>(`${this.baseUrl}/${path}`, body)
      .pipe(catchError(() => of(null as T)));
  }

  delete<T>(path: string): Observable<T> {
    if (!environment.apiUrl?.trim()) return of(null as T);
    return this.http.delete<T>(`${this.baseUrl}/${path}`)
      .pipe(catchError(() => of(null as T)));
  }

  private buildParams(params?: QueryParams): HttpParams {
    let p = new HttpParams();
    if (!params) return p;
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        p = p.set(k, String(v));
      }
    }
    return p;
  }
}
