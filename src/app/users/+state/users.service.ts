import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { UserAccount } from './user-account.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // ASSUMPTION: no user-management controller was included in this upload
  // (only auth/login and auth/refresh exist in auth.service.ts) - this
  // mirrors the Scenario/Module resources' Create/Read/Update/Delete shape
  // against a "users" resource. Update the path/payload mapping once a real
  // "User Management" ticket/contract is available.
  getUsers() {
    return this.http.get<UserAccount[] | { users: UserAccount[] }>(
      `${this.apiEndpoint}users`,
    );
  }

  getUserDetails(userId: string) {
    return this.http.get<UserAccount>(`${this.apiEndpoint}users/${userId}`);
  }

  createUser(user: Partial<UserAccount>) {
    return this.http.post<UserAccount>(`${this.apiEndpoint}users`, user);
  }

  updateUser(userId: string, updatedUser: Partial<UserAccount>) {
    return this.http.patch<UserAccount>(
      `${this.apiEndpoint}users/${userId}`,
      updatedUser,
    );
  }

  deleteUser(userId: string) {
    return this.http.delete(`${this.apiEndpoint}users/${userId}`);
  }

  // ASSUMPTION: no reset-password/send-reminder routes were included in this
  // upload - these mirror the CRUD endpoints above as sub-resources of a
  // given user. Update the path/payload mapping once a real contract exists.
  resetPassword(userId: string, newPassword: string) {
    return this.http.post<void>(
      `${this.apiEndpoint}users/${userId}/reset-password`,
      { newPassword },
    );
  }

  sendReminderEmail(userId: string) {
    return this.http.post<void>(
      `${this.apiEndpoint}users/${userId}/send-reminder`,
      {},
    );
  }
}
