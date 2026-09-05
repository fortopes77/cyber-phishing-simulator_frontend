import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UsersService } from './users.service';
import { environment } from 'src/environments/environment';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  const rawUser = {
    id: 1,
    username: 'ava.morales',
    email: 'ava.morales@example.com',
    firstName: 'Ava',
    lastName: 'Morales',
    role: 'LEARNER',
    organisationId: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET the learners list scoped to an organisation', () => {
    service.getUsers(1).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}users/learners?organisationId=1`,
    );
    expect(req.request.method).toBe('GET');
    req.flush([rawUser]);
  });

  it('should GET a single user by id', () => {
    service.getUserDetails('1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('GET');
    req.flush(rawUser);
  });

  it('should POST a new user with the role mapped to the backend enum', () => {
    service
      .createUser({
        username: 'new.learner',
        email: 'new@example.com',
        password: 'Password1!',
        firstName: 'New',
        lastName: 'Learner',
        role: 'user',
      })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      username: 'new.learner',
      email: 'new@example.com',
      password: 'Password1!',
      firstName: 'New',
      lastName: 'Learner',
      role: 'LEARNER',
    });
    req.flush({ ...rawUser, username: 'new.learner' });
  });

  it('should map the trainer role to TRAINER on create', () => {
    service
      .createUser({
        username: 'new.trainer',
        email: 'new@example.com',
        password: 'Password1!',
        firstName: 'New',
        lastName: 'Trainer',
        role: 'trainer',
      })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users`);
    expect(req.request.body.role).toBe('TRAINER');
    req.flush(rawUser);
  });

  it('should PATCH an existing user without username or role', () => {
    service.updateUser('1', { firstName: 'Updated' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ firstName: 'Updated' });
    req.flush({ ...rawUser, firstName: 'Updated' });
  });

  it('should DELETE a user', () => {
    service.deleteUser('1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should PATCH the new password to users/{id}, since there is no dedicated reset-password route', () => {
    service.resetPassword('1', 'newpassword1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ password: 'newpassword1' });
    req.flush(rawUser);
  });

  it('should POST to the send-reminder endpoint', () => {
    service.sendReminderEmail('1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/1/send-reminder`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
