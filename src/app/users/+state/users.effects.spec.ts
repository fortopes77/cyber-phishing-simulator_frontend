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

  const users: UserAccount[] = [
    { id: 'u_1', fullName: 'Ava Morales', email: 'ava.morales@example.com', role: 'user' },
  ];
  const user = users[0];

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

  it('should dispatch fetchListSuccess with a flat response', (done) => {
    usersService.getUsers.and.returnValue(of(users));
    actions$ = of(UsersActions.fetchList());

    effects.fetchUsers$.subscribe((action) => {
      expect(action).toEqual(UsersActions.fetchListSuccess({ users }));
      done();
    });
  });

  it('should dispatch fetchListSuccess with a wrapped response', (done) => {
    usersService.getUsers.and.returnValue(of({ users }));
    actions$ = of(UsersActions.fetchList());

    effects.fetchUsers$.subscribe((action) => {
      expect(action).toEqual(UsersActions.fetchListSuccess({ users }));
      done();
    });
  });

  it('should dispatch fetchListFailure on error', (done) => {
    usersService.getUsers.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(UsersActions.fetchList());

    effects.fetchUsers$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.fetchListFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch fetchUserDetailsSuccess on fetch', (done) => {
    usersService.getUserDetails.and.returnValue(of(user));
    actions$ = of(UsersActions.fetchUserDetails({ userId: 'u_1' }));

    effects.fetchUserDetails$.subscribe((action) => {
      expect(usersService.getUserDetails).toHaveBeenCalledWith('u_1');
      expect(action).toEqual(UsersActions.fetchUserDetailsSuccess({ user }));
      done();
    });
  });

  it('should dispatch fetchUserDetailsFailure on error', (done) => {
    usersService.getUserDetails.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(UsersActions.fetchUserDetails({ userId: 'u_1' }));

    effects.fetchUserDetails$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.fetchUserDetailsFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch createUserSuccess on create', (done) => {
    usersService.createUser.and.returnValue(of(user));
    actions$ = of(UsersActions.createUser({ user }));

    effects.createUser$.subscribe((action) => {
      expect(usersService.createUser).toHaveBeenCalledWith(user);
      expect(action).toEqual(UsersActions.createUserSuccess({ user }));
      done();
    });
  });

  it('should dispatch createUserFailure on error', (done) => {
    usersService.createUser.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(UsersActions.createUser({ user }));

    effects.createUser$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.createUserFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch updateUserSuccess on update', (done) => {
    usersService.updateUser.and.returnValue(of(user));
    actions$ = of(UsersActions.updateUser({ userId: 'u_1', updatedUser: user }));

    effects.updateUser$.subscribe((action) => {
      expect(usersService.updateUser).toHaveBeenCalledWith('u_1', user);
      expect(action).toEqual(UsersActions.updateUserSuccess({ user }));
      done();
    });
  });

  it('should dispatch updateUserFailure on error', (done) => {
    usersService.updateUser.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(UsersActions.updateUser({ userId: 'u_1', updatedUser: user }));

    effects.updateUser$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.updateUserFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch deleteUserSuccess on delete', (done) => {
    usersService.deleteUser.and.returnValue(of({}));
    actions$ = of(UsersActions.deleteUser({ userId: 'u_1' }));

    effects.deleteUser$.subscribe((action) => {
      expect(usersService.deleteUser).toHaveBeenCalledWith('u_1');
      expect(action).toEqual(UsersActions.deleteUserSuccess({ userId: 'u_1' }));
      done();
    });
  });

  it('should dispatch deleteUserFailure on error', (done) => {
    usersService.deleteUser.and.returnValue(
      throwError(() => new Error('Network error')),
    );
    actions$ = of(UsersActions.deleteUser({ userId: 'u_1' }));

    effects.deleteUser$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.deleteUserFailure({ error: 'Network error' }),
      );
      done();
    });
  });

  it('should dispatch resetUserPasswordSuccess on reset', (done) => {
    usersService.resetPassword.and.returnValue(of(undefined));
    actions$ = of(
      UsersActions.resetUserPassword({ userId: 'u_1', newPassword: 'newpassword1' }),
    );

    effects.resetUserPassword$.subscribe((action) => {
      expect(usersService.resetPassword).toHaveBeenCalledWith('u_1', 'newpassword1');
      expect(action).toEqual(UsersActions.resetUserPasswordSuccess({ userId: 'u_1' }));
      done();
    });
  });

  it('should dispatch resetUserPasswordFailure on error', (done) => {
    usersService.resetPassword.and.returnValue(
      throwError(() => new Error('Failed to reset password')),
    );
    actions$ = of(
      UsersActions.resetUserPassword({ userId: 'u_1', newPassword: 'newpassword1' }),
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
    actions$ = of(UsersActions.sendReminderEmail({ userId: 'u_1' }));

    effects.sendReminderEmail$.subscribe((action) => {
      expect(usersService.sendReminderEmail).toHaveBeenCalledWith('u_1');
      expect(action).toEqual(UsersActions.sendReminderEmailSuccess({ userId: 'u_1' }));
      done();
    });
  });

  it('should dispatch sendReminderEmailFailure on error', (done) => {
    usersService.sendReminderEmail.and.returnValue(
      throwError(() => new Error('Failed to send reminder email')),
    );
    actions$ = of(UsersActions.sendReminderEmail({ userId: 'u_1' }));

    effects.sendReminderEmail$.subscribe((action) => {
      expect(action).toEqual(
        UsersActions.sendReminderEmailFailure({ error: 'Failed to send reminder email' }),
      );
      done();
    });
  });
});
