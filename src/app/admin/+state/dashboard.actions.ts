import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { TrainerDashboardStats } from './dashboard.model';

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    fetchTrainerDashboard: emptyProps(),
    fetchTrainerDashboardSuccess: props<{ stats: TrainerDashboardStats }>(),
    fetchTrainerDashboardFailure: props<{ error: string }>(),
  },
});
