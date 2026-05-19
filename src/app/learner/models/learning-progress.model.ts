export interface LearningProgress {
  id: string;
  title: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  completedScenarios: number;
  totalScenarios: number;
  progressPercentage: number;
  icon?: string;
  route?: string;
}
