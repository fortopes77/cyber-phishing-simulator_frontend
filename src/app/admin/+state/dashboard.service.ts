import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { RawDashboardActivity, RawDashboardOverview } from './dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  /**
   * GET /organisations/{orgId}/trainer-dashboard - "Headline training stats
   * for an organisation (trainer only)". Authorization header is attached
   * by authInterceptor from the store.
   */
  getOverview(organisationId: number) {
    return this.http.get<RawDashboardOverview>(
      `${this.apiEndpoint}organisations/${organisationId}/trainer-dashboard`,
    );
  }

  /**
   * GET /organisations/{orgId}/trainer-dashboard/activity - "Ten most
   * recent learner activity items (trainer only)".
   */
  getActivity(organisationId: number) {
    return this.http.get<RawDashboardActivity>(
      `${this.apiEndpoint}organisations/${organisationId}/trainer-dashboard/activity`,
    );
  }
}
