import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-filter-bar',
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter-bar.component.html',
  styleUrl: './search-filter-bar.component.scss',
})
export class SearchFilterBarComponent {
  @Input() searchPlaceholder = 'Search...';
  @Input() filterLabel = 'Filter';
  @Input() filterOptions: string[] = [];
  @Input() searchValue = '';
  @Input() filterValue = 'all';

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string>();

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }

  onFilterChange(value: string): void {
    this.filterValue = value;
    this.filterChange.emit(value);
  }
}
