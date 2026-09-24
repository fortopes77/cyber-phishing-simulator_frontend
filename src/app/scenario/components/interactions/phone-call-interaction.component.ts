import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ScenarioMessage, MessageEntry, parseMessageEntries } from './scenario-interaction.model';

/** PHONE_CALL scenarios - a call transcript, one line per speaker turn. */
@Component({
  selector: 'app-phone-call-interaction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './phone-call-interaction.component.html',
  styleUrl: './interaction-shell.scss',
})
export class PhoneCallInteractionComponent {
  @Input({ required: true }) message!: ScenarioMessage;

  get entries(): MessageEntry[] {
    return parseMessageEntries(this.message.body);
  }
}
