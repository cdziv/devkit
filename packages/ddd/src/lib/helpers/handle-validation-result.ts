import { ArgumentInvalidError, DddError } from '../errors';
import { ValidationResult } from '../interfaces';

export function handleValidationResult(result: ValidationResult): void {
  if (result instanceof DddError) {
    throw result;
  }
  if (result instanceof Error) {
    const err = new ArgumentInvalidError(result.message);
    throw err;
  }
  if (typeof result === 'string') {
    throw new ArgumentInvalidError(result);
  }
  if (result === false) {
    throw new ArgumentInvalidError();
  }
}
