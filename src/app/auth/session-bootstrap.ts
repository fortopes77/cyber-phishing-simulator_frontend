import { Store } from '@ngrx/store';
import { AuthActions } from './+state/auth.actions';
import { loadSession } from './session-storage.util';

/**
 * APP_INITIALIZER factory: puts a persisted session into the store before
 * the router's initial navigation runs. Without this, AuthGuard would see
 * an empty store on the very first navigation after a reload and redirect
 * to /login even though a valid session was sitting in storage - the two
 * would be racing otherwise.
 */
export function rehydrateSessionOnBootstrap(store: Store): () => void {
  return () => {
    const session = loadSession();
    if (session) {
      store.dispatch(
        AuthActions.sessionRestored({
          user: session.user,
          token: session.token,
        }),
      );
    }
  };
}
