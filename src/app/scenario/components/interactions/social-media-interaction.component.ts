import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ScenarioMessage, MessageEntry, parseMessageEntries } from './scenario-interaction.model';

/** SOCIAL_MEDIA scenarios - a direct-message conversation. */
@Component({
  selector: 'app-social-media-interaction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-media-interaction.component.html',
  styleUrl: './interaction-shell.scss',
})
export class SocialMediaInteractionComponent {
  @Input({ required: true }) message!: ScenarioMessage;

  get messages(): MessageEntry[] {
    return parseMessageEntries(this.message.body);
  }
}
