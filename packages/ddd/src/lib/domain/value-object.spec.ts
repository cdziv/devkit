import { describe, it, expect } from 'vitest';
import { DomainPrimitive, ValidationResult } from '../interfaces';
import { ArgumentInvalidError } from '../errors';
import { DddError } from '../errors';
import { ValueObject } from './value-object';

describe('ValueObject', () => {
  type ObjectValue = {
    name: string;
    age: number;
  };
  class ObjectVO extends ValueObject<ObjectValue> {
    validate(): ValidationResult {
      return;
    }
  }
  type PrimitiveValue = DomainPrimitive;
  class PrimitiveVO extends ValueObject<PrimitiveValue> {
    validate(): ValidationResult {
      return;
    }
  }
  type NestedObjectValue = {
    name: string;
    age: number;
    complexObj: {
      firstName: string;
      lastName: string;
      nestedObj: {
        prop: string;
        vo: ObjectVO;
      };
    };
    vo: ObjectVO;
    voArr: ObjectVO[];
  };
  class NestedObjectVO extends ValueObject<NestedObjectValue> {
    validate(): ValidationResult {
      return;
    }
  }

  describe('constructor', () => {
    it('should create an instance when valid props provided', () => {
      expect(new PrimitiveVO(123)).toBeInstanceOf(PrimitiveVO);
      expect(new PrimitiveVO('string')).toBeInstanceOf(PrimitiveVO);
      expect(new PrimitiveVO(new Date())).toBeInstanceOf(PrimitiveVO);
      expect(new PrimitiveVO(null)).toBeInstanceOf(PrimitiveVO);
      expect(new PrimitiveVO(true)).toBeInstanceOf(PrimitiveVO);
      expect(new ObjectVO({ name: 'foo', age: 123 })).toBeInstanceOf(ObjectVO);
      expect(
        new NestedObjectVO({
          name: 'foo',
          age: 123,
          complexObj: {
            firstName: 'bar',
            lastName: 'baz',
            nestedObj: {
              prop: 'nestedProp',
              vo: new ObjectVO({ name: 'nestedVOName', age: 321 }),
            },
          },
          vo: new ObjectVO({ name: 'voName', age: 789 }),
          voArr: [new ObjectVO({ name: 'voArrName', age: 456 })],
        })
      ).toBeInstanceOf(NestedObjectVO);
    });

    it('should throw ArgumentInvalid error when passed value is undefined', () => {
      expect(() => new PrimitiveVO(undefined as any)).toThrow(
        ArgumentInvalidError
      );
    });

    it('should throw ArgumentInvalid error when passed value is function', () => {
      expect(
        () =>
          new PrimitiveVO((() => {
            return;
          }) as any)
      ).toThrow(ArgumentInvalidError);
    });

    it('should throw ArgumentInvalid error when passed value is empty object', () => {
      class Empty extends ValueObject<any> {
        validate() {
          return;
        }
      }
      expect(() => new Empty({})).toThrow(ArgumentInvalidError);
    });
  });

  describe('isDomainPrimitive', () => {
    it('should return true when passed value is domain primitive', () => {
      expect(new PrimitiveVO(123).isDomainPrimitive).toBe(true);
      expect(new PrimitiveVO('string').isDomainPrimitive).toBe(true);
      expect(new PrimitiveVO(true).isDomainPrimitive).toBe(true);
      expect(new PrimitiveVO(null).isDomainPrimitive).toBe(true);
      expect(new PrimitiveVO(new Date()).isDomainPrimitive).toBe(true);
    });

    it('should return false when passed value is not domain primitive', () => {
      const vo = new ObjectVO({ name: 'foo', age: 123 });
      expect(vo.isDomainPrimitive).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true when two value are equal', () => {
      const vo1 = new PrimitiveVO(123);
      const vo2 = new PrimitiveVO(123);
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should return false when two value are not equal', () => {
      const vo1 = new PrimitiveVO(123);
      const vo2 = new PrimitiveVO(456);
      expect(vo1.equals(vo2)).toBe(false);
    });

    it('should return true when two object are equal', () => {
      const vo1 = new ObjectVO({ name: 'foo', age: 123 });
      const vo2 = new ObjectVO({ name: 'foo', age: 123 });
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should return true when two nested object are equal that contains value object as prop', () => {
      const vo1 = new NestedObjectVO({
        name: 'foo',
        age: 123,
        complexObj: {
          firstName: 'bar',
          lastName: 'baz',
          nestedObj: {
            prop: 'nestedProp',
            vo: new ObjectVO({ name: 'nestedVOName', age: 321 }),
          },
        },
        vo: new ObjectVO({ name: 'voName', age: 789 }),
        voArr: [new ObjectVO({ name: 'voArrName', age: 456 })],
      });
      const vo2 = new NestedObjectVO({
        name: 'foo',
        age: 123,
        complexObj: {
          firstName: 'bar',
          lastName: 'baz',
          nestedObj: {
            prop: 'nestedProp',
            vo: new ObjectVO({ name: 'nestedVOName', age: 321 }),
          },
        },
        vo: new ObjectVO({ name: 'voName', age: 789 }),
        voArr: [new ObjectVO({ name: 'voArrName', age: 456 })],
      });
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should return false when two object are not equal', () => {
      const vo1 = new ObjectVO({ name: 'foo', age: 123 });
      const vo2 = new ObjectVO({ name: 'bar', age: 456 });
      expect(vo1.equals(vo2)).toBe(false);
    });
  });

  describe('validate', () => {
    it('should throw given error when validate method return the error extends from DddError', () => {
      class CustomError extends DddError {
        readonly code = 'custom';
        readonly name = 'CustomError';
        constructor() {
          super('custom error');
        }
      }
      class PrimitiveVO extends ValueObject<PrimitiveValue> {
        validate(): ValidationResult {
          return new CustomError();
        }
      }

      expect(() => new PrimitiveVO(123)).toThrow(CustomError);
      expect(() => new PrimitiveVO(123)).toThrow('custom error');
    });

    it('should throw ArgumentInvalidError when validate method return false', () => {
      class PrimitiveVO extends ValueObject<PrimitiveValue> {
        validate(): ValidationResult {
          return false;
        }
      }

      expect(() => new PrimitiveVO(123)).toThrow(ArgumentInvalidError);
    });

    it('should throw ArgumentInvalidError when custom error return from validate method', () => {
      class CustomError extends Error {
        code = 'custom';
        constructor() {
          super('custom error');
        }
      }
      class PrimitiveVO extends ValueObject<PrimitiveValue> {
        validate(): ValidationResult {
          return new CustomError();
        }
      }
      expect(() => new PrimitiveVO(123)).toThrow(ArgumentInvalidError);
    });

    it('should throw ArgumentInvalidError when validate method return string', () => {
      class PrimitiveVO extends ValueObject<PrimitiveValue> {
        validate(): ValidationResult {
          return 'error message';
        }
      }

      expect(() => new PrimitiveVO(123)).toThrow(ArgumentInvalidError);
      expect(() => new PrimitiveVO(123)).toThrow('error message');
    });

    it('should throw ArgumentInvalidError when validate method return false', () => {
      class PrimitiveVO extends ValueObject<PrimitiveValue> {
        validate(): ValidationResult {
          return false;
        }
      }

      expect(() => new PrimitiveVO(123)).toThrow(ArgumentInvalidError);
    });
  });

  describe('evolve', () => {
    class NumberChild extends ValueObject<number> {
      validate(value: number): ValidationResult {
        if (typeof value !== 'number') return false;
        return;
      }
    }

    it('should return a new instance with new primitive value', () => {
      const vo = new NumberChild(123);
      const newVo = vo.evolve(456);

      expect(newVo).not.toBe(vo);
      expect(newVo.value).toBe(456);
    });

    it('should return a new instance with new object value by recipe function', () => {
      const vo = new ObjectVO({ name: 'foo', age: 123 });
      const newVo = vo.evolve((draft) => {
        draft.name = 'bar';
      });

      expect(newVo.value).toEqual({ name: 'bar', age: 123 });
    });

    it('should return a new instance with changed props in recipe', () => {
      const vo = new NestedObjectVO({
        name: 'foo',
        age: 123,
        complexObj: {
          firstName: 'bar',
          lastName: 'baz',
          nestedObj: {
            prop: 'nestedProp',
            vo: new ObjectVO({ name: 'nestedVOName', age: 321 }),
          },
        },
        vo: new ObjectVO({ name: 'voName', age: 789 }),
        voArr: [new ObjectVO({ name: 'voArrName', age: 456 })],
      });
      const newVo = vo.evolve((draft) => {
        draft.complexObj.firstName = 'newBar';
        draft.complexObj.nestedObj.prop = 'newNestedProp';
        draft.complexObj.nestedObj.vo = new ObjectVO({
          name: 'newNestedVOName',
          age: 654,
        });
        draft.vo = new ObjectVO({ name: 'newVoName', age: 999 });
        draft.voArr = [new ObjectVO({ name: 'newVoArrName', age: 888 })];
      });

      expect(newVo.value).toEqual({
        name: 'foo',
        age: 123,
        complexObj: {
          firstName: 'newBar',
          lastName: 'baz',
          nestedObj: {
            prop: 'newNestedProp',
            vo: new ObjectVO({ name: 'newNestedVOName', age: 654 }),
          },
        },
        vo: new ObjectVO({ name: 'newVoName', age: 999 }),
        voArr: [new ObjectVO({ name: 'newVoArrName', age: 888 })],
      });
    });
  });

  describe('toJSON', () => {
    it('should return a JSON representation of the value object', () => {
      const vo = new ObjectVO({ name: 'foo', age: 123 });
      expect(vo.toJSON()).toEqual({ name: 'foo', age: 123 });
    });

    it('should return a JSON representation of the primitive value object', () => {
      const vo = new PrimitiveVO(123);
      expect(vo.toJSON()).toBe(123);
    });

    it('should return a JSON representation of the nested value object', () => {
      const vo = new NestedObjectVO({
        name: 'foo',
        age: 123,
        complexObj: {
          firstName: 'bar',
          lastName: 'baz',
          nestedObj: {
            prop: 'nestedProp',
            vo: new ObjectVO({ name: 'nestedVOName', age: 321 }),
          },
        },
        vo: new ObjectVO({ name: 'voName', age: 789 }),
        voArr: [new ObjectVO({ name: 'voArrName', age: 456 })],
      });
      expect(vo.toJSON()).toEqual({
        name: 'foo',
        age: 123,
        complexObj: {
          firstName: 'bar',
          lastName: 'baz',
          nestedObj: {
            prop: 'nestedProp',
            vo: { name: 'nestedVOName', age: 321 },
          },
        },
        vo: { name: 'voName', age: 789 },
        voArr: [{ name: 'voArrName', age: 456 }],
      });
    });
  });

  describe('get value', () => {
    it('should return value same as passed when domain primitive', () => {
      const time = new Date();
      const number = new PrimitiveVO(123);
      const string = new PrimitiveVO('string');
      const date = new PrimitiveVO(time);
      const bool = new PrimitiveVO(true);
      const nullValue = new PrimitiveVO(null);
      const object = new ObjectVO({ name: 'foo', age: 123 });

      expect(number.value).toBe(123);
      expect(string.value).toBe('string');
      expect(date.value).toEqual(time);
      expect(bool.value).toBe(true);
      expect(nullValue.value).toBe(null);
      expect(object.value).toEqual({ name: 'foo', age: 123 });
    });

    it('should return a frozen object', () => {
      const vo = new ObjectVO({ name: 'foo', age: 123 });
      expect(Object.isFrozen(vo.value)).toBe(true);
    });

    it('should return a frozen object with nested object properties', () => {
      const vo = new NestedObjectVO({
        name: 'foo',
        age: 123,
        complexObj: {
          firstName: 'bar',
          lastName: 'baz',
          nestedObj: {
            prop: 'nestedProp',
            vo: new ObjectVO({ name: 'nestedVOName', age: 321 }),
          },
        },
        vo: new ObjectVO({ name: 'voName', age: 789 }),
        voArr: [new ObjectVO({ name: 'voArrName', age: 456 })],
      });
      expect(Object.isFrozen(vo.value)).toBe(true);
      expect(Object.isFrozen(vo.value.complexObj)).toBe(true);
      expect(Object.isFrozen(vo.value.complexObj.nestedObj)).toBe(true);
    });

    it('should return nestedVO prop with original value object', () => {
      const vo = new NestedObjectVO({
        name: 'foo',
        age: 123,
        complexObj: {
          firstName: 'bar',
          lastName: 'baz',
          nestedObj: {
            prop: 'nestedProp',
            vo: new ObjectVO({ name: 'nestedVOName', age: 321 }),
          },
        },
        vo: new ObjectVO({ name: 'voName', age: 789 }),
        voArr: [new ObjectVO({ name: 'voArrName', age: 456 })],
      });
      expect(vo.value.vo).toBeInstanceOf(ObjectVO);
      expect(vo.value.voArr[0]).toBeInstanceOf(ObjectVO);
    });
  });
});
