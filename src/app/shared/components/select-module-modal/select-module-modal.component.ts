import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { ScenarioAnswerMode } from '../../../scenario/models/scenario.model';

export interface SelectModuleOption {
  moduleId: number;
  moduleName: string;
}

export interface SelectModuleConfirmation {
  moduleId: number;
  answerMode: ScenarioAnswerMode;
}

/**
 * Trainer-facing "which module should this go in?" prompt, opened from
 * ScenarioListComponent's "Create with AI" action. The AI generation API has
 * no concept of a module - it only produces scenario content - but the
 * backend's POST /scenarios requires one, so the trainer picks it here
 * before generation starts rather than the app guessing or hard-coding one.
 * The answer-mode toggle picked here decides which AI endpoint gets called
 * (simple-scenario vs detailed-scenario) - see ScenarioService.createScenarioWithAI.
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

  @Output() confirmed = new EventEmitter<SelectModuleConfirmation>();
  @Output() cancelled = new EventEmitter<void>();

  selectedModuleId: number | null = null;
  answerMode: ScenarioAnswerMode = 'simple';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.selectedModuleId = this.modules[0]?.moduleId ?? null;
      this.answerMode = 'simple';
    }
  }

  onConfirm(): void {
    if (this.selectedModuleId == null) {
      return;
    }

    this.confirmed.emit({ moduleId: this.selectedModuleId, answerMode: this.answerMode });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
