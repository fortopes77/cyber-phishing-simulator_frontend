import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  CreateUserPayload,
  RawUserAccount,
  UpdateUserPayload,
  UserAccount,
} from './user-account.model';

const ROLE_TO_API: Record<UserAccount['role'], string> = {
  trainer: 'TRAINER',
  user: 'LEARNER',
};

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // GET /users - list all users - doesn't exist on this backend; only
  // GET /users/learners (trainer-only, scoped to one organisation) is
  // exposed, per the Swagger contract.
  getUsers(organisationId: number) {
    return this.http.get<RawUserAccount[] | { users: RawUserAccount[] }>(
      `${this.apiEndpoint}users/learners`,
      { params: { organisationId } },
    );
  }

  getUserDetails(userId: string) {
    return this.http.get<RawUserAccount>(`${this.apiEndpoint}users/${userId}`);
  }

  // POST /users (CreateUserDto) - trainer-only. organisationId is
  // intentionally omitted: per the Swagger contract a trainer's own
  // organisation is inferred server-side and only a global admin needs to
  // supply it.
  createUser(user: CreateUserPayload) {
    return this.http.post<RawUserAccount>(`${this.apiEndpoint}users`, {
      ...user,
      role: ROLE_TO_API[user.role],
    });
  }

  // PATCH /users/{id} (UpdateUserDto) - email/password/firstName/lastName
  // only; the backend has no field to change username or role.
  updateUser(userId: string, updatedUser: UpdateUserPayload) {
    return this.http.patch<RawUserAccount>(
      `${this.apiEndpoint}users/${userId}`,
      updatedUser,
    );
  }

  deleteUser(userId: string) {
    return this.http.delete(`${this.apiEndpoint}users/${userId}`);
  }

  // No dedicated reset-password route exists - PATCH /users/{id} accepts an
  // optional `password` field (UpdateUserDto), so a trainer resetting
  // someone else's password reuses the same update endpoint.
  resetPassword(userId: string, newPassword: string) {
    return this.http.patch<RawUserAccount>(`${this.apiEndpoint}users/${userId}`, {
      password: newPassword,
    });
  }

  // ASSUMPTION: no "send reminder email" route exists anywhere in the
  // Swagger contract - there's no backend equivalent to wire this up to yet.
  // Left as a stub pointing at a plausible sub-resource path so the UI
  // action fails loudly (a 404) rather than silently, until a real contract
  // is available.
  sendReminderEmail(userId: string) {
    return this.http.post<void>(
      `${this.apiEndpoint}users/${userId}/send-reminder`,
      {},
    );
  }
}
