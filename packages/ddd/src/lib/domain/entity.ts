/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { produce, WritableDraft } from 'immer';

export abstract class Entity<
  T extends EntityProps,
  ID extends EntityId<ValueObjectValue> = EntityId<string>,
  J extends JsonValue = JsonifyDeep<T>
> extends DomainObject<J> {
  private cachedProps: ReadonlyDomainObjectProps<T>;

  constructor(props: T) {
    super();

    this.validateProps_(props);
    this.cachedProps = DomainObject.convertPropsToReadonly(props);
  }

  abstract get id(): ID;
  protected abstract validate(props: T): ValidationResult;

  equals(entity: this): boolean {
    return this.id.equals(entity.id);
  }

  evolve<R extends (draft: WritableDraft<T>) => void>(recipe: R): this {
    return new (this.constructor as Constructor<this>)(
      produce(this.props, recipe)
    );
  }

  toJSON(): J {
    return deepJsonify(this.props) as J;
  }

  get props(): ReadonlyDomainObjectProps<T> {
    return this.cachedProps;
  }

  private validateProps_(props: T): void {
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
export interface EntityProps {
  [key: string]:
    | DomainPrimitive
    | DomainPrimitive[]
    | DomainPrimitiveObject
    | ValueObject<any>
    | ValueObject<any>[]
    | Entity<any>
    | Entity<any>[]
    | EntityProps;
}
