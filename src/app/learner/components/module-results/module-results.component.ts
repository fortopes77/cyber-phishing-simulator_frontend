import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

interface ScenarioResult {
  id: number;
  title: string;
  answer: string;
  correct: boolean;
}

@Component({
  selector: 'app-module-results',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './module-results.component.html',
  styleUrls: ['./module-results.component.scss'],
})
export class ModuleResultsComponent {
  moduleTitle = 'Email Phishing Basics';
  scorePercentage = 100;
  correctAnswers = 2;
  totalScenarios = 2;
  passingScore = 70;
  scenarioResults: ScenarioResult[] = [
    {
      id: 1,
      title: 'Urgent Password Reset',
      answer: 'Suspicious',
      correct: true,
    },
    {
      id: 2,
      title: 'IT Department Software Update',
      answer: 'Safe',
      correct: true,
    },
  ];

  constructor(private router: Router) {}

  retryModule(): void {
    this.router.navigate(['/learner/modules/email-phishing']);
  }

  backToModules(): void {
    this.router.navigate(['/learner/dashboard']);
  }
}
