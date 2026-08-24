export interface LearningProgress {
  id: number;
  title: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  completedScenarios: number;
  totalScenarios: number;
  progressPercentage: number;
  icon?: string;
  route?: string;
}
