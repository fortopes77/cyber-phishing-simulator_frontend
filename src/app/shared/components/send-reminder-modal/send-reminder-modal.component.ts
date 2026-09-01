import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-send-reminder-modal',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './send-reminder-modal.component.html',
  styleUrl: './send-reminder-modal.component.scss',
})
export class SendReminderModalComponent {
  @Input() isOpen = false;
  @Input() learnerName = 'this learner';
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
