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

/** One entry of DashboardOverviewDto.moduleCompletion - ModuleCompletionDto. */
export interface RawModuleCompletion {
  moduleId: number;
  moduleName: string;
  completionPercentage: number;
}

/** GET /organisations/{orgId}/trainer-dashboard - DashboardOverviewDto. */
export interface RawDashboardOverview {
  totalLearners: number;
  activeModules: number;
  overallCompletionRate: number;
  averageScore: number;
  moduleCompletion: RawModuleCompletion[];
}

export type DashboardActivityAction = 'assigned' | 'started' | 'completed';

/** One entry of DashboardActivityDto.activity - DashboardActivityItemDto. */
export interface RawDashboardActivityItem {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  moduleId: number;
  moduleTitle: string;
  action: DashboardActivityAction;
  timestamp: string;
}

/** GET /organisations/{orgId}/trainer-dashboard/activity - DashboardActivityDto. */
export interface RawDashboardActivity {
  activity: RawDashboardActivityItem[];
}

// ActivityStatus has no "assigned" state (it only distinguishes started vs
// completed vs failed for the activity-item icon) - "assigned" is treated
// as "started" since neither icon fits an unstarted assignment better.
const ACTIVITY_STATUS_MAP: Record<DashboardActivityAction, ActivityStatus> = {
  completed: 'completed',
  started: 'started',
  assigned: 'started',
};

const ACTIVITY_ACTION_LABEL: Record<DashboardActivityAction, string> = {
  assigned: 'Assigned',
  started: 'Started',
  completed: 'Completed',
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

function normalizeActivityItem(raw: RawDashboardActivityItem): ActivityItem {
  return {
    id: `${raw.userId}-${raw.moduleId}-${raw.timestamp}`,
    userName: `${raw.firstName} ${raw.lastName}`.trim(),
    action: `${ACTIVITY_ACTION_LABEL[raw.action]} ${raw.moduleTitle}`,
    status: ACTIVITY_STATUS_MAP[raw.action],
    timestamp: formatRelativeTime(raw.timestamp),
    moduleName: raw.moduleTitle,
  };
}

/**
 * Combines the two real, trainer-only dashboard endpoints - both confirmed
 * live and fully documented via GET /api-json (DashboardOverviewDto,
 * DashboardActivityDto).
 */
export function normalizeTrainerDashboardStats(
  overview: RawDashboardOverview,
  activity: RawDashboardActivity,
): TrainerDashboardStats {
  return {
    totalLearners: overview.totalLearners,
    activeModules: overview.activeModules,
    completionRate: overview.overallCompletionRate,
    averageScore: overview.averageScore,
    moduleCompletion: overview.moduleCompletion,
    recentActivity: activity.activity.map(normalizeActivityItem),
  };
}
