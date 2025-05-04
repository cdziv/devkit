/* eslint-disable @typescript-eslint/no-explicit-any */

import { isDeepStrictEqual } from 'node:util';
import {
  DomainPrimitive,
  DomainPrimitiveObject,
  JsonifyDeep,
  JsonValue,
  ValidationResult,
} from '../interfaces';
import { ArgumentInvalidError } from '../errors';
import { deepJsonify, isDomainPrimitive } from '../utils';
import { handleValidationResult } from '../helpers';
import { DomainObject, ReadonlyDomainObjectProps } from './domain-object';
import { Map, MapOf, isMap } from 'immutable';
import { Constructor } from 'type-fest';

export abstract class ValueObject<
  T extends ValueObjectValue,
  J extends JsonValue = JsonifyDeep<T>
> extends DomainObject<J> {
  public readonly isDomainPrimitive: boolean;
  private readonly map: ImmutableValueObjectMap<T>;
  private cachedProps?: ReadonlyDomainObjectProps<ValueObjectProps<T>>;

  constructor(valueOrImmutableMap: T | ImmutableValueObjectMap<T>) {
    super();

    const isImmutableMap = isMap(valueOrImmutableMap);
    const value = isImmutableMap
      ? this.getValue_(
          (
            valueOrImmutableMap as ImmutableValueObjectMap<T>
          ).toJSON() as ValueObjectProps<T>
        )
      : (valueOrImmutableMap as T);
    this.validateValue_(value);
    this.isDomainPrimitive = isDomainPrimitive(value);
    this.map = isImmutableMap
      ? valueOrImmutableMap
      : Map(this.getProps_(value));
  }

  protected abstract validate(props: T): ValidationResult;

  equals(vo: this): boolean {
    return isDeepStrictEqual(this.value, vo.value);
  }

  evolve(value: T extends DomainPrimitive ? T : Partial<T>): this;
  evolve<K extends ValueObjectValueKeys<T>, V extends T[K]>(
    key: K,
    value: V
  ): this;
  evolve<
    K extends keyof T,
    V extends T[K],
    PropUpdater extends (vo: this) => V
  >(key: K, propUpdater: PropUpdater): this;
  evolve(updater: (vo: this) => PrimitiveValue<T> | PartialValue<T>): this;
  evolve<
    K extends ValueObjectValueKeys<T>,
    V extends T[K],
    PropUpdater extends (vo: this) => V,
    Updater extends (vo: this) => PrimitiveValue<T> | PartialValue<T>
  >(
    primitiveValueOrPartialValueOrKeyOrUpdater:
      | PrimitiveValue<T>
      | Updater
      | PartialValue<T>
      | K,
    propOrPropUpdater?: V | PropUpdater
  ): this;
  evolve<
    K extends ValueObjectValueKeys<T>,
    V extends T[K],
    PropUpdater extends (vo: this) => V,
    Updater extends (vo: this) => PrimitiveValue<T> | PartialValue<T>
  >(
    primitiveValueOrPartialValueOrKeyOrUpdater:
      | PrimitiveValue<T>
      | Updater
      | PartialValue<T>
      | K,
    propOrPropUpdater?: V | PropUpdater
  ) {
    if (propOrPropUpdater !== undefined) {
      const newPropValue =
        typeof propOrPropUpdater === 'function'
          ? (propOrPropUpdater as PropUpdater)(this)
          : propOrPropUpdater;
      const key = primitiveValueOrPartialValueOrKeyOrUpdater as K;
      return this.withProps_({ [key]: newPropValue } as any);
    }

    if (this.isDomainPrimitive) {
      return typeof primitiveValueOrPartialValueOrKeyOrUpdater === 'function'
        ? this.withDomainPrimitiveValue_(
            primitiveValueOrPartialValueOrKeyOrUpdater(
              this
            ) as PrimitiveValue<T>
          )
        : this.withDomainPrimitiveValue_(
            primitiveValueOrPartialValueOrKeyOrUpdater as PrimitiveValue<T>
          );
    }

    return typeof primitiveValueOrPartialValueOrKeyOrUpdater === 'function'
      ? this.withProps_(
          primitiveValueOrPartialValueOrKeyOrUpdater(this) as PartialValue<T>
        )
      : this.withProps_(
          primitiveValueOrPartialValueOrKeyOrUpdater as PartialValue<T>
        );
  }
  private withDomainPrimitiveValue_(
    value: T extends DomainPrimitive ? T : never
  ): this {
    return new (this.constructor as Constructor<this>)(value);
  }
  private withProps_(
    partialProps: T extends DomainPrimitive ? never : Partial<T>
  ): this {
    let newMap = this.map;
    for (const key in partialProps) {
      const value = partialProps[key] as any;
      if (value === undefined) {
        newMap = newMap.delete(key as keyof ValueObjectProps<T>);
      } else {
        newMap = newMap.set(key as keyof ValueObjectProps<T>, value);
      }
    }
    return new (this.constructor as Constructor<this>)(newMap);
  }

  toJSON(): J {
    return deepJsonify(this.value) as J;
  }

  get value(): ReadonlyDomainObjectProps<T> {
    if (!this.cachedProps) {
      this.cachedProps = DomainObject.convertPropsToReadonly(
        this.map.toJSON() as ValueObjectProps<T>
      );
    }
    return this.getValue_(this.cachedProps);
  }

  private getProps_(value: T): ValueObjectProps<T> {
    return this.isDomainPrimitive
      ? ({ value } as ValueObjectProps<T>)
      : (value as ValueObjectProps<T>);
  }

  private getValue_(props: ValueObjectProps<T>): T;
  private getValue_(
    props: ReadonlyDomainObjectProps<ValueObjectProps<T>>
  ): ReadonlyDomainObjectProps<T>;
  private getValue_(
    props: ValueObjectProps<T> | ReadonlyDomainObjectProps<ValueObjectProps<T>>
  ): T | ReadonlyDomainObjectProps<T> {
    return this.isDomainPrimitive
      ? (props as WrappedPrimitive<ReadonlyDomainObjectProps<T>>)['value']
      : (props as ReadonlyDomainObjectProps<T>);
  }

  private validateValue_(value: T): void {
    if (value === undefined) {
      throw new ArgumentInvalidError('The value must not be undefined');
    }
    const validationResult = this.validate(value);
    handleValidationResult(validationResult);

    if (isDomainPrimitive(value)) return;
    if (Object.keys(value).length === 0) {
      throw new ArgumentInvalidError('The value must not be empty object');
    }
    return;
  }
}

/**
 * @remarks
 * The definition method of `Record` makes it impossible to use `interface` as its constraint object,
 * so `type` must be used instead. If a better solution is found, this part should be revised.
 */
export type ValueObjectValue =
  | DomainPrimitive
  | Record<
      string,
      | DomainPrimitive
      | DomainPrimitive[]
      | DomainPrimitiveObject
      | ValueObject<any>
    >;
type PrimitiveValue<T extends ValueObjectValue> = T extends DomainPrimitive
  ? T
  : never;
type PartialValue<T extends ValueObjectValue> = T extends DomainPrimitive
  ? never
  : Partial<T>;
type ValueObjectValueKeys<T extends ValueObjectValue> =
  T extends DomainPrimitive ? never : keyof T;
type WrappedPrimitive<T> = { value: T };
type ValueObjectProps<T extends ValueObjectValue> = T extends DomainPrimitive
  ? WrappedPrimitive<T>
  : T;
type ImmutableValueObjectMap<T extends ValueObjectValue> = MapOf<
  ValueObjectProps<T>
>;
