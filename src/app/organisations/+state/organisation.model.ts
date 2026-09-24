/**
 * An organisation as returned by GET /organisations (list) or
 * GET /organisations/{id} (detail). The detail response has no moduleCount
 * or timestamps, so those are optional.
 */
export interface Organisation {
  id: number;
  name: string;
  learnerCount: number;
  trainerCount: number;
  moduleCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Body for POST /organisations and PATCH /organisations/{id}. */
export interface OrganisationPayload {
  name: string;
}

export function normalizeOrganisation(raw: any): Organisation {
  return {
    ...raw,
    id: Number(raw?.id),
    name: String(raw?.name ?? ''),
    learnerCount: Number(raw?.learnerCount ?? 0),
    trainerCount: Number(raw?.trainerCount ?? 0),
    ...(raw?.moduleCount != null ? { moduleCount: Number(raw.moduleCount) } : {}),
  };
}

/**
 * The organisation a staff screen should show data for:
 * - a trainer is always locked to their own organisation;
 * - a global admin sees whichever organisation they picked in the
 *   organisation filter, or every organisation when organisationId is null.
 */
export interface OrganisationScope {
  isGlobalAdmin: boolean;
  organisationId: number | null;
}
