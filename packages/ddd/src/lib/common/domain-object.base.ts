import { Jsonifiable, JsonValue, Primitive } from './interfaces';
import { isPrimitive } from './utils/is-primitive';

export abstract class DomainObject<J extends JsonValue>
  implements Jsonifiable<J>
{
  // @ts-expect-error allow no read
  private readonly _isDomainObject = true;

  abstract toJSON(): J;

  static convertPropsToReadonly<T>(props: T): ReadonlyDomainObjectProps<T> {
    if (
      isPrimitive(props) ||
      props instanceof Date ||
      props instanceof DomainObject
    ) {
      return props as ReadonlyDomainObjectProps<T>;
    }
    if (Array.isArray(props)) {
      return Object.freeze(
        props.map(DomainObject.convertPropsToReadonly)
      ) as ReadonlyDomainObjectProps<T>;
    }
    if (typeof props === 'object') {
      const result: Record<string, any> = {};
      for (const key of Object.keys(props as any)) {
        result[key] = DomainObject.convertPropsToReadonly((props as any)[key]);
      }
      return Object.freeze(result) as ReadonlyDomainObjectProps<T>;
    }

    return props as ReadonlyDomainObjectProps<T>;
  }
}

export type ReadonlyDomainObjectProps<T> = T extends
  | DomainObject<any>
  | Primitive
  | Date
  ? T
  : {
      readonly [K in keyof T]: ReadonlyDomainObjectProps<T[K]>;
    };
