/* eslint-disable @typescript-eslint/no-explicit-any */

import { isMap, List } from 'immutable';
import { DomainEventEmitter, JsonifyDeep, JsonValue } from '../interfaces';
import { DomainObject, ReadonlyDomainObjectProps } from './domain-object';
import { ValueObjectValue } from './value-object';
import { DomainEvent } from './domain-event';
import { EntityId } from './entity-id';
import { Constructor } from 'type-fest';
import { Entity, EntityProps, ImmutableProps } from './entity';

export abstract class AggregateRoot<
  T extends EntityProps,
  ID extends EntityId<ValueObjectValue> = EntityId<string>,
  J extends JsonValue = JsonifyDeep<T>
> extends Entity<T, ID, J> {
  private readonly immutableEvents: List<DomainEvent>;
  private cachedEvents?: ReadonlyDomainObjectProps<DomainEvent[]>;

  constructor(props: T, events?: DomainEvent[]);
  constructor(
    immutableProps: ImmutableProps<T>,
    immutableEvents?: ImmutableEvents
  );
  constructor(
    propsOrImmutableProps: T | ImmutableProps<T>,
    eventsOrImmutableEvents?: DomainEvent[] | ImmutableEvents
  ) {
    super(propsOrImmutableProps as T);

    const isImmutableEvents = eventsOrImmutableEvents
      ? isMap(eventsOrImmutableEvents)
      : false;
    this.immutableEvents = isImmutableEvents
      ? (eventsOrImmutableEvents as ImmutableEvents)
      : List(eventsOrImmutableEvents ?? []);
  }

  override evolve<
    K extends keyof T,
    V extends T[K],
    PropUpdater extends (entity: this) => V,
    Updater extends (entity: this) => Partial<T>
  >(
    partialPropsOrKeyOrUpdater: Partial<T> | Updater | K,
    propOrPropUpdater?: V | PropUpdater
  ) {
    if (propOrPropUpdater !== undefined) {
      const newPropValue =
        typeof propOrPropUpdater === 'function'
          ? (propOrPropUpdater as PropUpdater)(this)
          : propOrPropUpdater;
      const key = partialPropsOrKeyOrUpdater as K;
      return this.withAggregateProps_({ [key]: newPropValue } as any);
    }

    return typeof partialPropsOrKeyOrUpdater === 'function'
      ? this.withAggregateProps_(partialPropsOrKeyOrUpdater(this) as Partial<T>)
      : this.withAggregateProps_(partialPropsOrKeyOrUpdater as Partial<T>);
  }

  addEvent(event: DomainEvent): this {
    const newImmutableEvents = this.immutableEvents.push(event);
    return new (this.constructor as Constructor<this>)(
      this.immutableProps,
      newImmutableEvents
    );
  }

  publishEvents(eventEmitter: DomainEventEmitter): this {
    this.immutableEvents.forEach((event) => {
      eventEmitter.emit(event);
    });
    return this.clearEvents();
  }

  clearEvents(): this {
    return new (this.constructor as Constructor<this>)(this.immutableProps);
  }

  get events(): ReadonlyDomainObjectProps<DomainEvent[]> {
    if (!this.cachedEvents) {
      this.cachedEvents = DomainObject.convertPropsToReadonly(
        this.immutableEvents.toArray()
      );
    }
    return this.cachedEvents;
  }

  private withAggregateProps_(partialProps: Partial<T>): this {
    let newImmutableProps = this.immutableProps;
    for (const key in partialProps) {
      const value = partialProps[key] as any;
      if (value === undefined) {
        newImmutableProps = newImmutableProps.delete(key as keyof T);
      } else {
        newImmutableProps = newImmutableProps.set(key as keyof T, value);
      }
    }
    return new (this.constructor as Constructor<this>)(
      newImmutableProps,
      this.immutableEvents
    );
  }
}

type ImmutableEvents = List<DomainEvent>;
