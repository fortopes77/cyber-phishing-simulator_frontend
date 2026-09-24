import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { ScenarioActions } from '../../+state/scenario.actions';
import {
  selectScenario,
  selectScenarioList,
} from '../../+state/scenario.selectors';
import { normalizeAnswerMode, ScenarioAnswerMode } from '../../models/scenario.model';
import { ScenarioChoiceComponent } from '../scenario-choice/scenario-choice.component';
import { getInteractionKey } from '../interactions/scenario-interaction.model';
import { EmailInteractionComponent } from '../interactions/email-interaction.component';
import { PhoneCallInteractionComponent } from '../interactions/phone-call-interaction.component';
import { TextMessageInteractionComponent } from '../interactions/text-message-interaction.component';
import { SocialMediaInteractionComponent } from '../interactions/social-media-interaction.component';
import { InvoiceInteractionComponent } from '../interactions/invoice-interaction.component';
import { GenericInteractionComponent } from '../interactions/generic-interaction.component';

interface Scenario {
  id: number | string;
  title: string;
  type: string;
  body: string;
  moduleId?: number;
  answerMode: ScenarioAnswerMode;
  // Not part of the scenarios API response for learners (the Read endpoint
  // only returns scenarioId/moduleId/title/content/interactionType to
  // them - see the scenarios ticket) - kept optional so the UI degrades
  // gracefully rather than showing "From: " with nothing after it.
  difficulty?: string;
  from?: string;
  recipient?: string;
  subject?: string;
}

/**
 * The scenario screen container for the learner flow. It steps through
 * 'viewing' (the message, rendered by the interaction sub-component for the
 * scenario's interactionType - see interactions/ - plus cue selection for
 * detailed scenarios) and 'deciding' (ScenarioChoiceComponent - the
 * binary Safe/Suspicious decision for simple scenarios, or cue submission
 * for detailed ones, then the graded result) on the same route.
 */
@Component({
  selector: 'app-scenario-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ScenarioChoiceComponent,
    EmailInteractionComponent,
    PhoneCallInteractionComponent,
    TextMessageInteractionComponent,
    SocialMediaInteractionComponent,
    InvoiceInteractionComponent,
    GenericInteractionComponent,
  ],
  templateUrl: './scenario-page.component.html',
  styleUrls: ['./scenario-page.component.scss'],
})
export class ScenarioPageComponent implements OnInit, OnChanges {
  // Lets a caller (e.g. the trainer's scenario-edit live preview) render
  // this component against an in-memory scenario shape instead of the
  // routed/store-backed learner flow, so the preview is guaranteed to look
  // exactly like what a learner will see for a given interaction type -
  // without dispatching fetchScenarioDetails or navigating on decisions.
  @Input() previewMode = false;
  @Input() previewData: Record<string, any> | null = null;
  @Input() moduleTitle = 'Module';
  scenarioId: number | string = '';
  scenarioNumber = 1;
  totalScenarios = 1;
  scenario: Scenario = {
    id: '',
    title: '',
    type: 'generic',
    body: '',
    answerMode: 'simple',
  };
  selectedCues: string[] = [];
  step: 'viewing' | 'deciding' = 'viewing';
  // When the learner opened this scenario - handed to the decision step so
  // the recorded time covers reading the message too.
  openedAt = new Date();

