import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LearnerModule } from './module.model';

export const ModulesActions = createActionGroup({
  source: 'Modules',
  events: {
    fetchList: emptyProps(),
    fetchListSuccess: props<{ modules: LearnerModule[] }>(),
    fetchListFailure: props<{ error: string }>(),
  },
});
