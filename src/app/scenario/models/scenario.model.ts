/**
 * Matches the Scenario resource contract from the backend ticket (Create /
 * List / Read / Update / Delete): category, difficulty and interactionType
 * are fixed enums rather than free text, and a scenario carries either a
 * single `correctAnswer` (a "simple" scenario) or a list of `correctCues`
 * (a "detailed" scenario) - never both.
 */
export enum ScenarioCategory {
  Phishing = 'PHISHING',
  Smishing = 'SMISHING',
  Vishing = 'VISHING',
  SocialEngineering = 'SOCIAL_ENGINEERING',
  Malware = 'MALWARE',
  // Kept verbatim - this is the backend's actual enum value (confirmed via a
  // 400 validation response), typo and all.
  Ransomware = 'RANSONWARE',
  // Kept verbatim - same as above, the backend enum really is spelled this way.
  BusinessEmailCompromise = 'BUISINESS_EMAIL_COMPROMISE',
  SpearPhishing = 'SPEAR_PHISHING',
  Whaling = 'WHALING',
}

export enum ScenarioDifficulty {
  Easy = 'EASY',
  Medium = 'MEDIUM',
  Hard = 'HARD',
}

/**
 * Confirmed via a real 400 validation response: "interactionType must be
 * one of the following values: EMAIL, TEXT_MESSAGE, PHONE_CALL,
 * SOCIAL_MEDIA".
 */
export enum ScenarioInteractionType {
  Email = 'EMAIL',
  Sms = 'TEXT_MESSAGE',
  Call = 'PHONE_CALL',
  SocialMedia = 'SOCIAL_MEDIA',
}

export interface ScenarioOption<T extends string> {
  value: T;
  label: string;
}

export const CATEGORY_OPTIONS: ScenarioOption<ScenarioCategory>[] = [
  { value: ScenarioCategory.Phishing, label: 'Phishing' },
  { value: ScenarioCategory.Smishing, label: 'Smishing (SMS)' },
  { value: ScenarioCategory.Vishing, label: 'Vishing (Voice)' },
  { value: ScenarioCategory.SocialEngineering, label: 'Social Engineering' },
  { value: ScenarioCategory.Malware, label: 'Malware' },
  { value: ScenarioCategory.Ransomware, label: 'Ransomware' },
  {
    value: ScenarioCategory.BusinessEmailCompromise,
    label: 'Business Email Compromise',
  },
  { value: ScenarioCategory.SpearPhishing, label: 'Spear Phishing' },
  { value: ScenarioCategory.Whaling, label: 'Whaling' },
];

export const DIFFICULTY_OPTIONS: ScenarioOption<ScenarioDifficulty>[] = [
  { value: ScenarioDifficulty.Easy, label: 'Easy' },
  { value: ScenarioDifficulty.Medium, label: 'Medium' },
  { value: ScenarioDifficulty.Hard, label: 'Hard' },
];

export const INTERACTION_TYPE_OPTIONS: ScenarioOption<ScenarioInteractionType>[] =
  [
    { value: ScenarioInteractionType.Email, label: 'Email' },
    { value: ScenarioInteractionType.Sms, label: 'Text Message' },
    { value: ScenarioInteractionType.Call, label: 'Phone Call' },
    { value: ScenarioInteractionType.SocialMedia, label: 'Social Media' },
  ];

/** Aliases free text (any case/spacing, common misspellings) onto the exact enum value the backend validates against. */
const CATEGORY_ALIASES: Record<string, ScenarioCategory> = {
  PHISHING: ScenarioCategory.Phishing,
  SMISHING: ScenarioCategory.Smishing,
  VISHING: ScenarioCategory.Vishing,
  SOCIAL_ENGINEERING: ScenarioCategory.SocialEngineering,
  MALWARE: ScenarioCategory.Malware,
  RANSOMWARE: ScenarioCategory.Ransomware,
  RANSONWARE: ScenarioCategory.Ransomware,
  BUSINESS_EMAIL_COMPROMISE: ScenarioCategory.BusinessEmailCompromise,
  BUISINESS_EMAIL_COMPROMISE: ScenarioCategory.BusinessEmailCompromise,
  SPEAR_PHISHING: ScenarioCategory.SpearPhishing,
  WHALING: ScenarioCategory.Whaling,
};

const DIFFICULTY_ALIASES: Record<string, ScenarioDifficulty> = {
  EASY: ScenarioDifficulty.Easy,
  MEDIUM: ScenarioDifficulty.Medium,
  HARD: ScenarioDifficulty.Hard,
};

const INTERACTION_TYPE_ALIASES: Record<string, ScenarioInteractionType> = {
  EMAIL: ScenarioInteractionType.Email,
  SMS: ScenarioInteractionType.Sms,
  TEXT: ScenarioInteractionType.Sms,
  TEXT_MESSAGE: ScenarioInteractionType.Sms,
  CALL: ScenarioInteractionType.Call,
  PHONE_CALL: ScenarioInteractionType.Call,
  VOICE: ScenarioInteractionType.Call,
  SOCIAL_MEDIA: ScenarioInteractionType.SocialMedia,
  SOCIAL: ScenarioInteractionType.SocialMedia,
};

