import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ReportsActions } from './reports.actions';
import { ReportsService } from './reports.service';
import {
  normalizeLearnerReportDetail,
  normalizeLearnerReportRows,
  normalizeModuleReportDetail,
  normalizeModuleReportRows,
  normalizeReportOverview,
} from './reports.model';

// The backend's own message (e.g. an invalid date, or no access to that
// organisation) beats HttpErrorResponse's generic "Http failure response".
function errorMessage(error: any, fallback: string): string {
  const apiMessage = error?.error?.message;
  if (Array.isArray(apiMessage)) {
    return apiMessage.join(', ');
  }
  return apiMessage || error?.message || fallback;
}

// switchMap throughout: a newer request (e.g. the date range changing
// again) makes the in-flight one irrelevant, so it's cancelled rather than
// left to land out of order.
@Injectable()
export class ReportsEffects {
  constructor(
    private actions$: Actions,
    private reportsService: ReportsService,
  ) {}

  fetchReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.fetchReport),
      switchMap(({ organisationId, range }) =>
        forkJoin({
          overview: this.reportsService.getOverview(organisationId, range),
          modules: this.reportsService.getModules(organisationId, range),
        }).pipe(
          map(({ overview, modules }) =>
            ReportsActions.fetchReportSuccess({
              overview: normalizeReportOverview(overview),
              modules: normalizeModuleReportRows(modules),
            }),
          ),
          catchError((error) =>
            of(
              ReportsActions.fetchReportFailure({
                error: errorMessage(error, 'Failed to load the report'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  fetchLearners$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.fetchLearners),
      switchMap(({ organisationId, range, status }) =>
        this.reportsService.getLearners(organisationId, range, status).pipe(
          map((learners) =>
            ReportsActions.fetchLearnersSuccess({
              learners: normalizeLearnerReportRows(learners),
            }),
          ),
          catchError((error) =>
            of(
              ReportsActions.fetchLearnersFailure({
                error: errorMessage(error, 'Failed to load learner results'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  fetchModuleDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.fetchModuleDetail),
      switchMap(({ organisationId, moduleId, range }) =>
        this.reportsService.getModuleDetail(organisationId, moduleId, range).pipe(
          map((detail) =>
            ReportsActions.fetchModuleDetailSuccess({
              detail: normalizeModuleReportDetail(detail),
            }),
          ),
          catchError((error) =>
            of(
              ReportsActions.fetchModuleDetailFailure({
                error: errorMessage(error, 'Failed to load the module breakdown'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  fetchLearnerDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReportsActions.fetchLearnerDetail),
      switchMap(({ organisationId, userId }) =>
        this.reportsService.getLearnerDetail(organisationId, userId).pipe(
          map((detail) =>
            ReportsActions.fetchLearnerDetailSuccess({
              detail: normalizeLearnerReportDetail(detail),
            }),
          ),
          catchError((error) =>
            of(
              ReportsActions.fetchLearnerDetailFailure({
                error: errorMessage(error, "Failed to load the learner's modules"),
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
