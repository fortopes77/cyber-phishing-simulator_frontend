import { createReducer, on } from '@ngrx/store';
import { ModulesActions } from './modules.actions';
import { LearnerModule } from './module.model';

export interface ModulesState {
  moduleList: LearnerModule[];
  loading: boolean;
  error: string | null;
}

export const initialModulesState: ModulesState = {
  moduleList: [],
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
);
