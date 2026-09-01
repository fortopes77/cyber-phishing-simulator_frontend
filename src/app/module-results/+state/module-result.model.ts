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

// ASSUMPTION: no module-result-detail endpoint/contract was included in this
// upload - the field names here (totalScore/maxScore/percentageScore/
// passingScore/passed/scenarioResults) are a best guess mirroring the other
// resources' shapes. Normalized once here, at the boundary, the same way
// normalizeUser()/normalizeModule() are - update the raw-field fallbacks
// below once a real "GET module-results/:moduleId" contract is available.
export function normalizeModuleResult(raw: any): ModuleResult {
  const totalScore = Number(raw?.totalScore ?? raw?.score ?? 0);
  const maxScore = Number(raw?.maxScore ?? raw?.totalPossibleScore ?? 0);
  const percentageScore = Number(
    raw?.percentageScore ??
      raw?.scorePercentage ??
      (maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0),
  );
  const passingScore = Number(raw?.passingScore ?? 70);

  return {
    moduleId: Number(raw?.moduleId ?? raw?.id ?? 0),
    moduleName: raw?.moduleName ?? raw?.title ?? 'Module',
    totalScore,
    maxScore,
    percentageScore,
    passingScore,
    passed: raw?.passed ?? percentageScore >= passingScore,
    scenarioResults: (raw?.scenarioResults ?? raw?.scenarios ?? []).map(
      (scenario: any): ScenarioResultDetail => ({
        scenarioId: String(scenario?.scenarioId ?? scenario?.id ?? ''),
        title: scenario?.title ?? scenario?.scenarioTitle ?? 'Scenario',
        decision: scenario?.decision ?? scenario?.answer ?? '',
        correct: !!scenario?.correct,
      }),
    ),
  };
}
