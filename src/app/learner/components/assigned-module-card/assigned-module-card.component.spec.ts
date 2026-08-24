import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  AssignedModuleCardComponent,
  AssignedModule,
} from './assigned-module-card.component';

describe('AssignedModuleCardComponent', () => {
  let component: AssignedModuleCardComponent;
  let fixture: ComponentFixture<AssignedModuleCardComponent>;
  let router: Router;

  const module: AssignedModule = {
    id: 1,
    title: 'Phishing Awareness',
    description: 'Learn to spot phishing',
    level: 'Beginner',
    scenarios: 4,
    status: 'In progress',
    progressPercentage: 50,
    route: '/learner/modules/1',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignedModuleCardComponent, RouterTestingModule],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(AssignedModuleCardComponent);
    component = fixture.componentInstance;
    component.module = module;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the module title and description', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Phishing Awareness');
    expect(compiled.textContent).toContain('Learn to spot phishing');
  });

  it('should navigate to the module route and emit selected on click', () => {
    spyOn(component.selected, 'emit');

    component.onClick();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/modules/1']);
    expect(component.selected.emit).toHaveBeenCalledWith(module);
  });

  it('should not navigate when the module has no route', () => {
    component.module = { ...module, route: undefined };
    spyOn(component.selected, 'emit');

    component.onClick();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.selected.emit).toHaveBeenCalled();
  });
});
