import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { ScenarioActions } from '../../+state/scenario.actions';
import {
  selectScenario,
  selectScenarioList,
} from '../../+state/scenario.selectors';
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import { Attempt } from 'src/app/attempts/+state/attempt.model';
import { FeedbackActions } from 'src/app/feedback/+state/feedback.actions';
import {
  selectFeedback,
  selectFeedbackLoading,
} from 'src/app/feedback/+state/feedback.selectors';

interface Scenario {
  id: number | string;
  moduleId?: number;
  title: string;
  from: string;
  content: string;
  options: string[];
}

const DEFAULT_OPTIONS = ['Safe', 'Suspicious'];

@Component({
  selector: 'app-scenario-choice',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scenario-choice.component.html',
  styleUrls: ['./scenario-choice.component.scss'],
})
export class ScenarioChoiceComponent implements OnInit, OnDestroy {
  scenarioId: number | string = '';
  scenarioNumber = 1;
  totalScenarios = 1;
  scenario: Scenario = {
    id: '',
    title: '',
    from: '',
    content: '',
    options: DEFAULT_OPTIONS,
  };

  // The learner's suspicious-text selections carried over from the
  // scenario page via router navigation state.
  selectedCues: string[] = [];

  // 'deciding' -> choosing an option, 'result' -> showing correct/incorrect
  // and the AI-generated feedback for that decision.
  phase: 'deciding' | 'result' = 'deciding';
  selectedDecision: string | null = null;
  attempt: Attempt | null = null;
  submitting = false;
  feedbackContent: string | null = null;
  feedbackLoading = false;

  private destroy$ = new Subject<void>();
  private orderedScenarioIds: Array<number | string> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private actions$: Actions,
  ) {}

  ngOnInit(): void {
    // Selected cues are only relevant for the single navigation from the
    // scenario page - Angular's router writes navigation `extras.state`
    // into `history.state`, so it's readable here even though
    // getCurrentNavigation() is only available during the navigation
    // itself. Falls back to an empty array on a direct link/refresh.
    const navigationState = history.state as
      | { selectedCues?: string[] }
      | undefined;
    this.selectedCues = navigationState?.selectedCues ?? [];

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const idParam = params.get('id') || '';
      const idValue = /^\d+$/.test(idParam) ? Number(idParam) : idParam;
      this.scenarioId = idValue;
      this.phase = 'deciding';
      this.selectedDecision = null;
      this.attempt = null;
      this.feedbackContent = null;

      this.store.dispatch(
        ScenarioActions.fetchScenarioDetails({ scenarioId: String(idValue) }),
      );
    });

    combineLatest([
      this.store.select(selectScenario),
      this.store.select(selectScenarioList),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([scenario, scenarioList]) => {
        if (scenario) {
          this.scenario = this.mapScenario(scenario);

          if (this.scenario.moduleId != null) {
            this.store.dispatch(
              ScenarioActions.fetchScenariosByModule({
                moduleId: this.scenario.moduleId,
              }),
            );
          }
        }

        if (scenarioList?.length) {
          this.totalScenarios = scenarioList.length;
          this.orderedScenarioIds = scenarioList.map((item: any) => item.id);
          const index = this.orderedScenarioIds.findIndex(
            (id) => id === this.scenarioId,
          );
          this.scenarioNumber = index >= 0 ? index + 1 : 1;
        }
      });

    // When the attempt has been recorded, we know whether the decision was
    // correct and can ask the AI service for feedback tailored to it.
    this.actions$
      .pipe(ofType(AttemptsActions.createAttemptSuccess), takeUntil(this.destroy$))
      .subscribe(({ attempt }) => {
        this.submitting = false;
        this.attempt = attempt;
        this.phase = 'result';
        this.requestFeedback(attempt);
      });

    this.actions$
      .pipe(ofType(AttemptsActions.createAttemptFailure), takeUntil(this.destroy$))
      .subscribe(() => {
        this.submitting = false;
      });

    this.store
      .select(selectFeedback)
      .pipe(takeUntil(this.destroy$))
      .subscribe((feedback) => {
        this.feedbackContent = feedback?.content ?? null;
      });

    this.store
      .select(selectFeedbackLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.feedbackLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(FeedbackActions.clearFeedback());
  }

  private mapScenario(raw: any): Scenario {
    return {
      id: raw.id ?? this.scenarioId,
      moduleId: raw.moduleId != null ? Number(raw.moduleId) : undefined,
      title: raw.title ?? '',
      from: raw.sender ?? raw.from ?? '',
      content: raw.content ?? raw.body ?? '',
      options:
        Array.isArray(raw.options) && raw.options.length
          ? raw.options
          : DEFAULT_OPTIONS,
    };
  }

  selectDecision(decision: string): void {
    if (this.submitting) {
      return;
    }

    this.selectedDecision = decision;
    this.submitting = true;

    this.store.dispatch(
      AttemptsActions.createAttempt({
        attempt: {
          scenarioId: String(this.scenarioId),
          decision,
        },
      }),
    );
  }

  private requestFeedback(attempt: Attempt): void {
    this.store.dispatch(
      FeedbackActions.requestFeedback({
        request: {
          scenario_content: this.scenario.content,
          scenarioChoices: this.scenario.options.map((option, index) => ({
            id: index + 1,
            text: option,
            isCorrect: option === this.selectedDecision && attempt.correct,
            scenarioId: this.scenario.id,
          })),
          selectedChoiceId:
            this.scenario.options.indexOf(this.selectedDecision ?? '') + 1,
          attemptId: attempt.id,
        },
      }),
    );
  }

  get isCorrect(): boolean {
    return !!this.attempt?.correct;
  }

  continueToNext(): void {
    const currentIndex = this.orderedScenarioIds.findIndex(
      (id) => id === this.scenarioId,
    );
    const hasNext =
      currentIndex >= 0 && currentIndex < this.orderedScenarioIds.length - 1;

    if (hasNext) {
      const nextId = this.orderedScenarioIds[currentIndex + 1];
      this.router.navigate(['/learner/scenarios', nextId]);
      return;
    }

    this.router.navigate(['/learner/results'], {
      queryParams: { moduleId: this.scenario.moduleId },
    });
  }

  backToScenario(): void {
    this.router.navigate(['/learner/scenarios', this.scenarioId]);
  }
}
