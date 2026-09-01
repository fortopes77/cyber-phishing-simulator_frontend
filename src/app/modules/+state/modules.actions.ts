import { createActionGroup, props } from '@ngrx/store';
import { LearnerModule } from './module.model';

export const ModulesActions = createActionGroup({
  source: 'Modules',
  events: {
    // userId scopes the request to a specific learner's assigned modules
    // (e.g. the learner dashboard) - omit it (pass {}) for a trainer-facing
    // catalog view that should see every module in the org.
    fetchList: props<{ userId?: string }>(),
    fetchListSuccess: props<{ modules: LearnerModule[] }>(),
    fetchListFailure: props<{ error: string }>(),
    fetchModuleDetails: props<{ moduleId: number }>(),
    fetchModuleDetailsSuccess: props<{ module: LearnerModule }>(),
    fetchModuleDetailsFailure: props<{ error: string }>(),
    createModule: props<{ module: Partial<LearnerModule> }>(),
    createModuleSuccess: props<{ module: LearnerModule }>(),
    createModuleFailure: props<{ error: string }>(),
    updateModule: props<{
      moduleId: number;
      updatedModule: Partial<LearnerModule>;
    }>(),
    updateModuleSuccess: props<{ module: LearnerModule }>(),
    updateModuleFailure: props<{ error: string }>(),
    deleteModule: props<{ moduleId: number }>(),
    deleteModuleSuccess: props<{ moduleId: number }>(),
    deleteModuleFailure: props<{ error: string }>(),
  },
});
