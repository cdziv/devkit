export function createErrorCodes<
  T extends { [key: string]: string } | Array<string>,
>(source: T, options?: CreateErrorCodesOptions): ErrorCodes<T> {
  const { moduleName = '', delimiter = '/' } = options || {};

  if (Array.isArray(source)) {
    return source.reduce(
      (acc, key) => {
        acc[key] = moduleName ? `${moduleName}${delimiter}${key}` : key;
        return acc;
      },
      {} as Record<string, string>,
    ) as ErrorCodes<T>;
  }

  return Object.entries(source).reduce(
    (acc, [key, value]) => {
      acc[key] = moduleName ? `${moduleName}${delimiter}${value}` : value;
      return acc;
    },
    {} as Record<string, string>,
  ) as ErrorCodes<T>;
}

type ErrorCodeValue<
  T extends string,
  Module extends string = '',
  Delimiter extends string = '/',
> = Module extends '' ? `${T}` : `${Module}${Delimiter}${T}`;
type ErrorCodes<
  T,
  Module extends string = '',
  Delimiter extends string = '/',
> = T extends { [key: string]: string }
  ? {
      [K in keyof T]: ErrorCodeValue<T[K], Module, Delimiter>;
    }
  : T extends Array<string>
    ? {
        [K in T[number]]: ErrorCodeValue<K, Module, Delimiter>;
      }
    : never;

export interface CreateErrorCodesOptions {
  moduleName?: string;
  delimiter?: string;
}
