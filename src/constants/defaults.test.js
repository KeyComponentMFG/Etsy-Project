import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SUPPLY_CATEGORIES,
  DEFAULT_TEAM,
  DEFAULT_STORES,
  DEFAULT_PRINTERS,
  PRODUCTION_STAGES,
  TRANSACTION_FEE_RATE,
  PAYMENT_PROCESSING_RATE,
  PAYMENT_PROCESSING_FLAT,
  SALES_TAX_RATE,
} from './defaults';

describe('Default constants', () => {
  it('DEFAULT_SUPPLY_CATEGORIES has required fields', () => {
    expect(DEFAULT_SUPPLY_CATEGORIES.length).toBeGreaterThan(0);
    DEFAULT_SUPPLY_CATEGORIES.forEach(cat => {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(typeof cat.id).toBe('string');
      expect(typeof cat.name).toBe('string');
    });
  });

  it('DEFAULT_TEAM has required fields', () => {
    expect(DEFAULT_TEAM.length).toBeGreaterThan(0);
    DEFAULT_TEAM.forEach(member => {
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('name');
    });
  });

  it('DEFAULT_STORES has color property', () => {
    DEFAULT_STORES.forEach(store => {
      expect(store).toHaveProperty('color');
      expect(store.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('DEFAULT_PRINTERS has totalHours initialized to 0', () => {
    DEFAULT_PRINTERS.forEach(printer => {
      expect(printer.totalHours).toBe(0);
    });
  });

  it('PRODUCTION_STAGES has valid structure', () => {
    expect(PRODUCTION_STAGES.length).toBe(5);
    PRODUCTION_STAGES.forEach(stage => {
      expect(stage).toHaveProperty('id');
      expect(stage).toHaveProperty('name');
      expect(stage).toHaveProperty('color');
      expect(stage).toHaveProperty('icon');
    });
  });

  it('PRODUCTION_STAGES ids are unique', () => {
    const ids = PRODUCTION_STAGES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Fee constants', () => {
  it('TRANSACTION_FEE_RATE is 6.5%', () => {
    expect(TRANSACTION_FEE_RATE).toBe(0.065);
  });

  it('PAYMENT_PROCESSING_RATE is 3%', () => {
    expect(PAYMENT_PROCESSING_RATE).toBe(0.03);
  });

  it('PAYMENT_PROCESSING_FLAT is $0.25', () => {
    expect(PAYMENT_PROCESSING_FLAT).toBe(0.25);
  });

  it('SALES_TAX_RATE is 7.52%', () => {
    expect(SALES_TAX_RATE).toBe(0.0752);
  });

  it('fee rates are between 0 and 1', () => {
    expect(TRANSACTION_FEE_RATE).toBeGreaterThan(0);
    expect(TRANSACTION_FEE_RATE).toBeLessThan(1);
    expect(PAYMENT_PROCESSING_RATE).toBeGreaterThan(0);
    expect(PAYMENT_PROCESSING_RATE).toBeLessThan(1);
    expect(SALES_TAX_RATE).toBeGreaterThan(0);
    expect(SALES_TAX_RATE).toBeLessThan(1);
  });
});
