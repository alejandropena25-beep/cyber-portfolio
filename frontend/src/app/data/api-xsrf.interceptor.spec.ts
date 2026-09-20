import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api.config';
import { apiXsrfInterceptor } from './api-xsrf.interceptor';

describe('apiXsrfInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiXsrfInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000/api' },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    document.cookie = 'XSRF-TOKEN=docker-test-token; path=/';
  });

  afterEach(() => {
    controller.verify();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
  });

  it('adds the CSRF header to an unsafe request for the configured API', () => {
    http.patch('http://localhost:3000/api/admin/profile', {}).subscribe();

    const request = controller.expectOne('http://localhost:3000/api/admin/profile');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('docker-test-token');
    request.flush({});
  });

  it('does not add the CSRF header to safe or unrelated requests', () => {
    http.get('http://localhost:3000/api/profile').subscribe();
    http.post('https://example.invalid/api', {}).subscribe();

    const safeRequest = controller.expectOne('http://localhost:3000/api/profile');
    const unrelatedRequest = controller.expectOne('https://example.invalid/api');
    expect(safeRequest.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    expect(unrelatedRequest.request.headers.has('X-XSRF-TOKEN')).toBe(false);
    safeRequest.flush({});
    unrelatedRequest.flush({});
  });
});
