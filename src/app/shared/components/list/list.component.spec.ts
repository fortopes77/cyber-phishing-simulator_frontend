import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListComponent } from './list.component';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
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

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLElement>,
    ).map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Name', 'Email', 'Actions']);

    const firstRowCells = Array.from(
      fixture.nativeElement.querySelectorAll(
        'tbody tr:first-child td',
      ) as NodeListOf<HTMLElement>,
    ).map((td) => td.textContent?.trim());
    expect(firstRowCells.slice(0, 2)).toEqual(['Ada', 'ada@example.com']);
    expect(
      fixture.nativeElement.querySelector('button')?.textContent,
    ).toContain('Edit');
  });

  it('should paginate rows to a maximum of 10 per page', () => {
    component.columns = [{ key: 'name', label: 'Name' }];
    component.rows = Array.from({ length: 12 }, (_, index) => ({
      name: `Item ${index + 1}`,
    }));

    fixture.detectChanges();

    const rows = Array.from(
      fixture.nativeElement.querySelectorAll(
        'tbody tr',
      ) as NodeListOf<HTMLElement>,
    );

    expect(rows.length).toBe(10);
    expect(fixture.nativeElement.textContent).toContain('Page 1 of 2');
  });
});
