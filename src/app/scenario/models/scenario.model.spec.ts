import {
  normalizeCategory,
  normalizeDifficulty,
  normalizeInteractionType,
  toScenarioPayload,
  ScenarioCategory,
  ScenarioDifficulty,
  ScenarioInteractionType,
} from './scenario.model';

describe('scenario.model', () => {
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

    it('should fall back to a placeholder moduleId when none is supplied', () => {
      const payload = toScenarioPayload({ title: 'AI generated scenario' });

      expect(payload.moduleId).toBe(5);
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
