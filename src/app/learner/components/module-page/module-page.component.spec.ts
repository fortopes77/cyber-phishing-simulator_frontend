import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ModulePageComponent } from './module-page.component';

describe('ModulePageComponent', () => {
  let component: ModulePageComponent;
  let fixture: ComponentFixture<ModulePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulePageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'email-phishing' })),
          },
        },
      ],
    }).compileComponents();

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
});
