import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

interface Scenario {
  id: number;
  title: string;
  from: string;
}

@Component({
  selector: 'app-scenario-choice',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scenario-choice.component.html',
  styleUrls: ['./scenario-choice.component.scss'],
})
export class ScenarioChoiceComponent implements OnInit {
  moduleTitle = 'Email Phishing Basics';
  scenarioNumber = 1;
  totalScenarios = 2;
  scenario: Scenario = {
    id: 1,
    title: 'IT Department Software Update',
    from: 'it-support@yourcompany.com',
  };
  selectedDecision: 'safe' | 'suspicious' | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idValue = Number(params.get('id')) || 1;
      this.scenarioNumber = idValue;
      this.scenario = this.getScenarioById(idValue);
    });
  }

  getScenarioById(id: number): Scenario {
    const scenarios: Scenario[] = [
      {
        id: 1,
        title: 'Required: Software Update for All Employees',
        from: 'it-support@yourcompany.com',
      },
      {
        id: 2,
        title: 'IT Department Software Update',
        from: 'it-support@yourcompany.com',
      },
    ];

    return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
  }

  selectDecision(decision: 'safe' | 'suspicious'): void {
    this.selectedDecision = decision;

    if (this.scenarioNumber < this.totalScenarios) {
      this.router.navigate(['/learner/scenarios', this.scenarioNumber + 1]);
      return;
    }

    this.router.navigate(['/learner/results']);
  }

  backToScenario(): void {
    this.router.navigate(['/learner/scenarios', this.scenarioNumber]);
  }
}
