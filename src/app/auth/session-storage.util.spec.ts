import { clearSession, loadSession, saveSession } from './session-storage.util';
import { User } from './auth.service';

describe('session-storage.util', () => {
  const user: User = {
    id: '1',
    username: 'jane',
    email: 'jane@example.com',
    role: 'trainer',
  };

  afterEach(() => {
    localStorage.removeItem('auth_session');
  });

  it('should return null when nothing is stored', () => {
    expect(loadSession()).toBeNull();
  });

  it('should round-trip a saved session', () => {
    saveSession(user, 'abc123');

    expect(loadSession()).toEqual({ user, token: 'abc123' });
  });

  it('should store only user and token, nothing else', () => {
    saveSession(user, 'abc123');

    const raw = JSON.parse(localStorage.getItem('auth_session') as string);
    expect(Object.keys(raw).sort()).toEqual(['token', 'user']);
  });

  it('should overwrite a previously saved session', () => {
    saveSession(user, 'abc123');
    saveSession({ ...user, id: '2' }, 'fresh-token');

    expect(loadSession()).toEqual({
      user: { ...user, id: '2' },
      token: 'fresh-token',
    });
  });

  it('should return null for a corrupted value instead of throwing', () => {
    localStorage.setItem('auth_session', 'not json');

    expect(loadSession()).toBeNull();
  });

  it('should return null when the stored value is missing a token', () => {
    localStorage.setItem('auth_session', JSON.stringify({ user }));

    expect(loadSession()).toBeNull();
  });

  it('should remove the stored session on clear', () => {
    saveSession(user, 'abc123');

    clearSession();

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem('auth_session')).toBeNull();
  });
});
