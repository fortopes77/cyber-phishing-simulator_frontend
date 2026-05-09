import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Statistic } from '../../models/statistic.model';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-data-card',
  imports: [FaIconComponent, BrowserModule],
  templateUrl: './data-card.component.html',
  styleUrl: './data-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataCardComponent {
  @Input() icon?: IconDefinition;
  @Input() statistic?: Statistic;
  @Input() label?: string;
  //TODO: Turn this into an enum
  @Input() dataType?: 'module' | 'scenario' | 'average';
}
