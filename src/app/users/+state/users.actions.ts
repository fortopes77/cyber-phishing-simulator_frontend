import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { UserAccount } from './user-account.model';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    fetchList: emptyProps(),
    fetchListSuccess: props<{ users: UserAccount[] }>(),
    fetchListFailure: props<{ error: string }>(),
    fetchUserDetails: props<{ userId: string }>(),
    fetchUserDetailsSuccess: props<{ user: UserAccount }>(),
    fetchUserDetailsFailure: props<{ error: string }>(),
    createUser: props<{ user: Partial<UserAccount> }>(),
    createUserSuccess: props<{ user: UserAccount }>(),
    createUserFailure: props<{ error: string }>(),
    updateUser: props<{ userId: string; updatedUser: Partial<UserAccount> }>(),
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
