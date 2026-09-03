import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ScenarioActions } from '../../+state/scenario.actions';
import {
  selectScenario,
  selectScenarioList,
} from '../../+state/scenario.selectors';
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import { ScenarioAttemptResult } from 'src/app/attempts/+state/attempt.model';
import { FeedbackActions } from 'src/app/feedback/+state/feedback.actions';
import {
  selectFeedback,
  selectFeedbackLoading,
} from 'src/app/feedback/+state/feedback.selectors';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { SIMPLE_ANSWER_OPTIONS } from '../../models/scenario.model';

interface Scenario {
  id: number | string;
  moduleId?: number;
  title: string;
  content: string;
  // Not part of the scenarios API response (see scenario.model.ts) - kept
  // optional so the UI degrades gracefully rather than showing "From: "
  // with nothing after it.
  from?: string;
}

const DECISION_OPTIONS: string[] = [...SIMPLE_ANSWER_OPTIONS];

// Icon + supporting copy for each decision option, keyed off the option
// label above - kept separate from DECISION_OPTIONS so the dispatched
// decision value and the feedback-request mapping (both of which iterate
// decisionOptions as plain strings) don't have to change shape.
const DECISION_META: Record<string, { icon: IconDefinition; description: string }> = {
  Safe: {
    icon: iconLibrary.shieldIcon,
    description: 'This is a legitimate message',
  },
  Suspicious: {
    icon: iconLibrary.warningIcon,
    description: 'This looks like a phishing attempt',
  },
};