  // Tracks the moduleId we last asked the store for, so we only dispatch
  // fetchScenariosByModule once per module rather than on every store
  // emission.
  private lastRequestedModuleId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private store: Store,
  ) {}

  ngOnInit(): void {
    if (this.previewMode) {
      this.scenario = this.mapScenario(this.previewData ?? {});
      return;
    }

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id') || '';
      // Scenario ids from the API are strings (e.g. "s_001"), but some
      // routes/tests still pass numeric ids - keep whichever was given.
      const idValue = /^\d+$/.test(idParam) ? Number(idParam) : idParam;
      this.scenarioId = idValue;
      this.selectedCues = [];
      // Moving to another scenario (e.g. "Next Scenario" from the decision
      // step's result) starts back on its message.
      this.step = 'viewing';
      this.openedAt = new Date();
      this.store.dispatch(
        ScenarioActions.fetchScenarioDetails({ scenarioId: String(idValue) }),
      );
    });

    combineLatest([
      this.store.select(selectScenario),
      this.store.select(selectScenarioList),
    ]).subscribe(([scenario, scenarioList]) => {
      if (scenario) {
        this.scenario = this.mapScenario(scenario);

        // Load the full ordered scenario list for this module so "Scenario
        // X of Y" and the next-scenario routing on the feedback screen work
        // regardless of how the learner arrived at this page (deep link,
        // refresh, etc.), not just when navigating from the module page.
        if (
          this.scenario.moduleId != null &&
          this.scenario.moduleId !== this.lastRequestedModuleId
        ) {
          this.lastRequestedModuleId = this.scenario.moduleId;
          this.store.dispatch(
            ScenarioActions.fetchScenariosByModule({
              moduleId: this.scenario.moduleId,
            }),
          );
        }
      }

      // The learner typically arrives here from the module page, which has
      // already loaded the module's scenario list into the store - use it
      // to show "Scenario X of Y" and the module name without a second
      // round trip. Falls back gracefully if the list isn't loaded yet.
      if (scenarioList?.length) {
        this.totalScenarios = scenarioList.length;
        const index = scenarioList.findIndex(
          (item: any) => item.id === this.scenarioId,
        );
        this.scenarioNumber = index >= 0 ? index + 1 : 1;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only live-preview usage feeds previewData - the routed learner flow
    // above owns `scenario` via the store subscription instead.
    if (this.previewMode && changes['previewData']) {
      this.scenario = this.mapScenario(this.previewData ?? {});
    }
  }

  private mapScenario(raw: any): Scenario {
    return {
      id: raw.id ?? this.scenarioId,
      title: raw.title ?? '',
      type: raw.interactionType ?? raw.type ?? 'generic',
      // from/subject aren't part of the scenarios API response a learner
      // receives - these fallbacks only surface something if a
      // future/trainer-scoped response happens to include them.
      difficulty: raw.difficulty || undefined,
      from: raw.sender ?? raw.from ?? undefined,
      recipient: raw.recipient ?? raw.to ?? undefined,
      subject: raw.subject ?? raw.title ?? undefined,
      body: raw.content ?? raw.body ?? '',
      moduleId: raw.moduleId != null ? Number(raw.moduleId) : undefined,
      answerMode: normalizeAnswerMode(raw),
    };
  }

  // 'detailed' scenarios are answered by flagging suspicious text rather
  // than a plain Safe/Suspicious pick, so the cue selector only makes sense
  // for them - see the answerMode field note on ScenarioAnswerMode.
  get isDetailed(): boolean {
    return this.scenario.answerMode === 'detailed';
  }

  /** Which interaction sub-component renders this scenario. */
  getScenarioTypeKey(): string {
    return getInteractionKey(this.scenario?.type);
  }

  removeSelectedCue(cue: string): void {
    this.selectedCues = this.selectedCues.filter(
      (selectedCue) => selectedCue !== cue,
    );
  }

  /**
   * Captures free-text highlighted by the learner anywhere on the message -
   * sender, recipient, subject, or the body/transcript/invoice content -
   * and adds it to the selected cues. This is the learner's only source of
   * cues - the backend never sends the scenario's correctCues to them, so
   * there's nothing to show as a predefined hint. Bound to (mouseup) on
   * both the sender/recipient/subject summary and the switchable content
   * wrapper below it, so a selection anywhere across the message counts.
   */
  onContentMouseUp(): void {
    const selection = window.getSelection ? window.getSelection() : null;
    const text = selection?.toString().trim();

    if (text) {
      this.addSelectedCue(text);
    }

    selection?.removeAllRanges();
  }

  addSelectedCue(cue: string): void {
    if (!this.selectedCues.includes(cue)) {
      this.selectedCues = [...this.selectedCues, cue];
    }
  }

  makeDecision(): void {
    this.step = 'deciding';
  }

  // Back from the decision step to the message - selected cues are kept so
  // the learner can carry on flagging from where they left off.
  backToScenario(): void {
    this.step = 'viewing';
  }
}
