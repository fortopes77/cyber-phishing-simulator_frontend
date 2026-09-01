import { createReducer, on } from '@ngrx/store';
import { ModulesActions } from './modules.actions';
import { LearnerModule } from './module.model';

export interface ModulesState {
  moduleList: LearnerModule[];
  module: LearnerModule | null;
  loading: boolean;
  error: string | null;
}

export const initialModulesState: ModulesState = {
  moduleList: [],
  module: null,
  loading: false,
  error: null,
};

export const modulesReducer = createReducer(
  initialModulesState,
  on(ModulesActions.fetchList, (state) => ({
    ...state,
    loading: true,
  })),
  on(ModulesActions.fetchListSuccess, (state, { modules }) => ({
    ...state,
    moduleList: modules,
    loading: false,
  })),
  on(ModulesActions.fetchListFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ModulesActions.fetchModuleDetails, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ModulesActions.fetchModuleDetailsSuccess, (state, { module }) => ({
    ...state,
    module,
    loading: false,
  })),
  on(ModulesActions.fetchModuleDetailsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ModulesActions.createModule, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ModulesActions.createModuleSuccess, (state, { module }) => ({
    ...state,
    module,
    moduleList: [...state.moduleList, module],
    loading: false,
  })),
  on(ModulesActions.createModuleFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ModulesActions.updateModule, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ModulesActions.updateModuleSuccess, (state, { module }) => ({
    ...state,
    module,
    moduleList: state.moduleList.map((existing) =>
      existing.moduleId === module.moduleId ? module : existing,
    ),
    loading: false,
  })),
  on(ModulesActions.updateModuleFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ModulesActions.deleteModule, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ModulesActions.deleteModuleSuccess, (state, { moduleId }) => ({
    ...state,
    moduleList: state.moduleList.filter(
      (existing) => existing.moduleId !== moduleId,
    ),
    loading: false,
  })),
  on(ModulesActions.deleteModuleFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
