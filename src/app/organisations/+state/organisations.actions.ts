import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Organisation, OrganisationPayload } from './organisation.model';

export const OrganisationsActions = createActionGroup({
  source: 'Organisations',
  events: {
    fetchList: emptyProps(),
    fetchListSuccess: props<{ organisations: Organisation[] }>(),
    fetchListFailure: props<{ error: string }>(),
    fetchDetails: props<{ organisationId: number }>(),
    fetchDetailsSuccess: props<{ organisation: Organisation }>(),
    fetchDetailsFailure: props<{ error: string }>(),
    createOrganisation: props<{ organisation: OrganisationPayload }>(),
    createOrganisationSuccess: props<{ organisation: Organisation }>(),
    createOrganisationFailure: props<{ error: string }>(),
    updateOrganisation: props<{
      organisationId: number;
      organisation: OrganisationPayload;
    }>(),
    updateOrganisationSuccess: props<{ organisation: Organisation }>(),
    updateOrganisationFailure: props<{ error: string }>(),
    deleteOrganisation: props<{ organisationId: number }>(),
    deleteOrganisationSuccess: props<{ organisationId: number }>(),
    deleteOrganisationFailure: props<{ error: string }>(),
    // The global admin's organisation filter - null means "all
    // organisations". Ignored for everyone else (see selectOrganisationScope).
    setFilter: props<{ organisationId: number | null }>(),
  },
});
