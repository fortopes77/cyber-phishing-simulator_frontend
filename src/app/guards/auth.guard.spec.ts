import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Actions } from '@ngrx/effects';
import { Subject } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { selectAuthState } from '../auth/+state/auth.selectors';
import { AuthActions } from '../auth/+state/auth.actions';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let store: MockStore;
  let router: Router;
  let actionsSubject: Subject<any>;

  const buildRoute = (data: Record<string, unknown> = {}) =>
    ({ data } as unknown as ActivatedRouteSnapshot);

  beforeEach(() => {
    actionsSubject = new Subject();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [{ selector: selectAuthState, value: {} }],
        }),
        { provide: Actions, useValue: actionsSubject },
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

  it('should redirect a trainer to the trainer dashboard when the route is learner-only', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'abc',
      tokenExpiresAt: Date.now() + 60000,
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: 'trainer' },
    });
    store.refreshState();

    guard
      .canActivate(buildRoute({ roles: ['user'] }), {} as any)
      .subscribe((result) => {
        expect(result).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/trainer/dashboard']);
        done();
      });
  });

  it('should redirect to login when the role is unrecognised', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'abc',
      tokenExpiresAt: Date.now() + 60000,
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: '' as any },
    });
    store.refreshState();

    guard
      .canActivate(buildRoute({ roles: ['trainer'] }), {} as any)
      .subscribe((result) => {
        expect(result).toBeFalse();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });
  });

  it('should allow access when the user role is in the routes roles list', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'abc',
      tokenExpiresAt: Date.now() + 60000,
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: 'trainer' },
    });
    store.refreshState();

    guard
      .canActivate(buildRoute({ roles: ['user', 'trainer'] }), {} as any)
      .subscribe((result) => {
        expect(result).toBeTrue();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      });
  });

  it('should allow access immediately when authenticated and the token is still valid', (done) => {
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
        expect(store.dispatch).not.toHaveBeenCalled();
        done();
      });
  });

  it('should request a refresh and wait for it before allowing an expired-token navigation through', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'stale-token',
      tokenExpiresAt: Date.now() - 1000,
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: 'user' },
    });
    store.refreshState();

    let resolved = false;
    guard.canActivate(buildRoute(), {} as any).subscribe((result) => {
      resolved = true;
      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });

    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.refreshToken({ token: 'stale-token' }),
    );
    // canActivate must not resolve until the refresh outcome is known.
    expect(resolved).toBeFalse();

    actionsSubject.next(
      AuthActions.refreshTokenSuccess({ token: 'fresh-token' }),
    );
  });

  it('should deny the navigation when the refresh fails, without navigating itself', (done) => {
    store.overrideSelector(selectAuthState, {
      isAuthenticated: true,
      token: 'stale-token',
      tokenExpiresAt: Date.now() - 1000,
      loading: false,
      user: { id: '1', username: 'u', email: 'u@u.com', role: 'user' },
    });
    store.refreshState();

    guard.canActivate(buildRoute(), {} as any).subscribe((result) => {
      expect(result).toBeFalse();
      // Redirecting to /login on a failed refresh is AuthEffects'
      // responsibility (see auth.effects.spec.ts), triggered by the same
      // refreshTokenFailure action dispatched by the refresh effect - the
      // guard itself only reports the canActivate decision.
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });

    actionsSubject.next(
      AuthActions.refreshTokenFailure({ error: 'Session expired' }),
    );
  });
});
