import { rehydrateSessionOnBootstrap } from './session-bootstrap';
import { AuthActions } from './+state/auth.actions';
import { saveSession, clearSession } from './session-storage.util';
import { User } from './auth.service';

describe('rehydrateSessionOnBootstrap', () => {
  const user: User = {
    id: '1',
    username: 'jane',
    email: 'jane@example.com',
    role: 'trainer',
  };

  afterEach(() => {
    clearSession();
  });

  it('should dispatch sessionRestored when a persisted session exists', () => {
    saveSession(user, 'abc123');
    const dispatch = jasmine.createSpy('dispatch');
    const storeStub = { dispatch } as any;

    rehydrateSessionOnBootstrap(storeStub)();

    expect(dispatch).toHaveBeenCalledWith(
      AuthActions.sessionRestored({ user, token: 'abc123' }),
    );
  });

  it('should not dispatch anything when there is no persisted session', () => {
    const dispatch = jasmine.createSpy('dispatch');
    const storeStub = { dispatch } as any;

    rehydrateSessionOnBootstrap(storeStub)();

    expect(dispatch).not.toHaveBeenCalled();
  });
});
