import { ActivityItem } from '../components/models/activity-item.model';

export interface ModuleCompletion {
  moduleId?: number | string;
  moduleName: string;
  completionPercentage: number;
}

/**
 * The aggregate payload backing the trainer dashboard screen: the four stat
 * cards, the per-module completion breakdown, and the recent activity feed.
 * ASSUMPTION: no dedicated dashboard endpoint exists yet (PHISH-383
 * "Trainer Dashboard" is still To Do on the backend board), so this shape is
 * this frontend's proposal for what a single aggregate GET should return -
 * update it once that ticket lands if the real contract differs. Cohorts
 * are being scrapped as a product concept, so the completion breakdown is
 * per-module (the Modules domain already backs the rest of the app) rather
 * than per-cohort.
 */
export interface TrainerDashboardStats {
  totalLearners: number;
  activeModules: number;
  completionRate: number;
  averageScore: number;
  moduleCompletion: ModuleCompletion[];
  recentActivity: ActivityItem[];
}
