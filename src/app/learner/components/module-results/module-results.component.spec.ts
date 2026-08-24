import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ModuleResultsComponent } from './module-results.component';

describe('ModuleResultsComponent', () => {
  let component: ModuleResultsComponent;
  let fixture: ComponentFixture<ModuleResultsComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleResultsComponent, RouterTestingModule.withRoutes([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleResultsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the module title and score', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Email Phishing Basics');
    expect(compiled.textContent).toContain('100%');
    expect(compiled.textContent).toContain('2 of 2 scenarios');
  });

  it('should navigate to retry module when retry button is clicked', () => {
    spyOn(router, 'navigate');
    component.retryModule();
    expect(router.navigate).toHaveBeenCalledWith(['/learner/modules/1']);
  });
});
