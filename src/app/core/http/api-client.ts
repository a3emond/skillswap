import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Observable, catchError, throwError } from 'rxjs'

import { API_BASE_URL } from '../config/api.config'
import { normalizeError } from './error.util'

@Injectable({ providedIn: 'root' })
export class ApiClient {
  constructor(private readonly http: HttpClient) {}

  get<T>(path: string): Observable<T> {
    return this.http
      .get<T>(`${API_BASE_URL}${path}`)
      .pipe(catchError(this.handleError))
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${API_BASE_URL}${path}`, body)
      .pipe(catchError(this.handleError))
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<T>(`${API_BASE_URL}${path}`, body)
      .pipe(catchError(this.handleError))
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<T>(`${API_BASE_URL}${path}`)
      .pipe(catchError(this.handleError))
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => normalizeError(error))
  }
}