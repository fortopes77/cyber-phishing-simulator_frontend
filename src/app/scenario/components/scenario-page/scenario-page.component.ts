import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { ScenarioActions } from '../../+state/scenario.actions';
import {
  selectScenario,
  selectScenarioList,
} from '../../+state/scenario.selectors';

interface Scenario {
  id: number | string;
  title: string;
  type: string;
  body: string;
  moduleId?: number;
  // Not part of the scenarios API response for learners (the Read endpoint
  // only returns scenarioId/moduleId/title/content/interactionType to
  // them - see the scenarios ticket) - kept optional so the UI degrades
  // gracefully rather than showing "From: " with nothing after it.
  difficulty?: string;
  from?: string;
  subject?: string;
}

interface MessageEntry {
  speaker: string;
  text: string;
}

interface InvoiceField {
  label: string;
  value: string;
}

@Component({
  selector: 'app-scenario-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scenario-page.component.html',
  styleUrls: ['./scenario-page.component.scss'],
})
export class ScenarioPageComponent implements OnInit {
  moduleTitle = 'Module';
  scenarioId: number | string = '';
  scenarioNumber = 1;
  totalScenarios = 1;
  scenario: Scenario = {
    id: '',
    title: '',
    type: 'generic',
    body: '',
  };
  selectedCues: string[] = [];

  // Tracks the moduleId we last asked the store for, so we only dispatch
  // fetchScenariosByModule once per module rather than on every store
  // emission.
  private lastRequestedModuleId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id') || '';
      // Scenario ids from the API are strings (e.g. "s_001"), but some
      // routes/tests still pass numeric ids - keep whichever was given.
      const idValue = /^\d+$/.test(idParam) ? Number(idParam) : idParam;
      this.scenarioId = idValue;
      this.selectedCues = [];
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

  private mapScenario(raw: any): Scenario {
    return {
      id: raw.id ?? this.scenarioId,
      title: raw.title ?? '',
      type: raw.interactionType ?? raw.type ?? 'generic',
      // difficulty/from/subject aren't part of the scenarios API response a
      // learner receives - these fallbacks only surface something if a
      // future/trainer-scoped response happens to include them.
      difficulty: raw.difficulty || undefined,
      from: raw.sender ?? raw.from ?? undefined,
      subject: raw.subject ?? raw.title ?? undefined,
      body: raw.content ?? raw.body ?? '',
      moduleId: raw.moduleId != null ? Number(raw.moduleId) : undefined,
    };
  }

  /**
   * Maps the `interactionType` enum (EMAIL/SMS/CALL - see scenario.model.ts)
   * onto the message-shell keys the template switches on. Falls back to a
   * lowercase pass-through so older/free-text values ("Phone", "Text")
   * still resolve to something sensible.
   */
  getScenarioTypeKey(): string {
    const type = (this.scenario?.type ?? '').toUpperCase();
    const typeMap: Record<string, string> = {
      EMAIL: 'email',
      SMS: 'text',
      TEXT: 'text',
      CALL: 'phone',
      PHONE: 'phone',
      VOICE: 'phone',
    };

    return typeMap[type] ?? this.scenario?.type?.toLowerCase() ?? 'generic';
  }

  getTranscriptEntries(): MessageEntry[] {
    const lines = (this.scenario.body ?? '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex > 0) {
        return {
          speaker: line.slice(0, separatorIndex).trim(),
          text: line.slice(separatorIndex + 1).trim(),
        };
      }

      return {
        speaker: 'Caller',
        text: line,
      };
    });
  }

  getTextMessages(): MessageEntry[] {
    return this.getTranscriptEntries();
  }

  getInvoiceFields(): InvoiceField[] {
    const lines = (this.scenario.body ?? '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const fields = lines.flatMap((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex > 0) {
        return [
          {
            label: line.slice(0, separatorIndex).trim(),
            value: line.slice(separatorIndex + 1).trim(),
          },
        ];
      }

      return [];
    });

    if (fields.length > 0) {
      return fields;
    }

    return [
      { label: 'Invoice', value: this.scenario.subject ?? '' },
      { label: 'Amount', value: '$149.99' },
      { label: 'Due', value: '2026-08-15' },
    ];
  }

  getInvoiceAmount(): string {
    const amountMatch = this.scenario.body.match(/\$(\d+(?:\.\d{2})?)/);
    return amountMatch ? amountMatch[0] : '$149.99';
  }

  removeSelectedCue(cue: string): void {
    this.selectedCues = this.selectedCues.filter(
      (selectedCue) => selectedCue !== cue,
    );
  }

  /**
   * Captures free-text highlighted by the learner inside the scenario
   * content (email body, phone transcript, text thread, invoice fields) and
   * adds it to the selected cues. This is the learner's only source of
   * cues - the backend never sends the scenario's correctCues to them, so
   * there's nothing to show as a predefined hint. Bound to (mouseup) on the
   * wrapper around the switchable content so it works for every scenario
   * type.
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
    // Pass the learner's selected cues to the decision/feedback screen via
    // router navigation state rather than a new store slice - it's only
    // needed for the single upcoming navigation and is read from
    // history.state in ScenarioChoiceComponent.
    this.router.navigate(['/learner/scenarios', this.scenarioId, 'feedback'], {
      state: { selectedCues: this.selectedCues },
    });
  }
}
