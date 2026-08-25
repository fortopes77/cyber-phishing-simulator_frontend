export interface Attempt {
  id: string;
  scenarioId: string;
  userId?: string;
  decision: string;
  // The suspicious phrases the learner highlighted in the scenario content
  // (see ScenarioPageComponent.selectedCues), carried through so a
  // "detailed" scenario - one scored against correctCues rather than a
  // single correctAnswer - can be graded server-side.
  selectedCues?: string[];
  correct: boolean;
  timeTaken?: number;
  timestamp?: string;
}
