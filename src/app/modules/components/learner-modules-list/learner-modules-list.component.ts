import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import {
  faCircle,
  faCircleCheck,
  faClock,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scenarios: number;
  progress: number; // 0..1
}

@Component({
  selector: 'app-learner-modules-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FaIconComponent],
  templateUrl: './learner-modules-list.component.html',
  styleUrls: ['./learner-modules-list.component.scss'],
})
export class LearnerModulesListComponent implements OnInit {
  search = '';
  showFilters = false;
  difficultyFilter: '' | 'beginner' | 'intermediate' | 'advanced' = '';

  modules: ModuleCard[] = [];
  filteredModules: ModuleCard[] = [];

  ngOnInit(): void {
    // Sample data — replace with real data fetch when available
    this.modules = [
      {
        id: 'm1',
        title: 'Email Phishing Basics',
        description:
          'Learn to identify common email phishing tactics and protect yourself from credential theft.',
        difficulty: 'beginner',
        scenarios: 2,
        progress: 0.5,
      },
      {
        id: 'm2',
        title: 'Business Email Compromise',
        description:
          'Recognize sophisticated BEC attacks targeting employees and executives.',
        difficulty: 'intermediate',
        scenarios: 1,
        progress: 0,
      },
      {
        id: 'm3',
        title: 'SMS & Text Phishing',
        description:
          'Identify smishing attacks and protect your mobile communications.',
        difficulty: 'beginner',
        scenarios: 1,
        progress: 0,
      },
      {
        id: 'm4',
        title: 'Internal Communications Security',
        description:
          'Learn to verify legitimate internal communications from spoofed attempts.',
        difficulty: 'advanced',
        scenarios: 1,
        progress: 1,
      },
    ];

    this.applyFilters();
  }

  applyFilters(): void {
    const searchLower = this.search.trim().toLowerCase();
    this.filteredModules = this.modules.filter((m) => {
      if (this.difficultyFilter && m.difficulty !== this.difficultyFilter) {
        return false;
      }

      if (!searchLower) return true;
      return (
        m.title.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower)
      );
    });
  }

  clearFilters(): void {
    this.difficultyFilter = '';
    this.search = '';
    this.applyFilters();
  }

  getStatusClass(progress: number): string {
    if (progress >= 1) {
      return 'completed';
    }

    if (progress > 0) {
      return 'in-progress';
    }

    return 'not-started';
  }

  getStatusIcon(progress: number): IconDefinition | string {
    if (progress >= 1) {
      return iconLibrary.checkCircleIcon;
    }

    if (progress > 0) {
      return iconLibrary.clockIcon;
    }

    return iconLibrary.circleRegularIcon;
  }
}
