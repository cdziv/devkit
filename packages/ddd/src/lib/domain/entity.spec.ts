import { describe, it, expect } from 'vitest';
import { ArgumentInvalidError, ValidationResult } from '../common';
import { Entity } from './entity';
import { ValueObject } from './value-object';
import { EntityId } from './entity-id';
import { Map } from 'immutable';

describe('Entity', () => {
  type ObjectVOValue = {
    name: string;
    age: number;
  };
  class ObjectVO extends ValueObject<ObjectVOValue> {
    validate(): ValidationResult {
      return;
    }
  }
  class Id extends EntityId<string> {
    get rawId() {
      return this.value;
    }

    validate(): ValidationResult {
      return;
    }
  }
  type SimpleProps = {
    name: string;
    age: number;
  };
  class SimpleEntity extends Entity<SimpleProps> {
    // composite from props
    get id(): Id {
      return new Id(`${this.props.name}-${this.props.age}`);
    }
    validate(): ValidationResult {
      return;
    }
  }
  type NestedProps = {
    id: Id;
    name: string;
    age: number;
    nestedObj: {
      firstName: string;
      lastName?: string;
    };
    nestedVO: ObjectVO;
    nestedEntity: SimpleEntity;
  };
  class ComplexEntity extends Entity<NestedProps, Id> {
    get id(): Id {
      return this.props.id;
    }

    validate(): ValidationResult {
      return;
    }
  }

  describe('constructor', () => {
    it('should create an instance when valid props provided', () => {
      expect(
        new SimpleEntity({
          name: 'foo',
          age: 123,
        })
      ).toBeInstanceOf(SimpleEntity);
      expect(
        new ComplexEntity({
          id: new Id('complex-entity-id'),
          name: 'foo',
          age: 123,
          nestedObj: {
            firstName: 'bar',
            lastName: 'baz',
          },
          nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
          nestedEntity: new SimpleEntity({
            name: 'nested-entity',
            age: 456,
          }),
        })
      ).toBeInstanceOf(ComplexEntity);
    });

    it('should create an instance when valid immutable props', () => {
      expect(
        new SimpleEntity(
          Map({
            name: 'foo',
            age: 123,
          })
        )
      ).toBeInstanceOf(SimpleEntity);
      expect(
        new ComplexEntity(
          Map({
            id: new Id('complex-entity-id'),
            name: 'foo',
            age: 123,
            nestedObj: {
              firstName: 'bar',
              lastName: 'baz',
            },
            nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
            nestedEntity: new SimpleEntity({
              name: 'nested-entity',
              age: 456,
            }),
          })
        )
      ).toBeInstanceOf(ComplexEntity);
    });

    it('should call validateProps method with the passed props', () => {
      const spy = vi.spyOn(SimpleEntity.prototype, 'validate');
      new SimpleEntity({
        name: 'foo',
        age: 123,
      });
      expect(spy).toHaveBeenCalledWith({
        name: 'foo',
        age: 123,
      });
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('should call validateProps method with the props of passed immutable props', () => {
      const spy = vi.spyOn(SimpleEntity.prototype, 'validate');
      new SimpleEntity(
        Map({
          name: 'foo',
          age: 123,
        })
      );
      expect(spy).toHaveBeenCalledWith({
        name: 'foo',
        age: 123,
      });
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('should call handleValidationResult with the result of validateProps', async () => {
      const spy = vi.spyOn(await import('../common'), 'handleValidationResult');
      const validatePayloadReturn = Symbol();
      class TestEntity extends Entity<SimpleProps> {
        get id(): Id {
          return new Id('test-entity-id');
        }
        validate() {
          return validatePayloadReturn as any;
        }
      }
      new TestEntity({
        name: 'foo',
        age: 123,
      });

      expect(spy).toHaveBeenCalledWith(validatePayloadReturn);
      vi.restoreAllMocks();
    });

    it('should throw ArgumentInvalid error when passed props is undefined', () => {
      expect(() => new SimpleEntity(undefined as any)).toThrow(
        ArgumentInvalidError
      );
    });

    it('should throw ArgumentInvalid error when passed props is function', () => {
      expect(
        () =>
          new SimpleEntity((() => {
            return;
          }) as any)
      ).toThrow(ArgumentInvalidError);
    });

    it('should throw ArgumentInvalid error when passed props is empty object', () => {
      expect(() => new SimpleEntity({} as any)).toThrow(ArgumentInvalidError);
    });
  });

  describe('equals', () => {
    it('should return true when two id are equal', () => {
      // The id of SimpleEntity is composite from props
      const entity1 = new SimpleEntity({
        name: 'foo',
        age: 123,
      });
      const entity2 = new SimpleEntity({
        name: 'foo',
        age: 123,
      });

      expect(entity1.id.rawId).toBe('foo-123');
      expect(entity2.id.rawId).toBe('foo-123');
      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should return true when two id are equal even if props are different', () => {
      const entity1 = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      const entity2 = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'bar',
        age: 456,
        nestedObj: {
          firstName: 'baz',
          lastName: 'qux',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 789 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 789,
        }),
      });

      expect(entity1.id.rawId).toBe('complex-entity-id');
      expect(entity2.id.rawId).toBe('complex-entity-id');
      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should return false when two id are not equal', () => {
      const entity1 = new ComplexEntity({
        id: new Id('complex-entity-id-1'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      const entity2 = new ComplexEntity({
        id: new Id('complex-entity-id-2'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });

      expect(entity1.id.rawId).toBe('complex-entity-id-1');
      expect(entity2.id.rawId).toBe('complex-entity-id-2');
      expect(entity1.equals(entity2)).toBe(false);
    });
  });

  describe('withMutations', () => {
    it('should return a new instance with updated prop', () => {
      const entity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      const updated = entity.withMutations({
        name: 'bar',
      });

      expect(updated).not.toBe(entity);
      expect(updated.props).toEqual({
        id: new Id('complex-entity-id'),
        name: 'bar',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
    });

    it('should return a new instance with updated prop by updater', () => {
      const entity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      const updated = entity.withMutations((entity) => ({
        name: entity.props.name + 'bar',
      }));

      expect(updated).not.toBe(entity);
      expect(updated.props).toEqual({
        id: new Id('complex-entity-id'),
        name: 'foobar',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
    });

    it('should return a new instance with new props by key and value', () => {
      const entity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      const updated = entity.withMutations('name', 'bar');

      expect(updated).not.toBe(entity);
      expect(updated.props).toEqual({
        id: new Id('complex-entity-id'),
        name: 'bar',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
    });

    it('should return a new instance with new props by key and updater', () => {
      const entity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      const updated = entity.withMutations('name', 'bar');

      expect(updated).not.toBe(entity);
      expect(updated.props).toEqual({
        id: new Id('complex-entity-id'),
        name: 'bar',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
    });

    it('should return a new instance with only replaced top level props from partial value', () => {
      const entity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'foo',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      const updated = entity.withMutations({
        nestedObj: {
          firstName: 'bar',
        },
      });

      expect(updated).not.toBe(entity);
      expect(updated.props).toEqual({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
    });
  });

  describe('toJSON', () => {
    it('should return a JSON representation of the entity', () => {
      const entity = new SimpleEntity({
        name: 'foo',
        age: 123,
      });
      expect(entity.toJSON()).toEqual({ name: 'foo', age: 123 });
    });

    it('should return a JSON representation of the nested entity', () => {
      const entity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'foo',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });

      expect(entity.toJSON()).toEqual({
        id: 'complex-entity-id',
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'foo',
          lastName: 'baz',
        },
        nestedVO: { name: 'nested', age: 456 },
        nestedEntity: {
          name: 'nested-entity',
          age: 456,
        },
      });
    });
  });

  describe('get props', () => {
    it('should return props same as passed', () => {
      const entity = new SimpleEntity({
        name: 'foo',
        age: 123,
      });
      const complexEntity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });

      expect(entity.props).toEqual({
        name: 'foo',
        age: 123,
      });
      expect(complexEntity.props).toEqual({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
    });

    it('should return a frozen object', () => {
      const complexEntity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });

      expect(Object.isFrozen(complexEntity.props)).toBe(true);
    });

    it('should return a frozen object with nested object properties', () => {
      const complexEntity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO: new ObjectVO({ name: 'nested', age: 456 }),
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      expect(Object.isFrozen(complexEntity.props)).toBe(true);
      expect(Object.isFrozen(complexEntity.props.nestedObj)).toBe(true);
    });

    it('should return nestedVO prop with original value object', () => {
      const nestedVO = new ObjectVO({ name: 'nested', age: 456 });
      const complexEntity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO,
        nestedEntity: new SimpleEntity({
          name: 'nested-entity',
          age: 456,
        }),
      });
      expect(complexEntity.props.nestedVO).toBeInstanceOf(ObjectVO);
      expect(complexEntity.props.nestedVO).toBe(nestedVO);
    });

    it('should return nestedEntity prop with original value object', () => {
      const nestedVO = new ObjectVO({ name: 'nested', age: 456 });
      const nestedEntity = new SimpleEntity({
        name: 'nested-entity',
        age: 456,
      });
      const complexEntity = new ComplexEntity({
        id: new Id('complex-entity-id'),
        name: 'foo',
        age: 123,
        nestedObj: {
          firstName: 'bar',
          lastName: 'baz',
        },
        nestedVO,
        nestedEntity,
      });
      expect(complexEntity.props.nestedEntity).toBeInstanceOf(SimpleEntity);
      expect(complexEntity.props.nestedEntity).toBe(nestedEntity);
    });
  });
});
