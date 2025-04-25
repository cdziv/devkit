import { DomainPrimitive } from '../interfaces';

/**
 * Checks if the given value is a domain primitive.
 * **note** it does not include undefined
 */
export function isDomainPrimitive(value: unknown): value is DomainPrimitive {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date ||
    value === null
  );
}
