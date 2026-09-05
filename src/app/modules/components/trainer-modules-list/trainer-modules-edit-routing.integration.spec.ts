import { Component } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { TrainerModulesListComponent } from './trainer-modules-list.component';
import { ModuleEditComponent } from '../module-edit/module-edit.component';
import { modulesReducer } from '../../+state/modules.reducer';
import { ModulesEffects } from '../../+state/modules.effects';
import { scenarioReducer } from 'src/app/scenario/+state/scenario.reducer';
import { ScenarioEffects } from 'src/app/scenario/+state/scenario.effects';
import { AuthModule } from 'src/app/auth/auth.module';
import { UsersModule } from 'src/app/users/users.module';
import { environment } from 'src/environments/environment';

// Full-stack check (real Router + real NgRx Store/Effects + HttpTestingController)
// for a reported bug: clicking "Edit" on the trainer modules list appeared not
// to navigate or call the API at all. Component-level unit tests already
// mock the Router/Store, which proves the *call* to router.navigate/
// store.dispatch happens, but not that a real click on the real DOM button
// actually reaches that call, or that a real effect turns the dispatch into
// an HTTP request. This test exercises that whole chain for real.
@Component({
  standalone: true,
  imports: [RouterModule],
  template: '<router-outlet></router-outlet>',
})
class RootTestComponent {}

describe('Trainer modules list -> module edit (integration)', () => {
  let router: Router;
  let location: Location;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RootTestComponent,
        TrainerModulesListComponent,
        ModuleEditComponent,
        RouterTestingModule.withRoutes([
          { path: 'trainer/modules', component: TrainerModulesListComponent },
          {
            path: 'trainer/modules/:id/edit',
            component: ModuleEditComponent,
          },
        ]),
        StoreModule.forRoot({}),
        StoreModule.forFeature('modules', modulesReducer),
        StoreModule.forFeature('scenario', scenarioReducer),
        EffectsModule.forRoot([]),
        EffectsModule.forFeature([ModulesEffects, ScenarioEffects]),
        // ModuleEditComponent now also reads the signed-in trainer's
        // organisationId (to fetch the org's learners for its "assign
        // learners" panel) - both features need to be registered for real,
        // the same as AppModule does, or selectAuthState resolves to
        // undefined and crashes the subscription.
        AuthModule,
        UsersModule,
      ],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('clicking Edit navigates to the edit route and fetches the module from the API', fakeAsync(() => {
    const fixture = TestBed.createComponent(RootTestComponent);
    fixture.ngZone!.run(() => router.navigateByUrl('/trainer/modules'));
    tick();
    fixture.detectChanges();

    const listReqs = httpMock.match(
      (r) => r.url === `${environment.apiUrl}training-modules`,
    );
    expect(listReqs.length).toBeGreaterThan(0);
    listReqs.forEach((req) =>
      req.flush([
        {
          moduleId: 1,
          moduleName: 'Phishing Awareness',
          description: 'Learn to spot phishing',
        },
      ]),
    );
    httpMock.match(() => true).forEach((req) => req.flush([]));
    tick();
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector(
      '.action-button',
    ) as HTMLButtonElement | null;
    expect(editButton)
      .withContext('Edit button should be rendered for the fetched module')
      .not.toBeNull();

    editButton!.click();
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/trainer/modules/1/edit');

    const detailsReq = httpMock.expectOne(
      `${environment.apiUrl}training-modules/1`,
    );
    expect(detailsReq.request.method).toBe('GET');
    detailsReq.flush({
      moduleId: 1,
      moduleName: 'Phishing Awareness',
      description: 'Learn to spot phishing',
    });

    httpMock.match(() => true).forEach((req) => req.flush([]));
    tick();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector(
      'input[formcontrolname="moduleName"]',
    ) as HTMLInputElement;
    expect(nameInput.value).toBe('Phishing Awareness');
  }));
});
