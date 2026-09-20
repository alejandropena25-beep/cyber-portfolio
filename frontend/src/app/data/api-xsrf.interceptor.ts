import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { API_BASE_URL } from './api.config';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const apiXsrfInterceptor: HttpInterceptorFn = (request, next) => {
  if (safeMethods.has(request.method) || !isPlatformBrowser(inject(PLATFORM_ID))) {
    return next(request);
  }

  const apiBaseUrl = inject(API_BASE_URL).replace(/\/$/, '');
  if (request.url !== apiBaseUrl && !request.url.startsWith(`${apiBaseUrl}/`)) {
    return next(request);
  }

  const token = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('XSRF-TOKEN='))
    ?.slice('XSRF-TOKEN='.length);

  return next(
    token && !request.headers.has('X-XSRF-TOKEN')
      ? request.clone({ setHeaders: { 'X-XSRF-TOKEN': decodeURIComponent(token) } })
      : request,
  );
};
