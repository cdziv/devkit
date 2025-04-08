/* eslint-disable @typescript-eslint/no-explicit-any */

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONArray
  | JSONObject;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = JSONValue[];
export interface Serializable<T extends JSONValue> {
  toJSON(): T;
}

export type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};
export type Constructor<T> = new (...args: any[]) => T;

export type DomainPrimitive = string | number | boolean | null | Date;
export type DomainPrimitiveObject = {
  [key in string]: DomainPrimitive | DomainPrimitive[] | DomainPrimitiveObject;
};
export type DeepJSON<T> = T extends Date
  ? string
  : T extends JSONValue
  ? T
  : T extends Serializable<infer U>
  ? U
  : T extends Record<string, unknown>
  ? { [K in keyof T]: DeepJSON<T[K]> }
  : T extends Array<infer U>
  ? DeepJSON<U>[]
  : never;
