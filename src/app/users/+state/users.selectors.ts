import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UsersState } from './users.reducer';

export const selectUsersState = createFeatureSelector<UsersState>('users');
export const selectUserList = createSelector(
  selectUsersState,
  (state) => state.userList,
);
export const selectUser = createSelector(
  selectUsersState,
  (state) => state.user,
);
export const selectUsersLoading = createSelector(
  selectUsersState,
  (state) => state.loading,
);
export const selectUsersError = createSelector(
  selectUsersState,
  (state) => state.error,
);
