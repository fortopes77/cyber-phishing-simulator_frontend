import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  LearnerReportDetail,
  LearnerReportRow,
  LearnerReportStatus,
  ModuleReportDetail,
  ModuleReportRow,
  ReportDateRange,
  ReportOverview,
} from './reports.model';

export const ReportsActions = createActionGroup({
  source: 'Reports',
  events: {
    // Overview + module breakdown, loaded together.
    fetchReport: props<{ organisationId: number; range: ReportDateRange }>(),
    fetchReportSuccess: props<{ overview: ReportOverview; modules: ModuleReportRow[] }>(),
    fetchReportFailure: props<{ error: string }>(),
    // Loaded separately so changing the learner status filter doesn't
    // reload the rest of the report.
    fetchLearners: props<{
      organisationId: number;
      range: ReportDateRange;
      status: LearnerReportStatus | null;
    }>(),
    fetchLearnersSuccess: props<{ learners: LearnerReportRow[] }>(),
    fetchLearnersFailure: props<{ error: string }>(),
    fetchModuleDetail: props<{
      organisationId: number;
      moduleId: number;
      range: ReportDateRange;
    }>(),
    fetchModuleDetailSuccess: props<{ detail: ModuleReportDetail }>(),
    fetchModuleDetailFailure: props<{ error: string }>(),
    fetchLearnerDetail: props<{ organisationId: number; userId: number }>(),
    fetchLearnerDetailSuccess: props<{ detail: LearnerReportDetail }>(),
    fetchLearnerDetailFailure: props<{ error: string }>(),
    clearDetails: emptyProps(),
  },
});
