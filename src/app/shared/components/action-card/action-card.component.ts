import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { iconLibrary } from '../../constants/font-awesome-icons.const';

@Component({
  selector: 'app-action-card',
  imports: [FaIconComponent],
  templateUrl: './action-card.component.html',
  styleUrl: './action-card.component.scss',
})
export class ActionCardComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: IconDefinition;
  @Input() route?: string;
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();

  fontAwesomeIcons = iconLibrary;

  constructor(private router: Router) {}

  onClick(): void {
    if (this.disabled) return;

    if (this.route) {
      this.router.navigate([this.route]);
    }

    this.clicked.emit();
  }
}
