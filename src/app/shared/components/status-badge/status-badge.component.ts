import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatusBadgeVariant =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral';

// Maps the status strings already used across the app (module/learner
// progress, scenario state, etc.) onto a badge color so callers can just
// pass the raw status and get consistent styling without picking a variant
// themselves. Pass `variant` directly to override this for a status that
// isn't listed here.
const VARIANT_BY_STATUS: Record<string, StatusBadgeVariant> = {
  ASSIGNED: 'success',
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  OVERDUE: 'danger',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
  PENDING: 'warning',
  FAILED: 'danger',
  EXPIRED: 'danger',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() variant?: StatusBadgeVariant;

  get resolvedVariant(): StatusBadgeVariant {
    if (this.variant) {
      return this.variant;
    }

    const key = this.status.trim().toUpperCase().replace(/\s+/g, '_');
    return VARIANT_BY_STATUS[key] ?? 'neutral';
  }
}
