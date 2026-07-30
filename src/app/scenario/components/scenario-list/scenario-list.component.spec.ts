import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ScenarioListComponent } from './scenario-list.component';

describe('ScenarioListComponent', () => {
  let component: ScenarioListComponent;
  let fixture: ComponentFixture<ScenarioListComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioListComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the scenario edit page when the edit action is triggered', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.actions[0].action({ id: 42 } as Record<string, unknown>);

    expect(navigateSpy).toHaveBeenCalledWith(['/trainer/scenarios/42/edit']);
  });
});
