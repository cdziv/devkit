/* eslint-disable @typescript-eslint/no-explicit-any */

import { Map, MapOf, isMap } from 'immutable';
import {
  DomainPrimitive,
  DomainPrimitiveObject,
  JsonifyDeep,
  JsonValue,
  ValidationResult,
} from '../interfaces';
import { ArgumentInvalidError } from '../errors';
import { deepJsonify } from '../utils';
import { handleValidationResult } from '../helpers';
import { DomainObject, ReadonlyDomainObjectProps } from './domain-object';
import { ValueObject, ValueObjectValue } from './value-object';
import { EntityId } from './entity-id';
import { Constructor } from 'type-fest';

export abstract class Entity<
  T extends EntityProps,
  ID extends EntityId<ValueObjectValue> = EntityId<string>,
  J extends JsonValue = JsonifyDeep<T>
> extends DomainObject<J> {
  protected readonly immutableProps: ImmutableProps<T>;
  private cachedProps: ReadonlyDomainObjectProps<T>;

  constructor(props: T);
  constructor(immutableProps: ImmutableProps<T>);
  constructor(propsOrImmutableProps: T | ImmutableProps<T>) {
    super();

    const isImmutableProps = isMap(propsOrImmutableProps);
    const props = isImmutableProps
      ? (propsOrImmutableProps.toJSON() as T)
      : propsOrImmutableProps;
    this.validateProps(props);

    this.cachedProps = DomainObject.convertPropsToReadonly(props);
    this.immutableProps = isImmutableProps ? propsOrImmutableProps : Map(props);
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
      return this.withEntityProps({ [key]: newPropValue } as any);
    }

    return typeof partialPropsOrKeyOrUpdater === 'function'
      ? this.withEntityProps(partialPropsOrKeyOrUpdater(this) as Partial<T>)
      : this.withEntityProps(partialPropsOrKeyOrUpdater as Partial<T>);
  }

  private withEntityProps(partialProps: Partial<T>): this {
    let newImmutableProps = this.immutableProps;
    for (const key in partialProps) {
      const value = partialProps[key] as any;
      if (value === undefined) {
        newImmutableProps = newImmutableProps.delete(key as keyof T);
      } else {
        newImmutableProps = newImmutableProps.set(key as keyof T, value);
      }
    }
    return new (this.constructor as Constructor<this>)(newImmutableProps);
  }

  toJSON(): J {
    return deepJsonify(this.props) as J;
  }

  get props(): ReadonlyDomainObjectProps<T> {
    return this.cachedProps;
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
export type ImmutableProps<T extends EntityProps> = MapOf<T>;
