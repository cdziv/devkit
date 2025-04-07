/* eslint-disable @typescript-eslint/no-explicit-any */

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | Date
  | JSONArray
  | JSONObject;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = JSONValue[];

export type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};
export type Constructor<T> = new (...args: any[]) => T;

export type DomainPrimitive = string | number | boolean | null | Date;
export type DomainPrimitiveObject = {
  [key in string]: DomainPrimitive | DomainPrimitive[] | DomainPrimitiveObject;
};
