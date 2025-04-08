import { DeepJSON } from '../interfaces';

export function deepConvertToJson<T>(value: T): DeepJSON<T> {
  if (value === undefined) {
    throw new Error('Cannot convert undefined to JSON');
  }
  if (typeof value === 'symbol') {
    throw new Error('Cannot convert a Symbol value to JSON');
  }
  if (typeof value === 'bigint') {
    throw new Error('Cannot convert a BigInt value to JSON');
  }
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value as DeepJSON<T>;
  }

  if (value instanceof Date) {
    return value.toISOString() as DeepJSON<T>;
  }
  if (Array.isArray(value)) {
    return value.map(deepConvertToJson) as DeepJSON<T>;
  }
  if (typeof value === 'object') {
    if (typeof (value as any)['toJSON'] === 'function') {
      return (value as any).toJSON() as DeepJSON<T>;
    }
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      result[key] = deepConvertToJson((value as any)[key]);
    }
    return result as DeepJSON<T>;
  }

  throw new Error(`Cannot convert ${value} to JSON`);
}
