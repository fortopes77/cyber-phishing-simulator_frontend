import { dashboardReducer, initialDashboardState } from './dashboard.reducer';
import { DashboardActions } from './dashboard.actions';
import { TrainerDashboardStats } from './dashboard.model';

describe('dashboardReducer', () => {
  const stats: TrainerDashboardStats = {
    totalLearners: 52,
    activeModules: 8,
    completionRate: 78,
    averageScore: 81,
    moduleCompletion: [],
    recentActivity: [],
  };

  it('should return the initial state', () => {
    const state = dashboardReducer(undefined, { type: '@@init' } as any);
    expect(state).toEqual(initialDashboardState);
  });

  it('should set loading true and clear any error on fetchTrainerDashboard', () => {
    const state = dashboardReducer(
      { ...initialDashboardState, error: 'Previous failure' },
      DashboardActions.fetchTrainerDashboard(),
    );
    expect(state.loading).toBeTrue();
    expect(state.error).toBeNull();
  });

  it('should store the stats and clear loading on success', () => {
    const state = dashboardReducer(
      { ...initialDashboardState, loading: true },
      DashboardActions.fetchTrainerDashboardSuccess({ stats }),
    );
    expect(state.stats).toEqual(stats);
    expect(state.loading).toBeFalse();
  });

  it('should store the error and clear loading on failure', () => {
    const state = dashboardReducer(
      { ...initialDashboardState, loading: true },
      DashboardActions.fetchTrainerDashboardFailure({ error: 'Failed' }),
    );
    expect(state.error).toBe('Failed');
    expect(state.loading).toBeFalse();
  });
});
