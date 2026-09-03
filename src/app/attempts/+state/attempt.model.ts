export type ModuleAttemptStatus = 'IN_PROGRESS' | 'COMPLETED';

/**
 * A learner's attempt session at a module's scenarios - confirmed live
 * against POST /attempts, GET /attempts/{id} and POST /results/attempts/
 * {attemptId}/finalize, which all return this same shape (snake_case score
 * fields and all). One of these covers every scenario the learner answers
 * in that session; grading updates live as each scenario-attempt is
 * submitted, and finalize just locks it in as COMPLETED.
 */
export interface ModuleAttempt {
  id: number;
  moduleId: number;
  status: ModuleAttemptStatus;
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  scenariosCompleted: number;
  totalScenarios: number;
  passed: boolean;
  completedAt: string | null;
}

export function normalizeModuleAttempt(raw: any): ModuleAttempt {
  return {
    id: Number(raw?.id),
    moduleId: Number(raw?.moduleId),
    status: raw?.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
    totalScore: Number(raw?.total_score ?? raw?.totalScore ?? 0),
    maxPossibleScore: Number(
      raw?.max_possible_score ?? raw?.maxPossibleScore ?? 0,
    ),
    percentageScore: Number(
      raw?.percentage_score ?? raw?.percentageScore ?? 0,
    ),
    scenariosCompleted: Number(
      raw?.scenarios_completed ?? raw?.scenariosCompleted ?? 0,
    ),
    totalScenarios: Number(raw?.total_scenarios ?? raw?.totalScenarios ?? 0),
    passed: !!raw?.passed,
    completedAt: raw?.completedAt ?? null,
  };
}

/**
 * The payload for POST /attempts/{attemptId}/scenario-attempts
 * (CreateScenarioAttemptDto) - confirmed live against a real request.
 */
export interface ScenarioAttemptInput {
  scenarioId: number;
  moduleId: number;
  // "Which attempt number this is for this scenario" per the DTO - there's
  // no retry flow wired up in the UI yet, so every submission is always
  // this scenario's first attempt within its module attempt.
  attemptNumber: number;
  response: string;
  timeTakenSeconds?: number;
  startedAt: string;
  completedAt: string;
  // Confirmed live: despite Swagger declaring this an array of strings, the
  // real validator rejects an array outright ("selectedCues must be a
  // string") and only accepts a string - verified working as an empty
  // string for a "simple" scenario with nothing selected (every scenario in
  // this environment's test data). The multi-cue join format for a
  // "detailed" scenario is UNVERIFIED (comma-joined here) - no such
  // scenario existed in this environment to confirm against; re-check once
  // one does.
  selectedCues: string;
}

/**
 * One scenario's graded result within a module attempt - the response from
 * POST .../scenario-attempts (confirmed live: grading is immediate, no need
 * to wait for finalize to know correct/incorrect), and the shape of each
 * entry nested under GET /attempts/{id}.scenarioAttempts and GET /results/me.
 */
export interface ScenarioAttemptResult {
  attemptId: number;
  scenarioId: string;
  moduleId: number;
  response: string;
  correct: boolean;
  score: number;
  missedCues: string[];
}

export function normalizeScenarioAttemptResult(raw: any): ScenarioAttemptResult {
  return {
    attemptId: Number(raw?.attemptId ?? raw?.moduleResultId ?? 0),
    scenarioId: String(raw?.scenarioId ?? ''),
    moduleId: Number(raw?.moduleId ?? 0),
    response: raw?.response ?? '',
    correct: !!raw?.isCorrect,
    score: Number(raw?.score ?? 0),
    missedCues: Array.isArray(raw?.missedCues) ? raw.missedCues : [],
  };
}
