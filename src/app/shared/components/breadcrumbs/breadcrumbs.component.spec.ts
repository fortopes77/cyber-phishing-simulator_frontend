import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { BreadcrumbsComponent } from './breadcrumbs.component';

@Component({ template: '' })
class DummyComponent {}

describe('BreadcrumbsComponent', () => {
  let component: BreadcrumbsComponent;
  let fixture: ComponentFixture<BreadcrumbsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbsComponent],
      providers: [
        provideRouter([
          {
            path: 'learner',
            data: { breadcrumb: 'Learner' },
            children: [
              {
                path: 'dashboard',
                component: DummyComponent,
                data: { breadcrumb: 'Dashboard' },
              },
              {
                path: 'modules',
                component: DummyComponent,
                data: { breadcrumb: 'Modules' },
              },
              {
                path: 'modules/:id',
                component: DummyComponent,
                data: { breadcrumb: 'Module' },
              },
            ],
          },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate breadcrumbs from the active route', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/learner/modules/123');
    fixture.detectChanges();

    expect(component.breadcrumbs.map((breadcrumb) => breadcrumb.label)).toEqual(
      ['Learner', 'Modules', 'Module'],
    );
  });
});
