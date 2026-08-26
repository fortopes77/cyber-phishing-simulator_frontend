import { User } from './auth.service';

const SESSION_STORAGE_KEY = 'auth_session';

export interface PersistedSession {
  user: User;
  token: string;
}

/**
 * The only two fields the app persists across a reload - just enough to
 * reconstruct a working session. Everything else in AuthState
 * (tokenExpiresAt, loading, error, isAuthenticated) is transient or
 * derivable from these two and is never written to storage:
 * tokenExpiresAt is recomputed from the token on rehydrate, and an already
 * -expired persisted token is handled by the same
 * AuthGuard-waits-for-refresh flow used for any other expired token, not by
 * anything special here.
 */
export function saveSession(user: User, token: string): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, token }));
}

export function loadSession(): PersistedSession | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.user && typeof parsed?.token === 'string') {
      return parsed as PersistedSession;
    }
  } catch {
    // Corrupted value - treat as no session.
  }

  return null;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
