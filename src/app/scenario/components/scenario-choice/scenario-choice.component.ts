import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Subject, combineLatest, take, takeUntil } from 'rxjs';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ScenarioActions } from '../../+state/scenario.actions';
import {
  selectScenario,
  selectScenarioList,
} from '../../+state/scenario.selectors';
import { AttemptsActions } from 'src/app/attempts/+state/attempts.actions';
import { selectCurrentAttempt } from 'src/app/attempts/+state/attempts.selectors';
import { ScenarioAttemptResult } from 'src/app/attempts/+state/attempt.model';
import { FeedbackActions } from 'src/app/feedback/+state/feedback.actions';
import {
  selectFeedback,
  selectFeedbackLoading,
} from 'src/app/feedback/+state/feedback.selectors';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import {
  normalizeAnswerMode,
  ScenarioAnswerMode,
  SIMPLE_ANSWER_OPTIONS,
} from '../../models/scenario.model';

interface Scenario {
  id: number | string;
  moduleId?: number;
  title: string;
  content: string;
  answerMode: ScenarioAnswerMode;
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
    answerMode: 'simple',
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
  // Mirrored from the attempts store's currentAttempt (see the
  // selectCurrentAttempt subscription in ngOnInit) rather than only ever set
  // locally: continuing to the next scenario navigates through
  // ScenarioPageComponent in between (scenarios/:id -> scenarios/:id/feedback
  // is a different route each time), which destroys and recreates this
  // component - a purely local field would forget the in-progress attempt
  // after scenario 1, causing every scenario after the first to silently
  // start its own separate (single-scenario) attempt instead of extending it.
  private currentAttemptId: number | null = null;
  private currentAttemptModuleId: number | null = null;
  private pendingDecision: string | null = null;
  private scenarioOpenedAt = new Date();

  private destroy$ = new Subject<void>();
  private orderedScenarioIds: Array<number | string> = [];
  // Guards fetchScenariosByModule so it's only dispatched when the module
  // actually changes, not on every combineLatest emission below - without
  // this, dispatching it unconditionally on every emission of
  // [selectScenario, selectScenarioList] causes an infinite loop: the
  // dispatch's own success response updates scenarioList, which re-fires the
  // combineLatest, which dispatches again, forever.
  private lastFetchedModuleId: number | null = null;

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

          if (
            this.scenario.moduleId != null &&
            this.scenario.moduleId !== this.lastFetchedModuleId
          ) {
            this.lastFetchedModuleId = this.scenario.moduleId;
            this.store.dispatch(
              ScenarioActions.fetchScenariosByModule({
                moduleId: this.scenario.moduleId,
              }),
            );
          }
        }

        // scenarioList is meant to be scoped to this module via
        // fetchScenariosByModule, but it's a single store slice also written
        // by unrelated screens (the dashboard/module-page's own fetches for
        // a different module, an org-wide fetchList) - guard against briefly
        // reading someone else's list by filtering to this scenario's module
        // (mirrors the same guard in ModulePageComponent). Without this, a
        // stale/foreign list can leave orderedScenarioIds too short, making
        // hasNext resolve false after just the first scenario and finalizing
        // the attempt early.
        const moduleScenarios = (scenarioList ?? []).filter(
          (item: any) =>
            item.moduleId == null || item.moduleId === this.scenario.moduleId,
        );

        if (moduleScenarios.length) {
          this.totalScenarios = moduleScenarios.length;
          this.orderedScenarioIds = moduleScenarios.map((item: any) => item.id);
          const index = this.orderedScenarioIds.findIndex(
            (id) => id === this.scenarioId,
          );
          this.scenarioNumber = index >= 0 ? index + 1 : 1;
        }
      });

    // Keeps currentAttemptId/currentAttemptModuleId in sync with the
    // attempts store rather than only setting them from startAttemptSuccess
    // below - a fresh instance of this component (see the field comment
    // above) picks up an already-in-progress attempt immediately on
    // subscribe instead of losing track of it. Only IN_PROGRESS counts as
    // "reusable": once an attempt is finalized (e.g. the learner retries the
    // same module), its old id must not be extended further.
    this.store
      .select(selectCurrentAttempt)
      .pipe(takeUntil(this.destroy$))
      .subscribe((attempt) => {
        if (attempt?.status === 'IN_PROGRESS') {
          this.currentAttemptId = attempt.id;
          this.currentAttemptModuleId = attempt.moduleId;
        } else {
          this.currentAttemptId = null;
          this.currentAttemptModuleId = null;
        }
      });

    // Starting a module attempt is deferred until the first decision (see
    // selectDecision) - once it resolves, submit whichever decision was
    // waiting on it.
    this.actions$
      .pipe(ofType(AttemptsActions.startAttemptSuccess), takeUntil(this.destroy$))
      .subscribe(({ attempt }) => {
        if (this.pendingDecision !== null) {
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
      answerMode: normalizeAnswerMode(raw),
    };
  }

  // Detailed scenarios are answered by flagging cues rather than picking
  // Safe/Suspicious - see the answerMode field note on ScenarioAnswerMode.
  get isDetailed(): boolean {
    return this.scenario.answerMode === 'detailed';
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

  // The 'detailed' counterpart to selectDecision() - there's no explicit
  // Safe/Suspicious pick, so the decision is derived from whatever cues were
  // flagged on the scenario page: flagging nothing means the learner judged
  // the message safe, flagging anything means they judged it suspicious
  // (confirmed with the backend team alongside the answerMode field).
  submitCues(): void {
    if (this.submitting || this.scenario.moduleId == null) {
      return;
    }

    this.submitting = true;
    const decision = this.selectedCues.length ? 'Suspicious' : 'Safe';
    this.selectedDecision = decision;

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

    const moduleId = this.scenario.moduleId;
    this.finalizeCurrentAttempt(() => {
      this.router.navigate(['/learner/modules', moduleId, 'results']);
    });
  }

  backToScenario(): void {
    this.router.navigate(['/learner/scenarios', this.scenarioId]);
  }

  closeSession(): void {
    const moduleId = this.scenario.moduleId;
    this.finalizeCurrentAttempt(() => {
      if (moduleId != null) {
        this.router.navigate(['/learner/modules', moduleId]);
        return;
      }

      this.router.navigate(['/learner/dashboard']);
    });
  }

  // Locks in whatever scenarios were actually submitted this session,
  // whether the learner finished the module or left partway through - then
  // runs onDone only once finalize has actually landed (success or failure).
  // Navigating (and re-fetching results) immediately after just dispatching
  // finalizeAttempt races GET /results/me against the finalize POST: if the
  // fetch wins, this attempt still reads as IN_PROGRESS, and
  // buildModuleResult's isMoreComplete picks an older, already-COMPLETED
  // attempt over the one the learner just finished.
  private finalizeCurrentAttempt(onDone: () => void = () => {}): void {
    if (this.currentAttemptId == null) {
      onDone();
      return;
    }

    this.actions$
      .pipe(
        ofType(AttemptsActions.finalizeAttemptSuccess, AttemptsActions.finalizeAttemptFailure),
        take(1),
      )
      .subscribe(() => onDone());

    this.store.dispatch(
      AttemptsActions.finalizeAttempt({ attemptId: this.currentAttemptId }),
    );
  }
}
