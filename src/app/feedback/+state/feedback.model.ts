/**
 * AI-generated feedback for one scenario attempt, normalised from the AI
 * API's POST /feedback response (see RawFeedbackResponse). `content` is the
 * explanation paragraph - kept under that name so existing consumers that
 * just render a block of text don't need to know about tips/redFlagsMissed.
 */
export interface Feedback {
  score: number | null;
  content: string;
  tips: string[];
  redFlagsMissed: string[];
}

/**
 * What the learner did on a scenario, as the rest of the app knows it -
 * mapped onto the AI API's multiple-choice contract by toAiFeedbackRequest.
 * correctAnswer and missedCues are mutually exclusive (see Attempt) - only
 * whichever applies to the scenario's answer mode is sent.
 */
export interface FeedbackRequest {
  scenarioId: number;
  scenarioContent: string;
  decision: string;
  correct: boolean;
  selectedCues?: string[];
  missedCues?: string[];
}

export interface AiScenarioChoice {
  id: number;
  text: string;
  isCorrect: boolean;
  scenarioId: number;
}

/**
 * Body for the AI API's POST /feedback (FeedbackRequest in its OpenAPI
 * schema). The AI picks out the correct choice's text and the selected
 * choice's text and compares them against scenario_content.
 */
export interface AiFeedbackRequest {
  scenario_content: string;
  scenarioChoices: AiScenarioChoice[];
  selectedChoiceId: number;
}

/**
 * Response from the AI API's POST /feedback. Its OpenAPI schema leaves the
 * response untyped, but main.py prompts the model for exactly this shape
 * and returns the parsed JSON as-is - so every field is treated as
 * possibly missing.
 */
export interface RawFeedbackResponse {
  score?: number;
  explanation?: string;
  tips?: string[];
  redFlagsMissed?: string[];
}

const CORRECT_CHOICE_ID = 1;
const LEARNER_CHOICE_ID = 2;

function describeDecision(suspicious: boolean, cues: string[]): string {
  if (!suspicious) {
    return 'Safe';
  }
  return cues.length ? `Suspicious - red flags: ${cues.join('; ')}` : 'Suspicious';
}

/**
 * Every scenario is ultimately a binary Safe/Suspicious judgement (detailed
 * scenarios derive it from whether any cues were flagged - see
 * ScenarioChoiceComponent.submitCues). The backend has already graded the
 * attempt, so the correct action is the learner's decision if they got it
 * right and the opposite otherwise. For detailed scenarios the cues are
 * folded into the choice text, since the choice texts are the only
 * learner-specific input the AI prompt reads - a correct decision that
 * still missed some cues then shows up as two different choices.
 */
export function toAiFeedbackRequest(request: FeedbackRequest): AiFeedbackRequest {
  const decidedSuspicious = request.decision.toLowerCase() === 'suspicious';
  const correctIsSuspicious = request.correct ? decidedSuspicious : !decidedSuspicious;
  const selectedCues = request.selectedCues ?? [];
  const missedCues = request.missedCues ?? [];

  const correctText = describeDecision(correctIsSuspicious, [...selectedCues, ...missedCues]);
  const learnerText = describeDecision(decidedSuspicious, selectedCues);

  const scenarioChoices: AiScenarioChoice[] = [
    { id: CORRECT_CHOICE_ID, text: correctText, isCorrect: true, scenarioId: request.scenarioId },
  ];
  if (learnerText !== correctText) {
    scenarioChoices.push({
      id: LEARNER_CHOICE_ID,
      text: learnerText,
      isCorrect: false,
      scenarioId: request.scenarioId,
    });
  }

  return {
    scenario_content: request.scenarioContent,
    scenarioChoices,
    selectedChoiceId: learnerText === correctText ? CORRECT_CHOICE_ID : LEARNER_CHOICE_ID,
  };
}

export function normalizeFeedback(raw: RawFeedbackResponse | null | undefined): Feedback {
  return {
    score: typeof raw?.score === 'number' ? raw.score : null,
    content: raw?.explanation ?? '',
    tips: Array.isArray(raw?.tips) ? raw!.tips : [],
    redFlagsMissed: Array.isArray(raw?.redFlagsMissed) ? raw!.redFlagsMissed : [],
  };
}
