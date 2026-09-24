import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { OrganisationPayload } from './organisation.model';

@Injectable({
  providedIn: 'root',
})
export class OrganisationsService {
  private apiEndpoint = environment.apiUrl || 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  // GET /organisations - "List every organisation with member and module
  // counts (global admin only)".
  getOrganisations() {
    return this.http.get<any[]>(`${this.apiEndpoint}organisations`);
  }

  // GET /organisations/{id} - "Read one organisation with member counts".
  getOrganisation(organisationId: number) {
    return this.http.get<any>(`${this.apiEndpoint}organisations/${organisationId}`);
  }

  // POST /organisations (CreateOrganisationDto) - global admin only. Names
  // are unique; a clash comes back as a 409.
  createOrganisation(organisation: OrganisationPayload) {
    return this.http.post<any>(`${this.apiEndpoint}organisations`, organisation);
  }

  // PATCH /organisations/{id} (UpdateOrganisationDto) - "Rename an
  // organisation".
  updateOrganisation(organisationId: number, organisation: OrganisationPayload) {
    return this.http.patch<any>(
      `${this.apiEndpoint}organisations/${organisationId}`,
      organisation,
    );
  }

  // DELETE /organisations/{id} - global admin only. The backend refuses
  // (409) while the organisation still has users or modules.
  deleteOrganisation(organisationId: number) {
    return this.http.delete(`${this.apiEndpoint}organisations/${organisationId}`);
  }
}
