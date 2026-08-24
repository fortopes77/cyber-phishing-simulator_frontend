import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-sign-out-confirmation-modal',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './sign-out-confirmation-modal.component.html',
  styleUrl: './sign-out-confirmation-modal.component.scss',
})
export class SignOutConfirmationModalComponent {
  @Input() isOpen = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
