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
  // ASSUMPTION: a learner never receives a scenario's correctAnswer/
  // correctCues before deciding (see scenario-page.component.ts), so the
  // only place these can come from is the graded attempt response itself -
  // the same server-side grading pass that already produces `correct`.
  // correctAnswer is populated for a "simple" scenario; missedCues (the
  // correctCues the learner didn't select) for a "detailed" one - never
  // both, mirroring the correctAnswer/correctCues split on the scenario
  // itself. Both feed ScenarioChoiceComponent's AI feedback request so the
  // explanation can reference what was actually missed.
  correctAnswer?: string;
  missedCues?: string[];
  timeTaken?: number;
  timestamp?: string;
}
