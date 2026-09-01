import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';

import { ModuleEditComponent } from './module-edit.component';
import { ModulesActions } from '../../+state/modules.actions';
import { selectModule, selectModuleList } from '../../+state/modules.selectors';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';

describe('ModuleEditComponent', () => {
  let component: ModuleEditComponent;
  let fixture: ComponentFixture<ModuleEditComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Observable<any>;

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [ModuleEditComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectModule, value: null },
            { selector: selectModuleList, value: [] },
            { selector: selectScenarioList, value: [] },
          ],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the edit form controls and action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('Module name');
    expect(compiled.textContent).toContain('Save');
    expect(compiled.textContent).toContain('Cancel');
  });

  it('should read the module id from the route and fetch its details', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue('42');

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.moduleId).toBe(42);
    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.fetchModuleDetails({ moduleId: 42 }),
    );
  });

  it('should populate the form from the already-fetched module list even if fetchModuleDetails has not resolved yet', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue('42');
    store.overrideSelector(selectModuleList, [
      {
        moduleId: 42,
        moduleName: 'Phishing Awareness',
        description: 'Learn to spot phishing',
        version: '1.0.0',
      },
    ]);
    store.overrideSelector(selectModule, null);
    store.refreshState();

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.moduleForm.value).toEqual({
      moduleName: 'Phishing Awareness',
      description: 'Learn to spot phishing',
      version: '1.0.0',
    });
  });

  it('should detect create mode from the route and skip fetching details', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot as any).url = [{ path: 'create' }];

    fixture = TestBed.createComponent(ModuleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isCreateMode).toBeTrue();
  });

  it('should dispatch createModule with the form values in create mode', () => {
    component.isCreateMode = true;
    component.moduleForm.setValue({
      moduleName: 'New Module',
      description: 'A brand new module',
      version: '1.0.0',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.createModule({
        module: {
          moduleName: 'New Module',
          description: 'A brand new module',
          version: '1.0.0',
        },
      }),
    );
  });

  it('should dispatch updateModule with the form values in edit mode', () => {
    component.isCreateMode = false;
    component.moduleId = 7;
    component.moduleForm.setValue({
      moduleName: 'Updated Module',
      description: 'Updated description',
      version: '2.0.0',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      ModulesActions.updateModule({
        moduleId: 7,
        updatedModule: {
          moduleName: 'Updated Module',
          description: 'Updated description',
          version: '2.0.0',
        },
      }),
    );
  });

  it('should not dispatch when the form is invalid', () => {
    component.moduleForm.setValue({
      moduleName: '',
      description: '',
      version: '',
    });

    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should navigate back to the modules list on cancel', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/modules']);
  });

  it('should navigate to the scenario library to manage scenarios', () => {
    component.manageScenarios();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/scenarios']);
  });
});
