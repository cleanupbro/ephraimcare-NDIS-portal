import { describe, it, expect } from 'vitest';
import { formatAUD, centsToAUD, audToCents } from '../currency';

describe('currency utils', () => {
  describe('formatAUD', () => {
    it('formats whole numbers', () => {
      expect(formatAUD(100)).toBe('$100.00');
    });

    it('formats decimals', () => {
      expect(formatAUD(42.5)).toBe('$42.50');
    });

    it('formats zero', () => {
      expect(formatAUD(0)).toBe('$0.00');
    });

    it('formats large amounts with commas', () => {
      expect(formatAUD(85000)).toBe('$85,000.00');
    });
  });

  describe('centsToAUD', () => {
    it('converts cents to dollars', () => {
      expect(centsToAUD(4250)).toBe(42.5);
    });

    it('handles zero', () => {
      expect(centsToAUD(0)).toBe(0);
    });
  });

  describe('audToCents', () => {
    it('converts dollars to cents', () => {
      expect(audToCents(42.5)).toBe(4250);
    });

    it('handles whole dollars', () => {
      expect(audToCents(100)).toBe(10000);
    });
  });
});
