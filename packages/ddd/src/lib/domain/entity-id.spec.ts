import { describe, it, expect } from 'vitest';
import { EntityId } from './entity-id';

describe('EntityId', () => {
  type CompositeValue = {
    name: string;
    group: number;
  };
  class StringId extends EntityId<string> {
    validate() {
      return;
    }

    get rawId() {
      return this.value;
    }
  }
  class CompositeId extends EntityId<CompositeValue> {
    validate() {
      return;
    }

    get rawId() {
      return `${this.value.name}-${this.value.group}`;
    }
  }

  it('should return instance of EntityId', () => {
    expect(new StringId('foo')).toBeInstanceOf(EntityId);
    expect(new CompositeId({ name: 'foo', group: 1 })).toBeInstanceOf(EntityId);
  });

  it('should return the value matched the value provided', () => {
    const stringId = new StringId('foo');
    const compositeId = new CompositeId({ name: 'foo', group: 1 });

    expect(stringId.value).toBe('foo');
    expect(compositeId.value).toEqual({ name: 'foo', group: 1 });
  });

  it('should return the string value of the id', () => {
    const stringId = new StringId('foo');
    const compositeId = new CompositeId({ name: 'foo', group: 1 });

    expect(stringId.rawId).toBe('foo');
    expect(compositeId.rawId).toBe('foo-1');
  });
});
