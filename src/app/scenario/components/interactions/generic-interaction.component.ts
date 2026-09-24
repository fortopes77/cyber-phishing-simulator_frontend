import { Component, Input } from '@angular/core';
import { ScenarioMessage } from './scenario-interaction.model';

/** Fallback for an unrecognised interactionType - the message body as-is. */
@Component({
  selector: 'app-generic-interaction',
  standalone: true,
  imports: [],
  templateUrl: './generic-interaction.component.html',
  styleUrl: './interaction-shell.scss',
})
export class GenericInteractionComponent {
  @Input({ required: true }) message!: ScenarioMessage;
}
