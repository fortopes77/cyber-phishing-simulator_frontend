import { authReducer, initialAuthState } from './auth.reducer';
import { AuthActions } from './auth.actions';

describe('authReducer', () => {
  it('should return the initial state', () => {
    const state = authReducer(undefined, { type: '@@init' } as any);
    expect(state).toEqual(initialAuthState);
  });

  it('should set loading true on login', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.login({ credential: 'user', password: 'pass' }),
    );
    expect(state.loading).toBeTrue();
  });

  it('should store the user, token, and a decoded expiry on loginSuccess', () => {
    const expSeconds = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256' }));
    const payload = btoa(JSON.stringify({ exp: expSeconds }));
    const token = `${header}.${payload}.sig`;

    const state = authReducer(
      initialAuthState,
      AuthActions.loginSuccess({ user: { id: '1' } as any, token }),
    );

    expect(state.isAuthenticated).toBeTrue();
    expect(state.token).toBe(token);
    expect(state.tokenExpiresAt).toBe(expSeconds * 1000);
    expect(state.loading).toBeFalse();
  });

  it('should restore the session on sessionRestored, same as loginSuccess', () => {
    const expSeconds = Math.floor(Date.now() / 1000) + 3600;
    const header = btoa(JSON.stringify({ alg: 'HS256' }));
    const payload = btoa(JSON.stringify({ exp: expSeconds }));
    const token = `${header}.${payload}.sig`;

    const state = authReducer(
      initialAuthState,
      AuthActions.sessionRestored({ user: { id: '1' } as any, token }),
    );

    expect(state.isAuthenticated).toBeTrue();
    expect(state.token).toBe(token);
    expect(state.tokenExpiresAt).toBe(expSeconds * 1000);
    expect(state.loading).toBeFalse();
  });

  it('should store the error on loginFailure', () => {
    const state = authReducer(
      { ...initialAuthState, loading: true },
      AuthActions.loginFailure({ error: 'Invalid credentials' }),
    );
    expect(state.error).toBe('Invalid credentials');
    expect(state.loading).toBeFalse();
  });

  it('should clear the session on logoutSuccess', () => {
    const state = authReducer(
      {
        user: { id: '1' } as any,
        token: 'abc',
        tokenExpiresAt: Date.now() + 1000,
        loading: false,
        isAuthenticated: true,
      },
      AuthActions.logoutSuccess(),
    );

    expect(state.user).toBeUndefined();
    expect(state.token).toBeUndefined();
    expect(state.tokenExpiresAt).toBeUndefined();
    expect(state.isAuthenticated).toBeFalse();
  });

  it('should update the token and expiry on refreshTokenSuccess', () => {
    const startState = {
      user: { id: '1' } as any,
      token: 'stale',
      tokenExpiresAt: 1,
      loading: false,
      isAuthenticated: true,
    };

    const state = authReducer(
      startState,
      AuthActions.refreshTokenSuccess({ token: 'fresh' }),
    );

    expect(state.token).toBe('fresh');
    expect(state.isAuthenticated).toBeTrue();
    expect(state.tokenExpiresAt).toBeGreaterThan(1);
  });

  it('should clear the session on refreshTokenFailure', () => {
    const startState = {
      user: { id: '1' } as any,
      token: 'stale',
      tokenExpiresAt: 1,
      loading: false,
      isAuthenticated: true,
    };

    const state = authReducer(
      startState,
      AuthActions.refreshTokenFailure({ error: 'Session expired' }),
    );

    expect(state.user).toBeUndefined();
    expect(state.token).toBeUndefined();
    expect(state.isAuthenticated).toBeFalse();
  });
});
