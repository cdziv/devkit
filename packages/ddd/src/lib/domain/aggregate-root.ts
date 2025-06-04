import { DomainEventEmitter, JsonifyDeep, JsonValue } from '../interfaces';
import { DomainObject, ReadonlyDomainObjectProps } from './domain-object';
import { ValueObjectValue } from './value-object';
import { DomainEvent } from './domain-event';
import { EntityId } from './entity-id';
import { Constructor, ReadonlyDeep } from 'type-fest';
import { Entity, EntityProps } from './entity';
import { produce, WritableDraft } from 'immer';

export abstract class AggregateRoot<
  T extends EntityProps,
  ID extends EntityId<ValueObjectValue> = EntityId<string>,
  J extends JsonValue = JsonifyDeep<T>
> extends Entity<T, ID, J> {
  private cachedEvents: readonly ReadonlyDomainObjectProps<DomainEvent<any>>[];

  constructor(props: T, events?: DomainEvent<any>[]);
  constructor(
    props: T,
    events?: readonly ReadonlyDomainObjectProps<DomainEvent<any>>[]
  );
  constructor(
    props: T,
    events?:
      | DomainEvent<any>[]
      | readonly ReadonlyDomainObjectProps<DomainEvent<any>>[]
  ) {
    super(props);
    this.cachedEvents = Object.freeze(
      events?.map((evt) => DomainObject.convertPropsToReadonly(evt)) ?? []
    );
  }

  override evolve<R extends (draft: WritableDraft<T>) => void>(
    recipe: R
  ): this {
    return new (this.constructor as Constructor<this>)(
      produce(this.props, recipe),
      this.events
    );
  }

  addEvent(event: DomainEvent): this {
    const newEvents = [...this.events, event];
    return new (this.constructor as Constructor<this>)(this.props, newEvents);
  }

  publishEvents(eventEmitter: DomainEventEmitter): this {
    this.events?.forEach((event) => {
      eventEmitter.emit(event);
    });
    return this.clearEvents();
  }

  clearEvents(): this {
    return new (this.constructor as Constructor<this>)(this.props);
  }

  get events(): ReadonlyDeep<DomainEvent<any>[]> {
    return this.cachedEvents;
  }
}
