import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UsersService } from './users.service';
import { environment } from 'src/environments/environment.development';
import { UserAccount } from './user-account.model';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  const users: UserAccount[] = [
    { id: 'u_1', fullName: 'Ava Morales', email: 'ava.morales@example.com', role: 'user' },
  ];

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

  it('should GET the users list', () => {
    service.getUsers().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users`);
    expect(req.request.method).toBe('GET');
    req.flush(users);
  });

  it('should GET a single user by id', () => {
    service.getUserDetails('u_1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/u_1`);
    expect(req.request.method).toBe('GET');
    req.flush(users[0]);
  });

  it('should POST a new user', () => {
    const newUser = { fullName: 'New Learner', email: 'new@example.com', role: 'user' as const };
    service.createUser(newUser).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush({ id: 'u_2', ...newUser });
  });

  it('should PATCH an existing user', () => {
    const updatedUser = { fullName: 'Updated Name' };
    service.updateUser('u_1', updatedUser).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/u_1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(updatedUser);
    req.flush({ ...users[0], ...updatedUser });
  });

  it('should DELETE a user', () => {
    service.deleteUser('u_1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/u_1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should POST a new password to the reset-password endpoint', () => {
    service.resetPassword('u_1', 'newpassword1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/u_1/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ newPassword: 'newpassword1' });
    req.flush({});
  });

  it('should POST to the send-reminder endpoint', () => {
    service.sendReminderEmail('u_1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}users/u_1/send-reminder`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
