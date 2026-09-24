import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { OrganisationsService } from './organisations.service';

describe('OrganisationsService', () => {
  let service: OrganisationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrganisationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET the organisation list', () => {
    service.getOrganisations().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}organisations`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET one organisation', () => {
    service.getOrganisation(4).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}organisations/4`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 4, name: 'Acme' });
  });

  it('should POST a new organisation', () => {
    service.createOrganisation({ name: 'Acme' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}organisations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Acme' });
    req.flush({ id: 1, name: 'Acme' });
  });

  it('should PATCH an organisation', () => {
    service.updateOrganisation(4, { name: 'Acme Ltd' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}organisations/4`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Acme Ltd' });
    req.flush({ id: 4, name: 'Acme Ltd' });
  });

  it('should DELETE an organisation', () => {
    service.deleteOrganisation(4).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}organisations/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Organisation has been successfully deleted' });
  });
});
