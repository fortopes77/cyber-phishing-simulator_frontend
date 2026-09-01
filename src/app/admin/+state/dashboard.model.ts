import { ActivityItem, ActivityStatus } from '../components/models/activity-item.model';

export interface ModuleCompletion {
  moduleId?: number | string;
  moduleName: string;
  completionPercentage: number;
}

/**
 * The aggregate payload backing the trainer dashboard screen: the four stat
 * cards, the per-module completion breakdown, and the recent activity feed.
 * Built from two real backend calls (see normalizeTrainerDashboardStats) -
 * GET /organisations/{orgId}/trainer-dashboard ("headline training stats")
 * and its .../activity sibling ("ten most recent learner activity items"),
 * both trainer-only.
 */
export interface TrainerDashboardStats {
  totalLearners: number;
  activeModules: number;
  completionRate: number;
  averageScore: number;
  moduleCompletion: ModuleCompletion[];
  recentActivity: ActivityItem[];
}

const ACTIVITY_STATUS_MAP: Record<string, ActivityStatus> = {
  COMPLETED: 'completed',
  COMPLETE: 'completed',
  PASSED: 'completed',
  STARTED: 'started',
  IN_PROGRESS: 'started',
  FAILED: 'failed',
  FAIL: 'failed',
};

function normalizeActivityStatus(raw: unknown): ActivityStatus {
  const key = String(raw ?? '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return ACTIVITY_STATUS_MAP[key] ?? 'started';
}

function normalizeActivityItem(raw: any): ActivityItem {
  return {
    id: raw?.id != null ? String(raw.id) : undefined,
    userName:
      raw?.userName ?? raw?.learnerName ?? raw?.userFullName ?? raw?.username ?? 'A learner',
    action: raw?.action ?? raw?.eventType ?? raw?.description ?? '',
    status: normalizeActivityStatus(raw?.status ?? raw?.outcome),
    timestamp: raw?.timestamp ?? raw?.createdAt ?? raw?.occurredAt ?? '',
    moduleName: raw?.moduleName ?? raw?.module?.title ?? undefined,
  };
}

function normalizeModuleCompletion(raw: any): ModuleCompletion {
  return {
    moduleId: raw?.moduleId ?? raw?.id,
    moduleName: raw?.moduleName ?? raw?.title ?? 'Module',
    completionPercentage: Number(
      raw?.completionPercentage ?? raw?.completionRate ?? raw?.percentage ?? 0,
    ),
  };
}

/**
 * ASSUMPTION: combines the two real, trainer-only dashboard endpoints -
 * confirmed to exist (and to be role-gated) against the live backend, but
 * neither has a documented response schema in Swagger (no @ApiResponse on
 * either route), so every field name below is a best guess with fallbacks
 * for the most likely alternates. Correct these once a trainer account is
 * available to inspect a populated response against.
 */
export function normalizeTrainerDashboardStats(
  overview: any,
  activity: any,
): TrainerDashboardStats {
  const activityList: any[] = Array.isArray(activity)
    ? activity
    : (activity?.activities ?? activity?.items ?? activity?.data ?? []);

  const moduleCompletionList: any[] =
    overview?.moduleCompletion ?? overview?.modules ?? overview?.moduleCompletionRates ?? [];

  return {
    totalLearners: Number(
      overview?.totalLearners ?? overview?.learnerCount ?? overview?.totalUsers ?? 0,
    ),
    activeModules: Number(
      overview?.activeModules ?? overview?.moduleCount ?? overview?.totalModules ?? 0,
    ),
    completionRate: Number(overview?.completionRate ?? overview?.averageCompletionRate ?? 0),
    averageScore: Number(overview?.averageScore ?? overview?.avgScore ?? 0),
    moduleCompletion: moduleCompletionList.map(normalizeModuleCompletion),
    recentActivity: activityList.map(normalizeActivityItem),
  };
}
