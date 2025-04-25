export type {
  JsonValue,
  DomainPrimitive,
  DomainPrimitiveObject,
  ValidationResult,
  DomainEventEmitter,
  DomainEventProps,
  Jsonifiable,
  JsonifyDeep,
} from './lib/interfaces';
export { DDD_ERROR_CODES, DddError, ArgumentInvalidError } from './lib/errors';
export { isDomainPrimitive, deepJsonify } from './lib/utils';
export * from './lib/domain';
