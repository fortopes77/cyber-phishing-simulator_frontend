import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ScenarioMessage, MessageEntry, parseMessageEntries } from './scenario-interaction.model';

/** TEXT_MESSAGE scenarios - an SMS thread of chat bubbles. */
@Component({
  selector: 'app-text-message-interaction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-message-interaction.component.html',
  styleUrl: './interaction-shell.scss',
})
export class TextMessageInteractionComponent {
  @Input({ required: true }) message!: ScenarioMessage;

  get messages(): MessageEntry[] {
    return parseMessageEntries(this.message.body);
  }
}
