import {
  CreateErrorCodesOptions,
  DelimiterOfOptions,
  ErrorCodes,
  ModuleNameOfOptions,
} from './interfaces';

/**
 * Creates a mapping of error codes based on the provided source and options.
 *
 * This utility function allows you to generate error codes in a structured format
 * by appending a module name and a delimiter to each key or value in the source.
 *
 * **NOTE**: Should provide source and options as `const` to ensure type safety.
 *
 * @param source - The source for generating error codes. It can be:
 *                 - An array of strings, where each string represents a key.
 *                 - An object where each key-value pair represents a mapping.
 * @param options - Optional configuration for generating error codes.
 *                  - `moduleName` (string): A prefix to be added to each error code.
 *                  - `delimiter` (string): A delimiter to separate the module name and the key/value.
 *
 * @returns A mapping of error codes where:
 *          - For an array source, each key is mapped to a string in the format `moduleName/delimiter/key`.
 *          - For an object source, each key is mapped to a string in the format `moduleName/delimiter/value`.
 *
 * @example
 * // Using an array as the source
 * const source = ['NOT_FOUND', 'INVALID'] as const;
 * const errorCodes = createErrorCodes(source, { moduleName: 'USER', delimiter: '-' });
 * // Result: { NOT_FOUND: 'USER-NOT_FOUND', INVALID: 'USER-INVALID' }
 *
 * @example
 * // Using an object as the source
 * const source = { notFound: 'NOT_FOUND', invalid: 'INVALID' } as const;
 * const errorCodes = createErrorCodes(source, { moduleName: 'USER' });
 * // Result: { notFound: 'USER/NOT_FOUND', invalid: 'USER/INVALID' }
 *
 * @example
 * // Using custom module name and delimiter
 * const source = ['NOT_FOUND', 'INVALID'] as const;
 * const moduleName = 'USER' as const;
 * const delimiter = '.' as const;
 * const errorCodes = createErrorCodes(source, { moduleName, delimiter });
 * // Result: { NOT_FOUND: 'USER.NOT_FOUND', INVALID: 'USER.INVALID' }
 */
export function createErrorCodes<
  T extends readonly string[] | { [key: string]: string },
  Options extends CreateErrorCodesOptions = CreateErrorCodesOptions
>(
  source: T,
  options?: Options
): ErrorCodes<T, ModuleNameOfOptions<Options>, DelimiterOfOptions<Options>> {
  const { moduleName = '', delimiter = '/' } = options || {};

  if (Array.isArray(source)) {
    return source.reduce((acc, key) => {
      acc[key] = moduleName ? `${moduleName}${delimiter}${key}` : key;
      return acc;
    }, {} as Record<string, string>) as ErrorCodes<T>;
  }
  return Object.entries(source).reduce((acc, [key, value]) => {
    acc[key] = moduleName ? `${moduleName}${delimiter}${value}` : value;
    return acc;
  }, {} as Record<string, string>) as ErrorCodes<T>;
}
