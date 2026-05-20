import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ModulePageComponent } from './module-page.component';

describe('ModulePageComponent', () => {
  let component: ModulePageComponent;
  let fixture: ComponentFixture<ModulePageComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulePageComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'email-phishing' })),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(ModulePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read slug from route params', () => {
    expect(component.slug).toBe('email-phishing');
  });

  it('should generate a formatted title from slug', () => {
    expect(component.title).toBe('Email Phishing');
  });

  it('should navigate to the next incomplete scenario on continue', () => {
    component.continueModule();

    expect(router.navigate).toHaveBeenCalledWith(['/learner/scenarios', 2]);
  });
});
