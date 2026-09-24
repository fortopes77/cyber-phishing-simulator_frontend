import {
  LearnerResults,
  ModuleResultSummary,
  ScenarioResult,
} from 'src/app/results/+state/results.model';
import { buildModuleResultsOverview } from 'src/app/module-results/+state/module-result.model';
import { getScenarioOptionLabel } from 'src/app/scenario/models/scenario.model';

/** One module attempt in the learner's attempt history, newest first. */
export interface AttemptHistoryRow {
  attemptId: number;
  moduleId: number;
  moduleName: string;
  completed: boolean;
  // Only a completed attempt has a mark.
  percentageScore: number | null;
  passed: boolean | null;
  scenariosAnswered: number;
  scenariosCorrect: number;
  // completedAt for a finished attempt, otherwise when it was started.
  date: string | null;
}

export interface ModuleScore {
  moduleId: number;
  moduleName: string;
  percentageScore: number;
  passed: boolean;
}

/** How the learner does on one message type (email, text, call, social). */
export interface MessageTypeAccuracy {
  interactionType: string;
  label: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface MissedCueCount {
  cue: string;
  count: number;
}

export interface ScenarioToRevisit {
  scenarioId: string;
  title: string;
  moduleId: number | null;
}

/**
 * "Areas for improvement" - derived here from what the learner-facing API
 * actually returns, since the backend has no learner-facing weakness
 * endpoint (the per-learner `weaknesses` on GET /users/learners is
 * staff-only, and GET /results/me doesn't include scenario categories).
 * Every signal uses each scenario's most recent answer, so a scenario the
 * learner has since got right stops counting against them.
 */
export interface AreasForImprovement {
  // Message types (interactionType, from the learner's GET /scenarios)
  // with at least one wrong latest answer, weakest first.
  messageTypes: MessageTypeAccuracy[];
  // Red flags the learner failed to spot, most often missed first.
  missedCues: MissedCueCount[];
  // Scenarios whose latest answer was wrong.
  scenariosToRevisit: ScenarioToRevisit[];
}

export interface LearnerProgress {
  // Same figure as the learner dashboard: the mean of each completed
  // module's latest backend-computed percentageScore.
  averageScore: number | null;
  modulesCompleted: number;
  modulesAssigned: number;
  // Every module attempt, completed or in progress (retries included).
  totalAttempts: number;
  scenarioAnswers: number;
  correctAnswers: number;
  moduleScores: ModuleScore[];
  attemptHistory: AttemptHistoryRow[];
  areasForImprovement: AreasForImprovement;
}

const MAX_MISSED_CUES = 5;

export function buildLearnerProgress(
  results: LearnerResults | null,
  scenarios: any[],
  assignedModuleCount: number,
): LearnerProgress {
  const moduleResults = results?.moduleResults ?? [];
  const scenarioResults = results?.scenarioResults ?? [];
  const overview = buildModuleResultsOverview(results);

  const averageScore = overview.length
    ? Math.round(
        overview.reduce((sum, row) => sum + row.percentageScore, 0) / overview.length,
      )
    : null;

  return {
    averageScore,
    modulesCompleted: overview.length,
    // A module the learner completed may since have been unassigned - never
    // report more completed than assigned.
    modulesAssigned: Math.max(assignedModuleCount, overview.length),
    totalAttempts: moduleResults.length,
    scenarioAnswers: scenarioResults.length,
    correctAnswers: scenarioResults.filter((result) => result.correct).length,
    moduleScores: overview.map((row) => ({
      moduleId: row.moduleId,
      moduleName: row.moduleName,
      percentageScore: row.percentageScore,
      passed: row.passed,
    })),
    attemptHistory: buildAttemptHistory(moduleResults, scenarioResults),
    areasForImprovement: buildAreasForImprovement(scenarioResults, scenarios),
  };
}

export function buildAttemptHistory(
  moduleResults: ModuleResultSummary[],
  scenarioResults: ScenarioResult[],
): AttemptHistoryRow[] {
  return [...moduleResults]
    .sort((a, b) => b.id - a.id)
    .map((attempt) => {
      const answers = scenarioResults.filter(
        (result) => result.moduleResultId === attempt.id,
      );
      const completed = attempt.status === 'COMPLETED';

      return {
        attemptId: attempt.id,
        moduleId: attempt.moduleId,
        moduleName: attempt.moduleName,
        completed,
        percentageScore: completed ? attempt.percentageScore : null,
        passed: completed ? attempt.passed : null,
        scenariosAnswered: answers.length,
        scenariosCorrect: answers.filter((answer) => answer.correct).length,
        date: attempt.completedAt ?? attempt.startedAt ?? null,
      };
    });
}

export function buildAreasForImprovement(
  scenarioResults: ScenarioResult[],
  scenarios: any[],
): AreasForImprovement {
  const latest = latestAnswerPerScenario(scenarioResults);
  const scenarioById = new Map(
    (scenarios ?? []).map((scenario) => [String(scenario.id), scenario]),
  );

  // Message types - scenarios no longer visible to the learner (e.g. their
  // module was unassigned) have no known interactionType, so are skipped.
  const byType = new Map<string, { correct: number; total: number }>();
  for (const answer of latest) {
    const interactionType = scenarioById.get(answer.scenarioId)?.interactionType;
    if (!interactionType) {
      continue;
    }
    const tally = byType.get(interactionType) ?? { correct: 0, total: 0 };
    tally.total += 1;
    if (answer.correct) {
      tally.correct += 1;
    }
    byType.set(interactionType, tally);
  }
  const messageTypes = Array.from(byType.entries())
    .filter(([, tally]) => tally.correct < tally.total)
    .map(([interactionType, tally]) => ({
      interactionType,
      label: getScenarioOptionLabel(interactionType),
      correct: tally.correct,
      total: tally.total,
      accuracy: Math.round((tally.correct / tally.total) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);

  // Red flags - counted case-insensitively, shown as first spelled.
  const cueCounts = new Map<string, MissedCueCount>();
  for (const answer of latest) {
    for (const cue of answer.missedCues ?? []) {
      const trimmed = cue.trim();
      if (!trimmed) {
        continue;
      }
      const key = trimmed.toLowerCase();
      const entry = cueCounts.get(key) ?? { cue: trimmed, count: 0 };
      entry.count += 1;
      cueCounts.set(key, entry);
    }
  }
  const missedCues = Array.from(cueCounts.values())
    .sort((a, b) => b.count - a.count || a.cue.localeCompare(b.cue))
    .slice(0, MAX_MISSED_CUES);

  const scenariosToRevisit = latest
    .filter((answer) => !answer.correct)
    .map((answer) => ({
      scenarioId: answer.scenarioId,
      title: answer.title ?? scenarioById.get(answer.scenarioId)?.title ?? 'Scenario',
      moduleId: answer.moduleId,
    }));

  return { messageTypes, missedCues, scenariosToRevisit };
}

// GET /results/me returns every answer, newest first. Prefer the answer's
// own completedAt when both have one, and otherwise keep the first seen
// (i.e. the newest, per the backend's ordering).
function latestAnswerPerScenario(scenarioResults: ScenarioResult[]): ScenarioResult[] {
  const latest = new Map<string, ScenarioResult>();

  for (const answer of scenarioResults) {
    const existing = latest.get(answer.scenarioId);
    if (!existing) {
      latest.set(answer.scenarioId, answer);
      continue;
    }
    if (
      existing.completedAt &&
      answer.completedAt &&
      new Date(answer.completedAt).getTime() > new Date(existing.completedAt).getTime()
    ) {
      latest.set(answer.scenarioId, answer);
    }
  }

  return Array.from(latest.values());
}
