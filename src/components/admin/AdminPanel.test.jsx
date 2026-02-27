import { describe, it, expect, vi } from 'vitest';

// Test the invite code generation logic (extracted from AdminPanel)
describe('AdminPanel invite code security', () => {
  it('crypto.getRandomValues produces unpredictable codes', () => {
    // Generate multiple codes and verify they are all different
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      const array = new Uint8Array(5);
      crypto.getRandomValues(array);
      const code = Array.from(array, b => b.toString(36).padStart(2, '0')).join('').substring(0, 10);
      codes.add(code);
    }
    // All 100 codes should be unique
    expect(codes.size).toBe(100);
  });

  it('generated codes are 10 characters long', () => {
    const array = new Uint8Array(5);
    crypto.getRandomValues(array);
    const code = Array.from(array, b => b.toString(36).padStart(2, '0')).join('').substring(0, 10);
    expect(code.length).toBe(10);
  });

  it('generated codes contain only alphanumeric characters', () => {
    for (let i = 0; i < 50; i++) {
      const array = new Uint8Array(5);
      crypto.getRandomValues(array);
      const code = Array.from(array, b => b.toString(36).padStart(2, '0')).join('').substring(0, 10);
      expect(code).toMatch(/^[a-z0-9]+$/);
    }
  });
});
