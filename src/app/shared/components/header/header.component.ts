
import { Component, ElementRef, HostListener, Input } from '@angular/core';

export interface HeaderCreateAction {
  label: string;
  action: () => void;
}

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showCreateAction = false;
  @Input() createActions: HeaderCreateAction[] = [];

  isCreateMenuOpen = false;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  get hasCreateActions(): boolean {
    return this.showCreateAction && this.createActions.length > 0;
  }

  toggleCreateMenu(): void {
    if (!this.hasCreateActions) {
      return;
    }

    this.isCreateMenuOpen = !this.isCreateMenuOpen;
  }

  handleCreateAction(action: HeaderCreateAction): void {
    action.action();
    this.isCreateMenuOpen = false;
  }

  @HostListener('document:click', ['$event.target'])
  closeCreateMenuOnOutsideClick(target: EventTarget | null): void {
    if (
      this.isCreateMenuOpen &&
      target instanceof Node &&
      !this.elementRef.nativeElement.contains(target)
    ) {
      this.isCreateMenuOpen = false;
    }
  }
}
