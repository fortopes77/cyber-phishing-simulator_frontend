import { createActionGroup, props } from '@ngrx/store';
import { CreateUserPayload, UpdateUserPayload, UserAccount } from './user-account.model';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    // GET /users/learners is scoped to the trainer's own organisation; for a
    // global admin organisationId filters to one organisation, and null
    // lists learners across every organisation (see selectOrganisationScope).
    fetchList: props<{ organisationId: number | null }>(),
    fetchListSuccess: props<{ users: UserAccount[] }>(),
    fetchListFailure: props<{ error: string }>(),
    // Trainer-management screen's list of this org's trainers - kept in a
    // separate state slice from fetchList's learner list (see
    // UsersState.trainerList) so visiting either the Learners or Trainers
    // screen doesn't clobber the other's already-loaded data.
    fetchTrainerList: props<{ organisationId: number | null }>(),
    fetchTrainerListSuccess: props<{ users: UserAccount[] }>(),
    fetchTrainerListFailure: props<{ error: string }>(),
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
    // Trainer-initiated reset of another user's password
    // (LearnerListComponent's "Reset Password" row action). Doesn't mutate
    // anything in UsersState - loading/error is tracked locally in the
    // component that dispatched it via an Actions$ subscription, so
    // users.reducer has no cases for this.
    resetUserPassword: props<{ userId: string; newPassword: string }>(),
    resetUserPasswordSuccess: props<{ userId: string }>(),
    resetUserPasswordFailure: props<{ error: string }>(),
  },
});
