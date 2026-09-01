import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Observable, of, throwError } from 'rxjs';
import { AuthEffects } from './auth.effects';
import { AuthActions } from './auth.actions';
import { selectAuthState } from './auth.selectors';
import { AuthService } from 'src/app/auth/auth.service';
import { loadSession, saveSession } from '../session-storage.util';

describe('AuthEffects', () => {
  let effects: AuthEffects;
  let actions$: Observable<any>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let store: MockStore;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', [
      'login',
      'refreshToken',
      'updateProfile',
      'resetPassword',
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        { provide: AuthService, useValue: spy },
        provideMockStore({
          selectors: [{ selector: selectAuthState, value: {} }],
        }),
      ],
    });

    effects = TestBed.inject(AuthEffects);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    store = TestBed.inject(MockStore);
    spyOn(router, 'navigate');
  });

  it('should dispatch loginSuccess on successful login', (done) => {
    authService.login.and.returnValue(
      of({ user: { id: '1' }, token: 'abc' }),
    );
    actions$ = of(
      AuthActions.login({ credential: 'user', password: 'pass' }),
    );

    effects.login$.subscribe((action) => {
      expect(action).toEqual(
        AuthActions.loginSuccess({ user: { id: '1', role: '' } as any, token: 'abc' }),
      );
      done();
    });
  });

  it('should lowercase an all-caps role from the API on login', (done) => {
    authService.login.and.returnValue(
      of({
        user: { id: '1', username: 'jane', email: 'jane@example.com', role: 'TRAINER' },
        token: 'abc',
      }),
    );
    actions$ = of(
      AuthActions.login({ credential: 'jane', password: 'pass' }),
    );

    effects.login$.subscribe((action: any) => {
      expect(action.user.role).toBe('trainer');
      done();
    });
  });

  it('should dispatch loginFailure on login error', (done) => {
    authService.login.and.returnValue(
      throwError(() => new Error('Invalid credentials')),
    );
    actions$ = of(
      AuthActions.login({ credential: 'user', password: 'wrong' }),
    );

    effects.login$.subscribe((action) => {
      expect(action).toEqual(
        AuthActions.loginFailure({ error: 'Invalid credentials' }),
      );
      done();
    });
  });

  it('should dispatch logoutSuccess on logout', (done) => {
    actions$ = of(AuthActions.logout());

    effects.logout$.subscribe((action) => {
      expect(action).toEqual(AuthActions.logoutSuccess());
      done();
    });
  });

  it('should refresh using the token from the action payload and dispatch refreshTokenSuccess', (done) => {
    authService.refreshToken.and.returnValue(of({ token: 'fresh-token' }));
    actions$ = of(AuthActions.refreshToken({ token: 'stale-token' }));

    effects.refreshToken$.subscribe((action) => {
      expect(authService.refreshToken).toHaveBeenCalledWith('stale-token');
      expect(action).toEqual(
        AuthActions.refreshTokenSuccess({ token: 'fresh-token' }),
      );
      done();
    });
  });

  it('should dispatch refreshTokenFailure on refresh error', (done) => {
    authService.refreshToken.and.returnValue(
      throwError(() => new Error('Session expired')),
    );
    actions$ = of(AuthActions.refreshToken({ token: 'stale-token' }));

    effects.refreshToken$.subscribe((action) => {
      expect(action).toEqual(
        AuthActions.refreshTokenFailure({ error: 'Session expired' }),
      );
      done();
    });
  });

  it('should redirect to login when a refresh fails, regardless of what triggered it', (done) => {
    actions$ = of(
      AuthActions.refreshTokenFailure({ error: 'Session expired' }),
    );

    effects.refreshTokenFailureRedirect$.subscribe(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      done();
    });
  });

  it('should dispatch updateProfileSuccess with a normalized user on successful update', (done) => {
    authService.updateProfile.and.returnValue(
      of({
        user: {
          id: '1',
          firstName: 'Ava',
          lastName: 'Morales',
          username: 'ava',
          email: 'ava@example.com',
          role: 'USER',
        },
      }),
    );
    actions$ = of(
      AuthActions.updateProfile({
        firstName: 'Ava',
        lastName: 'Morales',
        username: 'ava',
        email: 'ava@example.com',
      }),
    );

    effects.updateProfile$.subscribe((action: any) => {
      expect(authService.updateProfile).toHaveBeenCalledWith(
        'Ava',
        'Morales',
        'ava',
        'ava@example.com',
      );
      expect(action.user.role).toBe('user');
      done();
    });
  });

  it('should dispatch updateProfileFailure on update error', (done) => {
    authService.updateProfile.and.returnValue(
      throwError(() => new Error('Email already in use')),
    );
    actions$ = of(
      AuthActions.updateProfile({
        firstName: 'Ava',
        lastName: 'Morales',
        username: 'ava',
        email: 'ava@example.com',
      }),
    );

    effects.updateProfile$.subscribe((action) => {
      expect(action).toEqual(
        AuthActions.updateProfileFailure({ error: 'Email already in use' }),
      );
      done();
    });
  });

  it('should dispatch resetPasswordSuccess on successful reset', (done) => {
    authService.resetPassword.and.returnValue(of({}));
    actions$ = of(
      AuthActions.resetPassword({ currentPassword: 'old', newPassword: 'new' }),
    );

    effects.resetPassword$.subscribe((action) => {
      expect(authService.resetPassword).toHaveBeenCalledWith('old', 'new');
      expect(action).toEqual(AuthActions.resetPasswordSuccess());
      done();
    });
  });

  it('should dispatch resetPasswordFailure on reset error', (done) => {
    authService.resetPassword.and.returnValue(
      throwError(() => new Error('Current password is incorrect')),
    );
    actions$ = of(
      AuthActions.resetPassword({ currentPassword: 'wrong', newPassword: 'new' }),
    );

    effects.resetPassword$.subscribe((action) => {
      expect(action).toEqual(
        AuthActions.resetPasswordFailure({ error: 'Current password is incorrect' }),
      );
      done();
    });
  });

  describe('persistSession$', () => {
    const user = { id: '1', username: 'u', email: 'u@u.com', role: 'trainer' } as any;

    afterEach(() => {
      localStorage.removeItem('auth_session');
    });

    it('should persist the current user and token on loginSuccess', (done) => {
      store.overrideSelector(selectAuthState, {
        user,
        token: 'abc',
        loading: false,
        isAuthenticated: true,
      });
      store.refreshState();
      actions$ = of(AuthActions.loginSuccess({ user, token: 'abc' }));

      effects.persistSession$.subscribe(() => {
        expect(loadSession()).toEqual({ user, token: 'abc' });
        done();
      });
    });

    it('should persist the existing user alongside a fresh token on refreshTokenSuccess', (done) => {
      store.overrideSelector(selectAuthState, {
        user,
        token: 'fresh-token',
        loading: false,
        isAuthenticated: true,
      });
      store.refreshState();
      actions$ = of(AuthActions.refreshTokenSuccess({ token: 'fresh-token' }));

      effects.persistSession$.subscribe(() => {
        expect(loadSession()).toEqual({ user, token: 'fresh-token' });
        done();
      });
    });

    it('should persist the updated user on updateProfileSuccess', (done) => {
      const updatedUser = { ...user, username: 'updated' };
      store.overrideSelector(selectAuthState, {
        user: updatedUser,
        token: 'abc',
        loading: false,
        isAuthenticated: true,
      });
      store.refreshState();
      actions$ = of(AuthActions.updateProfileSuccess({ user: updatedUser }));

      effects.persistSession$.subscribe(() => {
        expect(loadSession()).toEqual({ user: updatedUser, token: 'abc' });
        done();
      });
    });

    it('should not persist anything when the store has no user/token yet', (done) => {
      store.overrideSelector(selectAuthState, {
        loading: false,
        isAuthenticated: false,
      });
      store.refreshState();
      actions$ = of(AuthActions.loginSuccess({ user, token: 'abc' }));

      effects.persistSession$.subscribe(() => {
        expect(loadSession()).toBeNull();
        done();
      });
    });
  });

  describe('clearPersistedSession$', () => {
    const user = { id: '1', username: 'u', email: 'u@u.com', role: 'trainer' } as any;

    afterEach(() => {
      localStorage.removeItem('auth_session');
    });

    it('should clear the persisted session on logoutSuccess', (done) => {
      saveSession(user, 'abc');
      actions$ = of(AuthActions.logoutSuccess());

      effects.clearPersistedSession$.subscribe(() => {
        expect(loadSession()).toBeNull();
        done();
      });
    });

    it('should clear the persisted session on refreshTokenFailure', (done) => {
      saveSession(user, 'abc');
      actions$ = of(
        AuthActions.refreshTokenFailure({ error: 'Session expired' }),
      );

      effects.clearPersistedSession$.subscribe(() => {
        expect(loadSession()).toBeNull();
        done();
      });
    });
  });
});
