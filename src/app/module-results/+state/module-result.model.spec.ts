import { normalizeModuleResult } from './module-result.model';

describe('normalizeModuleResult', () => {
  it('maps a fully-populated response', () => {
    const result = normalizeModuleResult({
      moduleId: 3,
      moduleName: 'Email Phishing Basics',
      totalScore: 18,
      maxScore: 20,
      percentageScore: 90,
      passingScore: 70,
      passed: true,
      scenarioResults: [
        { scenarioId: 's_1', title: 'Urgent Password Reset', decision: 'Suspicious', correct: true },
        { scenarioId: 's_2', title: 'IT Software Update', decision: 'Safe', correct: false },
      ],
    });

    expect(result).toEqual({
      moduleId: 3,
      moduleName: 'Email Phishing Basics',
      totalScore: 18,
      maxScore: 20,
      percentageScore: 90,
      passingScore: 70,
      passed: true,
      scenarioResults: [
        { scenarioId: 's_1', title: 'Urgent Password Reset', decision: 'Suspicious', correct: true },
        { scenarioId: 's_2', title: 'IT Software Update', decision: 'Safe', correct: false },
      ],
    });
  });

  it('derives percentageScore from totalScore/maxScore when not provided', () => {
    const result = normalizeModuleResult({ moduleId: 1, totalScore: 3, maxScore: 4 });
    expect(result.percentageScore).toBe(75);
  });

  it('derives passed from percentageScore vs a default 70% passing score when not provided', () => {
    const passing = normalizeModuleResult({ moduleId: 1, totalScore: 8, maxScore: 10 });
    const failing = normalizeModuleResult({ moduleId: 1, totalScore: 5, maxScore: 10 });

    expect(passing.passed).toBeTrue();
    expect(failing.passed).toBeFalse();
  });

  it('falls back to id when moduleId is missing, and defaults an empty scenario list', () => {
    const result = normalizeModuleResult({ id: 9 });

    expect(result.moduleId).toBe(9);
    expect(result.scenarioResults).toEqual([]);
    expect(result.moduleName).toBe('Module');
  });

  it('maps a scenarios array using alternate field names', () => {
    const result = normalizeModuleResult({
      moduleId: 1,
      scenarios: [{ id: 's_1', scenarioTitle: 'Phishing Email', answer: 'Suspicious', correct: true }],
    });

    expect(result.scenarioResults).toEqual([
      { scenarioId: 's_1', title: 'Phishing Email', decision: 'Suspicious', correct: true },
    ]);
  });
});
