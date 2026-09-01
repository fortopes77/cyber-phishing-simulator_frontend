export interface LearnerModule {
  moduleId: number;
  moduleName: string;
  description: string;
  version?: string;
  hasUserCompleted?: boolean;
  completionDate?: string;
  score?: number;
  timeSpent?: number;
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
  return {
    ...raw,
    moduleId: rawId != null ? Number(rawId) : raw?.moduleId,
    moduleName: rawName != null ? String(rawName) : raw?.moduleName,
  };
}
