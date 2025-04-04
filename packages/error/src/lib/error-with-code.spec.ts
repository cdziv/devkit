import { describe, expect, it } from 'vitest';
import { ErrorWithCode } from './error-with-code';

describe('ErrorWithCode', () => {
  class CustomError extends ErrorWithCode {
    readonly code = 'custom';
    readonly name = 'CustomError';

    constructor() {
      super('custom error');
    }
  }

  it('should create an instance of CustomError', () => {
    const error = new CustomError();
    expect(error).toBeInstanceOf(CustomError);
  });

  it('should have the correct code and name', () => {
    const error = new CustomError();
    expect(error.code).toBe('custom');
    expect(error.name).toBe('CustomError');
  });

  it('should have the correct message', () => {
    const error = new CustomError();
    expect(error.message).toBe('custom error');
  });

  it('should return the correct string representation', () => {
    const error = new CustomError();
    expect(error.toString()).toBe('CustomError (custom): custom error');
  });
});
