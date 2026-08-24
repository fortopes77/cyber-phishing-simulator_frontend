import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Feedback, FeedbackRequest } from './feedback.model';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // Same endpoint as AuthService.getFeedback - moved here so the result
  // screen can go through the standard NgRx effect/reducer flow used by
  // the rest of the app, following the pattern in scenario.service.ts /
  // attempts.service.ts.
  getFeedback(payload: FeedbackRequest) {
    const authData = localStorage.getItem('auth');
    const token = authData ? JSON.parse(authData).token : null;
    return this.http.post<{ success: boolean; feedback: Feedback }>(
      `${this.apiEndpoint}feedback`,
      payload,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
  }
}
