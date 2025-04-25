import { describe } from 'vitest';
import { isPrimitive } from './is-primitive';

describe('isPrimitive', () => {
  it('should return true for primitive types', () => {
    expect(isPrimitive(42)).toBe(true);
    expect(isPrimitive('Hello')).toBe(true);
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive(undefined)).toBe(true);
    expect(isPrimitive(BigInt(123))).toBe(true);
    expect(isPrimitive(Symbol('foo'))).toBe(true);
  });

  it('should return false for non-primitive types', () => {
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([])).toBe(false);
    expect(
      isPrimitive(() => {
        return;
      })
    ).toBe(false);
  });
});
