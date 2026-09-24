import { Component, Input } from '@angular/core';
import {
  ScenarioMessage,
  InvoiceField,
  parseInvoiceAmount,
  parseInvoiceFields,
} from './scenario-interaction.model';

/**
 * Legacy "invoice" scenarios (not a current backend interactionType, kept
 * for older free-text values) - an invoice summary with its line items.
 */
@Component({
  selector: 'app-invoice-interaction',
  standalone: true,
  imports: [],
  templateUrl: './invoice-interaction.component.html',
  styleUrl: './interaction-shell.scss',
})
export class InvoiceInteractionComponent {
  @Input({ required: true }) message!: ScenarioMessage;

  get amount(): string {
    return parseInvoiceAmount(this.message.body);
  }

  get fields(): InvoiceField[] {
    return parseInvoiceFields(this.message.body, this.message.subject);
  }
}
