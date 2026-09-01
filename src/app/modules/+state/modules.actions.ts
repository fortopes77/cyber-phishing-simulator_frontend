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
    // Trainer-initiated learner assignment from ModuleEditComponent's "Assign
    // learners" search panel. Not tracked in ModulesState (see UsersActions'
    // resetUserPassword for the same pattern) - the component tracks
    // per-learner loading/added state locally via an Actions$ subscription.
    assignLearner: props<{ moduleId: number; userId: number }>(),
    assignLearnerSuccess: props<{ moduleId: number; userId: number }>(),
    assignLearnerFailure: props<{ userId: number; error: string }>(),
    // The toggle's "off" direction (DELETE /training-modules/{moduleId}/
    // assignments/{userId}, confirmed via GET /api-json). Since there's no
    // GET to list existing assignments, this can only ever undo an
    // assignment made earlier in the same session - see the ASSUMPTION note
    // on ModuleEditComponent.
    unassignLearner: props<{ moduleId: number; userId: number }>(),
    unassignLearnerSuccess: props<{ moduleId: number; userId: number }>(),
    unassignLearnerFailure: props<{ userId: number; error: string }>(),
  },
});
