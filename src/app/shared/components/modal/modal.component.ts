import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

let nextModalId = 0;

/**
 * Visual and behavioural shell every modal in the app should be built on, so
 * new modals automatically match (backdrop, card, header, close button,
 * Escape-to-close) instead of each screen re-implementing its own dialog
 * chrome. Concrete modals project their own body/footer content in:
 *
 *   <app-modal [isOpen]="isOpen" title="..." (closed)="onCancel()">
 *     <p>Body content</p>
 *     <div modal-footer>
 *       <button (click)="onConfirm()">Confirm</button>
 *     </div>
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';

  @Output() closed = new EventEmitter<void>();

  readonly titleId = `modal-title-${nextModalId++}`;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  onBackdropClick(): void {
    this.close();
  }

  close(): void {
    this.closed.emit();
  }
}
