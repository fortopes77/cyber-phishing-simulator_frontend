import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ReportsState } from './reports.reducer';

export const selectReportsState = createFeatureSelector<ReportsState>('reports');

export const selectReportOverview = createSelector(
  selectReportsState,
  (state) => state.overview,
);
export const selectModuleReportRows = createSelector(
  selectReportsState,
  (state) => state.modules,
);
export const selectLearnerReportRows = createSelector(
  selectReportsState,
  (state) => state.learners,
);
export const selectModuleReportDetail = createSelector(
  selectReportsState,
  (state) => state.moduleDetail,
);
export const selectLearnerReportDetail = createSelector(
  selectReportsState,
  (state) => state.learnerDetail,
);
export const selectReportsLoading = createSelector(
  selectReportsState,
  (state) => state.loading,
);
export const selectLearnerReportsLoading = createSelector(
  selectReportsState,
  (state) => state.learnersLoading,
);
export const selectReportsError = createSelector(
  selectReportsState,
  (state) => state.error,
);
