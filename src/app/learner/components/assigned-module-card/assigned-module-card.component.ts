import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface AssignedModule {
  id: number;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  scenarios: number;
  status: string;
  progressPercentage: number;
  route?: string;
}

@Component({
  selector: 'app-assigned-module-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assigned-module-card.component.html',
  styleUrls: ['./assigned-module-card.component.scss'],
})
export class AssignedModuleCardComponent {
  @Input() module!: AssignedModule;
  @Output() selected = new EventEmitter<AssignedModule>();

  constructor(private router: Router) {}

  onClick(): void {
    if (this.module?.route) {
      this.router.navigate([this.module.route]);
    }
    this.selected.emit(this.module);
  }
}
