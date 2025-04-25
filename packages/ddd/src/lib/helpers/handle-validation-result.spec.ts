import { ArgumentInvalidError, DddError } from '../errors';
import { handleValidationResult } from './handle-validation-result';

describe('handleValidationResult', () => {
  it('should throw given error when the provided error extends from DddError', () => {
    class CustomError extends DddError {
      readonly code = 'custom';
      readonly name = 'CustomError';
      constructor() {
        super('custom error');
      }
    }

    expect(() => handleValidationResult(new CustomError())).toThrow(
      CustomError
    );
    expect(() => handleValidationResult(new CustomError())).toThrow(
      'custom error'
    );
  });

  it('should throw ArgumentInvalidError when given false', () => {
    expect(() => handleValidationResult(false)).toThrow(ArgumentInvalidError);
  });

  it('should throw ArgumentInvalidError when given custom error', () => {
    class CustomError extends Error {
      code = 'custom';
      constructor() {
        super('custom error');
      }
    }

    expect(() => handleValidationResult(new CustomError())).toThrow(
      ArgumentInvalidError
    );
  });

  it('should throw ArgumentInvalidError when given string', () => {
    expect(() => handleValidationResult('error message')).toThrow(
      ArgumentInvalidError
    );
    expect(() => handleValidationResult('error message')).toThrow(
      'error message'
    );
  });
});
