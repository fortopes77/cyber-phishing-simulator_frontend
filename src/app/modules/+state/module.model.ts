export interface LearnerModule {
  moduleId: string;
  moduleName: string;
  description: string;
  version?: string;
  hasUserCompleted?: boolean;
  completionDate?: string;
  score?: number;
  timeSpent?: number;
}