@Component({
  selector: 'app-scenario-choice',
  standalone: true,
  imports: [CommonModule, RouterModule, FaIconComponent],
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
    content: '',
  };
  readonly decisionOptions = DECISION_OPTIONS;
  readonly fontAwesomeIcons = iconLibrary;

  // The learner's suspicious-text selections carried over from the
  // scenario page via router navigation state.
  selectedCues: string[] = [];

  // 'deciding' -> choosing an option, 'result' -> showing correct/incorrect
  // and the AI-generated feedback for that decision.
  phase: 'deciding' | 'result' = 'deciding';
  selectedDecision: string | null = null;
  scenarioResult: ScenarioAttemptResult | null = null;
  submitting = false;
  feedbackContent: string | null = null;
  feedbackLoading = false;

  // The module attempt session backing this walkthrough - started on the
  // first decision in a module and reused for every scenario after that
  // (see selectDecision), finalized once the learner finishes or leaves.
  private currentAttemptId: number | null = null;
  private currentAttemptModuleId: number | null = null;
  private pendingDecision: string | null = null;
  private scenarioOpenedAt = new Date();

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
      this.scenarioResult = null;
      this.feedbackContent = null;
      this.scenarioOpenedAt = new Date();

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

    // Starting a module attempt is deferred until the first decision (see
    // selectDecision) - once it resolves, submit whichever decision was
    // waiting on it.
    this.actions$
      .pipe(ofType(AttemptsActions.startAttemptSuccess), takeUntil(this.destroy$))
      .subscribe(({ attempt }) => {
        this.currentAttemptId = attempt.id;
        this.currentAttemptModuleId = attempt.moduleId;

        if (this.pendingDecision) {
          const decision = this.pendingDecision;
          this.pendingDecision = null;
          this.dispatchScenarioAttempt(attempt.id, decision);
        }
      });

    this.actions$
      .pipe(ofType(AttemptsActions.startAttemptFailure), takeUntil(this.destroy$))
      .subscribe(() => {
        this.submitting = false;
        this.pendingDecision = null;
      });

    // The attempt is graded immediately - no need to wait for the module
    // attempt to be finalized to know whether this decision was correct.
    this.actions$
      .pipe(
        ofType(AttemptsActions.submitScenarioAttemptSuccess),
        takeUntil(this.destroy$),
      )
      .subscribe(({ result }) => {
        this.submitting = false;
        this.scenarioResult = result;
        this.phase = 'result';
        this.requestFeedback(result);
      });

    this.actions$
      .pipe(
        ofType(AttemptsActions.submitScenarioAttemptFailure),
        takeUntil(this.destroy$),
      )
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
      from: raw.sender ?? raw.from ?? undefined,
      content: raw.content ?? raw.body ?? '',
    };
  }

  selectDecision(decision: string): void {
    if (this.submitting || this.scenario.moduleId == null) {
      return;
    }

    this.selectedDecision = decision;
    this.submitting = true;

    // Reuse the in-progress attempt if we're still in the same module;
    // otherwise (first decision, or the module changed) start a new one and
    // submit this decision once it resolves.
    if (
      this.currentAttemptId != null &&
      this.currentAttemptModuleId === this.scenario.moduleId
    ) {
      this.dispatchScenarioAttempt(this.currentAttemptId, decision);
    } else {
      this.pendingDecision = decision;
      this.store.dispatch(
        AttemptsActions.startAttempt({ moduleId: this.scenario.moduleId }),
      );
    }
  }

  private dispatchScenarioAttempt(attemptId: number, decision: string): void {
    const completedAt = new Date();
    const timeTakenSeconds = Math.max(
      0,
      Math.round((completedAt.getTime() - this.scenarioOpenedAt.getTime()) / 1000),
    );

    this.store.dispatch(
      AttemptsActions.submitScenarioAttempt({
        attemptId,
        scenarioAttempt: {
          scenarioId: Number(this.scenarioId),
          moduleId: this.scenario.moduleId!,
          // No retry flow is wired up in the UI yet - every submission is
          // this scenario's first attempt within this module attempt.
          attemptNumber: 1,
          response: decision,
          timeTakenSeconds,
          startedAt: this.scenarioOpenedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          // Confirmed live: the backend wants a string here, not an array -
          // see the ASSUMPTION note on ScenarioAttemptInput.
          selectedCues: this.selectedCues.join(','),
        },
      }),
    );
  }

  private requestFeedback(result: ScenarioAttemptResult): void {
    this.store.dispatch(
      FeedbackActions.requestFeedback({
        request: {
          scenarioContent: this.scenario.content,
          decision: this.selectedDecision ?? '',
          correct: result.correct,
          selectedCues: this.selectedCues.length ? this.selectedCues : undefined,
          missedCues: result.missedCues.length ? result.missedCues : undefined,
          attemptId: String(result.attemptId),
        },
      }),
    );
  }

  get isCorrect(): boolean {
    return !!this.scenarioResult?.correct;
  }

  get progressPercentage(): number {
    return this.totalScenarios > 0
      ? (this.scenarioNumber / this.totalScenarios) * 100
      : 0;
  }

  private get currentIndex(): number {
    return this.orderedScenarioIds.findIndex((id) => id === this.scenarioId);
  }

  get hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  get hasNext(): boolean {
    const index = this.currentIndex;
    return index >= 0 && index < this.orderedScenarioIds.length - 1;
  }

  getDecisionIcon(option: string): IconDefinition {
    return DECISION_META[option]?.icon ?? this.fontAwesomeIcons.circleRegularIcon;
  }

  getDecisionDescription(option: string): string {
    return DECISION_META[option]?.description ?? '';
  }

  goToPrevious(): void {
    if (this.hasPrevious) {
      this.router.navigate([
        '/learner/scenarios',
        this.orderedScenarioIds[this.currentIndex - 1],
      ]);
    }
  }

  goToNext(): void {
    if (this.hasNext) {
      this.router.navigate([
        '/learner/scenarios',
        this.orderedScenarioIds[this.currentIndex + 1],
      ]);
    }
  }

  continueToNext(): void {
    if (this.hasNext) {
      this.router.navigate([
        '/learner/scenarios',
        this.orderedScenarioIds[this.currentIndex + 1],
      ]);
      return;
    }

    this.finalizeCurrentAttempt();
    this.router.navigate(['/learner/results'], {
      queryParams: { moduleId: this.scenario.moduleId },
    });
  }

  backToScenario(): void {
    this.router.navigate(['/learner/scenarios', this.scenarioId]);
  }

  closeSession(): void {
    this.finalizeCurrentAttempt();

    if (this.scenario.moduleId != null) {
      this.router.navigate(['/learner/modules', this.scenario.moduleId]);
      return;
    }

    this.router.navigate(['/learner/dashboard']);
  }

  // Locks in whatever scenarios were actually submitted this session,
  // whether the learner finished the module or left partway through.
  private finalizeCurrentAttempt(): void {
    if (this.currentAttemptId != null) {
      this.store.dispatch(
        AttemptsActions.finalizeAttempt({ attemptId: this.currentAttemptId }),
      );
    }
  }
}
