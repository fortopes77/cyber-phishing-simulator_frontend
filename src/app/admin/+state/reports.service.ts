import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LearnerReportStatus, ReportDateRange } from './reports.model';

/**
 * The trainer/admin reporting endpoints under
 * /organisations/{orgId}/reports. A trainer can only read their own
 * organisation's reports (enforced server-side); a global admin any.
 * Authorization header is attached by authInterceptor from the store.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  private reportsUrl(organisationId: number): string {
    return `${this.apiEndpoint}organisations/${organisationId}/reports`;
  }

  getOverview(organisationId: number, range: ReportDateRange) {
    return this.http.get<any>(`${this.reportsUrl(organisationId)}/overview`, {
      params: { ...range },
    });
  }

  getModules(organisationId: number, range: ReportDateRange) {
    return this.http.get<any>(`${this.reportsUrl(organisationId)}/modules`, {
      params: { ...range },
    });
  }

  getModuleDetail(organisationId: number, moduleId: number, range: ReportDateRange) {
    return this.http.get<any>(`${this.reportsUrl(organisationId)}/modules/${moduleId}`, {
      params: { ...range },
    });
  }

  getLearners(
    organisationId: number,
    range: ReportDateRange,
    status: LearnerReportStatus | null,
  ) {
    return this.http.get<any>(`${this.reportsUrl(organisationId)}/users`, {
      params: { ...range, ...(status ? { status } : {}) },
    });
  }

  // Not date-filtered on the backend - always the learner's current state.
  getLearnerDetail(organisationId: number, userId: number) {
    return this.http.get<any>(`${this.reportsUrl(organisationId)}/users/${userId}`);
  }

  // GET .../reports/export?format=csv - the overview and module breakdown
  // as one CSV file, fetched as a Blob so the bearer token is sent (a plain
  // link wouldn't carry it).
  exportCsv(organisationId: number, range: ReportDateRange) {
    return this.http.get(`${this.reportsUrl(organisationId)}/export`, {
      params: { format: 'csv', ...range },
      responseType: 'blob',
    });
  }
}
