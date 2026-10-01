import { createBooleanParser } from './create-boolean-parser';

describe('createBooleanParser', () => {
  const parseYN = createBooleanParser('Y', 'N');

  it('matches configured tokens without case sensitivity', () => {
    expect(parseYN(' y ')).toBe(true);
    expect(parseYN('n')).toBe(false);
  });

  it('maps unrecognized and empty values to false', () => {
    expect(parseYN('unknown')).toBe(false);
    expect(parseYN(null)).toBe(false);
    expect(parseYN(undefined)).toBe(false);
  });
});
