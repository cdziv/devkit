import { randomUUID } from 'node:crypto';
import {
  ArgumentInvalidError,
  JsonValue,
  DomainEventProps,
  ValidationResult,
  handleValidationResult,
} from '../common';

export abstract class DomainEvent<T extends JsonValue | undefined = undefined> {
  public readonly id: string;
  public readonly aggregateId: string;
  public readonly timestamp: number;
  public readonly payload: T;

  constructor(aggregateIdOrProps: string | DomainEventProps<T>) {
    const props =
      typeof aggregateIdOrProps === 'string'
        ? { aggregateId: aggregateIdOrProps }
        : aggregateIdOrProps;
    this.id = props.id ?? randomUUID();
    this.aggregateId = props.aggregateId;
    this.timestamp = props.timestamp ?? Date.now();
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
