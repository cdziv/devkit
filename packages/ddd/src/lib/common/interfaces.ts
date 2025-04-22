export type Primitive = string | number | boolean | null | undefined;
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [K in string]: JsonValue } & {
  [K in string]?: JsonValue | undefined;
};
export type JsonArray = JsonValue[] | readonly JsonValue[];
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export type DomainPrimitive = string | number | boolean | null | Date;
export type DomainPrimitiveObject = {
  [key in string]: DomainPrimitive | DomainPrimitive[] | DomainPrimitiveObject;
};

export interface Jsonifiable<T extends JsonValue> {
  toJSON(): T;
}
export type JsonifyDeep<T> = T extends Date
  ? string
  : T extends JsonValue
  ? T
  : T extends bigint | symbol | Map<unknown, unknown> | Set<unknown>
  ? object
  : T extends Jsonifiable<infer U>
  ? U
  : T extends Record<string, unknown>
  ? { [K in keyof T]: JsonifyDeep<T[K]> }
  : T extends Array<infer U>
  ? JsonifyDeep<U>[]
  : never;

export type ValidationResult = string | Error | boolean | void;

export type DomainEventProps<T extends JsonValue | void = void> = {
  eventId?: string;
  aggregateId: string;
  timestamp?: number;
  correlationId?: string;
  causationId?: string;
  payload?: T;
};
