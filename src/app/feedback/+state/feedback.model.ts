export interface Feedback {
  id: string;
  attemptId: string;
  generatedBy: string;
  content: string;
}

/**
 * Payload sent to POST /feedback. ASSUMPTION: the AI feedback endpoint
 * wants what the learner actually did and got wrong, not a generic
 * multiple-choice shape - scenario_content/scenarioChoices/selectedChoiceId
 * (nav.component.ts's old debug trigger) was never wired into any screen
 * and predates the scenarios ticket's correctAnswer/correctCues model, so
 * it wasn't a confirmed contract worth preserving. correctAnswer and
 * missedCues are mutually exclusive (see Attempt) - only whichever applies
 * to the scenario's answer mode is sent.
 */
export interface FeedbackRequest {
  scenarioContent: string;
  decision: string;
  correct: boolean;
  correctAnswer?: string;
  selectedCues?: string[];
  missedCues?: string[];
  attemptId?: string;
}
