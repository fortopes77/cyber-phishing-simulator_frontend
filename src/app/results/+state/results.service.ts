import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResultsService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  /**
   * GET /results/me - "Detailed results for learner, sorted by module and
   * scenario". Self-scoped to whoever the bearer token belongs to; no
   * response schema is documented (see normalizeLearnerResults' ASSUMPTION
   * note in results.model.ts). Authorization header is attached by
   * authInterceptor from the store.
   */
  getMyResults() {
    return this.http.get<any>(`${this.apiEndpoint}results/me`);
  }

  /**
   * GET /results/me?moduleId=X - the same self-scoped results, narrowed by
   * the backend to one module. The learner-facing module result detail:
   * GET /results/module/:id is trainer/admin only (403 for a learner).
   */
  getMyModuleResult(moduleId: number) {
    return this.http.get<any>(`${this.apiEndpoint}results/me`, {
      params: { moduleId },
    });
  }
}
