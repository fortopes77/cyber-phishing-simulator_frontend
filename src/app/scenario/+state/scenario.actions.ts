import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const ScenarioActions = createActionGroup({
  source: 'Scenario',
  events: {
    fetchList: emptyProps(),
    fetchListSuccess: props<{ scenarios: any[] }>(),
    fetchListFailure: props<{ error: string }>(),
  },
});
