import { createActionGroup, props } from '@ngrx/store';
import { CreateUserPayload, UpdateUserPayload, UserAccount } from './user-account.model';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    // organisationId is required - GET /users/learners is scoped to one
    // organisation and has no "list everyone" mode.
    fetchList: props<{ organisationId: number }>(),
    fetchListSuccess: props<{ users: UserAccount[] }>(),
    fetchListFailure: props<{ error: string }>(),
    fetchUserDetails: props<{ userId: string }>(),
    fetchUserDetailsSuccess: props<{ user: UserAccount }>(),
    fetchUserDetailsFailure: props<{ error: string }>(),
    createUser: props<{ user: CreateUserPayload }>(),
    createUserSuccess: props<{ user: UserAccount }>(),
    createUserFailure: props<{ error: string }>(),
    updateUser: props<{ userId: string; updatedUser: UpdateUserPayload }>(),
    updateUserSuccess: props<{ user: UserAccount }>(),
    updateUserFailure: props<{ error: string }>(),
    deleteUser: props<{ userId: string }>(),
    deleteUserSuccess: props<{ userId: string }>(),
    deleteUserFailure: props<{ error: string }>(),
    // Trainer-initiated reset of another user's password (LearnerListComponent's
    // "Reset Password" row action) and the "send reminder email" action on
    // UserEditComponent. Neither mutates anything in UsersState - both are
    // tracked locally (loading/error) in the component that dispatched them
    // via an Actions$ subscription, so users.reducer has no cases for these.
    resetUserPassword: props<{ userId: string; newPassword: string }>(),
    resetUserPasswordSuccess: props<{ userId: string }>(),
    resetUserPasswordFailure: props<{ error: string }>(),
    sendReminderEmail: props<{ userId: string }>(),
    sendReminderEmailSuccess: props<{ userId: string }>(),
    sendReminderEmailFailure: props<{ error: string }>(),
  },
});
