import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LearningProgress } from '../../models/learning-progress.model';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { iconLibrary } from 'src/app/shared/constants/font-awesome-icons.const';

@Component({
  selector: 'app-learning-progress-card',
  imports: [FaIconComponent],
  templateUrl: './learning-progress-card.component.html',
  styleUrl: './learning-progress-card.component.scss',
})
export class LearningProgressCardComponent {
  @Input() item!: LearningProgress;

  @Output() clicked = new EventEmitter<LearningProgress>();

  fontAwesomeIcons = iconLibrary;

  constructor(private router: Router) {}

  onClick(): void {
    if (this.item.route) {
      this.router.navigate([this.item.route]);
    }

    this.clicked.emit(this.item);
  }
}
