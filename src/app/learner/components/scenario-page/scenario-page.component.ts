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
  };

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
      },
    ];

    return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
  }

  makeDecision(): void {
    this.router.navigate(['/learner/scenarios', this.scenarioId, 'feedback']);
  }
}
