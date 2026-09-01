import { createReducer, on } from '@ngrx/store';
import { DashboardActions } from './dashboard.actions';
import { TrainerDashboardStats } from './dashboard.model';

export interface DashboardState {
  stats: TrainerDashboardStats | null;
  loading: boolean;
  error: string | null;
}

export const initialDashboardState: DashboardState = {
  stats: null,
  loading: false,
  error: null,
};

export const dashboardReducer = createReducer(
  initialDashboardState,
  on(DashboardActions.fetchTrainerDashboard, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(DashboardActions.fetchTrainerDashboardSuccess, (state, { stats }) => ({
    ...state,
    stats,
    loading: false,
  })),
  on(DashboardActions.fetchTrainerDashboardFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
