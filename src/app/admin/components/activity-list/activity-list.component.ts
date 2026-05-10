import { Component, Input } from '@angular/core';
import { ActivityItem } from '../models/activity-item.model';
import { ActivityItemComponent } from '../activity-item/activity-item.component';

@Component({
  selector: 'app-activity-list',
  imports: [ActivityItemComponent],
  templateUrl: './activity-list.component.html',
  styleUrl: './activity-list.component.scss',
})
export class ActivityListComponent {
  @Input() items: ActivityItem[] = [];
}
