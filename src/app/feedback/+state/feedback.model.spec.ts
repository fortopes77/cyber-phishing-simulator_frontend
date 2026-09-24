import { normalizeFeedback, toAiFeedbackRequest } from './feedback.model';

describe('toAiFeedbackRequest', () => {
  it('should select the correct choice when the learner got it right', () => {
    const body = toAiFeedbackRequest({
      scenarioId: 3,
      scenarioContent: 'Your invoice is attached.',
      decision: 'Safe',
      correct: true,
    });

    expect(body).toEqual({
      scenario_content: 'Your invoice is attached.',
      scenarioChoices: [{ id: 1, text: 'Safe', isCorrect: true, scenarioId: 3 }],
      selectedChoiceId: 1,
    });
  });

  it('should treat the opposite decision as correct when the learner got it wrong', () => {
    const body = toAiFeedbackRequest({
      scenarioId: 3,
      scenarioContent: 'Reset your password now.',
      decision: 'Suspicious',
      correct: false,
    });

    expect(body.scenarioChoices).toEqual([
      { id: 1, text: 'Safe', isCorrect: true, scenarioId: 3 },
      { id: 2, text: 'Suspicious', isCorrect: false, scenarioId: 3 },
    ]);
    expect(body.selectedChoiceId).toBe(2);
  });

  it('should fold flagged and missed cues into the choice text for detailed scenarios', () => {
    const body = toAiFeedbackRequest({
      scenarioId: 4,
      scenarioContent: 'Dear user, verify your account.',
      decision: 'Suspicious',
      correct: true,
      selectedCues: ['Dear user'],
      missedCues: ['micr0soft.com'],
    });

    expect(body.scenarioChoices).toEqual([
      {
        id: 1,
        text: 'Suspicious - red flags: Dear user; micr0soft.com',
        isCorrect: true,
        scenarioId: 4,
      },
      {
        id: 2,
        text: 'Suspicious - red flags: Dear user',
        isCorrect: false,
        scenarioId: 4,
      },
    ]);
    expect(body.selectedChoiceId).toBe(2);
  });
});

describe('normalizeFeedback', () => {
  it('should map the AI response onto Feedback', () => {
    expect(
      normalizeFeedback({
        score: 50,
        explanation: 'Partly right.',
        tips: ['Hover over links'],
        redFlagsMissed: ['Urgency'],
      }),
    ).toEqual({
      score: 50,
      content: 'Partly right.',
      tips: ['Hover over links'],
      redFlagsMissed: ['Urgency'],
    });
  });

  it('should default missing fields', () => {
    expect(normalizeFeedback({})).toEqual({
      score: null,
      content: '',
      tips: [],
      redFlagsMissed: [],
    });
  });
});
