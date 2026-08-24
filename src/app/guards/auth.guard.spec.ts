import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { AuthGuard } from './auth.guard';
import { selectAuthState } from '../auth/+state/auth.selectors';
import { AuthActions } from '../auth/+state/auth.actions';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let store: MockStore;
  let router: Router;

  const buildRoute = (data: Record<string, unknown> = {}) =>
    ({ data } as unknown as ActivatedRouteSnapshot);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [{ selector: selectAuthState, value: {} }],
        }),
      ],
    });

    guard = TestBed.inject(AuthGuard);
    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should redirect to login when not authenticated', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: false,
      loading: false,
    });
    store.refreshState();

    guard.canActivate(buildRoute(), {} as any).subscribe((result) => {
      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should redirect to the learner dashboard when the role does not match', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'abc',
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: 'user' },
    });
    store.refreshState();

    guard
      .canActivate(buildRoute({ role: 'trainer' }), {} as any)
      .subscribe((result) => {
        expect(result).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/learner/dashboard']);
        done();
      });
  });

  it('should allow access when authenticated and the role matches', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'abc',
      tokenExpiresAt: Date.now() + 60000,
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: 'trainer' },
    });
    store.refreshState();

    guard
      .canActivate(buildRoute({ role: 'trainer' }), {} as any)
      .subscribe((result) => {
        expect(result).toBeTrue();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
  });

  it('should dispatch a token refresh when the rehydrated token is expired, but still allow the navigation', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'abc',
      tokenExpiresAt: Date.now() - 1000,
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: 'user' },
    });
    store.refreshState();

    guard.canActivate(buildRoute(), {} as any).subscribe((result) => {
      expect(result).toBeTrue();
      expect(store.dispatch).toHaveBeenCalledWith(AuthActions.refreshToken());
      done();
    });
  });

  it('should not dispatch a refresh when the token is still valid', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'abc',
      tokenExpiresAt: Date.now() + 60000,
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: 'user' },
    });
    store.refreshState();

    guard.canActivate(buildRoute(), {} as any).subscribe((result) => {
      expect(result).toBeTrue();
      expect(store.dispatch).not.toHaveBeenCalled();
      done();
    });
  });
});
