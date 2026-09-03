/** One scenario's outcome, as extracted from GET /results/me. */
export interface ScenarioResult {
  scenarioId: string;
  moduleId: number | null;
  correct: boolean;
}

/**
 * The normalized shape of GET /results/me ("Detailed results for learner,
 * sorted by module and scenario") - a flat list of every scenario the
 * learner has completed, plus an optional server-computed overall score.
 */
export interface LearnerResults {
  scenarioResults: ScenarioResult[];
  averageScore: number | null;
}

export const EMPTY_LEARNER_RESULTS: LearnerResults = {
  scenarioResults: [],
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

  return {
    scenarioResults,
    averageScore: rawAverage != null ? Number(rawAverage) : null,
  };
}

function normalizeScenarioResult(
  raw: any,
  fallbackModuleId: number | null,
): ScenarioResult {
  const moduleId = raw?.moduleId != null ? Number(raw.moduleId) : fallbackModuleId;

  return {
    scenarioId: String(raw?.scenarioId ?? raw?.id ?? ''),
    moduleId,
    correct: !!(raw?.correct ?? raw?.isCorrect ?? raw?.passed),
  };
}
