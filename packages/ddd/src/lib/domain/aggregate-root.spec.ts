import { describe, it, expect } from 'vitest';
import { DomainEventEmitter, ValidationResult } from '../interfaces';
import { EntityId } from './entity-id';
import { List, Map } from 'immutable';
import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

describe('AggregateRoot', () => {
  class Id extends EntityId<string> {
    get rawId() {
      return this.value;
    }

    validate(): ValidationResult {
      return;
    }
  }
  type AggregateProps = {
    name: string;
    age: number;
  };
  class TestAggregate extends AggregateRoot<AggregateProps> {
    // composite from props
    get id(): Id {
      return new Id(`${this.props.name}-${this.props.age}`);
    }
    validate(): ValidationResult {
      return;
    }
  }
  class TestDomainEvent extends DomainEvent {
    validatePayload() {
      return;
    }
  }

  describe('constructor', () => {
    it('should create an instance when valid props provided', () => {
      expect(
        new TestAggregate({
          name: 'foo',
          age: 123,
        })
      ).toBeInstanceOf(TestAggregate);
    });

    it('should create an instance when valid props and events provided', () => {
      const events = [
        new TestDomainEvent('aggregate-id'),
        new TestDomainEvent('aggregate-id'),
      ];
      const aggregate = new TestAggregate(
        {
          name: 'foo',
          age: 123,
        },
        events
      );

      expect(aggregate).toBeInstanceOf(TestAggregate);
      expect(aggregate.events).toEqual(events);
    });

    it('should create an instance when valid immutable props', () => {
      expect(
        new TestAggregate(
          Map({
            name: 'foo',
            age: 123,
          })
        )
      ).toBeInstanceOf(TestAggregate);
    });

    it('should create an instance when valid immutable props and immutable events', () => {
      const immutableEvents = List([
        new TestDomainEvent('aggregate-id'),
        new TestDomainEvent('aggregate-id'),
      ]);
      const aggregate = new TestAggregate(
        Map({
          name: 'foo',
          age: 123,
        }),
        immutableEvents
      );

      expect(aggregate).toBeInstanceOf(TestAggregate);
      expect(aggregate.events).toEqual(immutableEvents.toArray());
    });
  });

  describe('withMutations', () => {
    it('should return a new instance with updated prop and existed events', () => {
      const events = [
        new TestDomainEvent('aggregate-id'),
        new TestDomainEvent('aggregate-id'),
      ];
      const original = new TestAggregate(
        {
          name: 'foo',
          age: 123,
        },
        events
      );
      const updated = original.withMutations({
        name: 'bar',
      });

      expect(updated).not.toBe(original);
      expect(updated.props).toEqual({
        name: 'bar',
        age: 123,
      });
      expect(updated.events).toEqual(events);
    });
  });

  describe('addEvent', () => {
    it('should add an event to the aggregate', () => {
      const events = [
        new TestDomainEvent('aggregate-id'),
        new TestDomainEvent('aggregate-id'),
      ];
      const original = new TestAggregate(
        {
          name: 'foo',
          age: 123,
        },
        events
      );
      const newEvent = new TestDomainEvent('aggregate-id');
      const updated = original.addEvent(newEvent);

      expect(updated).not.toBe(original);
      expect(updated.events).toEqual([...events, newEvent]);
    });
  });

  describe('publishEvents', () => {
    it('should publish all events to the event emitter', () => {
      const events = [
        new TestDomainEvent('aggregate-id'),
        new TestDomainEvent('aggregate-id'),
      ];
      const original = new TestAggregate(
        {
          name: 'foo',
          age: 123,
        },
        events
      );
      const emitSpy = vi.fn();
      const eventEmitter: DomainEventEmitter = {
        emit: emitSpy,
      };

      original.publishEvents(eventEmitter);

      expect(emitSpy).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenCalledWith(events[0]);
      expect(emitSpy).toHaveBeenCalledWith(events[1]);
    });

    it('should return a new instance with cleared events', () => {
      const events = [
        new TestDomainEvent('aggregate-id'),
        new TestDomainEvent('aggregate-id'),
      ];
      const original = new TestAggregate(
        {
          name: 'foo',
          age: 123,
        },
        events
      );
      const eventEmitter: DomainEventEmitter = {
        emit: vi.fn(),
      };

      const updated = original.publishEvents(eventEmitter);

      expect(updated).not.toBe(original);
      expect(updated.events).toEqual([]);
    });
  });

  describe('clearEvents', () => {
    it('should return a new instance with cleared events', () => {
      const events = [
        new TestDomainEvent('aggregate-id'),
        new TestDomainEvent('aggregate-id'),
      ];
      const original = new TestAggregate(
        {
          name: 'foo',
          age: 123,
        },
        events
      );

      const updated = original.clearEvents();

      expect(updated).not.toBe(original);
      expect(updated.events).toEqual([]);
    });

    it('should return a new instance with the same props', () => {
      const events = [
        new TestDomainEvent('aggregate-id'),
        new TestDomainEvent('aggregate-id'),
      ];
      const original = new TestAggregate(
        {
          name: 'foo',
          age: 123,
        },
        events
      );

      const updated = original.clearEvents();

      expect(updated.props).toEqual(original.props);
    });
  });
});
