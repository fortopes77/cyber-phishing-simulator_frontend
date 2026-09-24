import {
  buildModuleProgress,
  buildModuleResult,
  buildModuleResultsOverview,
} from './module-result.model';
import { LearnerResults } from 'src/app/results/+state/results.model';

describe('buildModuleResult', () => {
  it("uses the backend's own total/max/percentage score, not a recount of scenarioResults - so the score shown can never disagree with `passed`", () => {
    const results: LearnerResults = {
      moduleResults: [
        {
          id: 1,
          moduleId: 3,
          moduleName: 'Email Phishing Basics',
          status: 'COMPLETED',
          // Deliberately different from a naive "1 point per correct
          // scenario" count (which would say 2/3, 67%) - a learner can pick
          // the right verdict on every scenario but still lose points for
          // missed cues, so the backend's own weighted score is the only
          // number that agrees with `passed`.
          totalScore: 18,
          maxScore: 20,
          percentageScore: 90,
          passed: true,
          completedAt: '2026-09-02T00:00:00.000Z',
        },
      ],
      scenarioResults: [
        {
          scenarioId: 's_1',
          moduleId: 3,
          correct: true,
          title: 'Urgent Password Reset',
          decision: 'Suspicious',
          moduleResultId: 1,
        },
        {
          scenarioId: 's_2',
          moduleId: 3,
          correct: false,
          title: 'IT Software Update',
          decision: 'Safe',
          moduleResultId: 1,
        },
        {
          scenarioId: 's_3',
          moduleId: 3,
          correct: true,
          title: 'Suspicious Invoice',
          decision: 'Suspicious',
          moduleResultId: 1,
        },
      ],
      averageScore: null,
    };

    const result = buildModuleResult(results, 3);

    expect(result).toEqual({
      moduleId: 3,
      moduleName: 'Email Phishing Basics',
      totalScore: 18,
      maxScore: 20,
      percentageScore: 90,
      passingScore: 80,
      passed: true,
      scenarioResults: [
        { scenarioId: 's_1', title: 'Urgent Password Reset', decision: 'Suspicious', correct: true },
        { scenarioId: 's_2', title: 'IT Software Update', decision: 'Safe', correct: false },
        { scenarioId: 's_3', title: 'Suspicious Invoice', decision: 'Suspicious', correct: true },
      ],
    });
  });

  it('returns null when the learner has no result for that module', () => {
    const results: LearnerResults = {
      moduleResults: [],
      scenarioResults: [],
      averageScore: null,
    };

    expect(buildModuleResult(results, 3)).toBeNull();
    expect(buildModuleResult(null, 3)).toBeNull();
  });

  it('picks the most recent attempt (highest id) when the module was retried', () => {
    const results: LearnerResults = {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Email Phishing Fundamentals',
          status: 'COMPLETED',
          totalScore: 0,
          maxScore: 1,
          percentageScore: 0,
          passed: false,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 2,
          moduleId: 1,
          moduleName: 'Email Phishing Fundamentals',
          status: 'COMPLETED',
          totalScore: 1,
          maxScore: 1,
          percentageScore: 100,
          passed: true,
          completedAt: '2026-09-02T00:00:00.000Z',
        },
      ],
      scenarioResults: [
        { scenarioId: '1', moduleId: 1, correct: false, moduleResultId: 1 },
        { scenarioId: '1', moduleId: 1, correct: true, title: 'Retry scenario', decision: 'Suspicious', moduleResultId: 2 },
      ],
      averageScore: null,
    };

    const result = buildModuleResult(results, 1);

    expect(result?.totalScore).toBe(1);
    expect(result?.maxScore).toBe(1);
    expect(result?.passed).toBeTrue();
    expect(result?.scenarioResults).toEqual([
      { scenarioId: '1', title: 'Retry scenario', decision: 'Suspicious', correct: true },
    ]);
  });

  it('prefers a COMPLETED attempt over a newer but still IN_PROGRESS one for the same module', () => {
    const results: LearnerResults = {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Email Phishing Fundamentals',
          status: 'COMPLETED',
          totalScore: 1,
          maxScore: 1,
          percentageScore: 100,
          passed: true,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 2,
          moduleId: 1,
          moduleName: 'Email Phishing Fundamentals',
          status: 'IN_PROGRESS',
          totalScore: 0,
          maxScore: 1,
          percentageScore: 0,
          passed: false,
          completedAt: null,
        },
      ],
      scenarioResults: [
        { scenarioId: '1', moduleId: 1, correct: true, title: 'Finished scenario', decision: 'Suspicious', moduleResultId: 1 },
      ],
      averageScore: null,
    };

    const result = buildModuleResult(results, 1);

    expect(result?.totalScore).toBe(1);
    expect(result?.percentageScore).toBe(100);
    expect(result?.passed).toBeTrue();
    expect(result?.scenarioResults).toEqual([
      { scenarioId: '1', title: 'Finished scenario', decision: 'Suspicious', correct: true },
    ]);
  });

  it('defaults a missing scenario title/decision to placeholders', () => {
    const results: LearnerResults = {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Module',
          status: 'COMPLETED',
          totalScore: 0,
          maxScore: 0,
          percentageScore: 0,
          passed: false,
          completedAt: null,
        },
      ],
      scenarioResults: [
        { scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 1 },
      ],
      averageScore: null,
    };

    const result = buildModuleResult(results, 1);

    expect(result?.scenarioResults).toEqual([
      { scenarioId: '1', title: 'Scenario', decision: '', correct: true },
    ]);
  });

  it('scores an attempt with no matching scenarios straight from the backend summary', () => {
    const results: LearnerResults = {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Module',
          status: 'COMPLETED',
          totalScore: 5,
          maxScore: 5,
          percentageScore: 100,
          passed: true,
          completedAt: null,
        },
      ],
      scenarioResults: [],
      averageScore: null,
    };

    const result = buildModuleResult(results, 1);

    expect(result?.totalScore).toBe(5);
    expect(result?.maxScore).toBe(5);
    expect(result?.percentageScore).toBe(100);
    expect(result?.scenarioResults).toEqual([]);
  });
});