/**
 * The scenarios API has no `options` field - a "simple" scenario's
 * correctAnswer is just free text - but the learner-facing scenario-choice
 * screen only ever offers a fixed Safe/Suspicious decision (there's no way
 * to derive scenario-specific choices from the API). So a simple scenario's
 * correctAnswer must be one of these two exact values, or a learner's
 * correct answer could never match it. Shared with ScenarioChoiceComponent
 * so the trainer's answer picker and the learner's decision options can
 * never drift apart.
 */
export const SIMPLE_ANSWER_OPTIONS = ['Safe', 'Suspicious'] as const;

export const DEFAULT_CATEGORY = ScenarioCategory.Phishing;
export const DEFAULT_DIFFICULTY = ScenarioDifficulty.Medium;
export const DEFAULT_INTERACTION_TYPE = ScenarioInteractionType.Email;

function normalizeEnumValue<T extends string>(
  raw: unknown,
  aliases: Record<string, T>,
  fallback: T,
): T {
  const key = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return aliases[key] ?? fallback;
}

export function normalizeCategory(raw: unknown): ScenarioCategory {
  return normalizeEnumValue(raw, CATEGORY_ALIASES, DEFAULT_CATEGORY);
}

export function normalizeDifficulty(raw: unknown): ScenarioDifficulty {
  return normalizeEnumValue(raw, DIFFICULTY_ALIASES, DEFAULT_DIFFICULTY);
}

const ALL_OPTIONS: ScenarioOption<string>[] = [
  ...CATEGORY_OPTIONS,
  ...DIFFICULTY_OPTIONS,
  ...INTERACTION_TYPE_OPTIONS,
];

/**
 * Looks up the human-readable label for an enum value (e.g. "RANSONWARE" ->
 * "Ransomware", correcting the backend's typo for display purposes). Falls
 * back to a title-cased version of the raw value for anything unrecognised.
 */
export function getScenarioOptionLabel(value: unknown): string {
  const match = ALL_OPTIONS.find((option) => option.value === value);
  if (match) {
    return match.label;
  }

  return String(value ?? '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeInteractionType(
  raw: unknown,
): ScenarioInteractionType {
  return normalizeEnumValue(
    raw,
    INTERACTION_TYPE_ALIASES,
    DEFAULT_INTERACTION_TYPE,
  );
}

/**
 * The request body shape for both the Create and Update endpoints.
 * moduleId is null only for the module-edit page's "unassign scenario"
 * toggle (see ModuleEditComponent.unassignScenario) - every other caller
 * (the manual create/edit form, the AI flow, "assign to this module") always
 * supplies a real number. Unconfirmed against the backend whether it
 * actually accepts a null moduleId - there's no trainer account available in
 * this environment to verify live.
 */
export interface ScenarioPayload {
  moduleId: number | null;
  title: string;
  scenarioDescription: string;
  content: string;
  category: ScenarioCategory;
  difficulty: ScenarioDifficulty;
  interactionType: ScenarioInteractionType;
  correctAnswer?: string;
  correctCues?: string[];
}

/**
 * Builds the exact Create/Update request body from whatever shape the
 * caller has on hand (the manual edit form, or an AI-generated scenario) -
 * normalizing the three enum fields and keeping only whichever of
 * correctAnswer/correctCues applies, per the "simple vs detailed scenario"
 * rule in the ticket.
 */
export function toScenarioPayload(source: Record<string, any>): ScenarioPayload {
  const payload: ScenarioPayload = {
    // Preserve an explicit null (the "unassign scenario" toggle) rather than
    // coercing it through Number(), which would silently turn it into 0 - a
    // real, wrong module id - instead of clearing the assignment.
    moduleId: source['moduleId'] === null ? null : Number(source['moduleId']),
    title: String(source['title'] ?? ''),
    scenarioDescription: String(
      source['scenarioDescription'] ?? source['description'] ?? '',
    ),
    content: String(source['content'] ?? source['emailBody'] ?? ''),
    category: normalizeCategory(source['category']),
    difficulty: normalizeDifficulty(source['difficulty']),
    interactionType: normalizeInteractionType(source['interactionType']),
  };

  const correctCues = Array.isArray(source['correctCues'])
    ? source['correctCues']
        .map((cue: unknown) => String(cue ?? '').trim())
        .filter((cue: string) => cue.length > 0)
    : [];

  if (correctCues.length > 0) {
    payload.correctCues = correctCues;
  } else if (source['correctAnswer']) {
    payload.correctAnswer = String(source['correctAnswer']).trim();
  }

  return payload;
}

/**
 * Confirmed live against GET /scenarios, GET /scenarios/{id} and GET
 * /scenarios?moduleId=X: every scenario response identifies itself via
 * `scenarioId`, not `id` - every consumer in this app (module-page,
 * scenario-page, scenario-choice, the trainer scenario list/edit screens)
 * reads `.id`, so without this every one of them silently got `undefined`
 * for a scenario's id (breaking routing, attempt matching, and the
 * moduleScenarios/isAssignedToThisModule lookups keyed on it). Mirrors
 * normalizeModule's id fallback - normalize once here, at the boundary,
 * rather than teach every consumer a second field name. Also confirmed live:
 * the list/detail responses no longer include category/difficulty/
 * scenarioDescription/correctAnswer/correctCues at all (a learner is never
 * sent the answer up front) - callers that read those fields need to keep
 * tolerating them being absent.
 */
export function normalizeScenario(raw: any): any {
  const rawId = raw?.id ?? raw?.scenarioId;

  return {
    ...raw,
    id: rawId != null ? Number(rawId) : raw?.id,
  };
}
