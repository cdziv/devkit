import { JsonifyDeep, JsonValue } from '../interfaces';
import { ValueObject, ValueObjectValue } from './value-object';

export abstract class EntityId<
  T extends ValueObjectValue,
  J extends JsonValue = JsonifyDeep<T>
> extends ValueObject<T, J> {
  abstract get rawId(): string;
}
