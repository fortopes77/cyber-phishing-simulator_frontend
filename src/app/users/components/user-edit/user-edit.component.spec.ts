import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';

import { UserEditComponent } from './user-edit.component';
import { UsersActions } from '../../+state/users.actions';
import { selectUser } from '../../+state/users.selectors';

describe('UserEditComponent', () => {
  let component: UserEditComponent;
  let fixture: ComponentFixture<UserEditComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Observable<any>;

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [UserEditComponent, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [{ selector: selectUser, value: null }],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the edit form controls and action buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.textContent).toContain('Full name');
    expect(compiled.textContent).toContain('Save');
    expect(compiled.textContent).toContain('Cancel');
  });

  it('should read the user id from the route and fetch its details', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue('u_42');

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.userId).toBe('u_42');
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.fetchUserDetails({ userId: 'u_42' }),
    );
  });

  it('should detect create mode from the route and skip fetching details', () => {
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot as any).url = [{ path: 'create' }];

    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isCreateMode).toBeTrue();
  });

  it('should dispatch createUser with the form values in create mode', () => {
    component.isCreateMode = true;
    component.userForm.setValue({
      fullName: 'Ava Morales',
      email: 'ava.morales@example.com',
      role: 'user',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.createUser({
        user: {
          fullName: 'Ava Morales',
          email: 'ava.morales@example.com',
          role: 'user',
        },
      }),
    );
  });

  it('should dispatch updateUser with the form values in edit mode', () => {
    component.isCreateMode = false;
    component.userId = 'u_7';
    component.userForm.setValue({
      fullName: 'Noah Bennett',
      email: 'noah.bennett@example.com',
      role: 'trainer',
    });

    component.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.updateUser({
        userId: 'u_7',
        updatedUser: {
          fullName: 'Noah Bennett',
          email: 'noah.bennett@example.com',
          role: 'trainer',
        },
      }),
    );
  });

  it('should not dispatch when the form is invalid', () => {
    component.userForm.setValue({
      fullName: '',
      email: 'not-an-email',
      role: 'user',
    });

    component.onSubmit();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should navigate back to the learners list on cancel', () => {
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/learners']);
  });

  it('should mark isLearner from the loaded user, not the unsaved role field', () => {
    store.overrideSelector(selectUser, {
      id: 'u_1',
      fullName: 'Ava Morales',
      email: 'ava.morales@example.com',
      role: 'user',
    });
    store.refreshState();

    expect(component.isLearner).toBeTrue();

    component.userForm.patchValue({ role: 'trainer' });
    expect(component.isLearner).toBeTrue();
  });

  it('should not show the reminder button in create mode even for a learner role', () => {
    component.isCreateMode = true;
    component.isLearner = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Send Reminder Email');
  });

  it('should dispatch sendReminderEmail with the user id on confirm', () => {
    component.isCreateMode = false;
    component.userId = 'u_1';

    component.openSendReminderModal();
    component.confirmSendReminder();

    expect(component.reminderSending).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.sendReminderEmail({ userId: 'u_1' }),
    );
  });

  it('should close the reminder modal without dispatching on cancel', () => {
    component.openSendReminderModal();
    component.cancelSendReminder();

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(component.isSendReminderModalOpen).toBeFalse();
  });

  it('should clear saving and close the modal when sendReminderEmailSuccess is seen', () => {
    actions$ = of(UsersActions.sendReminderEmailSuccess({ userId: 'u_1' }));
    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    component.isSendReminderModalOpen = true;
    component.reminderSending = true;

    fixture.detectChanges();

    expect(component.reminderSending).toBeFalse();
    expect(component.isSendReminderModalOpen).toBeFalse();
  });

  it('should surface the error when sendReminderEmailFailure is seen', () => {
    actions$ = of(
      UsersActions.sendReminderEmailFailure({ error: 'Failed to send reminder email' }),
    );
    fixture = TestBed.createComponent(UserEditComponent);
    component = fixture.componentInstance;
    component.reminderSending = true;

    fixture.detectChanges();

    expect(component.reminderSending).toBeFalse();
    expect(component.reminderError).toBe('Failed to send reminder email');
  });
});
