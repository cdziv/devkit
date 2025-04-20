type DefaultDelimiter = '/';
type ErrorCodeValue<
  T extends string,
  Module extends string = '',
  Delimiter extends string = DefaultDelimiter
> = Module extends '' ? `${T}` : `${Module}${Delimiter}${T}`;
export type ErrorCodes<
  T extends readonly string[] | { [key: string]: string },
  Module extends string = '',
  Delimiter extends string = DefaultDelimiter
> = T extends { [key: string]: string }
  ? {
      [K in keyof T]: ErrorCodeValue<T[K], Module, Delimiter>;
    }
  : T extends readonly string[]
  ? {
      [K in T[number]]: ErrorCodeValue<K, Module, Delimiter>;
    }
  : never;
export type ModuleNameOfOptions<T extends CreateErrorCodesOptions> =
  T['moduleName'] extends string ? T['moduleName'] : '';
export type DelimiterOfOptions<
  T extends CreateErrorCodesOptions,
  D extends string = DefaultDelimiter
> = T['delimiter'] extends string ? T['delimiter'] : D;
export interface CreateErrorCodesOptions {
  moduleName?: string;
  delimiter?: string;
}

export type Values<ErrorCodes extends object> = ErrorCodes[keyof ErrorCodes];
