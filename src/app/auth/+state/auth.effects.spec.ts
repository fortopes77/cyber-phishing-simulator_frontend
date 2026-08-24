import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { AuthEffects } from './auth.effects';
import { AuthActions } from './auth.actions';
import { AuthService } from 'src/app/auth/auth.service';

describe('AuthEffects', () => {
  let effects: AuthEffects;
  let actions$: Observable<any>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', [
      'login',
      'logout',
      'refreshToken',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        { provide: AuthService, useValue: spy },
      ],
    });

    effects = TestBed.inject(AuthEffects);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
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

  it('should call authService.logout and dispatch logoutSuccess', (done) => {
    authService.logout.and.returnValue(true);
    actions$ = of(AuthActions.logout());

    effects.logout$.subscribe((action) => {
      expect(authService.logout).toHaveBeenCalled();
      expect(action).toEqual(AuthActions.logoutSuccess());
      done();
    });
  });

  it('should dispatch refreshTokenSuccess on successful refresh', (done) => {
    authService.refreshToken.and.returnValue(of({ token: 'fresh-token' }));
    actions$ = of(AuthActions.refreshToken());

    effects.refreshToken$.subscribe((action) => {
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
    actions$ = of(AuthActions.refreshToken());

    effects.refreshToken$.subscribe((action) => {
      expect(action).toEqual(
        AuthActions.refreshTokenFailure({ error: 'Session expired' }),
      );
      done();
    });
  });
});
