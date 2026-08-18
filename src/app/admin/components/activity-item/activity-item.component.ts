import { Component, Input } from '@angular/core';
import { ActivityItem } from '../models/activity-item.model';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-activity-item',
  imports: [NgClass],
  templateUrl: './activity-item.component.html',
  styleUrl: './activity-item.component.scss',
})
export class ActivityItemComponent {
  @Input() item!: ActivityItem;
}
