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
  difficulty: string;
  from: string;
  subject: string;
  body: string;
  cues?: string[];
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
    difficulty: '',
    from: '',
    subject: '',
    body: '',
    cues: [],
  };
  selectedCues: string[] = [];

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
      // Backend field is `interactionType` (see scenario.service.ts
      // createScenario) - values are expected to align with the
      // email/phone/text/invoice switch below.
      type: raw.interactionType ?? raw.type ?? 'generic',
      difficulty: raw.difficulty ?? '',
      from: raw.sender ?? raw.from ?? '',
      subject: raw.subject ?? raw.title ?? '',
      body: raw.content ?? raw.body ?? '',
      cues: raw.cues ?? [],
    };
  }

  getScenarioTypeKey(): string {
    return this.scenario?.type?.toLowerCase() ?? 'generic';
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
      { label: 'Invoice', value: this.scenario.subject },
      { label: 'Amount', value: '$149.99' },
      { label: 'Due', value: '2026-08-15' },
    ];
  }

  getInvoiceAmount(): string {
    const amountMatch = this.scenario.body.match(/\$(\d+(?:\.\d{2})?)/);
    return amountMatch ? amountMatch[0] : '$149.99';
  }

  getSuspiciousCues(): string[] {
    return this.scenario?.cues ?? [];
  }

  toggleCue(cue: string): void {
    if (this.selectedCues.includes(cue)) {
      this.selectedCues = this.selectedCues.filter(
        (selectedCue) => selectedCue !== cue,
      );
      return;
    }

    this.selectedCues = [...this.selectedCues, cue];
  }

  isCueSelected(cue: string): boolean {
    return this.selectedCues.includes(cue);
  }

  makeDecision(): void {
    this.router.navigate(['/learner/scenarios', this.scenarioId, 'feedback']);
  }
}
