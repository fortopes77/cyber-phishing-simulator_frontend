import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

interface Scenario {
  id: number;
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
  moduleTitle = 'Email Phishing Basics';
  scenarioId = 1;
  scenarioNumber = 1;
  totalScenarios = 2;
  scenario: Scenario = {
    id: 1,
    title: 'Required: Software Update for All Employees',
    type: 'Email',
    difficulty: 'Medium',
    from: 'it-support@yourcompany.com',
    subject: 'Required: Software Update for All Employees',
    body: `Hi Team,

As part of our quarterly security updates, we need all employees to install the latest version of our VPN client.

Please download the update from our internal portal:
https://internal.yourcompany.com/downloads/vpn-client

If you have any questions, contact the IT Help Desk at ext. 4500.

Thanks,
IT Support Team`,
    cues: ['Urgent request', 'Unexpected link', 'Pressure to act quickly'],
  };
  selectedCues: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idValue = Number(params.get('id')) || 1;
      this.scenarioId = idValue;
      this.scenarioNumber = idValue;
      this.scenario = this.getScenarioById(idValue);
    });
  }

  getScenarioById(id: number): Scenario {
    const scenarios: Scenario[] = [
      {
        id: 1,
        title: 'Required: Software Update for All Employees',
        type: 'Email',
        difficulty: 'Medium',
        from: 'it-support@yourcompany.com',
        subject: 'Required: Software Update for All Employees',
        body: `Hi Team,

As part of our quarterly security updates, we need all employees to install the latest version of our VPN client.

Please download the update from our internal portal:
https://internal.yourcompany.com/downloads/vpn-client

If you have any questions, contact the IT Help Desk at ext. 4500.

Thanks,
IT Support Team`,
        cues: ['Urgent request', 'Unexpected link', 'Pressure to act quickly'],
      },
      {
        id: 2,
        title: 'Urgent Password Reset',
        type: 'Email',
        difficulty: 'Easy',
        from: 'security@yourcompany.com',
        subject: 'Urgent Password Reset Required',
        body: `Hi Team,

Your account has been flagged for suspicious activity. Please reset your password immediately using the secure link below.

https://secure.yourcompany.com/reset-password

Thank you,
Security Team`,
        cues: ['Urgent language', 'Suspicious link', 'Threatening tone'],
      },
    ];

    return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
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
