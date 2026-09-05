/** One scenario's outcome, as extracted from GET /results/me. */
export interface ScenarioResult {
  scenarioId: string;
  moduleId: number | null;
  correct: boolean;
  /** Present when GET /results/me returns the nested `scenario` object. */
  title?: string;
  /** The learner's submitted response (e.g. "Suspicious" / "Safe"). */
  decision?: string;
  score?: number;
  missedCues?: string[];
  moduleResultId?: number | null;
}

/**
 * One completed (or in-progress) attempt at a module, as extracted from the
 * `moduleResults` array of GET /results/me. A learner can have more than one
 * of these per module (retries), so consumers that want "the" result for a
 * module should pick the most recent by id.
 */
export interface ModuleResultSummary {
  id: number;
  moduleId: number;
  moduleName: string;
  status: string;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  completedAt: string | null;
}

/**
 * The normalized shape of GET /results/me ("Detailed results for learner,
 * sorted by module and scenario") - a flat list of every scenario the
 * learner has completed, the per-module attempt summaries they roll up
 * into, plus an optional server-computed overall score.
 */
export interface LearnerResults {
  scenarioResults: ScenarioResult[];
  moduleResults?: ModuleResultSummary[];
  averageScore: number | null;
}

export const EMPTY_LEARNER_RESULTS: LearnerResults = {
  scenarioResults: [],
  moduleResults: [],
  averageScore: null,
};

/**
 * Confirmed live against GET /results/me: the response envelope is
 * `{ moduleResults: [...], scenarioResults: [...] }` (both were empty for
 * the test account used, which has no completed scenarios yet, so the
 * envelope shape is verified but the field names *inside* a populated
 * scenarioResults entry are still a best guess, aliased below). moduleResults
 * isn't consumed yet - nothing in this app needs per-module server-computed
 * stats today, but it's there once something does. Re-verify the entry-level
 * field names once a learner account with real completed scenarios is
 * available to inspect.
 */
export function normalizeLearnerResults(raw: any): LearnerResults {
  const entries: any[] = Array.isArray(raw)
    ? raw
    : (raw?.scenarioResults ?? raw?.results ?? raw?.modules ?? raw?.data ?? []);

  const scenarioResults: ScenarioResult[] = [];

  for (const entry of entries) {
    const nested = entry?.scenarios ?? entry?.scenarioResults;

    if (Array.isArray(nested)) {
      const moduleId =
        entry?.moduleId != null ? Number(entry.moduleId) : null;

      for (const scenario of nested) {
        scenarioResults.push(normalizeScenarioResult(scenario, moduleId));
      }
    } else {
      scenarioResults.push(normalizeScenarioResult(entry, null));
    }
  }

  const rawAverage = raw?.averageScore ?? raw?.overallScore ?? raw?.score;

  const moduleResults: ModuleResultSummary[] = Array.isArray(raw?.moduleResults)
    ? raw.moduleResults.map(normalizeModuleResultSummary)
    : [];

  return {
    scenarioResults,
    moduleResults,
    averageScore: rawAverage != null ? Number(rawAverage) : null,
  };
}

// Confirmed live against a populated GET /results/me: module.title (not
// moduleName) and snake_case score fields (total_score/max_possible_score/
// percentage_score) - normalized here the same way normalizeModule() aliases
// title -> moduleName elsewhere.
function normalizeModuleResultSummary(raw: any): ModuleResultSummary {
  return {
    id: Number(raw?.id ?? 0),
    moduleId: Number(raw?.moduleId ?? 0),
    moduleName: raw?.module?.title ?? raw?.moduleName ?? 'Module',
    status: raw?.status ?? '',
    totalScore: Number(raw?.total_score ?? raw?.totalScore ?? 0),
    maxScore: Number(raw?.max_possible_score ?? raw?.maxScore ?? 0),
    percentageScore: Number(raw?.percentage_score ?? raw?.percentageScore ?? 0),
    passed: !!raw?.passed,
    completedAt: raw?.completedAt ?? null,
  };
}

function normalizeScenarioResult(
  raw: any,
  fallbackModuleId: number | null,
): ScenarioResult {
  const moduleId = raw?.moduleId != null ? Number(raw.moduleId) : fallbackModuleId;

  const result: ScenarioResult = {
    scenarioId: String(raw?.scenarioId ?? raw?.id ?? ''),
    moduleId,
    correct: !!(raw?.correct ?? raw?.isCorrect ?? raw?.passed),
  };

  // Optional detail fields, only confirmed present on a populated GET
  // /results/me entry - added conditionally so callers that don't have them
  // (e.g. the older module-grouped/flat test fixtures) keep the exact same
  // shape as before.
  const title = raw?.scenario?.title ?? raw?.title;
  if (title != null) {
    result.title = title;
  }
  const decision = raw?.response ?? raw?.decision;
  if (decision != null) {
    result.decision = decision;
  }
  if (raw?.score != null) {
    result.score = Number(raw.score);
  }
  if (Array.isArray(raw?.missedCues)) {
    result.missedCues = raw.missedCues;
  }
  if (raw?.moduleResultId != null) {
    result.moduleResultId = Number(raw.moduleResultId);
  }

  return result;
}
