import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { ModulePageComponent } from './module-page.component';
import { selectScenarioList } from 'src/app/scenario/+state/scenario.selectors';
import { selectAttempts } from 'src/app/attempts/+state/attempts.selectors';

describe('ModulePageComponent', () => {
  let component: ModulePageComponent;
  let fixture: ComponentFixture<ModulePageComponent>;
  let router: Router;
  let store: MockStore;

  const scenarios = [
    { id: 1, title: 'Urgent Password Reset', difficulty: 'Easy' },
    { id: 2, title: 'IT Department Software Update', difficulty: 'Medium' },
  ];
  const attempts = [
    { id: 'a1', scenarioId: 1, decision: 'Report', correct: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulePageComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 1 })),
          },
        },
        provideMockStore({
          selectors: [
            { selector: selectScenarioList, value: scenarios },
            { selector: selectAttempts, value: attempts },
          ],
        }),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    store = TestBed.inject(MockStore);
    spyOn(router, 'navigate');
    spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(ModulePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the module id from the route params', () => {
    expect(component.moduleId).toBe(1);
  });

  it('should generate a formatted title from the id', () => {
    expect(component.title).toBe('Email Phishing');
  });

  it('should dispatch actions to load the module scenarios and attempts', () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({ moduleId: 1 }),
    );
  });

  it('should navigate to the next incomplete scenario on continue', () => {
    component.continueModule();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 2]);
  });
});
