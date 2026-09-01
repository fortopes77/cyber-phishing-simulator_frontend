import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';

import { ListComponent } from './list.component';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent, NoopAnimationsModule],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    overlayContainerElement = overlayContainer.getContainerElement();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
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

  it('should open the overflow action menu when the ellipsis trigger is clicked', () => {
    component.columns = [{ key: 'name', label: 'Name' }];
    component.rows = [{ name: 'Ada' }];
    component.actions = [
      { label: 'Edit', action: jasmine.createSpy('edit') },
      { label: 'View', action: jasmine.createSpy('view') },
      { label: 'Delete', action: jasmine.createSpy('delete') },
    ];

    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.action-menu-trigger',
    ) as HTMLElement;
    expect(trigger).not.toBeNull();

    trigger.click();
    fixture.detectChanges();

    // The menu is portaled into the CDK overlay container (appended
    // directly to <body>) rather than rendered inside the component's own
    // DOM subtree, so it's found there instead of via fixture.nativeElement.
    const menuItems = overlayContainerElement.querySelectorAll(
      '.action-menu-item',
    );
    expect(menuItems.length).toBe(1);
    expect(menuItems[0].textContent).toContain('Delete');
  });

  it('should close the overflow menu when an item is clicked', () => {
    component.columns = [{ key: 'name', label: 'Name' }];
    component.rows = [{ name: 'Ada' }];
    const deleteSpy = jasmine.createSpy('delete');
    component.actions = [
      { label: 'Edit', action: jasmine.createSpy('edit') },
      { label: 'View', action: jasmine.createSpy('view') },
      { label: 'Delete', action: deleteSpy },
    ];

    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.action-menu-trigger',
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    const deleteItem = overlayContainerElement.querySelector(
      '.action-menu-item',
    ) as HTMLElement;
    deleteItem.click();
    fixture.detectChanges();

    expect(deleteSpy).toHaveBeenCalled();
    expect(overlayContainerElement.querySelectorAll('.action-menu-item').length).toBe(0);
  });
});
