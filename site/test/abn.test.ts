import { describe, expect, it } from 'vitest';
import { formatAbn, isValidAbn, normaliseAbn } from '@/lib/abn';
import { parsePerthLocal, toPerthLocal } from '@/lib/time';

describe('ABN', () => {
  it('accepts a valid ABN with or without spaces', () => {
    expect(isValidAbn('51 824 753 556')).toBe(true);
    expect(isValidAbn('51824753556')).toBe(true);
  });
  it('rejects a bad checksum or length', () => {
    expect(isValidAbn('51 824 753 557')).toBe(false);
    expect(isValidAbn('5182475355')).toBe(false);
    expect(isValidAbn('')).toBe(false);
  });
  it('normalises and formats', () => {
    expect(normaliseAbn(' 51-824 753 556 ')).toBe('51824753556');
    expect(formatAbn('51824753556')).toBe('51 824 753 556');
  });
});

describe('Perth time', () => {
  it('round-trips a datetime-local value at UTC+8', () => {
    const d = parsePerthLocal('2026-12-10T09:00');
    expect(d.toISOString()).toBe('2026-12-10T01:00:00.000Z');
    expect(toPerthLocal(d)).toBe('2026-12-10T09:00');
  });
});
