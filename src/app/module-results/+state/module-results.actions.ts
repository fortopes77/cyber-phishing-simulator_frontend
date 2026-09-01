import { createActionGroup, props } from '@ngrx/store';
import { ModuleResult } from './module-result.model';

export const ModuleResultsActions = createActionGroup({
  source: 'ModuleResults',
  events: {
    fetchModuleResult: props<{ moduleId: number }>(),
    fetchModuleResultSuccess: props<{ result: ModuleResult }>(),
    fetchModuleResultFailure: props<{ error: string }>(),
  },
});
