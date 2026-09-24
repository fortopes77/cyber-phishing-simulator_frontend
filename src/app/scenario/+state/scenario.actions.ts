import { createActionGroup, props } from '@ngrx/store';
import { ScenarioAnswerMode } from '../models/scenario.model';

export const ScenarioActions = createActionGroup({
  source: 'Scenario',
  events: {
    // organisationId narrows a global admin's list to one organisation (null
    // or omitted = every organisation). Everyone else is scoped server-side
    // to their own organisation / assigned modules, so they omit it.
    fetchList: props<{ organisationId?: number | null }>(),
    fetchListSuccess: props<{ scenarios: any[] }>(),
    fetchListFailure: props<{ error: string }>(),
    fetchScenariosByModule: props<{ moduleId: number }>(),
    fetchScenariosByModuleSuccess: props<{ scenarios: any[] }>(),
    fetchScenariosByModuleFailure: props<{ error: string }>(),
    fetchScenarioDetails: props<{ scenarioId: string }>(),
    fetchScenarioDetailsSuccess: props<{ scenario: any }>(),
    fetchScenarioDetailsFailure: props<{ error: string }>(),
    createAIScenario: props<{ answerMode: ScenarioAnswerMode }>(),
    createAIScenarioSuccess: props<{ scenario: any }>(),
    createAIScenarioFailure: props<{ error: string }>(),
    createScenario: props<{ scenario: any }>(),
    createScenarioSuccess: props<{ scenario: any }>(),
    createScenarioFailure: props<{ error: string }>(),
    updateScenario: props<{ scenarioId: string; updatedScenario: any }>(),
    updateScenarioSuccess: props<{ scenario: any }>(),
    updateScenarioFailure: props<{ error: string }>(),
    deleteScenario: props<{ scenarioId: string }>(),
    deleteScenarioSuccess: props<{ scenarioId: string }>(),
    deleteScenarioFailure: props<{ error: string }>(),
  },
});
