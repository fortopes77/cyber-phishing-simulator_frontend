import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ListComponent } from './list.component';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render dynamic columns, rows and actions', () => {
    component.columns = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
    ];
    component.rows = [
      { name: 'Ada', email: 'ada@example.com' },
      { name: 'Grace', email: 'grace@example.com' },
    ];
    component.actions = [{ label: 'Edit', action: jasmine.createSpy('edit') }];

    fixture.detectChanges();

    const headerLabels = Array.from(
      fixture.nativeElement.querySelectorAll(
        'th[mat-header-cell]',
      ) as NodeListOf<HTMLElement>,
    )
      .map((header) => header.textContent?.trim())
      .filter(Boolean);

    expect(headerLabels).toContain('Name');
    expect(headerLabels).toContain('Email');
    expect(headerLabels).toContain('Actions');

    expect(fixture.nativeElement.textContent).toContain('Ada');
    expect(fixture.nativeElement.textContent).toContain('ada@example.com');
    const actionButton = fixture.nativeElement.querySelector(
      '.action-button',
    ) as HTMLElement | null;
    expect(actionButton).not.toBeNull();
    expect(actionButton?.getAttribute('aria-label')).toBeNull();
  });

  it('should allow sorting by regular columns and keep the actions column unsortable', () => {
    component.columns = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
    ];
    component.rows = [
      { name: 'Grace', email: 'grace@example.com' },
      { name: 'Ada', email: 'ada@example.com' },
    ];
    component.actions = [{ label: 'Edit', action: jasmine.createSpy('edit') }];

    fixture.detectChanges();

    const sortHeaders =
      fixture.nativeElement.querySelectorAll('th.mat-sort-header');
    expect(sortHeaders.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Actions');
  });
});
