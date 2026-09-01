import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { TrainerModulesListComponent } from './trainer-modules-list.component';
import { ModulesActions } from 'src/app/modules/+state/modules.actions';
import { selectModuleList } from 'src/app/modules/+state/modules.selectors';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';

describe('TrainerModulesListComponent', () => {
  let component: TrainerModulesListComponent;
  let fixture: ComponentFixture<TrainerModulesListComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Observable<any>;

  const modules = [
    {
      moduleId: 1,
      moduleName: 'Phishing Awareness',
      version: '1.2.0',
      description: 'Learn how to recognize and avoid phishing attacks',
    },
  ];
  const scenarios = [
    { id: 's_001', moduleId: 1 },
    { id: 's_002', moduleId: 1 },
    { id: 's_003', moduleId: 2 },
  ];

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [TrainerModulesListComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectModuleList, value: modules },
            { selector: selectScenarioList, value: scenarios },
          ],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(TrainerModulesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should map modules with a scenario count scoped to that module', () => {
    expect(component.allRows.length).toBe(1);
    expect(component.allRows[0]['scenarioCount']).toBe(2);
    expect(component.allRows[0]['moduleName']).toBe('Phishing Awareness');
  });

  it('should filter rows by search text', () => {
    component.onSearchChange('nonexistent');
    expect(component.rows.length).toBe(0);

    component.onSearchChange('phishing');
    expect(component.rows.length).toBe(1);
  });

  it('should navigate to the module edit page on edit', () => {
    component.actions[0].action(component.allRows[0]);

    expect(router.navigate).toHaveBeenCalledWith(['/trainer/modules', '1', 'edit']);
  });

  it('should navigate to the trainer scenario library on manage scenarios', () => {
    component.actions[1].action(component.allRows[0]);

    expect(router.navigate).toHaveBeenCalledWith(['/trainer/scenarios']);
  });

  it('should navigate to the module create page from the header action', () => {
    component.createActions[0].action();

    expect(router.navigate).toHaveBeenCalledWith(['/trainer/modules/create']);
  });

  it('should open the delete confirmation modal with the selected module', () => {
    component.actions[2].action(component.allRows[0]);

    expect(component.isDeleteModalOpen).toBeTrue();
    expect(component.selectedModuleName).toBe('Phishing Awareness');
  });

  it('should dispatch deleteModule on confirm and close the modal', () => {
    component.actions[2].action(component.allRows[0]);
    component.confirmDelete();

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.deleteModule({ moduleId: 1 }),
    );
    expect(component.isDeleteModalOpen).toBeFalse();
  });

  it('should close the modal without dispatching on cancel', () => {
    component.actions[2].action(component.allRows[0]);
    component.cancelDelete();

    expect(store.dispatch).not.toHaveBeenCalledWith(
      ModulesActions.deleteModule({ moduleId: 1 }),
    );
    expect(component.isDeleteModalOpen).toBeFalse();
  });

  it('should refetch modules after a successful delete', () => {
    actions$ = of(ModulesActions.deleteModuleSuccess({ moduleId: 1 }));

    fixture = TestBed.createComponent(TrainerModulesListComponent);
    component = fixture.componentInstance;
    (store.dispatch as jasmine.Spy).calls.reset();
    fixture.detectChanges();

    expect(store.dispatch).toHaveBeenCalledWith(ModulesActions.fetchList({}));
  });
});
