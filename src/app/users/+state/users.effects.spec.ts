import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { UsersEffects } from './users.effects';
import { UsersActions } from './users.actions';
import { UsersService } from './users.service';
import { UserAccount } from './user-account.model';

describe('UsersEffects', () => {
  let effects: UsersEffects;
  let actions$: Observable<any>;
  let usersService: jasmine.SpyObj<UsersService>;

  // Raw shape as returned by the backend - uppercase role, firstName/lastName
  // split, no fullName - normalizeUserAccount() is what turns this into a
  // UserAccount, so the effects are expected to produce the normalized form.
  const rawUser = {
    id: 1,
    username: 'ava.morales',
    email: 'ava.morales@example.com',
    firstName: 'Ava',
    lastName: 'Morales',
    role: 'LEARNER',
    organisationId: 1,
  };

  const normalizedUser: UserAccount = {
    id: '1',
    username: 'ava.morales',
    email: 'ava.morales@example.com',
    firstName: 'Ava',
    lastName: 'Morales',
    fullName: 'Ava Morales',
    role: 'user',
    organisationId: 1,
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('UsersService', [
      'getUsers',
      'getUserDetails',
      'createUser',
      'updateUser',
      'deleteUser',
      'resetPassword',
      'sendReminderEmail',
    ]);

    TestBed.configureTestingModule({
      providers: [
        UsersEffects,
        provideMockActions(() => actions$),
        { provide: UsersService, useValue: spy },
      ],
    });

    effects = TestBed.inject(UsersEffects);
    usersService = TestBed.inject(UsersService) as jasmine.SpyObj<UsersService>;
  });

  it('should fetch with the organisationId and dispatch fetchListSuccess with normalized users, for a flat response', (done) => {
    usersService.getUsers.and.returnValue(of([rawUser]));
    actions$ = of(UsersActions.fetchList({ organisationId: 1 }));

    effects.fetchUsers$.subscribe((action) => {
      expect(usersService.getUsers).toHaveBeenCalledWith(1);
      expect(action).toEqual(
        UsersActions.fetchListSuccess({ users: [normalizedUser] }),
      );
      done();
    });
  });

  it('should dispatch fetchListSuccess with a wrapped response', (done) => {
    usersService.getUsers.and.returnValue(of({ users: [rawUser] }));
    actions$ = of(UsersActions.fetchList({ organisationId: 1 }));

    effects.fetchUsers$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.fetchListSuccess({ users: [normalizedUser] }),
      );
      done();
    });
  });

  it('should dispatch fetchListFailure on error', (done) => {
    usersService.getUsers.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(UsersActions.fetchList({ organisationId: 1 }));

    effects.fetchUsers$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.fetchListFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch fetchUserDetailsSuccess with a normalized user on fetch', (done) => {
    usersService.getUserDetails.and.returnValue(of(rawUser));
    actions$ = of(UsersActions.fetchUserDetails({ userId: '1' }));

    effects.fetchUserDetails$.subscribe((action) => {
      expect(usersService.getUserDetails).toHaveBeenCalledWith('1');
      expect(action).toEqual(
        UsersActions.fetchUserDetailsSuccess({ user: normalizedUser }),
      );
      done();
    });
  });

  it('should dispatch fetchUserDetailsFailure on error', (done) => {
    usersService.getUserDetails.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(UsersActions.fetchUserDetails({ userId: '1' }));

    effects.fetchUserDetails$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.fetchUserDetailsFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch createUserSuccess with a normalized user on create', (done) => {
    const payload = {
      username: 'ava.morales',
      email: 'ava.morales@example.com',
      password: 'Password1!',
      firstName: 'Ava',
      lastName: 'Morales',
      role: 'user' as const,
    };
    usersService.createUser.and.returnValue(of(rawUser));
    actions$ = of(UsersActions.createUser({ user: payload }));

    effects.createUser$.subscribe((action) => {
      expect(usersService.createUser).toHaveBeenCalledWith(payload);
      expect(action).toEqual(
        UsersActions.createUserSuccess({ user: normalizedUser }),
      );
      done();
    });
  });

  it('should dispatch createUserFailure on error', (done) => {
    usersService.createUser.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(
      UsersActions.createUser({
        user: {
          username: 'ava.morales',
          email: 'ava.morales@example.com',
          password: 'Password1!',
          firstName: 'Ava',
          lastName: 'Morales',
          role: 'user',
        },
      }),
    );

    effects.createUser$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.createUserFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch updateUserSuccess with a normalized user on update', (done) => {
    usersService.updateUser.and.returnValue(of(rawUser));
    actions$ = of(
      UsersActions.updateUser({ userId: '1', updatedUser: { firstName: 'Ava' } }),
    );

    effects.updateUser$.subscribe((action) => {
      expect(usersService.updateUser).toHaveBeenCalledWith('1', { firstName: 'Ava' });
      expect(action).toEqual(
        UsersActions.updateUserSuccess({ user: normalizedUser }),
      );
      done();
    });
  });

  it('should dispatch updateUserFailure on error', (done) => {
    usersService.updateUser.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(
      UsersActions.updateUser({ userId: '1', updatedUser: { firstName: 'Ava' } }),
    );

    effects.updateUser$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.updateUserFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch deleteUserSuccess on delete', (done) => {
    usersService.deleteUser.and.returnValue(of({}));
    actions$ = of(UsersActions.deleteUser({ userId: '1' }));

    effects.deleteUser$.subscribe((action) => {
      expect(usersService.deleteUser).toHaveBeenCalledWith('1');
      expect(action).toEqual(UsersActions.deleteUserSuccess({ userId: '1' }));
      done();
    });
  });

  it('should dispatch deleteUserFailure on error', (done) => {
    usersService.deleteUser.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(UsersActions.deleteUser({ userId: '1' }));

    effects.deleteUser$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.deleteUserFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch resetUserPasswordSuccess on reset', (done) => {
    usersService.resetPassword.and.returnValue(of(rawUser));
    actions$ = of(
      UsersActions.resetUserPassword({ userId: '1', newPassword: 'newpassword1' }),
    );

    effects.resetUserPassword$.subscribe((action) => {
      expect(usersService.resetPassword).toHaveBeenCalledWith('1', 'newpassword1');
      expect(action).toEqual(UsersActions.resetUserPasswordSuccess({ userId: '1' }));
      done();
    });
  });

  it('should dispatch resetUserPasswordFailure on error', (done) => {
    usersService.resetPassword.and.returnValue(
      throwError(() => new Error('Failed to reset password')),
    );
    actions$ = of(
      UsersActions.resetUserPassword({ userId: '1', newPassword: 'newpassword1' }),
    );

    effects.resetUserPassword$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.resetUserPasswordFailure({ error: 'Failed to reset password' }),
      );
      done();
    });
  });

  it('should dispatch sendReminderEmailSuccess on send', (done) => {
    usersService.sendReminderEmail.and.returnValue(of(undefined));
    actions$ = of(UsersActions.sendReminderEmail({ userId: '1' }));

    effects.sendReminderEmail$.subscribe((action) => {
      expect(usersService.sendReminderEmail).toHaveBeenCalledWith('1');
      expect(action).toEqual(UsersActions.sendReminderEmailSuccess({ userId: '1' }));
      done();
    });
  });

  it('should dispatch sendReminderEmailFailure on error', (done) => {
    usersService.sendReminderEmail.and.returnValue(
      throwError(() => new Error('Failed to send reminder email')),
    );
    actions$ = of(UsersActions.sendReminderEmail({ userId: '1' }));

    effects.sendReminderEmail$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.sendReminderEmailFailure({ error: 'Failed to send reminder email' }),
      );
      done();
    });
  });
});
