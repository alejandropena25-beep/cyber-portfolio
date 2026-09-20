import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../data/api.config';
import type { AdminProfile, AdminProject, AdminProjectInput } from './admin.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly options = { withCredentials: true } as const;
  projects() {
    return this.http.get<AdminProject[]>(`${this.baseUrl}/admin/projects`, this.options);
  }
  project(id: number) {
    return this.http.get<AdminProject>(`${this.baseUrl}/admin/projects/${id}`, this.options);
  }
  createProject(project: AdminProjectInput) {
    return this.http.post<AdminProject>(`${this.baseUrl}/admin/projects`, project, this.options);
  }
  updateProject(id: number, project: AdminProjectInput) {
    return this.http.patch<AdminProject>(
      `${this.baseUrl}/admin/projects/${id}`,
      project,
      this.options,
    );
  }
  profile() {
    return this.http.get<AdminProfile>(`${this.baseUrl}/admin/profile`, this.options);
  }
  updateProfile(profile: AdminProfile) {
    return this.http.put<AdminProfile>(`${this.baseUrl}/admin/profile`, profile, this.options);
  }
}
