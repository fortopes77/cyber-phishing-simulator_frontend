import { LearnerResults } from 'src/app/results/+state/results.model';
import {
  buildAreasForImprovement,
  buildAttemptHistory,
  buildLearnerProgress,
} from './learner-progress.model';

describe('learner progress model', () => {
  const scenarios = [
    { id: 1, title: 'Password reset email', interactionType: 'EMAIL' },
    { id: 2, title: 'Parcel text', interactionType: 'TEXT_MESSAGE' },
    { id: 3, title: 'Invoice email', interactionType: 'EMAIL' },
    { id: 4, title: 'Bank call', interactionType: 'PHONE_CALL' },
  ];

  const results: LearnerResults = {
    averageScore: null,
    moduleResults: [
      // Module 1: failed first try, passed on retry.
      { id: 10, moduleId: 1, moduleName: 'Email Basics', status: 'COMPLETED', totalScore: 1, maxScore: 2, percentageScore: 50, passed: false, completedAt: '2026-09-01T10:00:00Z' },
      { id: 11, moduleId: 1, moduleName: 'Email Basics', status: 'COMPLETED', totalScore: 2, maxScore: 2, percentageScore: 100, passed: true, completedAt: '2026-09-02T10:00:00Z' },
      // Module 2: completed, not passed.
      { id: 12, moduleId: 2, moduleName: 'Mobile Threats', status: 'COMPLETED', totalScore: 1, maxScore: 2, percentageScore: 50, passed: false, completedAt: '2026-09-03T10:00:00Z' },
      // Module 3: still in progress.
      { id: 13, moduleId: 3, moduleName: 'Voice Scams', status: 'IN_PROGRESS', totalScore: 0, maxScore: 0, percentageScore: 0, passed: false, completedAt: null, startedAt: '2026-09-04T10:00:00Z' },
    ],
    // Newest first, as GET /results/me returns them.
    scenarioResults: [
      { scenarioId: '4', moduleId: 3, correct: false, moduleResultId: 13, missedCues: ['Caller asks for PIN'], completedAt: '2026-09-04T10:05:00Z' },
      { scenarioId: '2', moduleId: 2, correct: false, moduleResultId: 12, missedCues: ['Unknown sender', 'Shortened link'], completedAt: '2026-09-03T10:05:00Z' },
      { scenarioId: '3', moduleId: 2, correct: true, moduleResultId: 12, completedAt: '2026-09-03T10:04:00Z' },
      { scenarioId: '1', moduleId: 1, correct: true, moduleResultId: 11, completedAt: '2026-09-02T10:05:00Z' },
      { scenarioId: '1', moduleId: 1, correct: false, moduleResultId: 10, missedCues: ['Shortened link'], completedAt: '2026-09-01T10:05:00Z' },
    ],
  };

  describe('buildLearnerProgress', () => {
    const progress = buildLearnerProgress(results, scenarios, 4);

    it('should average the latest completed score per module, like the dashboard', () => {
      // Module 1's latest is 100 (the retry), module 2 is 50.
      expect(progress.averageScore).toBe(75);
      expect(progress.moduleScores.map((m) => [m.moduleId, m.percentageScore])).toEqual(
        jasmine.arrayWithExactContents([[1, 100], [2, 50]]),
      );
    });

    it('should count completed modules against assigned ones', () => {
      expect(progress.modulesCompleted).toBe(2);
      expect(progress.modulesAssigned).toBe(4);
    });

    it('should never report more completed than assigned', () => {
      expect(buildLearnerProgress(results, scenarios, 1).modulesAssigned).toBe(2);
    });

    it('should count every module attempt and scenario answer', () => {
      expect(progress.totalAttempts).toBe(4);
      expect(progress.scenarioAnswers).toBe(5);
      expect(progress.correctAnswers).toBe(2);
    });

    it('should cope with no results at all', () => {
      const empty = buildLearnerProgress(null, [], 3);

      expect(empty.averageScore).toBeNull();
      expect(empty.totalAttempts).toBe(0);
      expect(empty.modulesAssigned).toBe(3);
      expect(empty.attemptHistory).toEqual([]);
    });
  });

  describe('buildAttemptHistory', () => {
    const history = buildAttemptHistory(results.moduleResults!, results.scenarioResults);

    it('should list every attempt newest first, retries included', () => {
      expect(history.map((row) => row.attemptId)).toEqual([13, 12, 11, 10]);
    });

    it("should tally each attempt's own answers", () => {
      const moduleTwo = history.find((row) => row.attemptId === 12)!;

      expect(moduleTwo.scenariosAnswered).toBe(2);
      expect(moduleTwo.scenariosCorrect).toBe(1);
    });

    it('should leave an in-progress attempt unscored and date it by when it started', () => {
      const inProgress = history.find((row) => row.attemptId === 13)!;

      expect(inProgress.completed).toBeFalse();
      expect(inProgress.percentageScore).toBeNull();
      expect(inProgress.passed).toBeNull();
      expect(inProgress.date).toBe('2026-09-04T10:00:00Z');
    });
  });

  describe('buildAreasForImprovement', () => {
    const areas = buildAreasForImprovement(results.scenarioResults, scenarios);

    it('should only use the latest answer per scenario, so a fixed mistake stops counting', () => {
      // Scenario 1 was wrong, then right on the retry - not something to revisit.
      expect(areas.scenariosToRevisit.map((s) => s.scenarioId)).toEqual(['4', '2']);
    });

    it('should rank weak message types by accuracy, ignoring ones with no mistakes', () => {
      expect(areas.messageTypes).toEqual([
        { interactionType: 'PHONE_CALL', label: 'Phone Call', correct: 0, total: 1, accuracy: 0 },
        { interactionType: 'TEXT_MESSAGE', label: 'Text Message', correct: 0, total: 1, accuracy: 0 },
      ]);
    });

    it("should count red flags missed on each scenario's latest answer", () => {
      expect(areas.missedCues).toEqual([
        { cue: 'Caller asks for PIN', count: 1 },
        { cue: 'Shortened link', count: 1 },
        { cue: 'Unknown sender', count: 1 },
      ]);
    });

    it('should merge the same red flag regardless of case, most-missed first', () => {
      const merged = buildAreasForImprovement(
        [
          { scenarioId: '1', moduleId: 1, correct: false, missedCues: ['Urgent tone'] },
          { scenarioId: '3', moduleId: 1, correct: false, missedCues: ['urgent tone ', 'Odd domain'] },
        ],
        scenarios,
      );

      expect(merged.missedCues).toEqual([
        { cue: 'Urgent tone', count: 2 },
        { cue: 'Odd domain', count: 1 },
      ]);
    });

    it("should skip message types for scenarios the learner can't see any more", () => {
      const unknown = buildAreasForImprovement(
        [{ scenarioId: '99', moduleId: 9, correct: false, title: 'Old scenario' }],
        scenarios,
      );

      expect(unknown.messageTypes).toEqual([]);
      expect(unknown.scenariosToRevisit).toEqual([
        { scenarioId: '99', title: 'Old scenario', moduleId: 9 },
      ]);
    });
  });
});
