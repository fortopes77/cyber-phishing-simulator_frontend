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
    localStorage.removeItem('auth');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('auth');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
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

  it('should POST the current token to the refresh endpoint', () => {
    localStorage.setItem('auth', JSON.stringify({ token: 'stale-token' }));

    service.refreshToken().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'stale-token' });
    req.flush({ token: 'fresh-token' });
  });

  it('should send a null token to refresh when nothing is stored', () => {
    service.refreshToken().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/refresh`);
    expect(req.request.body).toEqual({ token: null });
    req.flush({ token: 'fresh-token' });
  });

  it('should report hasRole/isAdmin based on the current user', () => {
    localStorage.setItem(
      'current_user',
      JSON.stringify({ id: '1', username: 'admin', email: 'a@a.com', role: 'trainer' }),
    );
    localStorage.setItem('auth_token', 'some-token');

    const trainerService = TestBed.inject(AuthService);

    expect(trainerService.hasRole('trainer')).toBeTrue();
    expect(trainerService.isAdmin()).toBeTrue();
  });

  it('should clear storage and auth subjects on logout', () => {
    localStorage.setItem('auth_token', 'some-token');
    localStorage.setItem('current_user', JSON.stringify({ id: '1' }));

    const result = service.logout();

    expect(result).toBeTrue();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
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
