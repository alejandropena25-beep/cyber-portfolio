import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { Project, ProjectSummary, PublicProfile } from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class PortfolioApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getProjects(): Observable<readonly ProjectSummary[]> {
    return this.http.get<readonly ProjectSummary[]>(`${this.apiBaseUrl}/projects`);
  }

  getProject(slug: string): Observable<Project | null> {
    return this.http.get<Project>(`${this.apiBaseUrl}/projects/${encodeURIComponent(slug)}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }

        return throwError(() => error);
      }),
    );
  }

  getProfile(): Observable<PublicProfile> {
    return this.http.get<PublicProfile>(`${this.apiBaseUrl}/profile`);
  }
}
