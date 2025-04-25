import { describe, it, expect } from 'vitest';
import { DomainObject } from './domain-object';

describe('DomainObject', () => {
  describe('convertPropsToReadonly', () => {
    it('should convert a simple object to a readonly object', () => {
      const input = { name: 'John', age: 30 };
      const result = DomainObject.convertPropsToReadonly(input);

      expect(result).toEqual(input);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should convert a nested object to a readonly object, but keep domain object reference', () => {
      class Child extends DomainObject<any> {
        toJSON() {
          return;
        }
      }

      const input = {
        user: { name: 'John', details: { age: 30 }, domainObject: new Child() },
      };
      const result = DomainObject.convertPropsToReadonly(input);

      expect(result).toEqual(input);
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.user)).toBe(true);
      expect(Object.isFrozen(result.user.details)).toBe(true);
      expect(result.user.domainObject).toBeInstanceOf(Child);
      expect(result.user.domainObject).toEqual(input.user.domainObject);
    });

    it('should convert an array to a readonly array', () => {
      const input = [1, 2, 3];
      const result = DomainObject.convertPropsToReadonly(input);

      expect(result).toEqual(input);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should convert a nested array to a readonly array', () => {
      const input = [
        [1, 2],
        [3, 4],
      ];
      const result = DomainObject.convertPropsToReadonly(input);

      expect(result).toEqual(input);
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result[0])).toBe(true);
      expect(Object.isFrozen(result[1])).toBe(true);
    });

    it('should handle empty objects and arrays', () => {
      const emptyObject = {};
      const emptyArray: any[] = [];

      const readonlyObject = DomainObject.convertPropsToReadonly(emptyObject);
      const readonlyArray = DomainObject.convertPropsToReadonly(emptyArray);

      expect(readonlyObject).toEqual(emptyObject);
      expect(Object.isFrozen(readonlyObject)).toBe(true);

      expect(readonlyArray).toEqual(emptyArray);
      expect(Object.isFrozen(readonlyArray)).toBe(true);
    });
  });
});
