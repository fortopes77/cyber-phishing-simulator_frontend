import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-delete-confirmation-modal',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './delete-confirmation-modal.component.html',
  styleUrl: './delete-confirmation-modal.component.scss',
})
export class DeleteConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() title = 'this item';
  @Input() message = 'Are you sure you wish to delete';
  @Input() confirmLabel = 'Delete';
  @Input() cancelLabel = 'Cancel';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
