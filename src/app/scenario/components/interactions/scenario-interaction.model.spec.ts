import {
  getInteractionKey,
  parseInvoiceAmount,
  parseInvoiceFields,
  parseMessageEntries,
} from './scenario-interaction.model';

describe('scenario interaction model', () => {
  it('should pick a sub-component for every backend interactionType', () => {
    expect(getInteractionKey('EMAIL')).toBe('email');
    expect(getInteractionKey('TEXT_MESSAGE')).toBe('text');
    expect(getInteractionKey('PHONE_CALL')).toBe('phone');
    expect(getInteractionKey('SOCIAL_MEDIA')).toBe('social');
  });

  it('should fall back to generic for a missing type and pass unknown ones through', () => {
    expect(getInteractionKey(undefined)).toBe('generic');
    expect(getInteractionKey('Invoice')).toBe('invoice');
  });

  it('should split a transcript into speaker turns', () => {
    expect(parseMessageEntries('Bank: Hi, is that you?\nYou: Yes\nHold the line')).toEqual([
      { speaker: 'Bank', text: 'Hi, is that you?' },
      { speaker: 'You', text: 'Yes' },
      { speaker: 'Caller', text: 'Hold the line' },
    ]);
  });

  it('should read invoice fields and the amount from the body', () => {
    const body = 'Invoice: INV-7\nAmount: $320.50\nDue: Friday';

    expect(parseInvoiceFields(body)).toEqual([
      { label: 'Invoice', value: 'INV-7' },
      { label: 'Amount', value: '$320.50' },
      { label: 'Due', value: 'Friday' },
    ]);
    expect(parseInvoiceAmount(body)).toBe('$320.50');
  });
});
