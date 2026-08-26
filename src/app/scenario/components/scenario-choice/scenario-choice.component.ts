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
import { Attempt } from 'src/app/attempts/+state/attempt.model';
import { FeedbackActions } from 'src/app/feedback/+state/feedback.actions';
import {
  selectFeedback,
  selectFeedbackLoading,
} from 'src/app/feedback/+state/feedback.selectors';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';

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

// The scenarios API has no `options` field - a scenario's correctAnswer is
// free text a trainer enters (see ScenarioEditComponent), and a learner
// never receives it, so there's no way to derive scenario-specific choices
// on this end. Safe/Suspicious is the fixed decision every scenario is
// judged against; trainers should set correctAnswer to one of these two
// values for a "simple" scenario.
const DECISION_OPTIONS = ['Safe', 'Suspicious'];

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
      from: raw.sender ?? raw.from ?? undefined,
      content: raw.content ?? raw.body ?? '',
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
          // Only sent for a "detailed" scenario (scored against
          // correctCues) - omitted entirely when the learner selected no
          // text, which is the normal case for a "simple" scenario.
          selectedCues: this.selectedCues.length ? this.selectedCues : undefined,
        },
      }),
    );
  }

  private requestFeedback(attempt: Attempt): void {
    this.store.dispatch(
      FeedbackActions.requestFeedback({
        request: {
          scenarioContent: this.scenario.content,
          decision: this.selectedDecision ?? '',
          correct: attempt.correct,
          // correctAnswer/missedCues are mutually exclusive on the graded
          // attempt (see attempt.model.ts) - only whichever the scenario's
          // answer mode produced is sent, so the AI feedback can explain a
          // wrong decision or point out exactly which cues were missed.
          correctAnswer: attempt.correctAnswer,
          selectedCues: this.selectedCues.length ? this.selectedCues : undefined,
          missedCues: attempt.missedCues?.length ? attempt.missedCues : undefined,
          attemptId: attempt.id,
        },
      }),
    );
  }

  get isCorrect(): boolean {
    return !!this.attempt?.correct;
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

    this.router.navigate(['/learner/results'], {
      queryParams: { moduleId: this.scenario.moduleId },
    });
  }

  backToScenario(): void {
    this.router.navigate(['/learner/scenarios', this.scenarioId]);
  }

  closeSession(): void {
    if (this.scenario.moduleId != null) {
      this.router.navigate(['/learner/modules', this.scenario.moduleId]);
      return;
    }

    this.router.navigate(['/learner/dashboard']);
  }
}
