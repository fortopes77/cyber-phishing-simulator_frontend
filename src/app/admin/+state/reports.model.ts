/**
 * Response shapes for the trainer/admin reporting endpoints
 * (GET /organisations/{orgId}/reports/...). Rates and scores are
 * percentages (0-100), rounded to one decimal place by the backend.
 */

/** GET .../reports/overview */
export interface ReportOverview {
  totalUsers: number;
  // Organisation modules with at least one learner assigned.
  modulesAssignedCount: number;
  completionRate: number;
  averageScore: number;
}

/** One row of GET .../reports/modules */
export interface ModuleReportRow {
  moduleId: number;
  title: string;
  completionRate: number;
  averageScore: number;
  // Share of learners completing the module with 80% or more.
  passRate: number;
}

export interface ReportStatusBreakdown {
  notStarted: number;
  inProgress: number;
  completed: number;
}

/** GET .../reports/modules/{moduleId} */
export interface ModuleReportDetail {
  moduleId: number;
  title: string;
  scoreDistribution: { range: string; count: number }[];
  statusBreakdown: ReportStatusBreakdown;
}

/** One row of GET .../reports/users */
export interface LearnerReportRow {
  userId: number;
  username: string;
  completionRate: number;
  averageScore: number;
  // At least one completed module and an average below 70%.
  atRisk: boolean;
}

export type LearnerReportStatus = 'notStarted' | 'inProgress' | 'completed';

/** GET .../reports/users/{userId} */
export interface LearnerReportDetail {
  userId: number;
  username: string;
  modules: {
    moduleId: number;
    title: string;
    percentageScore: number;
    status: LearnerReportStatus;
  }[];
}

/**
 * The startDate/endDate query params every date-filtered report endpoint
 * takes, as ISO timestamps. Omitted = no bound.
 */
export interface ReportDateRange {
  startDate?: string;
  endDate?: string;
}

export function toReportDateRange(start: Date | null, end: Date | null): ReportDateRange {
  return {
    ...(start ? { startDate: start.toISOString() } : {}),
    ...(end ? { endDate: end.toISOString() } : {}),
  };
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizeReportOverview(raw: any): ReportOverview {
  return {
    totalUsers: toNumber(raw?.totalUsers),
    // Confirmed live as `modulesAssignedCount`; the Swagger schema
    // (OrgOverviewDto) documents it as `countModulesAssigned`, so accept both.
    modulesAssignedCount: toNumber(raw?.modulesAssignedCount ?? raw?.countModulesAssigned),
    completionRate: toNumber(raw?.completionRate),
    averageScore: toNumber(raw?.averageScore),
  };
}

export function normalizeModuleReportRows(raw: any): ModuleReportRow[] {
  return (raw?.modules ?? []).map((row: any) => ({
    moduleId: toNumber(row?.moduleId),
    title: String(row?.title ?? ''),
    completionRate: toNumber(row?.completionRate),
    averageScore: toNumber(row?.averageScore),
    passRate: toNumber(row?.passRate),
  }));
}

export function normalizeModuleReportDetail(raw: any): ModuleReportDetail {
  return {
    moduleId: toNumber(raw?.moduleId),
    title: String(raw?.title ?? ''),
    scoreDistribution: (raw?.scoreDistribution ?? []).map((bucket: any) => ({
      range: String(bucket?.range ?? ''),
      count: toNumber(bucket?.count),
    })),
    statusBreakdown: {
      notStarted: toNumber(raw?.statusBreakdown?.notStarted),
      inProgress: toNumber(raw?.statusBreakdown?.inProgress),
      completed: toNumber(raw?.statusBreakdown?.completed),
    },
  };
}

export function normalizeLearnerReportRows(raw: any): LearnerReportRow[] {
  return (raw?.users ?? []).map((row: any) => ({
    userId: toNumber(row?.userId),
    username: String(row?.username ?? ''),
    completionRate: toNumber(row?.completionRate),
    averageScore: toNumber(row?.averageScore),
    atRisk: !!row?.atRisk,
  }));
}

export function normalizeLearnerReportDetail(raw: any): LearnerReportDetail {
  return {
    userId: toNumber(raw?.userId),
    username: String(raw?.username ?? ''),
    modules: (raw?.modules ?? []).map((module: any) => ({
      moduleId: toNumber(module?.moduleId),
      title: String(module?.title ?? ''),
      percentageScore: toNumber(module?.percentageScore),
      status: module?.status ?? 'notStarted',
    })),
  };
}
