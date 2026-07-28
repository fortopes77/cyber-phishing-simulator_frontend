import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const ScenarioActions = createActionGroup({
  source: 'Scenario',
  events: {
    fetchList: emptyProps(),
    fetchListSuccess: props<{ scenarios: any[] }>(),
    fetchListFailure: props<{ error: string }>(),
    fetchScenarioDetails: props<{ scenarioId: string }>(),
    fetchScenarioDetailsSuccess: props<{ scenario: any }>(),
    fetchScenarioDetailsFailure: props<{ error: string }>(),
    createAIScenario: emptyProps(),
    createAIScenarioSuccess: props<{ scenario: any }>(),
    createAIScenarioFailure: props<{ error: string }>(),
    createScenario: props<{ scenario: any }>(),
    createScenarioSuccess: props<{ scenario: any }>(),
    createScenarioFailure: props<{ error: string }>(),
  },
});
