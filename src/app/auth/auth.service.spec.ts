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
    req.flush({ user: { id: '1' }, token: 'abc', refreshToken: 'refresh-abc' });
  });

  it('should POST the given refresh token to the refresh endpoint', () => {
    service.refreshToken('stale-refresh-token').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'stale-refresh-token' });
    req.flush({ token: 'fresh-token', refreshToken: 'fresh-refresh-token' });
  });

  it('should send a null refresh token to refresh when none is supplied', () => {
    service.refreshToken(undefined).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/refresh`);
    expect(req.request.body).toEqual({ refreshToken: null });
    req.flush({ token: 'fresh-token', refreshToken: 'fresh-refresh-token' });
  });

  it('should PATCH the name and email to the users/{id} endpoint', () => {
    service.updateProfile('1', 'Ava', 'Morales', 'ava@example.com').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      firstName: 'Ava',
      lastName: 'Morales',
      email: 'ava@example.com',
    });
    req.flush({
      id: '1',
      firstName: 'Ava',
      lastName: 'Morales',
      username: 'ava',
      email: 'ava@example.com',
      role: 'LEARNER',
    });
  });

  it('should PATCH just the new password to the users/{id} endpoint', () => {
    service.changePassword('1', 'new-password').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ password: 'new-password' });
    req.flush({
      id: '1',
      firstName: 'Ava',
      lastName: 'Morales',
      username: 'ava',
      email: 'ava@example.com',
      role: 'LEARNER',
    });
  });

  it('should POST the refresh token to the logout endpoint', () => {
    service.logout('stale-refresh-token').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'stale-refresh-token' });
    req.flush({ message: 'Logged out successfully' });
  });

  it('should POST the email to the forgot-password endpoint', () => {
    service.forgotPassword('ava.morales@example.com').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}auth/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ava.morales@example.com' });
    req.flush({ message: 'If an account exists for this email, a reset link has been sent.' });
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

  it('should map the backend LEARNER role to the app\'s "user" literal', () => {
    const user = normalizeUser({
      id: '1',
      username: 'jane',
      email: 'jane@example.com',
      role: 'LEARNER',
    });

    expect(user.role).toBe('user');
  });

  it('should handle mixed-case roles', () => {
    expect(normalizeUser({ role: 'Trainer' }).role).toBe('trainer');
    expect(normalizeUser({ role: 'Learner' }).role).toBe('user');
  });

  it('should not blow up when role is missing', () => {
    expect(normalizeUser({ id: '1' }).role).toBe('');
  });
});
