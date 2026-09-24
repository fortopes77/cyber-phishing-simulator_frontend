import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  FeedbackRequest,
  RawFeedbackResponse,
  toAiFeedbackRequest,
} from './feedback.model';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private aiApiEndpoint = environment.aiApiUrl || 'http://localhost:8000/';

  constructor(private http: HttpClient) {}

  // POST /feedback lives on the AI API, not the NestJS backend (which has no
  // feedback route) - see toAiFeedbackRequest for how a Safe/Suspicious
  // decision maps onto its multiple-choice request body.
  getFeedback(payload: FeedbackRequest) {
    return this.http.post<RawFeedbackResponse>(
      `${this.aiApiEndpoint}feedback`,
      toAiFeedbackRequest(payload),
    );
  }
}
