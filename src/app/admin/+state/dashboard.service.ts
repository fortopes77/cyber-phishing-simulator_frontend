import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { TrainerDashboardStats } from './dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  /**
   * ASSUMPTION: PHISH-383 "Trainer Dashboard" is still To Do on the backend
   * board, so this endpoint doesn't exist yet - this assumes a single
   * aggregate GET returning everything the screen needs (learner/module
   * counts, completion rate, average score, per-module completion, recent
   * activity) rather than the frontend stitching together several separate
   * list endpoints, most of which are themselves still To Do/In Review
   * (PHISH-313 Scenario Attempt, PHISH-314 Module Results, PHISH-312
   * Advanced Analytics). Update the path/response mapping once PHISH-383
   * lands if the real contract differs.
   */
  getTrainerDashboard() {
    // Authorization header is attached by authInterceptor from the store.
    return this.http.get<
      { stats: TrainerDashboardStats } | TrainerDashboardStats
    >(`${this.apiEndpoint}trainer/dashboard`);
  }
}
