import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-row',
  imports: [],
  templateUrl: './progress-row.component.html',
  styleUrl: './progress-row.component.scss',
})
export class ProgressRowComponent {
  @Input() label = '';
  @Input() value = 0;
  @Input() max = 100;
  @Input() color = '#0d6efd';

  get percentage(): number {
    return (this.value / this.max) * 100;
  }
}
