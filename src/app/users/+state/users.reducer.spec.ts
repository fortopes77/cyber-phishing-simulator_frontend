import { usersReducer, initialUsersState } from './users.reducer';
import { UsersActions } from './users.actions';
import { UserAccount } from './user-account.model';

describe('usersReducer', () => {
  const learner: UserAccount = {
    id: '1',
    username: 'jane',
    firstName: 'Jane',
    lastName: 'Smith',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
  };

  const trainer: UserAccount = {
    id: '2',
    username: 'bruce',
    firstName: 'Bruce',
    lastName: 'Wayne',
    fullName: 'Bruce Wayne',
    email: 'bruce@example.com',
    role: 'trainer',
  };

  it('stores the learner list separately from the trainer list on fetchListSuccess/fetchTrainerListSuccess', () => {
    let state = usersReducer(initialUsersState, UsersActions.fetchListSuccess({ users: [learner] }));
    state = usersReducer(state, UsersActions.fetchTrainerListSuccess({ users: [trainer] }));

    expect(state.userList).toEqual([learner]);
    expect(state.trainerList).toEqual([trainer]);
  });

  it('sets loading/error for the trainer list independently of the learner list', () => {
    const state = usersReducer(
      initialUsersState,
      UsersActions.fetchTrainerListFailure({ error: 'boom' }),
    );

    expect(state.error).toBe('boom');
    expect(state.trainerList).toEqual([]);
  });

  it("appends a newly created learner to userList only, leaving trainerList untouched", () => {
    const seeded = { ...initialUsersState, trainerList: [trainer] };
    const state = usersReducer(seeded, UsersActions.createUserSuccess({ user: learner }));

    expect(state.userList).toEqual([learner]);
    expect(state.trainerList).toEqual([trainer]);
  });

  it('appends a newly created trainer to trainerList only, leaving userList untouched', () => {
    const seeded = { ...initialUsersState, userList: [learner] };
    const state = usersReducer(seeded, UsersActions.createUserSuccess({ user: trainer }));

    expect(state.trainerList).toEqual([trainer]);
    expect(state.userList).toEqual([learner]);
  });

  it('removes a deleted user from whichever list contains them', () => {
    const seeded = {
      ...initialUsersState,
      userList: [learner],
      trainerList: [trainer],
    };

    const afterDeletingLearner = usersReducer(
      seeded,
      UsersActions.deleteUserSuccess({ userId: learner.id }),
    );
    expect(afterDeletingLearner.userList).toEqual([]);
    expect(afterDeletingLearner.trainerList).toEqual([trainer]);

    const afterDeletingTrainer = usersReducer(
      seeded,
      UsersActions.deleteUserSuccess({ userId: trainer.id }),
    );
    expect(afterDeletingTrainer.trainerList).toEqual([]);
    expect(afterDeletingTrainer.userList).toEqual([learner]);
  });

  it('updates a user in whichever list contains them', () => {
    const seeded = {
      ...initialUsersState,
      userList: [learner],
      trainerList: [trainer],
    };
    const updatedTrainer = { ...trainer, firstName: 'Bruce Updated' };

    const state = usersReducer(
      seeded,
      UsersActions.updateUserSuccess({ user: updatedTrainer }),
    );

    expect(state.trainerList).toEqual([updatedTrainer]);
    expect(state.userList).toEqual([learner]);
  });
});
