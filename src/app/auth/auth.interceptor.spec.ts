import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { AuthActions } from './+state/auth.actions';
import { selectToken } from './+state/auth.selectors';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: MockStore;
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'refreshToken',
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideMockStore({
          selectors: [{ selector: selectToken, value: 'initial-token' }],
        }),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach the current token as an Authorization header', () => {
    http.get('/api/scenarios').subscribe();

    const req = httpMock.expectOne('/api/scenarios');
    expect(req.request.headers.get('Authorization')).toBe(
      'Bearer initial-token',
    );
    req.flush({});
  });

  it('should not attach a header when there is no token', () => {
    store.overrideSelector(selectToken, undefined);
    store.refreshState();

    http.get('/api/scenarios').subscribe();

    const req = httpMock.expectOne('/api/scenarios');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should refresh the token and retry the request on a 401', (done) => {
    authService.refreshToken.and.returnValue(of({ token: 'fresh-token' }));

    http.get('/api/scenarios').subscribe({
      next: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          AuthActions.refreshTokenSuccess({ token: 'fresh-token' }),
        );
        done();
      },
    });

    const firstReq = httpMock.expectOne('/api/scenarios');
    firstReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne('/api/scenarios');
    expect(retryReq.request.headers.get('Authorization')).toBe(
      'Bearer fresh-token',
    );
    retryReq.flush({ ok: true });
  });

  it('should log out and redirect to login when the refresh itself fails', (done) => {
    authService.refreshToken.and.returnValue(
      throwError(() => new Error('refresh failed')),
    );

    http.get('/api/scenarios').subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          AuthActions.refreshTokenFailure({ error: 'Session expired' }),
        );
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });

    const firstReq = httpMock.expectOne('/api/scenarios');
    firstReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should not attempt a refresh for the login endpoint itself', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authService.refreshToken).not.toHaveBeenCalled();
  });
});
