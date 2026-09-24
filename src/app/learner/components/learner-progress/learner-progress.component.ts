import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DataCardComponent } from 'src/app/shared/components/data-card/data-card.component';
import { DashboardCardComponent } from 'src/app/shared/components/dashboard-card/dashboard-card.component';
import { ProgressRowComponent } from 'src/app/shared/components/progress-row/progress-row.component';
import {
  StatusBadgeComponent,
  StatusBadgeVariant,
} from 'src/app/shared/components/status-badge/status-badge.component';
import {
  ListAction,
  ListCellTemplateDirective,
  ListColumn,
  ListComponent,
} from 'src/app/shared/components/list/list.component';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { ScenarioActions } from 'src/app/scenario/+state/scenario.actions';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { ResultsActions } from 'src/app/results/+state/results.actions';
import {
  selectMyResults,
  selectResultsError,
  selectResultsLoading,
} from 'src/app/results/+state/results.selectors';
import {
  AttemptHistoryRow,
  buildLearnerProgress,
  LearnerProgress,
} from '../../models/learner-progress.model';
import { PASSING_SCORE } from 'src/app/module-results/+state/module-result.model';


/**
 * The learner's personal progress page - headline stats, per-module scores,
 * areas for improvement and their full attempt history, all built
 * client-side from GET /results/me plus the learner's assigned modules and
 * scenarios (see buildLearnerProgress).
 */
@Component({
  selector: 'app-learner-progress',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    DataCardComponent,
    DashboardCardComponent,
    ProgressRowComponent,
    StatusBadgeComponent,
    ListComponent,
    ListCellTemplateDirective,
  ],
  templateUrl: './learner-progress.component.html',
  styleUrl: './learner-progress.component.scss',
})
export class LearnerProgressComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly fontAwesomeIcons = iconLibrary;

  progress: LearnerProgress | null = null;
  loading = false;
  error: string | null = null;

  readonly historyColumns: ListColumn[] = [
    { key: 'moduleName', label: 'Module', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'score', label: 'Score' },
    { key: 'answers', label: 'Correct Answers' },
    { key: 'date', label: 'Date', sortable: true },
  ];
  historyRows: Record<string, unknown>[] = [];
  readonly historyActions: ListAction[] = [
    {
      label: 'View Results',
      action: (row) => this.viewModuleResults(Number(row['moduleId'])),
      icon: iconLibrary.chartColumnIcon,
      tooltip: 'View module results',
    },
  ];

  ngOnInit(): void {
    this.store.dispatch(ResultsActions.fetchMyResults());
    // Assigned modules give the "x of y completed" denominator; the
    // learner's scenarios give each answer its message type.
    this.store.dispatch(ModulesActions.fetchList({ assignedToMe: true }));
    this.store.dispatch(ScenarioActions.fetchList({}));

    combineLatest([
      this.store.select(selectMyResults),
      this.store.select(selectScenarioList),
      this.store.select(selectModuleList),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([results, scenarios, modules]) => {
        this.progress = buildLearnerProgress(
          results,
          scenarios ?? [],
          (modules ?? []).length,
        );
        this.historyRows = this.progress.attemptHistory.map((row) =>
          this.toHistoryRow(row),
        );
      });

    this.store
      .select(selectResultsLoading)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => (this.loading = loading));
    this.store
      .select(selectResultsError)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => (this.error = error));
  }

  get hasActivity(): boolean {
    return !!this.progress && this.progress.totalAttempts > 0;
  }

  get hasAreasForImprovement(): boolean {
    const areas = this.progress?.areasForImprovement;
    return (
      !!areas &&
      (areas.messageTypes.length > 0 ||
        areas.missedCues.length > 0 ||
        areas.scenariosToRevisit.length > 0)
    );
  }

  get accuracy(): number {
    const answers = this.progress?.scenarioAnswers ?? 0;
    return answers ? Math.round(((this.progress?.correctAnswers ?? 0) / answers) * 100) : 0;
  }

  scoreColor(percentage: number): string {
    return percentage >= PASSING_SCORE ? '#16a34a' : percentage >= 50 ? '#f59e0b' : '#dc2626';
  }

  statusVariant(row: Record<string, unknown>): StatusBadgeVariant {
    if (!row['completed']) {
      return 'info';
    }
    return row['passed'] ? 'success' : 'danger';
  }

  private toHistoryRow(row: AttemptHistoryRow): Record<string, unknown> {
    return {
      attemptId: row.attemptId,
      moduleId: row.moduleId,
      moduleName: row.moduleName,
      completed: row.completed,
      passed: row.passed,
      status: !row.completed ? 'In progress' : row.passed ? 'Passed' : 'Not Passed',
      score: row.percentageScore != null ? `${row.percentageScore}%` : '-',
      answers: `${row.scenariosCorrect} / ${row.scenariosAnswered}`,
      date: row.date ?? '',
    };
  }

  viewModuleResults(moduleId: number): void {
    this.router.navigate(['/learner/modules', moduleId, 'results']);
  }

  revisitScenario(scenarioId: string): void {
    this.router.navigate(['/learner/scenarios', scenarioId]);
  }
}
