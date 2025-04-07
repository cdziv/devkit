import { describe, it, expect } from 'vitest';
import { isDomainPrimitive } from './is-domain-primitive';

describe('isDomainPrimitive', () => {
  it('should return true for string values', () => {
    expect(isDomainPrimitive('test')).toBe(true);
  });

  it('should return true for number values', () => {
    expect(isDomainPrimitive(123)).toBe(true);
  });

  it('should return true for boolean values', () => {
    expect(isDomainPrimitive(true)).toBe(true);
    expect(isDomainPrimitive(false)).toBe(true);
  });

  it('should return true for Date instances', () => {
    expect(isDomainPrimitive(new Date())).toBe(true);
  });

  it('should return true for null', () => {
    expect(isDomainPrimitive(null)).toBe(true);
  });

  it('should return false for undefined', () => {
    expect(isDomainPrimitive(undefined)).toBe(false);
  });

  it('should return false for objects', () => {
    expect(isDomainPrimitive({})).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isDomainPrimitive([])).toBe(false);
  });

  it('should return false for functions', () => {
    expect(
      isDomainPrimitive(() => {
        return;
      })
    ).toBe(false);
  });

  it('should return false for symbols', () => {
    expect(isDomainPrimitive(Symbol('test'))).toBe(false);
  });
});
