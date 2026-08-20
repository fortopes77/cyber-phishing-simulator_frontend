export interface Attempt {
  id: string;
  scenarioId: string;
  userId?: string;
  decision: string;
  correct: boolean;
  timeTaken?: number;
  timestamp?: string;
}
