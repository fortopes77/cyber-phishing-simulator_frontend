import { createReducer, on } from '@ngrx/store';
import { ReportsActions } from './reports.actions';
import {
  LearnerReportDetail,
  LearnerReportRow,
  ModuleReportDetail,
  ModuleReportRow,
  ReportOverview,
} from './reports.model';

export interface ReportsState {
  overview: ReportOverview | null;
  modules: ModuleReportRow[];
  learners: LearnerReportRow[];
  moduleDetail: ModuleReportDetail | null;
  learnerDetail: LearnerReportDetail | null;
  loading: boolean;
  learnersLoading: boolean;
  error: string | null;
}

export const initialReportsState: ReportsState = {
  overview: null,
  modules: [],
  learners: [],
  moduleDetail: null,
  learnerDetail: null,
  loading: false,
  learnersLoading: false,
  error: null,
};

export const reportsReducer = createReducer(
  initialReportsState,
  on(ReportsActions.fetchReport, (state) => ({ ...state, loading: true, error: null })),
  on(ReportsActions.fetchReportSuccess, (state, { overview, modules }) => ({
    ...state,
    overview,
    modules,
    loading: false,
  })),
  on(ReportsActions.fetchReportFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ReportsActions.fetchLearners, (state) => ({ ...state, learnersLoading: true })),
  on(ReportsActions.fetchLearnersSuccess, (state, { learners }) => ({
    ...state,
    learners,
    learnersLoading: false,
  })),
  on(ReportsActions.fetchLearnersFailure, (state, { error }) => ({
    ...state,
    learnersLoading: false,
    error,
  })),
  // A detail panel is replaced as soon as another one is asked for, so it
  // never shows the previous module/learner while the next one loads.
  on(ReportsActions.fetchModuleDetail, (state) => ({ ...state, moduleDetail: null })),
  on(ReportsActions.fetchModuleDetailSuccess, (state, { detail }) => ({
    ...state,
    moduleDetail: detail,
  })),
  on(ReportsActions.fetchLearnerDetail, (state) => ({ ...state, learnerDetail: null })),
  on(ReportsActions.fetchLearnerDetailSuccess, (state, { detail }) => ({
    ...state,
    learnerDetail: detail,
  })),
  on(
    ReportsActions.fetchModuleDetailFailure,
    ReportsActions.fetchLearnerDetailFailure,
    (state, { error }) => ({ ...state, error }),
  ),
  on(ReportsActions.clearDetails, (state) => ({
    ...state,
    moduleDetail: null,
    learnerDetail: null,
  })),
);
