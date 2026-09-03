import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ModulesActions } from './modules.actions';
import { ModulesService } from './modules.service';
import { LearnerModule, normalizeModule } from './module.model';

@Injectable()
export class ModulesEffects {
  constructor(
    private actions$: Actions,
    private modulesService: ModulesService,
  ) {}

  fetchModules$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModulesActions.fetchList),
      mergeMap((action) =>
        this.modulesService.getModules(action.assignedToMe).pipe(
          map((response: LearnerModule[] | { modules: LearnerModule[] }) =>
            ModulesActions.fetchListSuccess({
              modules: (Array.isArray(response)
                ? response
                : response.modules
              ).map(normalizeModule),
            }),
          ),
          catchError((error) =>
            of(
              ModulesActions.fetchListFailure({
                error: error.message || 'Failed to fetch modules',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  fetchModuleDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModulesActions.fetchModuleDetails),
      mergeMap((action) =>
        this.modulesService.getModuleDetails(action.moduleId).pipe(
          map((module: LearnerModule) =>
            ModulesActions.fetchModuleDetailsSuccess({
              module: normalizeModule(module),
            }),
          ),
          catchError((error) =>
            of(
              ModulesActions.fetchModuleDetailsFailure({
                error: error.message || 'Failed to fetch module details',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createModule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModulesActions.createModule),
      mergeMap((action) =>
        this.modulesService.createModule(action.module).pipe(
          map((module: LearnerModule) =>
            ModulesActions.createModuleSuccess({
              module: normalizeModule(module),
            }),
          ),
          catchError((error) =>
            of(
              ModulesActions.createModuleFailure({
                error: error.message || 'Failed to create module',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateModule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModulesActions.updateModule),
      mergeMap((action) =>
        this.modulesService
          .updateModule(action.moduleId, action.updatedModule)
          .pipe(
            map((module: LearnerModule) =>
              ModulesActions.updateModuleSuccess({
                module: normalizeModule(module),
              }),
            ),
            catchError((error) =>
              of(
                ModulesActions.updateModuleFailure({
                  error: error.message || 'Failed to update module',
                }),
              ),
            ),
          ),
      ),
    ),
  );

  deleteModule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModulesActions.deleteModule),
      mergeMap((action) =>
        this.modulesService.deleteModule(action.moduleId).pipe(
          map(() =>
            ModulesActions.deleteModuleSuccess({ moduleId: action.moduleId }),
          ),
          catchError((error) =>
            of(
              ModulesActions.deleteModuleFailure({
                error: error.message || 'Failed to delete module',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  assignLearner$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModulesActions.assignLearner),
      mergeMap((action) =>
        this.modulesService.assignLearner(action.moduleId, action.userId).pipe(
          map(() =>
            ModulesActions.assignLearnerSuccess({
              moduleId: action.moduleId,
              userId: action.userId,
            }),
          ),
          catchError((error) =>
            of(
              ModulesActions.assignLearnerFailure({
                userId: action.userId,
                error: error.message || 'Failed to assign learner',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  unassignLearner$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ModulesActions.unassignLearner),
      mergeMap((action) =>
        this.modulesService
          .unassignLearner(action.moduleId, action.userId)
          .pipe(
            map(() =>
              ModulesActions.unassignLearnerSuccess({
                moduleId: action.moduleId,
                userId: action.userId,
              }),
            ),
            catchError((error) =>
              of(
                ModulesActions.unassignLearnerFailure({
                  userId: action.userId,
                  error: error.message || 'Failed to unassign learner',
                }),
              ),
            ),
          ),
      ),
    ),
  );
}
