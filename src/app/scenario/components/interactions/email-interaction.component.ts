import { Component, Input } from '@angular/core';
import { ScenarioMessage } from './scenario-interaction.model';

/** EMAIL scenarios - an inbox-style message with From/To/Subject headers. */
@Component({
  selector: 'app-email-interaction',
  standalone: true,
  imports: [],
  templateUrl: './email-interaction.component.html',
  styleUrl: './interaction-shell.scss',
})
export class EmailInteractionComponent {
  @Input({ required: true }) message!: ScenarioMessage;
}
