export interface Feedback {
  id: string;
  attemptId: string;
  generatedBy: string;
  content: string;
}

// Payload sent to POST /feedback - mirrors the shape already used by
// AuthService.getFeedback / nav.component.ts's debug trigger.
export interface FeedbackRequest {
  scenario_content: string;
  scenarioChoices: Array<{
    id: number | string;
    text: string;
    isCorrect: boolean;
    scenarioId: number | string;
  }>;
  selectedChoiceId: number | string;
  attemptId?: string;
}
