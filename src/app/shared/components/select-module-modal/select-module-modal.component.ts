import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

export interface SelectModuleOption {
  moduleId: number;
  moduleName: string;
}

/**
 * Trainer-facing "which module should this go in?" prompt, opened from
 * ScenarioListComponent's "Create with AI" action. The AI generation API has
 * no concept of a module - it only produces scenario content - but the
 * backend's POST /scenarios requires one, so the trainer picks it here
 * before generation starts rather than the app guessing or hard-coding one.
 */
@Component({
  selector: 'app-select-module-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './select-module-modal.component.html',
  styleUrl: './select-module-modal.component.scss',
})
export class SelectModuleModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() modules: SelectModuleOption[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;

  @Output() confirmed = new EventEmitter<number>();
  @Output() cancelled = new EventEmitter<void>();

  selectedModuleId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.selectedModuleId = this.modules[0]?.moduleId ?? null;
    }
  }

  onConfirm(): void {
    if (this.selectedModuleId == null) {
      return;
    }

    this.confirmed.emit(this.selectedModuleId);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
