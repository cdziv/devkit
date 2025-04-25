import { DddError } from './error.base';
import { DDD_ERROR_CODES } from './error.codes';

export class ArgumentInvalidError extends DddError {
  readonly code = DDD_ERROR_CODES['argument-invalid'];
  readonly name = DDD_ERROR_CODES['argument-invalid'];

  constructor(message = 'Argument is invalid') {
    super(message);

    Error.captureStackTrace(this, ArgumentInvalidError);
  }
}
