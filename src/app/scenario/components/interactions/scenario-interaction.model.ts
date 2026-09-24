/**
 * What an interaction sub-component needs to render a scenario's message -
 * the learner-facing fields ScenarioPageComponent maps from the learner-scoped
 * GET /scenarios/:id (never the answer, which the backend doesn't send to a
 * learner).
 */
export interface ScenarioMessage {
  title: string;
  body: string;
  from?: string;
  recipient?: string;
  subject?: string;
}

export interface MessageEntry {
  speaker: string;
  text: string;
}

export interface InvoiceField {
  label: string;
  value: string;
}

/**
 * Which interaction sub-component renders a scenario, keyed off its
 * `interactionType` (EMAIL/TEXT_MESSAGE/PHONE_CALL/SOCIAL_MEDIA - see
 * scenario.model.ts). Falls back to a lowercase pass-through so
 * older/free-text values ("Phone", "Text", "invoice") still resolve to
 * something sensible.
 */
export function getInteractionKey(interactionType: string | undefined | null): string {
  const type = (interactionType ?? '').toUpperCase();
  const typeMap: Record<string, string> = {
    EMAIL: 'email',
    SMS: 'text',
    TEXT: 'text',
    TEXT_MESSAGE: 'text',
    CALL: 'phone',
    PHONE: 'phone',
    PHONE_CALL: 'phone',
    VOICE: 'phone',
    SOCIAL_MEDIA: 'social',
    SOCIAL: 'social',
  };

  return typeMap[type] ?? (interactionType ? interactionType.toLowerCase() : 'generic');
}

/**
 * Splits a transcript/thread body into speaker turns - one per line, with
 * "Speaker: text" lines attributed and anything else given to
 * defaultSpeaker.
 */
export function parseMessageEntries(body: string, defaultSpeaker = 'Caller'): MessageEntry[] {
  return (body ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex > 0) {
        return {
          speaker: line.slice(0, separatorIndex).trim(),
          text: line.slice(separatorIndex + 1).trim(),
        };
      }

      return { speaker: defaultSpeaker, text: line };
    });
}

export function parseInvoiceFields(body: string, subject?: string): InvoiceField[] {
  const fields = (body ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const separatorIndex = line.indexOf(':');
      return separatorIndex > 0
        ? [
            {
              label: line.slice(0, separatorIndex).trim(),
              value: line.slice(separatorIndex + 1).trim(),
            },
          ]
        : [];
    });

  if (fields.length > 0) {
    return fields;
  }

  return [
    { label: 'Invoice', value: subject ?? '' },
    { label: 'Amount', value: '$149.99' },
    { label: 'Due', value: '2026-08-15' },
  ];
}

export function parseInvoiceAmount(body: string): string {
  const amountMatch = (body ?? '').match(/\$(\d+(?:\.\d{2})?)/);
  return amountMatch ? amountMatch[0] : '$149.99';
}
