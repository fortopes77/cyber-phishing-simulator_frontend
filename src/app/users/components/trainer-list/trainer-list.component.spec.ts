import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';

import { TrainerListComponent } from './trainer-list.component';
import { UsersActions } from 'src/app/users/+state/users.actions';
import { selectTrainerList } from 'src/app/users/+state/users.selectors';
import { selectAuthState } from 'src/app/auth/+state/auth.selectors';
import { AuthActions } from 'src/app/auth/+state/auth.actions';
import { UserAccount } from 'src/app/users/+state/user-account.model';

describe('TrainerListComponent', () => {
  let component: TrainerListComponent;
  let fixture: ComponentFixture<TrainerListComponent>;
  let store: MockStore;
  let router: Router;
  let actions$: Observable<any>;

  const mockTrainers: UserAccount[] = [
    {
      id: '1',
      username: 'jane.trainer',
      firstName: 'Jane',
      lastName: 'Trainer',
      fullName: 'Jane Trainer',
      email: 'jane.trainer@example.com',
      role: 'trainer',
      organisationId: 1,
    },
    {
      id: '2',
      username: 'bruce.trainer',
      firstName: 'Bruce',
      lastName: 'Trainer',
      fullName: 'Bruce Trainer',
      email: 'bruce.trainer@example.com',
      role: 'trainer',
      organisationId: 1,
    },
  ];

  beforeEach(async () => {
    actions$ = of();

    await TestBed.configureTestingModule({
      imports: [TrainerListComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectTrainerList, value: mockTrainers },
            {
              selector: selectAuthState,
              value: {
                isAuthenticated: true,
                loading: false,
                user: { id: '99', username: 't', email: 't@t.com', role: 'trainer', organisationId: 1 },
              },
            },
          ],
        }),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    spyOn(store, 'dispatch');
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(TrainerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("should dispatch fetchTrainerList with the trainer's organisationId on init", () => {
    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.fetchTrainerList({ organisationId: 1 }),
    );
  });

  it('should seed the rows from the store trainer list', () => {
    expect(component.rows.length).toBe(mockTrainers.length);
    expect(component.rows[0].fullName).toBe('Jane Trainer');
    expect(component.rows[0].email).toBe('jane.trainer@example.com');
  });

  it('should only expose "Send Password Reset Email" and "Delete" actions - no Edit and no direct password set', () => {
    expect(component.actions.length).toBe(2);
    expect(component.actions.map((a) => a.label)).toEqual([
      'Send Password Reset Email',
      'Delete',
    ]);
  });

  it('should render the trainer table and the Learners/Trainers tabs', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Jane Trainer');
    expect(text).toContain('Bruce Trainer');
    expect(text).toContain('Learners');
    expect(text).toContain('Trainers');
  });

  it('should navigate to the trainer create page from the header action', () => {
    component.createActions[0].action();
    expect(router.navigate).toHaveBeenCalledWith(['/trainer/trainers/create']);
  });

  it('should open the delete modal with the selected trainer', () => {
    component.actions[1].action(component.rows[0]);
    expect(component.isDeleteModalOpen).toBeTrue();
    expect(component.selectedTrainerName).toBe(component.rows[0].fullName);
  });

  it('should dispatch deleteUser on confirm and close the modal', () => {
    const firstRow = component.rows[0];

    component.actions[1].action(firstRow);
    component.confirmDelete();

    expect(store.dispatch).toHaveBeenCalledWith(
      UsersActions.deleteUser({ userId: String(firstRow.id) }),
    );
    expect(component.isDeleteModalOpen).toBeFalse();
    expect(component.selectedTrainerRow).toBeNull();
  });

  it('should close the delete modal without dispatching on cancel', () => {
    component.actions[1].action(component.rows[0]);
    component.cancelDelete();

    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: UsersActions.deleteUser.type }),
    );
    expect(component.isDeleteModalOpen).toBeFalse();
  });

  it('should reflect the store dropping a deleted trainer from the list', () => {
    const remaining = mockTrainers.slice(1);
    store.overrideSelector(selectTrainerList, remaining);
    store.refreshState();

    expect(component.rows.length).toBe(remaining.length);
  });

  it('should open the forgot-password modal with the selected trainer', () => {
    component.actions[0].action(component.rows[0]);

    expect(component.isForgotPasswordModalOpen).toBeTrue();
    expect(component.selectedResetName).toBe(component.rows[0].fullName);
  });

  it("should dispatch forgotPassword with the selected trainer's email on confirm", () => {
    const firstRow = component.rows[0];
    component.actions[0].action(firstRow);

    component.confirmForgotPassword();

    expect(component.forgotPasswordSending).toBeTrue();
    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.forgotPassword({ email: firstRow.email }),
    );
  });

  it('should close the forgot-password modal without dispatching on cancel', () => {
    component.actions[0].action(component.rows[0]);
    component.cancelForgotPassword();

    expect(store.dispatch).not.toHaveBeenCalledWith(
      jasmine.objectContaining({ type: AuthActions.forgotPassword.type }),
    );
    expect(component.isForgotPasswordModalOpen).toBeFalse();
  });

  it('should clear sending and close the modal when forgotPasswordSuccess is seen', () => {
    actions$ = of(AuthActions.forgotPasswordSuccess());
    fixture = TestBed.createComponent(TrainerListComponent);
    component = fixture.componentInstance;
    component.isForgotPasswordModalOpen = true;
    component.forgotPasswordSending = true;

    fixture.detectChanges();

    expect(component.forgotPasswordSending).toBeFalse();
    expect(component.isForgotPasswordModalOpen).toBeFalse();
  });

  it('should surface the error when forgotPasswordFailure is seen', () => {
    actions$ = of(
      AuthActions.forgotPasswordFailure({ error: 'Failed to send password reset email' }),
    );
    fixture = TestBed.createComponent(TrainerListComponent);
    component = fixture.componentInstance;
    component.forgotPasswordSending = true;

    fixture.detectChanges();

    expect(component.forgotPasswordSending).toBeFalse();
    expect(component.forgotPasswordError).toBe('Failed to send password reset email');
  });
});
