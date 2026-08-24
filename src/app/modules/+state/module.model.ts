export interface LearnerModule {
  moduleId: number;
  moduleName: string;
  description: string;
  version?: string;
  hasUserCompleted?: boolean;
  completionDate?: string;
  score?: number;
  timeSpent?: number;
}
