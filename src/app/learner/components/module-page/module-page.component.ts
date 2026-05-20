import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-module-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-page.component.html',
  styleUrls: ['./module-page.component.scss'],
})
export class ModulePageComponent {
  slug = '';
  title = 'Module';

  scenarios = [
    {
      id: 1,
      title: 'Urgent Password Reset',
      type: 'Email',
      difficulty: 'Easy',
      status: 'Completed',
    },
    {
      id: 2,
      title: 'IT Department Software Update',
      type: 'Email',
      difficulty: 'Medium',
      status: 'In Progress',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.paramMap.subscribe((params) => {
      const s = params.get('slug') || '';
      this.slug = s;
      // Convert slug-like 'email-phishing' to a nicer title
      this.title = s
        ? s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Module';
    });
  }

  continueModule(): void {
    const nextScenario =
      this.scenarios.find((scenario) => scenario.status !== 'Completed') ||
      this.scenarios[0];

    this.router.navigate(['/learner/scenarios', nextScenario.id]);
  }
}
