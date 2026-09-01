import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { UsersActions } from './users.actions';
import { UsersService } from './users.service';
import { UserAccount } from './user-account.model';

@Injectable()
export class UsersEffects {
  constructor(
    private actions$: Actions,
    private usersService: UsersService,
  ) {}

  fetchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.fetchList),
      mergeMap(() =>
        this.usersService.getUsers().pipe(
          map((response: UserAccount[] | { users: UserAccount[] }) =>
            UsersActions.fetchListSuccess({
              users: Array.isArray(response) ? response : response.users,
            }),
          ),
          catchError((error) =>
            of(
              UsersActions.fetchListFailure({
                error: error.message || 'Failed to fetch users',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  fetchUserDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.fetchUserDetails),
      mergeMap((action) =>
        this.usersService.getUserDetails(action.userId).pipe(
          map((user: UserAccount) =>
            UsersActions.fetchUserDetailsSuccess({ user }),
          ),
          catchError((error) =>
            of(
              UsersActions.fetchUserDetailsFailure({
                error: error.message || 'Failed to fetch user details',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.createUser),
      mergeMap((action) =>
        this.usersService.createUser(action.user).pipe(
          map((user: UserAccount) => UsersActions.createUserSuccess({ user })),
          catchError((error) =>
            of(
              UsersActions.createUserFailure({
                error: error.message || 'Failed to create user',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateUser),
      mergeMap((action) =>
        this.usersService.updateUser(action.userId, action.updatedUser).pipe(
          map((user: UserAccount) => UsersActions.updateUserSuccess({ user })),
          catchError((error) =>
            of(
              UsersActions.updateUserFailure({
                error: error.message || 'Failed to update user',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.deleteUser),
      mergeMap((action) =>
        this.usersService.deleteUser(action.userId).pipe(
          map(() => UsersActions.deleteUserSuccess({ userId: action.userId })),
          catchError((error) =>
            of(
              UsersActions.deleteUserFailure({
                error: error.message || 'Failed to delete user',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  resetUserPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.resetUserPassword),
      mergeMap((action) =>
        this.usersService.resetPassword(action.userId, action.newPassword).pipe(
          map(() =>
            UsersActions.resetUserPasswordSuccess({ userId: action.userId }),
          ),
          catchError((error) =>
            of(
              UsersActions.resetUserPasswordFailure({
                error: error.message || 'Failed to reset password',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  sendReminderEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.sendReminderEmail),
      mergeMap((action) =>
        this.usersService.sendReminderEmail(action.userId).pipe(
          map(() =>
            UsersActions.sendReminderEmailSuccess({ userId: action.userId }),
          ),
          catchError((error) =>
            of(
              UsersActions.sendReminderEmailFailure({
                error: error.message || 'Failed to send reminder email',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
