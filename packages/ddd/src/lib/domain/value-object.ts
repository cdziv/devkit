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
      ? this.getValue(
          (
            valueOrImmutableMap as ImmutableValueObjectMap<T>
          ).toJSON() as ValueObjectProps<T>
        )
      : (valueOrImmutableMap as T);
    this.validateValue(value);
    this.isDomainPrimitive = isDomainPrimitive(value);
    this.map = isImmutableMap ? valueOrImmutableMap : Map(this.getProps(value));
  }

  protected abstract validate(props: T): ValidationResult;

  equals(vo: this): boolean {
    return isDeepStrictEqual(this.value, vo.value);
  }

  withMutations(value: T extends DomainPrimitive ? T : Partial<T>): this;
  withMutations<K extends ValueObjectValueKeys<T>, V extends T[K]>(
    key: K,
    value: V
  ): this;
  withMutations<
    K extends keyof T,
    V extends T[K],
    PropUpdater extends (vo: this) => V
  >(key: K, propUpdater: PropUpdater): this;
  withMutations(
    updater: (vo: this) => PrimitiveValue<T> | PartialValue<T>
  ): this;
  withMutations<
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
  withMutations<
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
      return this.withProps({ [key]: newPropValue } as any);
    }

    if (this.isDomainPrimitive) {
      return typeof primitiveValueOrPartialValueOrKeyOrUpdater === 'function'
        ? this.withDomainPrimitiveValue(
            primitiveValueOrPartialValueOrKeyOrUpdater(
              this
            ) as PrimitiveValue<T>
          )
        : this.withDomainPrimitiveValue(
            primitiveValueOrPartialValueOrKeyOrUpdater as PrimitiveValue<T>
          );
    }

    return typeof primitiveValueOrPartialValueOrKeyOrUpdater === 'function'
      ? this.withProps(
          primitiveValueOrPartialValueOrKeyOrUpdater(this) as PartialValue<T>
        )
      : this.withProps(
          primitiveValueOrPartialValueOrKeyOrUpdater as PartialValue<T>
        );
  }
  private withDomainPrimitiveValue(
    value: T extends DomainPrimitive ? T : never
  ): this {
    return new (this.constructor as Constructor<this>)(value);
  }
  private withProps(
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
    return this.getValue(this.cachedProps);
  }

  private getProps(value: T): ValueObjectProps<T> {
    return this.isDomainPrimitive
      ? ({ value } as ValueObjectProps<T>)
      : (value as ValueObjectProps<T>);
  }

  private getValue(props: ValueObjectProps<T>): T;
  private getValue(
    props: ReadonlyDomainObjectProps<ValueObjectProps<T>>
  ): ReadonlyDomainObjectProps<T>;
  private getValue(
    props: ValueObjectProps<T> | ReadonlyDomainObjectProps<ValueObjectProps<T>>
  ): T | ReadonlyDomainObjectProps<T> {
    return this.isDomainPrimitive
      ? (props as WrappedPrimitive<ReadonlyDomainObjectProps<T>>)['value']
      : (props as ReadonlyDomainObjectProps<T>);
  }

  private validateValue(value: T): void {
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
