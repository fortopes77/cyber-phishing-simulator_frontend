import { createReducer, on } from '@ngrx/store';
import { UsersActions } from './users.actions';
import { UserAccount } from './user-account.model';

export interface UsersState {
  userList: UserAccount[];
  user: UserAccount | null;
  loading: boolean;
  error: string | null;
}

export const initialUsersState: UsersState = {
  userList: [],
  user: null,
  loading: false,
  error: null,
};

export const usersReducer = createReducer(
  initialUsersState,
  on(UsersActions.fetchList, (state) => ({
    ...state,
    loading: true,
  })),
  on(UsersActions.fetchListSuccess, (state, { users }) => ({
    ...state,
    userList: users,
    loading: false,
  })),
  on(UsersActions.fetchListFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UsersActions.fetchUserDetails, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(UsersActions.fetchUserDetailsSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
  })),
  on(UsersActions.fetchUserDetailsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UsersActions.createUser, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(UsersActions.createUserSuccess, (state, { user }) => ({
    ...state,
    user,
    userList: [...state.userList, user],
    loading: false,
  })),
  on(UsersActions.createUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UsersActions.updateUser, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(UsersActions.updateUserSuccess, (state, { user }) => ({
    ...state,
    user,
    userList: state.userList.map((existing) =>
      existing.id === user.id ? user : existing,
    ),
    loading: false,
  })),
  on(UsersActions.updateUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UsersActions.deleteUser, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(UsersActions.deleteUserSuccess, (state, { userId }) => ({
    ...state,
    userList: state.userList.filter((existing) => existing.id !== userId),
    loading: false,
  })),
  on(UsersActions.deleteUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
