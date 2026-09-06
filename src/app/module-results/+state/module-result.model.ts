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
    // Use the backend's own score, not a recount of scenarioResults - it's
    // the same score the backend used to decide `passed`, so the two can
    // never disagree (e.g. a learner picking the right verdict on every
    // scenario but missing some cues can score under 100% and fail, even
    // though every scenario reads "correct" here).
    totalScore: latest.totalScore,
    maxScore: latest.maxScore,
    percentageScore: latest.percentageScore,
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

  return Array.from(latestByModule.values())
    .map(
      (attempt): ModuleResultOverviewRow => ({
        moduleId: attempt.moduleId,
        moduleName: attempt.moduleName,
        // Use the backend's own score - see the matching comment in
        // buildModuleResult for why this can't be recounted from
        // scenarioResults without disagreeing with `passed`.
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentageScore: attempt.percentageScore,
        passed: attempt.passed,
        completedAt: attempt.completedAt,
      }),
    )
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}
