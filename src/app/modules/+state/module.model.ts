export interface LearnerModule {
  moduleId: number;
  moduleName: string;
  description: string;
  hasUserCompleted?: boolean;
  completionDate?: string;
  score?: number;
  timeSpent?: number;
  // The module's currently-assigned learner ids - only present once the
  // backend actually includes them (see normalizeAssignedUserIds below).
  // Undefined (not an empty array) means "unknown", so a caller can tell
  // "no learners assigned yet" apart from "this response didn't include
  // assignment data at all".
  assignedUserIds?: number[];
}

/**
 * The rest of the app (route params, ScenarioPayload.moduleId, the Edit
 * button's navigation) all treat moduleId/moduleName as the two canonical
 * fields, but the mock/spec data is our only confirmed reference for the
 * real endpoint's field names - if the actual backend returns the id under
 * `id` or `_id` instead of `moduleId`, every one of those consumers silently
 * breaks (an Edit button that does nothing, a module page that can never
 * find its own scenarios, etc.) without ever throwing a visible error.
 * Confirmed live against GET /training-modules that the backend actually
 * returns the name under `title`, not `moduleName` - without normalizing
 * that too, every module name renders blank (e.g. the AI scenario module
 * picker's dropdown). Normalizing once here, right where raw API data enters
 * the store, means every consumer can keep trusting moduleId/moduleName
 * regardless of which keys the backend actually used.
 */
export function normalizeModule(raw: any): LearnerModule {
  const rawId = raw?.moduleId ?? raw?.id ?? raw?._id;
  const rawName = raw?.moduleName ?? raw?.title ?? raw?.name;
  const assignedUserIds = normalizeAssignedUserIds(raw?.assignedUsers);

  return {
    ...raw,
    moduleId: rawId != null ? Number(rawId) : raw?.moduleId,
    moduleName: rawName != null ? String(rawName) : raw?.moduleName,
    // Omitted entirely (rather than set to undefined) when the response has
    // no assignedUsers field, so callers that don't care about assignment
    // state (and existing snapshots of a normalized module) see the exact
    // same shape as before this field existed.
    ...(assignedUserIds !== undefined ? { assignedUserIds } : {}),
  };
}

// The backend was asked to add assigned-learner ids to GET
// /training-modules/{id} (previously there was no way at all to read
// assignment state - only POST/DELETE one at a time) since
// CreateTrainingModuleDto/UpdateTrainingModuleDto already accept an
// `assignedUsers: number[]` field on write. UNCONFIRMED live whether the
// read side returns plain ids or full user objects, so this accepts either
// - a bare id, or an object with an `id`/`userId` property - and coerces to
// a number either way. Returns undefined (rather than []) when the field is
// missing entirely, so ModuleEditComponent can tell "not returned" apart
// from "returned empty" and knows whether to trust it over the
// session-tracked addedLearnerIds.
function normalizeAssignedUserIds(raw: unknown): number[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  return raw
    .map((entry) =>
      entry != null && typeof entry === 'object'
        ? Number((entry as any).id ?? (entry as any).userId)
        : Number(entry),
    )
    .filter((id) => !Number.isNaN(id));
}

export interface ModulePayload {
  title: string;
  description: string;
}

/**
 * Builds the exact Create/Update request body from the internal
 * moduleName/description shape - confirmed live via GET /api-json that
 * CreateTrainingModuleDto/UpdateTrainingModuleDto only accept `title` and
 * `description` (plus optional `scenarios`/`assignedUsers` number-id arrays,
 * unused here since this app manages those via the dedicated assign-scenario/
 * assign-learner endpoints instead, one at a time, after the module already
 * exists). There's no `version` field on this resource at all - confirmed
 * live via a 400 ("property moduleName should not exist", "property version
 * should not exist") that the backend's ValidationPipe rejects any unlisted
 * property outright, so a payload built from the raw form value (moduleName +
 * version) always 400s. Mirrors toScenarioPayload's normalize-at-the-boundary
 * approach so every other consumer can keep trusting moduleName internally.
 */
export function toModulePayload(source: Partial<LearnerModule>): ModulePayload {
  return {
    title: String(source.moduleName ?? ''),
    description: String(source.description ?? ''),
  };
}
