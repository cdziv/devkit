import { JsonifyDeep } from '../interfaces';

export function deepJsonify<T>(value: T): JsonifyDeep<T> {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value as JsonifyDeep<T>;
  }
  if (value instanceof Date) {
    return value.toISOString() as JsonifyDeep<T>;
  }
  if (
    typeof value === 'symbol' ||
    typeof value === 'bigint' ||
    value instanceof Map ||
    value instanceof Set
  ) {
    return {} as JsonifyDeep<T>;
  }
  if (Array.isArray(value)) {
    return value.map(deepJsonify) as JsonifyDeep<T>;
  }
  if (typeof value === 'object') {
    if (
      'toJSON' in (value as any) &&
      typeof (value as any)['toJSON'] === 'function'
    ) {
      return (value as any).toJSON() as JsonifyDeep<T>;
    }
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      result[key] = deepJsonify((value as any)[key]);
    }
    return result as JsonifyDeep<T>;
  }

  throw new Error(`Cannot convert ${value} to JSON`);
}
