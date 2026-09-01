import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePreset {
  label: string;
  getRange: () => DateRange;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  { label: 'Today', getRange: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { label: 'Last 7 days', getRange: () => ({ start: startOfDay(daysAgo(6)), end: endOfDay(new Date()) }) },
  { label: 'Last 30 days', getRange: () => ({ start: startOfDay(daysAgo(29)), end: endOfDay(new Date()) }) },
  {
    label: 'This month',
    getRange: () => {
      const now = new Date();
      return {
        start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: endOfDay(new Date()),
      };
    },
  },
];

// Native <input type="date"> works in the browser's local timezone and
// expects/returns "yyyy-MM-dd" - going through Date#toISOString would shift
// the date across a UTC day boundary, so these convert using local
// year/month/day components instead.
function toInputValue(date: Date | null): string {
  if (!date) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromInputValue(value: string): Date | null {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Generic date-range filter, dropped in above any list/table (e.g. the
 * Learners screen's "Last Active" column) to narrow rows to a date window.
 * Purely presentational/controlled: the parent owns the actual start/end
 * values and re-filters its rows on `rangeChange` - this component never
 * touches the data it's filtering.
 */
@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule],
  templateUrl: './date-range-picker.component.html',
  styleUrl: './date-range-picker.component.scss',
})
export class DateRangePickerComponent implements OnChanges, OnDestroy {
  @Input() label = 'Date range';
  @Input() startDate: Date | null = null;
  @Input() endDate: Date | null = null;
  @Input() presets: DateRangePreset[] = DEFAULT_PRESETS;

  @Output() rangeChange = new EventEmitter<DateRange>();

  @ViewChild('panelTemplate') panelTemplate!: TemplateRef<unknown>;

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  isOpen = false;
  draftStart = '';
  draftEnd = '';

  get triggerLabel(): string {
    if (!this.startDate && !this.endDate) {
      return this.label;
    }
    const start = this.startDate ? this.formatShort(this.startDate) : '…';
    const end = this.endDate ? this.formatShort(this.endDate) : '…';
    return `${start} - ${end}`;
  }

  get hasSelection(): boolean {
    return !!(this.startDate || this.endDate);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate']) {
      this.draftStart = toInputValue(this.startDate);
      this.draftEnd = toInputValue(this.endDate);
    }
  }

  toggle(trigger: HTMLElement): void {
    if (this.isOpen) {
      this.close();
      return;
    }
    this.open(trigger);
  }

  private open(trigger: HTMLElement): void {
    this.draftStart = toInputValue(this.startDate);
    this.draftEnd = toInputValue(this.endDate);

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(trigger)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ])
      .withPush(true);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    const portal = new TemplatePortal(this.panelTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);
    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.isOpen = true;
  }

  close(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen = false;
  }

  applyPreset(preset: DateRangePreset): void {
    const range = preset.getRange();
    this.rangeChange.emit(range);
    this.close();
  }

  applyDraft(): void {
    this.rangeChange.emit({
      start: fromInputValue(this.draftStart),
      end: fromInputValue(this.draftEnd),
    });
    this.close();
  }

  clear(): void {
    this.draftStart = '';
    this.draftEnd = '';
    this.rangeChange.emit({ start: null, end: null });
    this.close();
  }

  private formatShort(date: Date): string {
    // Built manually (not toLocaleDateString) so the trigger label reads the
    // same "Mon D" way in every locale, rather than flipping to "D Mon" in
    // locales that order day before month.
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  ngOnDestroy(): void {
    this.close();
  }
}
