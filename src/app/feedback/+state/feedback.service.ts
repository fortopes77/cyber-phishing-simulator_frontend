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

  // Follows the same service/effect/reducer/selector pattern as
  // scenario.service.ts and attempts.service.ts.
  getFeedback(payload: FeedbackRequest) {
    // Authorization header is attached by authInterceptor from the store.
    return this.http.post<{ success: boolean; feedback: Feedback }>(
      `${this.apiEndpoint}feedback`,
      payload,
    );
  }
}
