import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../environments/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () =>
    isPlatformServer(inject(PLATFORM_ID)) ? environment.serverApiBaseUrl : environment.apiBaseUrl,
});
