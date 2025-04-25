import { randomUUID } from 'node:crypto';
import { ArgumentInvalidError } from '../errors';
import { JsonValue, ValidationResult, DomainEventProps } from '../interfaces';
import { handleValidationResult } from '../helpers';

export abstract class DomainEvent<T extends JsonValue | undefined = undefined> {
  public readonly eventId: string;
  public readonly eventType: string = this.constructor.name;
  public readonly aggregateId: string;
  public readonly timestamp: number;
  public readonly payload: T;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  constructor(aggregateIdOrProps: string | DomainEventProps<T>) {
    const props =
      typeof aggregateIdOrProps === 'string'
        ? { aggregateId: aggregateIdOrProps }
        : aggregateIdOrProps;
    this.eventId = props.eventId ?? randomUUID();
    this.aggregateId = props.aggregateId;
    this.timestamp = props.timestamp ?? Date.now();
    this.correlationId = props.correlationId;
    this.causationId = props.causationId;
    this.payload = props.payload as T;
    this.validateProps();
  }

  private validateProps() {
    if (
      typeof this.aggregateId !== 'string' ||
      this.aggregateId?.length === 0
    ) {
      throw new ArgumentInvalidError('DomainEvent must have an aggregateId');
    }
    if (typeof this.timestamp !== 'number' || this.timestamp < 0) {
      throw new ArgumentInvalidError('DomainEvent must have a valid timestamp');
    }

    handleValidationResult(this.validatePayload(this.payload));
  }

  protected abstract validatePayload(payload: T): ValidationResult;
}
