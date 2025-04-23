import {
  ArgumentInvalidError,
  deepJsonify,
  DomainObject,
  DomainPrimitive,
  DomainPrimitiveObject,
  handleValidationResult,
  JsonifyDeep,
  JsonValue,
  ReadonlyDomainObjectProps,
  ValidationResult,
} from '../common';
import { Map, MapOf, isMap, List } from 'immutable';
import { ValueObject, ValueObjectValue } from './value-object';
import { DomainEvent } from './domain-event';
import { EntityId } from './entity-id';
import { Constructor } from 'type-fest';

/**
 * @remarks
 * The definition method of `Record` makes it impossible to use `interface` as its constraint object,
 * so `type` must be used instead. If a better solution is found, this part should be revised.
 */
export type EntityProps = Record<
  string,
  | DomainPrimitive
  | DomainPrimitive[]
  | DomainPrimitiveObject
  | ValueObject<any>
  | Entity<any>
>;
type ImmutableProps<T extends EntityProps> = MapOf<T>;
type ImmutableEvents = List<DomainEvent>;

export abstract class Entity<
  T extends EntityProps,
  ID extends EntityId<ValueObjectValue> = EntityId<string>,
  J extends JsonValue = JsonifyDeep<T>
> extends DomainObject<J> {
  private readonly immutableProps: ImmutableProps<T>;
  private readonly immutableEvents: List<DomainEvent>;
  private cachedProps: ReadonlyDomainObjectProps<T>;
  private cachedEvents?: ReadonlyDomainObjectProps<DomainEvent[]>;

  constructor(props: T, events?: DomainEvent[]);
  constructor(
    immutableProps: ImmutableProps<T>,
    immutableEvents?: DomainEvent[]
  );
  constructor(
    propsOrImmutableProps: T | ImmutableProps<T>,
    eventsOrImmutableEvents?: DomainEvent[] | ImmutableEvents
  ) {
    super();

    const isImmutableProps = isMap(propsOrImmutableProps);
    const isImmutableEvents = eventsOrImmutableEvents
      ? isMap(eventsOrImmutableEvents)
      : false;

    const props = isImmutableProps
      ? (propsOrImmutableProps.toJSON() as T)
      : propsOrImmutableProps;
    this.validateProps(props);

    this.cachedProps = DomainObject.convertPropsToReadonly(props);
    this.immutableProps = isImmutableProps ? propsOrImmutableProps : Map(props);
    this.immutableEvents = isImmutableEvents
      ? (eventsOrImmutableEvents as ImmutableEvents)
      : List(eventsOrImmutableEvents ?? []);
  }

  abstract get id(): ID;
  protected abstract validate(props: T): ValidationResult;

  equals(entity: this): boolean {
    return this.id.equals(entity.id);
  }

  withMutations(props: Partial<T>): this;
  withMutations<K extends keyof T, V extends T[K]>(key: K, value: V): this;
  withMutations<
    K extends keyof T,
    V extends T[K],
    PropUpdater extends (entity: this) => V
  >(key: K, propUpdater: PropUpdater): this;
  withMutations(updater: (entity: this) => Partial<T>): this;
  withMutations<
    K extends keyof T,
    V extends T[K],
    PropUpdater extends (entity: this) => V,
    Updater extends (entity: this) => Partial<T>
  >(
    partialPropsOrKeyOrUpdater: Partial<T> | Updater | K,
    propOrPropUpdater?: V | PropUpdater
  ): this;
  withMutations<
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.withProps({ [key]: newPropValue } as any);
    }

    return typeof partialPropsOrKeyOrUpdater === 'function'
      ? this.withProps(partialPropsOrKeyOrUpdater(this) as Partial<T>)
      : this.withProps(partialPropsOrKeyOrUpdater as Partial<T>);
  }

  private withProps(partialProps: Partial<T>): this {
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

  toJSON(): J {
    return deepJsonify(this.props) as J;
  }

  get props(): ReadonlyDomainObjectProps<T> {
    return this.cachedProps;
  }

  get events(): ReadonlyDomainObjectProps<DomainEvent[]> {
    if (!this.cachedEvents) {
      this.cachedEvents = DomainObject.convertPropsToReadonly(
        this.immutableEvents.toArray()
      );
    }
    return this.cachedEvents;
  }

  private validateProps(props: T): void {
    if (props === undefined) {
      throw new ArgumentInvalidError('The props must not be undefined');
    }
    const validationResult = this.validate(props);
    handleValidationResult(validationResult);

    if (Object.keys(props).length === 0) {
      throw new ArgumentInvalidError('The props must not be empty object');
    }
    return;
  }
}
