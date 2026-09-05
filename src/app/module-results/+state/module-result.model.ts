import { LearnerResults, ModuleResultSummary } from 'src/app/results/+state/results.model';

export interface ScenarioResultDetail {
  scenarioId: string;
  title: string;
  decision: string;
  correct: boolean;
}

export interface ModuleResult {
  moduleId: number;
  moduleName: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  passingScore: number;
  passed: boolean;
  scenarioResults: ScenarioResultDetail[];
}

// The backend has no passing-score field on a module result (or on the
// module itself yet) - 70% is a placeholder pass mark until one exists.
const DEFAULT_PASSING_SCORE = 70;

// Points are one per scenario rather than whatever weighting the backend's
// own total_score/max_possible_score used - a module with 3 scenarios is
// worth 3 points, one per correct answer, regardless of difficulty or answer
// mode.
function computeScoreFromScenarios(scenarios: { correct: boolean }[]): {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
} {
  const maxScore = scenarios.length;
  const totalScore = scenarios.filter((scenario) => scenario.correct).length;
  const percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  return { totalScore, maxScore, percentageScore };
}

// COMPLETED beats any other status regardless of id, so a module the learner
// finished and then retried-but-abandoned (leaving a newer IN_PROGRESS
// attempt with near-empty stats) still shows the finished attempt's real
// score rather than the incomplete one. Within the same completeness, the
// most recent attempt (highest id) wins.
function isMoreComplete(
  candidate: ModuleResultSummary,
  current: ModuleResultSummary,
): boolean {
  const candidateCompleted = candidate.status === 'COMPLETED';
  const currentCompleted = current.status === 'COMPLETED';
  if (candidateCompleted !== currentCompleted) {
    return candidateCompleted;
  }
  return candidate.id > current.id;
}

/**
 * There's no per-module-result detail endpoint a learner can call (GET
 * /results/module/:id is trainer/admin-only - confirmed 403 for a learner
 * token - and the previously assumed GET /module-results/:id doesn't exist
 * at all, confirmed 404). GET /results/me already returns everything needed
 * - a moduleResults[] summary per attempt plus a flat scenarioResults[] - so
 * this builds the module-results page's view model from that instead of a
 * second network call.
 *
 * A learner can retry a module, so moduleResults can hold more than one
 * entry for the same moduleId - the most complete one (see isMoreComplete)
 * is treated as "the" result, and only its own scenarioResults (matched by
 * moduleResultId) are shown.
 */
export function buildModuleResult(
  results: LearnerResults | null,
  moduleId: number,
): ModuleResult | null {
  const attempts = (results?.moduleResults ?? []).filter(
    (attempt) => attempt.moduleId === moduleId,
  );

  if (!attempts.length) {
    return null;
  }

  const latest = attempts.reduce((a, b) => (isMoreComplete(b, a) ? b : a));

  const scenarioResults = (results?.scenarioResults ?? [])
    .filter((scenario) => scenario.moduleResultId === latest.id)
    .map(
      (scenario): ScenarioResultDetail => ({
        scenarioId: scenario.scenarioId,
        title: scenario.title ?? 'Scenario',
        decision: scenario.decision ?? '',
        correct: scenario.correct,
      }),
    );

  return {
    moduleId: latest.moduleId,
    moduleName: latest.moduleName,
    ...computeScoreFromScenarios(scenarioResults),
    passingScore: DEFAULT_PASSING_SCORE,
    passed: latest.passed,
    scenarioResults,
  };
}

/** One row of the all-modules results list - the mark the learner got on a completed module. */
export interface ModuleResultOverviewRow {
  moduleId: number;
  moduleName: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  completedAt: string | null;
}

/**
 * The overview shown at /learner/results when reached from the nav (as
 * opposed to a single module's breakdown at
 * /learner/modules/:moduleId/results) - one row per module the learner has
 * completed, using their most recent attempt's mark when a module was
 * retried. In-progress attempts (status !== COMPLETED) are left out since
 * there's no mark to show yet.
 */
export function buildModuleResultsOverview(
  results: LearnerResults | null,
): ModuleResultOverviewRow[] {
  const latestByModule = new Map<number, ModuleResultSummary>();

  for (const attempt of results?.moduleResults ?? []) {
    if (attempt.status !== 'COMPLETED') {
      continue;
    }
    const existing = latestByModule.get(attempt.moduleId);
    if (!existing || attempt.id > existing.id) {
      latestByModule.set(attempt.moduleId, attempt);
    }
  }

  const scenarioResults = results?.scenarioResults ?? [];

  return Array.from(latestByModule.values())
    .map((attempt): ModuleResultOverviewRow => {
      const attemptScenarios = scenarioResults.filter(
        (scenario) => scenario.moduleResultId === attempt.id,
      );

      return {
        moduleId: attempt.moduleId,
        moduleName: attempt.moduleName,
        ...computeScoreFromScenarios(attemptScenarios),
        passed: attempt.passed,
        completedAt: attempt.completedAt,
      };
    })
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}
