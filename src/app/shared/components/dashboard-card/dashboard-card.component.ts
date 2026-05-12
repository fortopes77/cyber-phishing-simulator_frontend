import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-card',
  imports: [],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
})
export class DashboardCardComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() actionText = 'View Details';
  @Input() showAction = true;

  @Output() actionClick = new EventEmitter<void>();

  onActionClick(): void {
    this.actionClick.emit();
  }
}
