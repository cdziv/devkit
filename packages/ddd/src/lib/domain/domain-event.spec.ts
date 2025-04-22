import { describe, it, expect } from 'vitest';
import { DomainEvent } from './domain-event';
import { ArgumentInvalidError } from '../common';

describe('DomainEvent', () => {
  describe('constructor', () => {
    it('should create a DomainEvent with aggregate id', () => {
      class TestEvent extends DomainEvent {
        validatePayload() {
          return;
        }
      }
      const aggregateId = 'aggregate-id';
      const event = new TestEvent(aggregateId);

      expect(event).toBeInstanceOf(DomainEvent);
      expect(event.eventId).toBeDefined();
      expect(event.aggregateId).toBe(aggregateId);
      expect(event.timestamp).toBeDefined();
      expect(event.payload).toBeUndefined();
    });

    it('should create a DomainEvent with props', () => {
      class TestEvent extends DomainEvent<{ data: string }> {
        validatePayload() {
          return;
        }
      }
      const props = {
        eventId: 'event-id',
        aggregateId: 'aggregate-id',
        timestamp: Date.now(),
        payload: { data: 'test' },
      };
      const event = new TestEvent(props);

      expect(event).toBeInstanceOf(DomainEvent);
      expect(event.payload).toEqual(props.payload);
      expect(event.eventId).toBe(props.eventId);
      expect(event.aggregateId).toBe(props.aggregateId);
      expect(event.timestamp).toBe(props.timestamp);
    });

    it('should use constructor name as event type by default', () => {
      class TestEvent extends DomainEvent {
        validatePayload() {
          return;
        }
      }
      const event = new TestEvent('aggregate-id');

      expect(event.eventType).toBe('TestEvent');
    });

    it('should throw an ArgumentInvalidError if aggregateId is empty', () => {
      class TestEvent extends DomainEvent {
        validatePayload() {
          return;
        }
      }
      expect(() => new TestEvent('')).toThrowError(ArgumentInvalidError);
    });

    it('should throw an ArgumentInvalidError if aggregateId is not string', () => {
      class TestEvent extends DomainEvent {
        validatePayload() {
          return;
        }
      }
      expect(() => new TestEvent(123 as any)).toThrowError(
        ArgumentInvalidError
      );
    });

    it('should throw an ArgumentInvalidError if timestamp is not a number', () => {
      class TestEvent extends DomainEvent {
        validatePayload() {
          return;
        }
      }
      expect(
        () =>
          new TestEvent({ aggregateId: 'id', timestamp: 'not-a-number' } as any)
      ).toThrowError(ArgumentInvalidError);
    });

    it('should throw an ArgumentInvalidError if timestamp is less than 0', () => {
      class TestEvent extends DomainEvent {
        validatePayload() {
          return;
        }
      }
      expect(
        () => new TestEvent({ aggregateId: 'id', timestamp: -1 })
      ).toThrowError(ArgumentInvalidError);
    });

    it('should call handleValidationResult with the result of validatePayload', async () => {
      const spy = vi.spyOn(await import('../common'), 'handleValidationResult');
      const validatePayloadReturn = Symbol();
      class TestEvent extends DomainEvent {
        validatePayload() {
          return validatePayloadReturn as any;
        }
      }
      new TestEvent('aggregate-id');

      expect(spy).toHaveBeenCalledWith(validatePayloadReturn);
      vi.restoreAllMocks();
    });
  });
});
