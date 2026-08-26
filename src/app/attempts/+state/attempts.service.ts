import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.development';
import { Attempt } from './attempt.model';

@Injectable({
  providedIn: 'root',
})
export class AttemptsService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // Returns attempts for the current authenticated learner (scoped server-side
  // by the auth token), matching the pattern used by scenario.service.ts.
  // ASSUMPTION: backend exposes GET /attempts for the logged-in user's own
  // attempts - adjust the path here if your NestJS route differs.
  getUserAttempts() {
    // Authorization header is attached by authInterceptor from the store.
    return this.http.get<{ attempts: Attempt[] } | Attempt[]>(
      `${this.apiEndpoint}attempts`,
    );
  }

  createAttempt(attempt: Partial<Attempt>) {
    return this.http.post<{ success: boolean; attempt: Attempt }>(
      `${this.apiEndpoint}attempts`,
      attempt,
    );
  }
}
