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
import { Constructor } from 'type-fest';
import { produce, WritableDraft } from 'immer';

export abstract class ValueObject<
  T extends ValueObjectValue,
  J extends JsonValue = JsonifyDeep<T>
> extends DomainObject<J> {
  public readonly isDomainPrimitive: boolean;
  private readonly props: ValueObjectProps<T>;
  private cachedProps?: ReadonlyDomainObjectProps<ValueObjectProps<T>>;

  constructor(value: T) {
    super();

    this.validateValue_(value);
    this.isDomainPrimitive = isDomainPrimitive(value);
    this.props = this.getProps_(value);
  }

  protected abstract validate(props: T): ValidationResult;

  equals(vo: this): boolean {
    return isDeepStrictEqual(this.value, vo.value);
  }

  evolve<R extends (draft: WritableDraft<T>) => void>(
    valueOrRecipe: T extends DomainPrimitive ? T : R
  ): this {
    if (this.isDomainPrimitive) {
      return new (this.constructor as Constructor<this>)(valueOrRecipe as T);
    }

    return new (this.constructor as Constructor<this>)(
      produce(this.props, valueOrRecipe as R)
    );
  }

  toJSON(): J {
    return deepJsonify(this.value) as J;
  }

  get value(): ReadonlyDomainObjectProps<T> {
    if (!this.cachedProps) {
      this.cachedProps = DomainObject.convertPropsToReadonly(this.props);
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
export type ValueObjectValue = DomainPrimitive | ValueObjectValueObject;
export interface ValueObjectValueObject {
  [key: string]:
    | DomainPrimitive
    | DomainPrimitive[]
    | DomainPrimitiveObject
    | DomainPrimitiveObject[]
    | ValueObject<any>
    | ValueObject<any>[]
    | ValueObjectValueObject;
}

type WrappedPrimitive<T> = { value: T };
type ValueObjectProps<T extends ValueObjectValue> = T extends DomainPrimitive
  ? WrappedPrimitive<T>
  : T;
