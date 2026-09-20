import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../environments/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    if (isPlatformServer(inject(PLATFORM_ID))) return environment.serverApiBaseUrl;
    const runtimeConfig = (
      globalThis as typeof globalThis & {
        __CYBER_PORTFOLIO_CONFIG__?: { apiBaseUrl?: string };
      }
    ).__CYBER_PORTFOLIO_CONFIG__;
    return runtimeConfig?.apiBaseUrl ?? environment.apiBaseUrl;
  },
});
