import { describe, it, expect } from 'vitest';
import { calculateShipByDate } from './dateUtils';

describe('calculateShipByDate', () => {
  it('returns null for missing orderDate', () => {
    expect(calculateShipByDate(null, 3)).toBeNull();
    expect(calculateShipByDate(undefined, 3)).toBeNull();
  });

  it('returns null for missing processingDays', () => {
    expect(calculateShipByDate('2026-01-06', null)).toBeNull();
    expect(calculateShipByDate('2026-01-06', 0)).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(calculateShipByDate('not-a-date', 3)).toBeNull();
  });

  it('skips weekends when calculating ship date', () => {
    // Use T00:00:00 to avoid UTC-vs-local timezone issues
    // Monday Jan 5, 2026 + 5 business days = Monday Jan 12
    const result = calculateShipByDate('2026-01-05T00:00:00', 5);
    expect(result).not.toBeNull();
    expect(result.getDate()).toBe(12);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('handles processing days that span a weekend', () => {
    // Thursday Jan 8, 2026 + 3 business days = Tuesday Jan 13
    const result = calculateShipByDate('2026-01-08T00:00:00', 3);
    expect(result.getDate()).toBe(13);
    expect(result.getDay()).toBe(2); // Tuesday
  });

  it('handles starting on a Friday', () => {
    // Friday Jan 9, 2026 + 1 business day = Monday Jan 12
    const result = calculateShipByDate('2026-01-09T00:00:00', 1);
    expect(result.getDate()).toBe(12);
    expect(result.getDay()).toBe(1); // Monday
  });

  it('handles 1 business day from Wednesday', () => {
    // Wednesday Jan 7, 2026 + 1 business day = Thursday Jan 8
    const result = calculateShipByDate('2026-01-07T00:00:00', 1);
    expect(result.getDate()).toBe(8);
    expect(result.getDay()).toBe(4); // Thursday
  });
});
