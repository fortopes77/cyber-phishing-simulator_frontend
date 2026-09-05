import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ScenarioAttemptInput } from './attempt.model';

@Injectable({
  providedIn: 'root',
})
export class AttemptsService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // POST /attempts { moduleId } (CreateAttemptDto) - "Start a new attempt for
  // a module". Idempotent per learner+module: if the caller already has an
  // IN_PROGRESS attempt for this module, the backend returns that existing
  // attempt instead of creating a duplicate, so callers can safely call this
  // again (e.g. after losing track of the attempt id across a page refresh)
  // without risking splitting one module's scenarios across two attempts.
  startAttempt(moduleId: number) {
    return this.http.post<any>(`${this.apiEndpoint}attempts`, { moduleId });
  }

  // Confirmed live: POST /attempts/{attemptId}/scenario-attempts
  // (CreateScenarioAttemptDto) - "Record an answer to one scenario within an
  // attempt". Grades immediately - the response includes isCorrect/score/
  // missedCues, no need to wait for finalize.
  submitScenarioAttempt(attemptId: number, scenarioAttempt: ScenarioAttemptInput) {
    return this.http.post<any>(
      `${this.apiEndpoint}attempts/${attemptId}/scenario-attempts`,
      scenarioAttempt,
    );
  }

  // Confirmed live: POST /results/attempts/{attemptId}/finalize -
  // "Finalize an attempt and store the result". Marks the module attempt
  // COMPLETED and locks in whatever scenarios were actually submitted.
  finalizeAttempt(attemptId: number) {
    return this.http.post<any>(
      `${this.apiEndpoint}results/attempts/${attemptId}/finalize`,
      {},
    );
  }
}