describe('buildModuleResultsOverview', () => {
  it("scores each row from the backend's own summary, using the matching moduleResultId for the passed flag", () => {
    const results: LearnerResults = {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Email Phishing Fundamentals',
          status: 'COMPLETED',
          totalScore: 99,
          maxScore: 99,
          percentageScore: 100,
          passed: true,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 2,
          moduleId: 3,
          moduleName: 'Instant Messaging Attacks',
          status: 'COMPLETED',
          totalScore: 40,
          maxScore: 99,
          percentageScore: 40,
          passed: false,
          completedAt: '2026-09-02T00:00:00.000Z',
        },
      ],
      scenarioResults: [
        { scenarioId: 's_1', moduleId: 1, correct: true, moduleResultId: 1 },
        { scenarioId: 's_2', moduleId: 3, correct: false, moduleResultId: 2 },
        { scenarioId: 's_3', moduleId: 3, correct: false, moduleResultId: 2 },
      ],
      averageScore: null,
    };

    expect(buildModuleResultsOverview(results)).toEqual([
      {
        moduleId: 3,
        moduleName: 'Instant Messaging Attacks',
        totalScore: 40,
        maxScore: 99,
        percentageScore: 40,
        passed: false,
        completedAt: '2026-09-02T00:00:00.000Z',
      },
      {
        moduleId: 1,
        moduleName: 'Email Phishing Fundamentals',
        totalScore: 99,
        maxScore: 99,
        percentageScore: 100,
        passed: true,
        completedAt: '2026-09-01T00:00:00.000Z',
      },
    ]);
  });

  it('collapses retries to the most recent attempt for that module', () => {
    const results: LearnerResults = {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Email Phishing Fundamentals',
          status: 'COMPLETED',
          totalScore: 0,
          maxScore: 1,
          percentageScore: 0,
          passed: false,
          completedAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 2,
          moduleId: 1,
          moduleName: 'Email Phishing Fundamentals',
          status: 'COMPLETED',
          totalScore: 1,
          maxScore: 1,
          percentageScore: 100,
          passed: true,
          completedAt: '2026-09-02T00:00:00.000Z',
        },
      ],
      scenarioResults: [
        { scenarioId: '1', moduleId: 1, correct: false, moduleResultId: 1 },
        { scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 2 },
      ],
      averageScore: null,
    };

    const overview = buildModuleResultsOverview(results);

    expect(overview.length).toBe(1);
    expect(overview[0].totalScore).toBe(1);
    expect(overview[0].maxScore).toBe(1);
    expect(overview[0].passed).toBeTrue();
  });

  it('excludes attempts that are still in progress', () => {
    const results: LearnerResults = {
      moduleResults: [
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Email Phishing Fundamentals',
          status: 'IN_PROGRESS',
          totalScore: 0,
          maxScore: 1,
          percentageScore: 0,
          passed: false,
          completedAt: null,
        },
      ],
      scenarioResults: [],
      averageScore: null,
    };

    expect(buildModuleResultsOverview(results)).toEqual([]);
  });

  it('returns an empty list when there is no results data', () => {
    expect(buildModuleResultsOverview(null)).toEqual([]);
  });
});

describe('buildModuleProgress', () => {
  const attempt = (id: number, moduleId: number, status: string, passed = false) => ({
    id,
    moduleId,
    moduleName: 'Module',
    status,
    totalScore: 0,
    maxScore: 0,
    percentageScore: passed ? 100 : 0,
    passed,
    completedAt: status === 'COMPLETED' ? '2026-09-01T00:00:00.000Z' : null,
  });

  it('should be Assigned with no attempts, even if its scenarios were answered elsewhere', () => {
    const progress = buildModuleProgress(
      {
        moduleResults: [attempt(1, 1, 'COMPLETED', true)],
        scenarioResults: [{ scenarioId: '7', moduleId: 1, correct: true, moduleResultId: 1 }],
        averageScore: null,
      },
      2,
      [7],
    );

    expect(progress.status).toBe('Assigned');
    expect(progress.progress).toBe(0);
  });

  it('should count only answers from the current attempt while in progress', () => {
    const progress = buildModuleProgress(
      {
        moduleResults: [attempt(1, 1, 'COMPLETED', true), attempt(2, 1, 'IN_PROGRESS')],
        scenarioResults: [
          { scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 1 },
          { scenarioId: '2', moduleId: 1, correct: true, moduleResultId: 1 },
          { scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 2 },
        ],
        averageScore: null,
      },
      1,
      [1, 2],
    );

    expect(progress.status).toBe('In progress');
    expect(progress.progress).toBe(0.5);
    // The earlier completed attempt still counts as a pass underneath.
    expect(progress.passed).toBeTrue();
    expect(Array.from(progress.answeredScenarioIds)).toEqual(['1']);
  });

  it('should stay completed after its scenarios change', () => {
    const progress = buildModuleProgress(
      { moduleResults: [attempt(1, 1, 'COMPLETED', true)], scenarioResults: [], averageScore: null },
      1,
      [],
    );

    expect(progress.status).toBe('Passed');
    expect(progress.progress).toBe(1);
  });
});
