import {
  normalizeAnswerMode,
  normalizeCategory,
  normalizeDifficulty,
  normalizeInteractionType,
  normalizeScenario,
  toScenarioPayload,
  ScenarioCategory,
  ScenarioDifficulty,
  ScenarioInteractionType,
} from './scenario.model';

describe('scenario.model', () => {
  describe('normalizeScenario', () => {
    it('should fall back to `scenarioId` when `id` is missing - the real GET /scenarios shape, confirmed live', () => {
      const result = normalizeScenario({
        scenarioId: 1,
        moduleId: 1,
        title: 'Fake Invoice',
      });

      expect(result.id).toBe(1);
    });

    it('should prefer an existing `id` over `scenarioId` when both are present', () => {
      const result = normalizeScenario({ id: 5, scenarioId: 1 });

      expect(result.id).toBe(5);
    });

    it('should coerce a string scenarioId to a number', () => {
      const result = normalizeScenario({ scenarioId: '7' });

      expect(result.id).toBe(7);
      expect(typeof result.id).toBe('number');
    });

    it('should preserve every other field unchanged', () => {
      const result = normalizeScenario({
        scenarioId: 1,
        moduleId: 1,
        title: 'Fake Invoice',
        content: 'Dear customer...',
      });

      expect(result.moduleId).toBe(1);
      expect(result.title).toBe('Fake Invoice');
      expect(result.content).toBe('Dear customer...');
    });

    it("should default answerMode to 'simple' when the backend doesn't send one yet", () => {
      const result = normalizeScenario({ scenarioId: 1, title: 'Fake Invoice' });

      expect(result.answerMode).toBe('simple');
    });

    it("should carry through a 'detailed' answerMode once the backend sends one", () => {
      const result = normalizeScenario({
        scenarioId: 1,
        title: 'Fake Invoice',
        answerMode: 'detailed',
      });

      expect(result.answerMode).toBe('detailed');
    });
  });

  describe('normalizeAnswerMode', () => {
    it("should default to 'simple' for a missing or unrecognised value", () => {
      expect(normalizeAnswerMode({})).toBe('simple');
      expect(normalizeAnswerMode({ answerMode: 'something-else' })).toBe(
        'simple',
      );
    });

    it("should recognise 'detailed' case-insensitively", () => {
      expect(normalizeAnswerMode({ answerMode: 'detailed' })).toBe('detailed');
      expect(normalizeAnswerMode({ answerMode: 'DETAILED' })).toBe('detailed');
    });
  });

  describe('normalizeCategory', () => {
    it('should uppercase a matching category', () => {
      expect(normalizeCategory('phishing')).toBe(ScenarioCategory.Phishing);
    });

    it('should map aliases onto the backend enum, typos included', () => {
      expect(normalizeCategory('Business Email Compromise')).toBe(
        ScenarioCategory.BusinessEmailCompromise,
      );
      expect(normalizeCategory('ransomware')).toBe(ScenarioCategory.Ransomware);
    });

    it('should fall back to Phishing for an unrecognised category', () => {
      expect(normalizeCategory('Training')).toBe(ScenarioCategory.Phishing);
      expect(normalizeCategory(undefined)).toBe(ScenarioCategory.Phishing);
    });
  });

  describe('normalizeDifficulty', () => {
    it('should uppercase a matching difficulty', () => {
      expect(normalizeDifficulty('Medium')).toBe(ScenarioDifficulty.Medium);
    });

    it('should fall back to Medium for an unrecognised difficulty', () => {
      expect(normalizeDifficulty('nightmare')).toBe(ScenarioDifficulty.Medium);
    });
  });

  describe('normalizeInteractionType', () => {
    it('should uppercase a matching interaction type', () => {
      expect(normalizeInteractionType('Email')).toBe(
        ScenarioInteractionType.Email,
      );
    });

    it('should fall back to Email for an unrecognised interaction type', () => {
      expect(normalizeInteractionType('carrier pigeon')).toBe(
        ScenarioInteractionType.Email,
      );
    });

    it('should map Social Media aliases onto the SOCIAL_MEDIA enum', () => {
      expect(normalizeInteractionType('Social Media')).toBe(
        ScenarioInteractionType.SocialMedia,
      );
      expect(normalizeInteractionType('social')).toBe(
        ScenarioInteractionType.SocialMedia,
      );
    });

    it('should match the exact enum values confirmed by the backend\'s 400 response - EMAIL, TEXT_MESSAGE, PHONE_CALL, SOCIAL_MEDIA', () => {
      expect(ScenarioInteractionType.Email).toBe('EMAIL');
      expect(ScenarioInteractionType.Sms).toBe('TEXT_MESSAGE');
      expect(ScenarioInteractionType.Call).toBe('PHONE_CALL');
      expect(ScenarioInteractionType.SocialMedia).toBe('SOCIAL_MEDIA');
    });

    it('should map legacy SMS/CALL free text onto the TEXT_MESSAGE/PHONE_CALL enum values', () => {
      expect(normalizeInteractionType('SMS')).toBe(
        ScenarioInteractionType.Sms,
      );
      expect(normalizeInteractionType('CALL')).toBe(
        ScenarioInteractionType.Call,
      );
      expect(normalizeInteractionType('Phone Call')).toBe(
        ScenarioInteractionType.Call,
      );
    });
  });

  describe('toScenarioPayload', () => {
    it('should build the Create/Update request shape from a form-shaped source', () => {
      const payload = toScenarioPayload({
        moduleId: '3',
        title: 'Suspicious Invoice Email',
        scenarioDescription:
          'Learner must identify red flags in a fake invoice email.',
        content: 'Dear customer, your invoice #4471 is overdue...',
        category: 'phishing',
        difficulty: 'Medium',
        interactionType: 'Email',
        correctAnswer: 'suspicious',
      });

      expect(payload).toEqual({
        moduleId: 3,
        title: 'Suspicious Invoice Email',
        scenarioDescription:
          'Learner must identify red flags in a fake invoice email.',
        content: 'Dear customer, your invoice #4471 is overdue...',
        category: ScenarioCategory.Phishing,
        difficulty: ScenarioDifficulty.Medium,
        interactionType: ScenarioInteractionType.Email,
        correctAnswer: 'suspicious',
      });
    });

    it('should send correctCues instead of correctAnswer when cues are present', () => {
      const payload = toScenarioPayload({
        moduleId: 3,
        title: 'Suspicious Invoice Email',
        correctAnswer: 'should be ignored',
        correctCues: ['Dear customer', 'invoice #4471', ''],
      });

      expect(payload.correctCues).toEqual(['Dear customer', 'invoice #4471']);
      expect(payload.correctAnswer).toBeUndefined();
    });

    it('should omit correctAnswer/correctCues entirely when neither is supplied', () => {
      const payload = toScenarioPayload({ moduleId: 3, title: 'No answer yet' });

      expect(payload.correctAnswer).toBeUndefined();
      expect(payload.correctCues).toBeUndefined();
    });

    it('should carry through whatever moduleId the caller supplies (the manual form or the AI flow after module selection)', () => {
      const payload = toScenarioPayload({ moduleId: 7, title: 'AI generated scenario' });

      expect(payload.moduleId).toBe(7);
    });

    it('should preserve an explicit null moduleId instead of coercing it to 0 - the module-edit "unassign" toggle', () => {
      const payload = toScenarioPayload({ moduleId: null, title: 'Unassigned scenario' });

      expect(payload.moduleId).toBeNull();
    });

    it('should read legacy field names as a fallback', () => {
      const payload = toScenarioPayload({
        moduleId: 3,
        title: 'Legacy shaped scenario',
        description: 'legacy description field',
        emailBody: 'legacy content field',
      });

      expect(payload.scenarioDescription).toBe('legacy description field');
      expect(payload.content).toBe('legacy content field');
    });
  });
});
