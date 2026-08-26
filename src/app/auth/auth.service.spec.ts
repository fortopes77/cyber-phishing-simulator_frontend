import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService, normalizeUser } from './auth.service';
import { environment } from 'src/environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST credentials to the login endpoint', () => {
    service.login('user@example.com', 'password').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      credential: 'user@example.com',
      password: 'password',
    });
    req.flush({ user: { id: '1' }, token: 'abc' });
  });

  it('should POST the given token to the refresh endpoint', () => {
    service.refreshToken('stale-token').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'stale-token' });
    req.flush({ token: 'fresh-token' });
  });

  it('should send a null token to refresh when none is supplied', () => {
    service.refreshToken(undefined).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/refresh`);
    expect(req.request.body).toEqual({ token: null });
    req.flush({ token: 'fresh-token' });
  });
});

describe('normalizeUser', () => {
  it('should lowercase an all-caps role from the API', () => {
    const user = normalizeUser({
      id: '1',
      username: 'jane',
      email: 'jane@example.com',
      role: 'TRAINER',
    });

    expect(user.role).toBe('trainer');
  });

  it('should leave an already-lowercase role unchanged', () => {
    const user = normalizeUser({
      id: '1',
      username: 'jane',
      email: 'jane@example.com',
      role: 'user',
    });

    expect(user.role).toBe('user');
  });

  it('should handle mixed-case roles', () => {
    expect(normalizeUser({ role: 'Trainer' }).role).toBe('trainer');
  });

  it('should not blow up when role is missing', () => {
    expect(normalizeUser({ id: '1' }).role).toBe('');
  });
});
